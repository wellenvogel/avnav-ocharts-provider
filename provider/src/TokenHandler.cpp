/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Token Handler
 * Author:   Andreas Vogel
 *
 ***************************************************************************
 *   Copyright (C) 2020 by Andreas Vogel   *
 *                                                                         *
 *   This program is free software; you can redistribute it and/or modify  *
 *   it under the terms of the GNU General Public License as published by  *
 *   the Free Software Foundation; either version 2 of the License, or     *
 *   (at your option) any later version.                                   *
 *                                                                         *
 *   This program is distributed in the hope that it will be useful,       *
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of        *
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the         *
 *   GNU General Public License for more details.                          *
 *                                                                         *
 *   You should have received a copy of the GNU General Public License     *
 *   along with this program; if not, write to the                         *
 *   Free Software Foundation, Inc.,                                       *
 *   51 Franklin Street, Fifth Floor, Boston, MA 02110-1301,  USA.             *
 ***************************************************************************
 *
 */

#include "TokenHandler.h"
#include "Logger.h"
#include "SimpleThread.h"
#include <deque>
#include "RefCount.h"
#include <openssl/evp.h>
#include <openssl/rsa.h>
#include <openssl/pem.h>
#include <wx/tokenzr.h>
#include <vector>
#include "MD5.h"
#ifdef DEBUG
    #include "publicKeyDebug.h"
#else
    #include "publicKey.h"
#endif

//timeout in seconds for a client
#define CLIENT_TIMEOUT 300
//token interval
#define TOKEN_INTERVAL 120
//how man tokens we keep (multiplied with token interval this is the validity period)
#define TOKEN_LIST_LEN 4


//https://gist.github.com/irbull/08339ddcd5686f509e9826964b17bb59
static RSA* createPublicRSA(const char * key) {
  RSA *rsa = NULL;
  BIO *keybio;
  keybio = BIO_new_mem_buf((void*)key, -1);
  if (keybio==NULL) {
      return NULL;
  }
  rsa = PEM_read_bio_RSA_PUBKEY(keybio, &rsa,NULL, NULL);
  return rsa;
}


/**
 * encrypt our 128 bit key using rsa
 * @param key
 * @return 
 */
static wxString encryptKey(const unsigned char *key){
    RSA* rsa=createPublicRSA(PUBLICKEY);
    EVP_PKEY_CTX *ctx=NULL;
    ENGINE *eng=NULL;
    unsigned char *out=NULL;
    size_t outlen;
    EVP_PKEY *pubKey=EVP_PKEY_new();;
    EVP_PKEY_assign_RSA(pubKey, rsa);

 
    ctx = EVP_PKEY_CTX_new(pubKey, eng);
    if (!ctx){
        EVP_PKEY_free(pubKey);
        LOG_DEBUG(wxT("error creating encrypt ctx"));
        return wxEmptyString;
    }
        
     /* Error occurred */
    if (EVP_PKEY_encrypt_init(ctx) <= 0){
        EVP_PKEY_free(pubKey);
        EVP_PKEY_CTX_free(ctx); 
        LOG_DEBUG(wxT("error creating encrypt ctx"));
        return wxEmptyString;
    }
        
     /* Error */
    if (EVP_PKEY_CTX_set_rsa_padding(ctx, RSA_PKCS1_PADDING) <= 0){
        EVP_PKEY_free(pubKey);
        EVP_PKEY_CTX_free(ctx); 
        LOG_DEBUG(wxT("error setting padding"));
        return wxEmptyString;
    }
     /* Error */

    /* Determine buffer length */
    if (EVP_PKEY_encrypt(ctx, NULL, &outlen, key, 16) <= 0){
        EVP_PKEY_free(pubKey);
        EVP_PKEY_CTX_free(ctx); 
        LOG_DEBUG(wxT("error getting crypted len"));
        return wxEmptyString;
    }
    out = new unsigned char[outlen];

    if (!out){
        EVP_PKEY_free(pubKey);
        EVP_PKEY_CTX_free(ctx); 
        LOG_DEBUG(wxT("new no mem"));
        return wxEmptyString;
    }
    if (EVP_PKEY_encrypt(ctx, out, &outlen,key, 16) <= 0){
        EVP_PKEY_free(pubKey);
        EVP_PKEY_CTX_free(ctx); 
        delete []out;
        LOG_DEBUG(wxT("encrypt error"));
        return wxEmptyString;
    }
    EVP_PKEY_free(pubKey);
    EVP_PKEY_CTX_free(ctx); 
    char *hexBuffer=OPENSSL_buf2hexstr(out,outlen);
    delete []out;
    wxString rt(hexBuffer);
    OPENSSL_free(hexBuffer);
    return rt;
}
/**
 * 
 * @param hexInput encrypted input in hex
 * @param key 128 bit AES key
 * @return the decrypted string
 */
static wxString decryptAes(wxString hexInput, wxString hexIv, const unsigned char *key){
   long inputLen=0; 
   unsigned char *input=OPENSSL_hexstr2buf(hexInput.ToAscii().data(),&inputLen);
   if (input == NULL){
       LOG_DEBUG(wxT("unable to decode aes %s"),hexInput);
       return wxEmptyString;
   }
   long outputLen=inputLen+10;
   long ivLen=0;
   unsigned char *iv=OPENSSL_hexstr2buf(hexIv.ToAscii().data(),&ivLen);
   if (iv == NULL){
       LOG_DEBUG(wxT("invalid iv %s"),hexIv);
       OPENSSL_free(input);
       return wxEmptyString;
   }
   if (ivLen != 16){
       LOG_DEBUG(wxT("invalid iv len for %s"),hexIv);
       OPENSSL_free(input);
       OPENSSL_free(iv);
       return wxEmptyString;
   }
   EVP_CIPHER_CTX *ctx=EVP_CIPHER_CTX_new();
   if (ctx == NULL){
       LOG_DEBUG(wxT("unable to create cipher ctx"));
       OPENSSL_free(input);
       OPENSSL_free(iv);
       return wxEmptyString;
   }
   if (EVP_DecryptInit(ctx,EVP_aes_128_ctr(),key,iv) != 1){
       LOG_DEBUG(wxT("unable to init decryption"));
       EVP_CIPHER_CTX_free(ctx);
       OPENSSL_free(input);
       OPENSSL_free(iv);
       return wxEmptyString;
   }
   unsigned char output[outputLen];
   int filledOutput=0;
   if (EVP_DecryptUpdate(ctx,output,&filledOutput,input,inputLen) != 1){
       LOG_DEBUG(wxT("unable to decrypt %s"),hexInput);
       EVP_CIPHER_CTX_free(ctx);
       OPENSSL_free(input);
       OPENSSL_free(iv);
       return wxEmptyString;
   }
   int addFilled=0;
   if (EVP_DecryptFinal(ctx,output+filledOutput,&addFilled) != 1){
       LOG_DEBUG(wxT("unable to finalize decrypt %s"),hexInput);
       EVP_CIPHER_CTX_free(ctx);
       OPENSSL_free(input);
       OPENSSL_free(iv);
       return wxEmptyString;
   }
   filledOutput+=addFilled;
   EVP_CIPHER_CTX_free(ctx);
   OPENSSL_free(input);
   OPENSSL_free(iv);
   output[filledOutput]=0;
   wxString rt(output);
   LOG_DEBUG(wxT("decoded url %s"),hexInput);
   return rt;
}



class Token : public RefCount {
public: 
    wxString encryptedKey;
    MD5Name key;
    int sequence;   
    Token(MD5Name key,int sequence): RefCount(){
        this->key=key;
        this->encryptedKey=wxEmptyString;
        this->sequence=sequence;
    }
    void Encrypt(){
        encryptedKey=encryptKey(key.GetValue());
    }
protected:
    virtual ~Token(){
    }
};

class TokenList: public RefCount{
private:
    long lastToken;
    std::deque<Token*> tokens;
    wxString sessionId;
    std::mutex lock;
    int sequence;
    Token * NextToken(){
        Token *rt=NULL;
        {
            Synchronized locker(lock);
            sequence++;
            rt= new Token(MD5::Compute(sessionId+wxGetLocalTimeMillis().ToString()),sequence);
        }
        rt->Encrypt(); 
        return rt;
    }
    virtual ~TokenList(){
        std::deque<Token*>::iterator it;
        for (it=tokens.begin();it != tokens.end();it++){
            (*it)->Unref();
        }
    }
public: 
    long lastAccess;
    TokenList(wxString sessionId):RefCount(){
        LOG_DEBUG(wxT("creating new token list for %s"),sessionId);
        this->sessionId=sessionId;
        lastAccess=wxGetLocalTime();
        lastToken=lastAccess;
        sequence=0;
        tokens.push_back(NextToken());
    }
    bool TimerAction(){
        long now=wxGetLocalTime();
        if ((now-lastToken) >= TOKEN_INTERVAL){
            LOG_DEBUG(wxT("new token for %s"),sessionId);
            Token *next=NextToken();
            Synchronized locker(lock);
            tokens.push_back(next);
            if (tokens.size() > TOKEN_LIST_LEN) {
                tokens.front()->Unref();
                tokens.pop_front();
            }
            lastToken=now;
            return true;
        }
        return false;
    }
    
    TokenResult NewestToken(){
        lastAccess=wxGetLocalTime();
        Synchronized locker(lock);
        TokenResult rt;
        rt.state=TokenResult::RES_OK;
        rt.sessionId=sessionId;
        rt.key=tokens.back()->encryptedKey;
        rt.sequence=tokens.back()->sequence;
        return rt;
    }
    Token * findTokenBySequence(int sequence){
        Synchronized locker(lock);
        std::deque<Token*>::iterator it;
        for (it=tokens.begin();it != tokens.end();it++){
            if ((*it)->sequence == sequence){
                (*it)->Ref();
                return (*it);
            }
        }
        return NULL;
    }
};


TokenHandler::TokenHandler(wxString name): Thread() {
    this->name=name;
}
wxString TokenHandler::ComputeMD5(wxString data){
    MD5 md5;
    md5.AddValue(data);
    return md5.GetHex();
}
wxString TokenHandler::GetNextSessionId(){
    wxString data=name+wxGetLocalTimeMillis().ToString();
    return ComputeMD5(data);
}

TokenHandler::~TokenHandler() {
    TokenMap::iterator it;
    for (it=map.begin();it != map.end();it++){
        it->second->Unref();
    }
}

TokenResult TokenHandler::NewToken(wxString sessionId){
    TokenList *list=NULL;
    {
        Synchronized locker(lock);
        TokenMap::iterator it=map.find(sessionId);
        if (it != map.end()){
            list=it->second;
            list->Ref();
        }
    }
    if (list == NULL){
        return NewToken();
    }
    TokenResult rt=list->NewestToken();
    list->Unref();
    LOG_DEBUG(wxT("TokenHandler::NewToken(sessionId) %s"),rt.ToString());
    return rt;
}

TokenResult TokenHandler::NewToken(){
    TokenResult rt;
    {
        Synchronized locker(lock);
        if (map.size() >= MAX_CLIENTS){
            rt.state=TokenResult::RES_TOO_MANY;
            return rt;
        }
    }
    wxString sessionId=GetNextSessionId();
    TokenList *list=NULL;
    {
        Synchronized locker(lock);
        list=new TokenList(sessionId);
        list->Ref();
        map[sessionId]=list;
    }
    rt=list->NewestToken();
    list->Unref();
    return rt;
}
DecryptResult TokenHandler::DecryptUrl(wxString url){
    wxStringTokenizer tokenizer(url,"/");
    wxString sessionId=tokenizer.GetNextToken();
    if (sessionId == wxEmptyString){
        LOG_ERROR(wxT("no session Id in encrypted URL: %s"),url);
        return DecryptResult();
    }
    TokenList *list=NULL;
    {
        Synchronized locker(lock);
        TokenMap::iterator it=map.find(sessionId);
        if (it != map.end()){
            list=it->second;
            list->Ref();
        }
    }
    if (! list){
        LOG_DEBUG(wxT("DecryptUrl: session not found: %s"),sessionId);
        return DecryptResult();
    }
    wxString sequenceStr=tokenizer.GetNextToken();
    wxString hexIv=tokenizer.GetNextToken();
    wxString cryptedUrl=tokenizer.GetNextToken();
    int sequence=-1;
    if (sscanf(sequenceStr.c_str(),"%d",&sequence) != 1){
        LOG_DEBUG(wxT("DecryptUrl: no sequence in encrypted url %s"),url);
        return DecryptResult();
    }
    if (hexIv == wxEmptyString || cryptedUrl == wxEmptyString ){
        LOG_DEBUG(wxT("DecrpytUrl: invalid crypted url %s"),url);
        return DecryptResult();
    }
    Token *token=list->findTokenBySequence(sequence);
    list->Unref();
    if (token == NULL){
        LOG_DEBUG(wxT("DecryptUrl: unable to find sequence %d for session %s"),sequence,sessionId);
        return DecryptResult();
    }
    DecryptResult rt;
    rt.url=decryptAes(cryptedUrl,hexIv,token->key.GetValue());
    rt.sessionId=sessionId;
    token->Unref();
    return rt;
}

bool TokenHandler::TimerAction(){
    //step1: find outdated sessions and remove them
    long now=wxGetLocalTime();
    long toErase=now-CLIENT_TIMEOUT;
    TokenMap::iterator it;
    std::vector<TokenList*> sessions;
    {
        Synchronized locker(lock);
        for (it=map.begin();it!=map.end();){
            if (it->second->lastAccess < toErase){
                LOG_DEBUG(wxT("deleting session %s"),it->first);
                it->second->Unref();
                it=map.erase(it);
            }
            else{
                //just make a copy of the entry to get away from the global lock for the timer
                //actions as they could be time consuming when computing new keys
                sessions.push_back(it->second);
                it->second->Ref();
                it++;
            }
        }
    }
    //now we have all the remaining sessions in the sessions list and 
    //can call ther timer actions without a global lock
    std::vector<TokenList*>::iterator tit;
    for (tit=sessions.begin();tit!=sessions.end();tit++){
        (*tit)->TimerAction();
        (*tit)->Unref();
    }
    return true;
}

void TokenHandler::run(){
    LOG_INFO(wxT("token handler %s timer started"),name);
    while (! shouldStop()){
        wxMilliSleep(1000);
        TimerAction();
    }
    LOG_INFO(wxT("token handler %s timer finished"),name);
}
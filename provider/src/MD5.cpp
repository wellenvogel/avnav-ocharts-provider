/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  MD5
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

#include <wx/filename.h>

#include "MD5.h"
#include "Logger.h"

MD5::MD5() {
   mdctx = EVP_MD_CTX_new();
   if(1 != EVP_DigestInit_ex(mdctx, EVP_md5(), NULL)){
        LOG_DEBUG(wxT("error init md context"));
        EVP_MD_CTX_free(mdctx);
        mdctx=NULL;
    }
   resultBuffer=NULL;
   finalized=false;
}

MD5::MD5(const MD5& other){
    //make a copy of the current state
    finalized=other.finalized;
    mdctx=NULL;
    resultBuffer=NULL;
    if (finalized){
        resultBuffer=new unsigned char[MD5_LEN];
        memcpy(resultBuffer,other.resultBuffer,MD5_LEN);
        return;
    }
    if (!other.IsOk()) return;
    mdctx=EVP_MD_CTX_new();
    if (1 != EVP_MD_CTX_copy(mdctx,other.mdctx)){
        LOG_DEBUG(wxT("copying MD5 failed"));
        EVP_MD_CTX_free(mdctx);
        mdctx=NULL;
    }
}
MD5& MD5::operator =(const MD5& other){
    finalized=other.finalized;
    mdctx=NULL;
    resultBuffer=NULL;
    if (finalized){
        resultBuffer=new unsigned char[MD5_LEN];
        memcpy(resultBuffer,other.resultBuffer,MD5_LEN);
        return *this;
    }
    if (!other.IsOk()) return *this;
    mdctx=EVP_MD_CTX_new();
    if (1 != EVP_MD_CTX_copy(mdctx,other.mdctx)){
        LOG_DEBUG(wxT("copying MD5 failed"));
        EVP_MD_CTX_free(mdctx);
        mdctx=NULL;
    }
    return *this;
}

bool MD5::IsOk() const {
    return mdctx != NULL;
}
bool MD5::AddBuffer(const unsigned char* buffer, long len){
    if (! IsOk() || finalized) return false;
    if (EVP_DigestUpdate(mdctx,buffer,len) != 1){
        LOG_DEBUG(wxT("md5 add long failed"));
        EVP_MD_CTX_free(mdctx);
        mdctx=NULL;
    }
    return IsOk();
}

bool MD5::AddValue(wxDateTime v){
    time_t tv=v.GetTicks();
    return MD5_ADD_VALUEP(this,tv);
}
bool MD5::AddValue(wxString data) {
    return AddBuffer(data.utf8_str().data(),data.utf8_str().length());
}

bool MD5::AddFileInfo(wxString path, wxString base){
    if (! IsOk() || finalized) return false;
    wxFileName fileName;
    if (base != wxEmptyString){
        fileName=wxFileName(base,path);
    }
    else{
        fileName=wxFileName::FileName(path);
    }
    if (! wxFileExists(fileName.GetFullPath())){
        LOG_DEBUG(wxT("file not found for MD5::AddFileInfo: %s"),fileName.GetFullPath());
        return true;
    }
    AddValue(fileName.GetFullPath());
    AddValue(fileName.GetModificationTime());
    wxULongLong sz=fileName.GetSize();
    MD5_ADD_VALUEP(this,sz);
    return IsOk();
}

const unsigned char * MD5::GetValue(){
    if (finalized) return resultBuffer;
    if (! IsOk()) return NULL;
    if (resultBuffer == NULL) resultBuffer=new unsigned char[MD5_LEN];
    finalized=true;
    unsigned int len=16;
    if(1 != EVP_DigestFinal_ex(mdctx, resultBuffer, &len)){
        LOG_DEBUG(wxT("error md result"));
        delete [] resultBuffer;
        resultBuffer=NULL;
    }
    return resultBuffer;
}
MD5Name MD5::GetValueCopy(){
    return MD5Name(GetValue());
}

static unsigned char ToHex(unsigned char v){
    v=v&0xf;
    if (v <=9) return '0'+v;
    return 'a'+v-10;
}

wxString MD5::GetHex(){
    const unsigned char *result=GetValue();
    if (result == NULL) return wxEmptyString;
    char res[2 * MD5_LEN + 1];
    for (int i=0;i<MD5_LEN;i++){
        res[2*i]=ToHex(result[i]>>4);
        res[2*i+1]=ToHex(result[i]);
    }
    res[2 * MD5_LEN]=0;
    return wxString(res);
}

MD5::~MD5() {
    if (mdctx != NULL) EVP_MD_CTX_free(mdctx);
    if (resultBuffer != NULL) delete [] resultBuffer;
}

MD5Name MD5::Compute(wxString v){
    MD5 md5;
    md5.AddValue(v);
    return md5.GetValueCopy();
}

wxString MD5Name::ToString(){
    char res[2 * MD5_LEN + 1];
    for (int i=0;i<MD5_LEN;i++){
        res[2*i]=ToHex(name[i]>>4);
        res[2*i+1]=ToHex(name[i]);
    }
    res[2 * MD5_LEN]=0;
    return wxString(res);
}


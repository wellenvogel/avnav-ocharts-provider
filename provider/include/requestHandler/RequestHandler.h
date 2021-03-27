/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Request Handler
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
#ifndef REQUESTHANDLER_H
#define REQUESTHANDLER_H
#include "SimpleThread.h"
#include "CacheHandler.h"
#include "Types.h"
#include "StringHelper.h"
#include "MainQueue.h"
#include <wx/wx.h>
#include <wx/wfstream.h>
#include <vector>
#include <map>

class HTTPResponse{
public:
    bool valid;
    wxString mimeType;
    NameValueMap responseHeaders;
    int code=0;
    HTTPResponse(wxString mimeType){
        this->mimeType=mimeType;
        this->valid=true;
        this->code=200;
    }
    HTTPResponse(){
        this->valid=false;
        this->code=401;
    }
    virtual ~HTTPResponse(){
    }
    wxString GetMimeType(){return mimeType;}
    virtual bool SupportsChunked(){return false;}
    virtual unsigned long GetLength(){return 0;}
    virtual const unsigned char * GetData(/*inout*/unsigned long &maxLen){return NULL;}
};


class HTTPBufferResponse : public HTTPResponse{
private:
    CacheEntry *entry;
public:
    HTTPBufferResponse(wxString mimeType,CacheEntry *entry):
        HTTPResponse(mimeType){
        this->entry=entry;
    }
    virtual ~HTTPBufferResponse(){
        entry->Unref();
    }
    virtual unsigned long GetLength(){return entry->GetLength();}
    virtual const unsigned char * GetData(unsigned long &maxLen){ return entry->GetData();}
};

class HTTPStringResponse : public HTTPResponse{
protected:
    wxString data;
public:
    HTTPStringResponse(wxString mimeType,wxString data):
        HTTPResponse(mimeType){
        this->data=data;
    }
    HTTPStringResponse(wxString mimeType):
        HTTPResponse(mimeType){
        this->data=wxEmptyString;
    }    
    virtual ~HTTPStringResponse(){
    }
    virtual unsigned long GetLength(){return data.utf8_str().length();}
    virtual const unsigned char * GetData(unsigned long &maxLen){ return (const unsigned char *)data.utf8_str().data();}
};

class HTTPJsonErrorResponse : public HTTPStringResponse{
public:    
    HTTPJsonErrorResponse(wxString errors): HTTPStringResponse("application/json"){
        LOG_DEBUG(wxT("json error response: %s"),errors);
        data=wxString::Format(
                "{" 
                JSON_SV(status,ERROR) ","
                JSON_SV(info,%s) 
                "}",
                StringHelper::safeJsonString(errors)
                );
        
    }
    virtual ~HTTPJsonErrorResponse(){
    }    
};

class HTTPStreamResponse: public HTTPResponse{
private:
    wxInputStream *stream;
    unsigned char *buffer;
    unsigned long bufferLen;
    unsigned long len;
    unsigned long alreadyRead;
public:
    HTTPStreamResponse(wxString mimeType,wxInputStream *stream,unsigned long len):
        HTTPResponse(mimeType){
            this->stream=stream;
            this->len=len;
            this->buffer=NULL;
            this->alreadyRead=0;
            this->bufferLen=0;
    }
    virtual ~HTTPStreamResponse(){
        delete stream;
        if (buffer != NULL) delete []buffer;
    }    
    virtual bool SupportsChunked(){return true;}
    virtual unsigned long GetLength(){return len;}
    virtual const unsigned char * GetData(/*inout*/unsigned long &maxLen){
        unsigned long toRead=maxLen;
        if ((alreadyRead + toRead) > len){
            toRead=len-alreadyRead;
        }
        if (toRead == 0){
            maxLen=0;
            return NULL;
        }
        if (bufferLen < toRead){
            if (buffer) delete [] buffer;
            buffer= new unsigned char[toRead];
            bufferLen=toRead;
        }
        stream->Read(buffer,toRead);
        maxLen=stream->LastRead();
        alreadyRead+=maxLen;
        return buffer;
    }    
};

class HTTPRequest {
public:
    NameValueMap    query;
    NameValueMap    header;
    NameValueMap    cookies;
    wxString        url;
    int             serverPort;
    wxString        serverIp;
    wxString        method;
    int             socket;
};

class RequestHandler{
public:
    virtual HTTPResponse *HandleRequest(HTTPRequest *request)=0;
    virtual wxString GetUrlPattern()=0;
    virtual ~RequestHandler(){};
    wxString corsOrigin(HTTPRequest *request){
        NameValueMap::iterator it=request->header.find("Origin");
        if (it==request->header.end()) return "*";
        return it->second;
    }
    HTTPResponse *handleGetFile(HTTPRequest *request,wxString mimeType,wxFileName name, bool cors=true){
        name.MakeAbsolute();
        wxFileInputStream  *stream=new wxFileInputStream(name.GetFullPath());
        if (! stream->IsOk()){
            delete stream;
            return new HTTPResponse();
        }
        HTTPResponse *rt=new HTTPStreamResponse(mimeType,stream,stream->GetFile()->Length());
        if (cors){
            rt->responseHeaders["Access-Control-Allow-Origin"]=corsOrigin(request);
        }
        return rt;
    }
    unsigned long long WriteFromInput(HTTPRequest *request,wxFile *openOutput,
        unsigned long long len,
        long chunkTimeout=20000); //app. 500Bytes/s
protected:
    HTTPResponse    *EnqueueAndWait(MainQueue *queue,
            MainMessage *msg,
            wxString request,
            long waitTime=10000,
            long enqueueTime=5000){
        if (! queue->Enqueue(msg,enqueueTime)){
            msg->Unref();
            return new HTTPJsonErrorResponse(wxT("unable to enqueue"));
        }
        bool rt=msg->WaitForResult(waitTime);
        if (! rt){
            msg->Unref();
            return new HTTPJsonErrorResponse(wxT("timeout server"));
        }
        LOG_INFO(wxString::Format(wxT("%sRequest: finished"),request));
        return NULL;
    }
    
    wxString    GetHeaderValue(HTTPRequest *request,wxString name){
        NameValueMap::iterator it = request->header.find(name);
        if (it == request->header.end()) {
            return wxEmptyString;
        }
        return it->second;
    }
    wxString    GetQueryValue(HTTPRequest *request,wxString name){
        NameValueMap::iterator it = request->query.find(name);
        if (it == request->query.end()) {
            return wxEmptyString;
        }
        return it->second;
    }
};

#define GET_HEADER(var,name) {\
    var=GetHeaderValue(request,name);\
    if (var == wxEmptyString) return new HTTPJsonErrorResponse("missing header " name);\
    }
#define GET_QUERY(var,name) {\
    var=GetQueryValue(request,name); \
    if (var == wxEmptyString) return new HTTPJsonErrorResponse("missing parameter " name);\
    }

#endif /* REQUESTHANDLER_H */


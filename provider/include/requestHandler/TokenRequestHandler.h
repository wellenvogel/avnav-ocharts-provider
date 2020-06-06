/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Token Request Handler
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
#ifndef TOKENREQUESTHANDLER_H
#define TOKENREQUESTHANDLER_H
#include "RequestHandler.h"
#include "Logger.h"
#include "TokenHandler.h"
#include <wx/wx.h>



class TokenRequestHandler : public RequestHandler {
public:
    const wxString URL_PREFIX=wxT("/tokens/");
    const wxString TOKENRESPONSE=wxT("{\"status\":\"%s\","
      "\"data\":{"
          "\"key\":\"%s\","
          "\"sequence\":\"%d\","
          "\"sessionId\":\"%s\""
      "}"
    "}");
    const wxString TOOMANY=wxT("{\"status\":\"too many clients\"}");
    const wxString JSFILE="tokenHandler.js";
private:
    TokenHandler *handler;
    wxString baseDir;
    HTTPResponse *handleGetLocalFile(HTTPRequest *request,wxString mimeType,wxString fileName){
        wxFileName name(baseDir,fileName);
        return handleGetFile(request,mimeType,name,true);
    }
    
public:
    /**
     * create a request handler
     * @param chartList
     * @param name url compatible name
     */
    TokenRequestHandler(wxString baseDir,TokenHandler *handler){
        this->baseDir=baseDir;
        this->handler=handler;
    }
    virtual HTTPResponse *HandleRequest(HTTPRequest* request) {
        if (request->method == "OPTIONS"){
            HTTPResponse *resp=new HTTPResponse();
            resp->valid=true;
            resp->code=204;
            resp->responseHeaders["Access-Control-Allow-Origin"]=corsOrigin(request);
            resp->responseHeaders["Access-Control-Max-Age"]="86400";
            resp->responseHeaders["Access-Control-Allow-Methods","GET, OPTIONS"];
            NameValueMap::iterator it=request->header.find("access-control-request-headers");
            if (it != request->header.end()){
                resp->responseHeaders["Access-Control-Allow-Headers"]=it->second;
            }
            return resp;
        }
        long start = Logger::MicroSeconds100();
        wxString url = request->url.Mid(URL_PREFIX.Length());
        url.Replace("//","/");
        if (url.StartsWith("/")){
            url=url.AfterFirst('/');
        }
        NameValueMap::iterator it;
        it=request->query.find(wxT("request"));
        if (it == request->query.end()){
            LOG_DEBUG(wxT("empty token request type"));
            return new HTTPResponse();
        }
        if (it->second == "script"){
            LOG_DEBUG(wxT("download script request"));
            return handleGetLocalFile(request,"application/javascript",JSFILE);
        }
        if (it->second == "testHTML"){
            LOG_DEBUG(wxT("download test request"));
            return handleGetLocalFile(request,"text/html","test.html");
        }
        bool isTest=false;
        if (it->second != "key" && it->second != "test"){
            LOG_DEBUG(wxT("invalid token request %s"),it->second);
        }
        if (it->second == "test") isTest=true;
        it=request->query.find("sessionId");
        TokenResult rt;
        if (it == request->query.end()){
            //new session
            LOG_DEBUG(wxT("new session"));
            rt=handler->NewToken();
        }
        else{
            LOG_DEBUG(wxT("next token for %s"),it->second);
            rt=handler->NewToken(it->second);
        }
        if (isTest){
           it=request->query.find(wxT("url"));
           if (it != request->query.end()){
               DecryptResult result=handler->DecryptUrl(it->second);
           }
        }
        if (rt.state == TokenResult::RES_OK){
            HTTPResponse *ret= new HTTPStringResponse("application/json",
                    wxString::Format(TOKENRESPONSE,"OK",rt.key,rt.sequence,rt.sessionId));
            ret->responseHeaders["Access-Control-Allow-Origin"]=corsOrigin(request);
            return ret;
        }
        if (rt.state == TokenResult::RES_TOO_MANY){
           HTTPResponse *ret= new HTTPStringResponse("application/json", TOOMANY);
            ret->responseHeaders["Access-Control-Allow-Origin"]=corsOrigin(request);
            return ret; 
        }
        return new HTTPResponse(); //TODO: detailed error
    }
    virtual wxString GetUrlPattern() {
        return URL_PREFIX+wxT("*");
    }

};

#endif /* CHARTREQUESTHANDLER_H */


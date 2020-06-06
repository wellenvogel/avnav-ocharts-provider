/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  HTTP worker thread
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
#include <wx-3.0/wx/tokenzr.h>
#include <wx-3.0/wx/uri.h>
#include <vector>
#include <wx-3.0/wx/utils.h>

#include "Worker.h"
#include "Logger.h"
#include "RequestHandler.h"
#include "SocketHelper.h"

Worker::Worker(AcceptInterface *accepter,HandlerMap *handlers) : Thread(){
    this->accepter=accepter;
    this->handlers=handlers;
}
Worker::~Worker(){}
void Worker::run(){
    LOG_INFO(wxT("HTTP worker Thread started"));
    int socket=-1;
    while (! shouldStop()){
        socket=accepter->Accept();
        if (socket >= 0){
            LOG_DEBUG(wxT("start processing on socket %d"),socket);
            SocketHelper::SetNonBlocking(socket);
            HandleRequest(socket);
            LOG_DEBUG(wxT("finished request on socket %d"),socket);
            close(socket);
        }
        else{
            if (! shouldStop()) wxMicroSleep(100); //avoid CPU peak in start phase
        }
    }
    LOG_INFO(wxT("HTTP worker thread stopping"));
}

void Worker::HandleRequest(int socket){
    SocketAddress local=SocketHelper::GetLocalAddress(socket);
    SocketAddress peer=SocketHelper::GetRemoteAddress(socket);
    wxString localIP=SocketHelper::GetAddress(local);
    int localPort=SocketHelper::GetPort(local);
    wxString remoteIP=SocketHelper::GetAddress(peer);
    int remotePort=SocketHelper::GetPort(peer);
    LOG_DEBUG(wxT("request local %s:%d, remote %s:%d"),
            localIP,localPort,remoteIP,remotePort);
    wxArrayString requestArray;
    wxString line;
    bool headerDone=false;
    wxLongLong start = wxGetLocalTimeMillis();
    wxLongLong end=start+5000;
    wxLongLong current=start;
    while (!headerDone && !shouldStop() && (current >= start && current < end)) {
        current = wxGetLocalTimeMillis();
        long wait = (end - current).ToLong();
        if (wait <= 0) wait = 1;
        char ch;
        if (SocketHelper::Read(socket, &ch, sizeof (ch), 0) < 1) {
            LOG_DEBUG(wxT("no header data from socket"));
            return;
        }
        if (ch != '\n') {
            line += ch;
        } else {
            line = line.Trim(true);
            if (line.IsEmpty()) {
                headerDone = true;
            } else {
                requestArray.Add(line);
                line.Clear();
            }
        }
    }

    if (!headerDone){
        LOG_DEBUG(wxT("no header received"));
        return;
    }
    HTTPRequest request;
    request.serverPort=localPort;
    request.serverIp=localIP;
    request.socket=socket;
    //TODO: read data for POST
    ParseAndExecute(socket,requestArray,&request);
    
}

static wxString unescape(wxString encoded){
    wxString rt=encoded.Clone();
    rt.Replace("+"," ",true);
    rt=wxURI::Unescape(rt);
    return rt;
}
#define MAXBODY 100000
void Worker::ParseAndExecute(int socket,wxArrayString header,HTTPRequest *request){
    LOG_DEBUG(wxT("found %ld header lines"),header.Count());
    if (header.Count() < 1) return;
    wxString method;
    wxString url;
    wxStringTokenizer tokens(header[0], wxT(" "));
    method=tokens.GetNextToken();
    url=tokens.GetNextToken();
    url.Replace( wxT("+"), wxT(" ") );
    wxURI uri(url);
    url=uri.BuildUnescapedURI();
    int pos;
    wxString query;
    request->url=url;
    request->method=method.Upper();
    if ((pos = url.Find('?')) != wxNOT_FOUND) {
        query  = url.Mid(pos + 1);
        url   = url.Mid(0, pos);

        LOG_DEBUG(wxT("query string = %s"), query);

        wxStringTokenizer qryToke( query, wxT("&") );

        while (qryToke.HasMoreTokens()) {
            wxString pair = qryToke.GetNextToken();
            wxString id, val;

            if ((pos = pair.Find('=')) != wxNOT_FOUND) {
                id  = pair.Mid(0, pos);
                val = pair.Mid(pos + 1);
                LOG_DEBUG(wxT("query id %s val %s"),id,val);
                request->query[id]=val;
            }
        }
    }
    for (size_t hdr_line = 1 ; hdr_line < header.Count() ; hdr_line++)
    {
        wxString hdrName, hdrValue,line;
        int pos = -1;

        line = header[hdr_line];

        /* Find first ':' and parse header-name and value. */
        if ((pos = line.Find(wxT(':'))) != wxNOT_FOUND) {
            hdrName  = line.Mid(0, pos);
            hdrValue = line.Mid(pos + 1).Trim(false);

            if (hdrName.CmpNoCase(wxT("Cookie")) != 0) {
                LOG_DEBUG(wxT("Header [%s] Value [%s]"),hdrName.c_str(),
                                                      hdrValue.c_str());
                request->header[hdrName.Lower()]=hdrValue;
            } else {
                wxStringTokenizer ckeToke(hdrValue, wxT("=;"));
                wxString cookieID, cookieVal;
                while (ckeToke.HasMoreTokens()) {
                    cookieID = ckeToke.GetNextToken().Trim(false);
                    cookieVal = ckeToke.GetNextToken().Trim(false);
                    LOG_DEBUG(wxT("cookie id [%s] value [%s]"),cookieID, 
                        cookieVal);
                    /* Add the cookie to the request cookie-array */
                    request->cookies[cookieID]=cookieVal;
                }
            }
        }
    }
    if (request->method == wxT("POST") || request->method == wxT("PUT")) {
        NameValueMap::iterator it = request->header.find(wxT("content-type"));
        if (it == request->header.end() || !it->second.Lower().StartsWith("application/x-www-form-urlencoded")) {
            LOG_INFO(wxT("can only handle POST with application/x-www-form-urlencoded by default"));
        } else {
            int postSize = 0;
            it = request->header.find("content-length");
            if (it == request->header.end()) {
                ReturnError(socket, 500, "missing content-length");
                return;
            }
            postSize = std::atoi(it->second.ToAscii().data());
            if (postSize < 0 || postSize > MAXBODY) {
                ReturnError(socket, 500, "invalid content-length");
                return;
            }
            char buffer[postSize + 1];
            int rd = 0;
            long start = wxGetLocalTimeMillis().ToLong();
            while (rd < postSize && wxGetLocalTimeMillis().ToLong() < (start + 10000)) {
                int cur = SocketHelper::Read(socket, buffer + rd, postSize - rd, 5000);
                if (cur < 0) {
                    ReturnError(socket, 500, "unexpected end of input");
                    return;
                }
                rd += cur;
            }
            if (rd < postSize) {
                ReturnError(socket, 500, "unexpected end of input");
                return;
            }
            buffer[postSize] = 0;
            wxString body = wxString::FromUTF8(buffer, postSize);
            wxStringTokenizer tokenizer(body, "&");
            while (tokenizer.HasMoreTokens()) {
                wxString pair = tokenizer.GetNextToken();
                if ((pos = pair.Find('=')) != wxNOT_FOUND) {
                    wxString id = unescape(pair.Mid(0, pos));
                    wxString val = unescape(pair.Mid(pos + 1));
                    LOG_DEBUG(wxT("query id %s val %s"), id, val);
                    request->query[id] = val;
                }
            }
        }
    }
    //now the request is parsed, start processing
    RequestHandler *handler = handlers->GetHandler(url);
    if (!handler) {
        ReturnError(socket, 404, "not found");
        return;
    }
    HTTPResponse *response = handler->HandleRequest(request);
    if (response->valid) {
        SendData(socket, response, request);
    } else {
        ReturnError(socket, 404, "not found");
    }
    delete response;
}


void Worker::ReturnError(int socket, int code, const char *description) {
    LOG_DEBUG(wxT("HTTPdWorker::ReturnError(%d, %d, %s)"), socket, code, description);
    char response[700];

    snprintf(response,699, "HTTP/1.1 %d %s\r\nserver: AvNav-Provider\r\n"
            "Access-Control-Allow-Origin: *\r\n"
            "content-type: text/plain\r\n"
            "content-length: %ld\r\n\r\n%s",
            code, description, strlen(description), description);
    response[699]=0;
    SocketHelper::WriteAll(socket,response, strlen(response),5000);
    return;
}
static wxString sHTMLEol = wxT("\r\n");
void Worker::WriteHeadersAndCookies(int socket, HTTPResponse* response, HTTPRequest* request){
    wxString data="";
    if (request->cookies.size() > 0) {
        NameValueMap::iterator it;
        for (it=request->cookies.begin();it != request->cookies.end();it++) {
            data.Append(wxString::Format(wxT("Set-Cookie: %s=%s%s"),it->first,it->second,sHTMLEol));
        }
    }
    if (response->responseHeaders.size()>0){
        NameValueMap::iterator it;
        for (it=response->responseHeaders.begin();it != response->responseHeaders.end();it++){
            data.Append(it->first).Append(": ").Append(it->second).Append(sHTMLEol);
        }
    }
    data.Append(sHTMLEol);
    SocketHelper::WriteAll(socket, data.c_str(), data.Length(),1000 );
}
void Worker::SendData(int socket,HTTPResponse *response,HTTPRequest *request){
    int code=response->code;
    wxString phrase="OK";
    if (code >= 400) phrase="ERROR";
    wxString sHTTP =  wxString::Format(wxT("HTTP/1.1 %d %s%s"),code,phrase,sHTMLEol);
    sHTTP += wxT("Server: AvNav-Provider") + sHTMLEol;
    sHTTP += wxT("Content-Type: ") + response->mimeType + sHTMLEol;
    sHTTP += wxT("Cache-Control: no-store, no-cache, must-revalidate, max-age=0") + sHTMLEol;
    sHTTP += wxT("Content-Length: ") + wxString::Format(wxT("%ld"), response->GetLength()) + sHTMLEol;
    sHTTP += wxT("Connection: Close") + sHTMLEol;
    SocketHelper::WriteAll(socket, sHTTP.c_str(), sHTTP.Length(),1000 );
    WriteHeadersAndCookies(socket,response,request);
    unsigned long maxLen=0;
    if (response->SupportsChunked()){
        maxLen=10000;
        const unsigned char *data;
        while (maxLen > 0){
            data=response->GetData(maxLen);
            if (maxLen <= 0)return;
            int written=SocketHelper::WriteAll(socket,data,maxLen,10000);
            if (written < 0 || (unsigned long)written != maxLen){
                LOG_ERROR(wxT("unable to write all data to socket %d, expected %ld, written %d"),socket,maxLen,written);
            }
            maxLen=10000;
        }
    }
    else{
        SocketHelper::WriteAll(socket, response->GetData(maxLen), response->GetLength() ,10000);
    }
}

#define BUFSIZE 10000
unsigned long RequestHandler::WriteFromInput(HTTPRequest *request,wxFile *openOutput, unsigned long len,long chunkTimeOut) {
    unsigned long bRead=0;
    char buffer[BUFSIZE];
    while (bRead < len){        
        unsigned long rdLen=(len-bRead);
        if (rdLen > BUFSIZE) rdLen=BUFSIZE;
        int rd=SocketHelper::Read(request->socket,buffer,rdLen,chunkTimeOut);
        if (rd <=0){
            LOG_DEBUG(wxT("unable to read %ld bytes from stream"),len);
            return 0;
        }
        int bwr=openOutput->Write(buffer,rd);
        if (bwr != rd){
            LOG_DEBUG(wxT("unable to write %d bytes"),rd);
            return 0;
        }
        bRead+=rd;
    }
    return bRead;
}

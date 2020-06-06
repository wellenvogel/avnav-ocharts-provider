/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Static Request Handler
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
#ifndef STATICREQUESTHANDLER_
#define STATICREQUESTHANDLER_
#include "RequestHandler.h"
#include "Logger.h"
#include "ItemStatus.h"
#include <wx/wx.h>
#include "StringHelper.h"

class StaticRequestHandler : public RequestHandler {
public:
    const wxString URL_PREFIX=wxT("/static");
private:
    wxString baseDir;
public:
   
    StaticRequestHandler(wxString baseDir){
        this->baseDir=baseDir;
    }
    virtual HTTPResponse *HandleRequest(HTTPRequest* request) {
        wxString url = request->url.Mid(URL_PREFIX.Length());
        url.Replace("//","/");
        if (url.StartsWith("/")){
            url=url.AfterFirst('/');
        }
        url=StringHelper::SanitizeString(url.BeforeFirst('?'));
        LOG_DEBUG(wxT("Static request for %s"),url);
        wxFileName name(baseDir,url);
        if (name.Exists()){
            wxString mimeType="application/octet-string";
            if (name.GetFullName().EndsWith(".js")) mimeType="text/javascript";
            if (name.GetFullName().EndsWith(".html")) mimeType="text/html";
            if (name.GetFullName().EndsWith(".css")) mimeType="text/css";
            if (name.GetFullName().EndsWith(".png")) mimeType="image/png";
            if (name.GetFullName().EndsWith(".svg")) mimeType="image/svg+xml";
            return handleGetFile(request,mimeType,name,true);
        }
        HTTPResponse *rt=new HTTPResponse();
        rt->responseHeaders["Access-Control-Allow-Origin"]=corsOrigin(request);
        return rt;       
    }
    virtual wxString GetUrlPattern() {
        return URL_PREFIX+wxT("*");
    }

};

#endif /* STATICREQUESTHANDLER_ */


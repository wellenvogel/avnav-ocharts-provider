/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Status Request Handler
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
#ifndef STATUSREQUESTHANDLER_
#define STATUSREQUESTHANDLER_
#include "RequestHandler.h"
#include "Logger.h"
#include "ItemStatus.h"
#include <wx/wx.h>
#include "StringHelper.h"





class StatusRequestHandler : public RequestHandler {
public:
    const wxString URL_PREFIX=wxT("/status");
private:
    const wxString FRAME=wxT("{\"status\":\"OK\",\n\"data\":\n%s\n}\n");
    ItemStatus    *status;
public:
   
    StatusRequestHandler(ItemStatus *status){
        this->status=status;
    }
    virtual HTTPResponse *HandleRequest(HTTPRequest* request) {
       HTTPStringResponse *rt=new HTTPStringResponse("application/json",wxString::Format(FRAME,status->ToJson()));
       rt->responseHeaders["Access-Control-Allow-Origin"]=corsOrigin(request);
       return rt;       
    }
    virtual wxString GetUrlPattern() {
        return URL_PREFIX+wxT("*");
    }

};

#endif /* STATUSREQUESTHANDLER_ */


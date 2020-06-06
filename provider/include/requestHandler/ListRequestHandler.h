/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Chart Request Handler
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
#ifndef LISTREQUESTHANDLER_
#define LISTREQUESTHANDLER_
#include "RequestHandler.h"
#include "Logger.h"
#include "ChartSetInfo.h"
#include "ChartManager.h"
#include <vector>
#include <wx/wx.h>
#include "StringHelper.h"

const wxString FRAME("{\"status\":\"OK\",\"items\":[%s]}\n");
/*
 entry={
             'name':chart['name'],
             'url':url,
             'charturl':url,
             'time': chart['mtime'],
             'canDelete': True,
             'canDownload': True,
             'scheme': chart['chart'].getScheme(),
             'sequence':chart['chart'].getChangeCount()
      }
 */

const wxString ENTRY(
    "{\n"
    "\"name\":\"%s\",\n"
    "\"url\":\"http://%s:%d/charts/%s\",\n"
    "\"time\":\"%ld\",\n"
    "\"canDelete\":false,\n"
    "\"canDownload\":false,\n"
    "\"eulaMode\":%d,\n"
    "\"infoMode\":%d,\n"
    "\"version\":\"%s\",\n"
    "\"validTo\":\"%s\",\n"
    "\"info\":\"%s\",\n"
    "\"sequence\":%ld,\n"
    "\"tokenUrl\":\"http://%s:%d/tokens/?request=script\",\n"
    "\"tokenFunction\":\"ochartsProvider\"\n"
    "}\n"
);


class ListRequestHandler : public RequestHandler {
public:
    const wxString URL_PREFIX=wxT("/list");
private:
    ChartManager    *manager;
public:
    /**
     * create a request handler
     * @param chartList
     * @param name url compatible name
     */
    ListRequestHandler(ChartManager *manager){
        this->manager=manager;
    }
    virtual HTTPResponse *HandleRequest(HTTPRequest* request) {
       wxString entries("");
       ChartSetMap *map=manager->GetChartSets();
       ChartSetMap::iterator it;
       for (it=map->begin();it!=map->end();it++){
           if (!it->second->IsActive() || ! it->second->IsReady()) continue;
           ChartSetInfo info=it->second->info;
           wxString title=info.title;
           if (info.version != wxEmptyString && info.version.Find('-') != wxNOT_FOUND){
               title.Append("[").Append(info.version.After('-')).Append("]");
           }
           wxString chartInfo=wxString::Format(wxT("%s version %s valid to %s"),StringHelper::safeJsonString(info.title),info.version,info.validTo);
           wxString e=wxString::Format(ENTRY,
                   StringHelper::safeJsonString(title),
                   request->serverIp,
                   request->serverPort,
                   info.name,
                   info.mtime,
                   (int)info.eulaMode,
                   (int)info.chartInfoMode,
                   info.version,
                   info.validTo,
                   chartInfo,
                   manager->GetSettings()->GetCurrentSequence(),
                   request->serverIp,
                   request->serverPort
                   );
           if (entries.Len()<1){
               entries.Append(e);
           }
           else{
               entries.Append(wxT(","));
               entries.Append(e);
           }
       }
       HTTPStringResponse *rt=new HTTPStringResponse("application/json",wxString::Format(FRAME,entries));
       return rt;       
    }
    virtual wxString GetUrlPattern() {
        return URL_PREFIX+wxT("*");
    }

};

#endif /* LISTREQUESTHANDLER_ */


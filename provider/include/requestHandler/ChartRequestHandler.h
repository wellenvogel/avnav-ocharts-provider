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
#ifndef CHARTREQUESTHANDLER_H
#define CHARTREQUESTHANDLER_H
#include "RequestHandler.h"
#include "Logger.h"
#include "ChartList.h"
#include "Renderer.h"
#include "TokenHandler.h"
#include "SimpleThread.h"
#include <wx/string.h>
#include <wx/tokenzr.h>
#include <wx/filename.h>


static wxString AVNAV_FORMAT("<?xml version=\"1.0\" encoding=\"UTF-8\" ?>"
 "<TileMapService version=\"1.0.0\" >"
   "<Title>%s</Title>"
   "<TileMaps>"
     "<TileMap" 
       " title=\"%s\"" 
       " href=\"http://%s:%d%s\""
       " minzoom=\"%d\""
       " maxzoom=\"%d\""
       " projection=\"EPSG:4326\">"
	     "<BoundingBox minlon=\"%f\" minlat=\"%f\" maxlon=\"%f\" maxlat=\"%f\" title=\"layer\"/>"
       "<TileFormat width=\"256\" height=\"256\" mime-type=\"x-png\" extension=\"png\" />"
    "</TileMap>"
   "</TileMaps>"
 "</TileMapService>");

static wxString DEFAULT_EULA("<html>"
    "<body>"
    "<p>No license file found</p>"
    "<p>Refer to <a href=\"https://o-charts.org/\">o-charts</a> for license info.</p>"
    "</body"
    "</html>");
class ChartRequestHandler : public RequestHandler {
public:
    const wxString URL_PREFIX=wxT("/charts/");
    const wxString avnavXml=wxT("avnav.xml");
private:
    TokenHandler *tokenHandler;
    ChartList *chartList;
    ChartSet  *set;
    wxString name;
    wxString urlPrefix;   
    ChartSetInfo info;
    HTTPResponse *handleOverviewRequest(HTTPRequest *request){
        int minZoom=chartList->GetMinZoom();
        int maxZoom=chartList->GetMaxZoom();
        BoundingBox b=chartList->GetBoundings();       
        wxString data=wxString::Format(AVNAV_FORMAT,
                name,name,request->serverIp,request->serverPort,urlPrefix,minZoom,maxZoom,
                b.minLon,b.minLat,b.maxLon,b.maxLat);
        HTTPResponse *rt=new HTTPStringResponse("application/xml",data);
        rt->responseHeaders["Access-Control-Allow-Origin"]="*";
        return rt;
    }
    
    HTTPResponse *tryOpenFile(wxString base,wxString file,wxString mimeType){
        wxFileName fileName(base,file);
        fileName.MakeAbsolute();
        if (!wxFileExists(fileName.GetFullPath())){
            return NULL;
        }
        LOG_DEBUG(wxT("open file %s"),fileName.GetFullPath());
        wxFileInputStream  *stream=new wxFileInputStream(fileName.GetFullPath());
        if (! stream->IsOk()){
            delete stream;
            return NULL;
        }
        HTTPResponse *rt=new HTTPStreamResponse(mimeType,stream,stream->GetFile()->Length());
        rt->responseHeaders["Access-Control-Allow-Origin"]="*";
        return rt;
    }
    HTTPResponse *handleEulaRequest(HTTPRequest *request){
        //Accept-Language: de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7,es;q=0.6
        wxString languageHeader="en";
        NameValueMap::iterator it=request->header.find("accept-language");
        if (it != request->header.end()){
            languageHeader=it->second+","+languageHeader;
        }
        LOG_DEBUG(wxT("EULA request for %s, languages=%s"),name,languageHeader);
        wxStringTokenizer tokenizer(it->second,",");
        wxString lang=tokenizer.GetNextToken();
        HTTPResponse *rt=NULL;
        std::vector<wxString>::iterator fit;
        while (lang != wxEmptyString){
            if (lang.Find(';') >= 0){
                lang=lang.Before(';');
            }
            for(fit=info.eulaFiles.begin();fit!=info.eulaFiles.end();fit++){
                if (fit->StartsWith(lang.Upper()+"_")){
                    rt=tryOpenFile(info.dirname,*fit,"text/html");
                    if (rt != NULL){
                        LOG_DEBUG(wxT("found existing eula file %s for %s"),*fit,lang);
                        return rt;
                    }
                }
            }
            lang=tokenizer.GetNextToken();
        }
        //did not find any eula file matching our languages, try any...
        for(fit=info.eulaFiles.begin();fit!=info.eulaFiles.end();fit++){
            rt=tryOpenFile(info.dirname,*fit,"text/html");
                    if (rt != NULL){
                        LOG_DEBUG(wxT("found existing eula file %s for any"),*fit);
                        return rt;
                    }
        }
        //no eula file - use default
        rt=new HTTPStringResponse("text/html",DEFAULT_EULA);
        rt->responseHeaders["Access-Control-Allow-Origin"]="*";
        return rt;
    }
public:
    /**
     * create a request handler
     * @param chartList
     * @param name url compatible name
     */
    ChartRequestHandler(ChartSet * set,TokenHandler *tk){
        this->chartList=set->charts;
        this->set=set;
        this->name=set->GetKey();
        this->tokenHandler=tk;
        urlPrefix=URL_PREFIX+name+wxT("/");
        this->info=set->info;
    }
    virtual HTTPResponse *HandleRequest(HTTPRequest* request) {
        if (! set->IsActive()){
            return new HTTPResponse();
        }
        long start = Logger::MicroSeconds100();
        wxString url = request->url.Mid(urlPrefix.Length());
        url.Replace("//","/");
        if (url.StartsWith("/")){
            url=url.AfterFirst('/');
        }
        if (url.StartsWith(avnavXml)){
            //get chart overview
            return handleOverviewRequest(request);
        }
        if (url.StartsWith("eula")){
            return handleEulaRequest(request);
        }
        DecryptResult res;
        if (url.StartsWith("encrypted/")){
            wxString encrypted=url.AfterFirst('/');
            res=tokenHandler->DecryptUrl(encrypted);
            if (res.url == wxEmptyString){
                LOG_DEBUG(_T("unable to decrypt url %s"),encrypted);
                return new HTTPResponse();
            }
            url=res.url;
        }
        else{
            LOG_DEBUG(_T("invalid url %s"), url);
            return new HTTPResponse();
        }
        TileInfo tile(url,name);
        if (! tile.valid) {
            LOG_DEBUG(_T("invalid url %s"), url);
            return new HTTPResponse();
        }
        if (res.sessionId != wxEmptyString){
            set->LastRequest(res.sessionId,tile);
        }
        CacheEntry *ce=NULL;
        Renderer::RenderResult rt = Renderer::Instance()->renderTile(set,tile, ce);
        if (rt != Renderer::RENDER_OK) return new HTTPResponse();
        //the Cache entry is now owned by the response
        //and will be unrefed there
        HTTPResponse *response = new HTTPBufferResponse("image/png", ce);
        long timeSave = Logger::MicroSeconds100();
        LOG_DEBUG(_T("http render: all=%ld"),
                (timeSave - start)*100
                );
        return response;
    }
    virtual wxString GetUrlPattern() {
        return urlPrefix+wxT("*");
    }

};

#endif /* CHARTREQUESTHANDLER_H */


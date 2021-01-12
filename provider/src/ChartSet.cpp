/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Chart Set
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

#include "ChartSet.h"
#include "ChartList.h"
#include "CacheHandler.h"
#include "MD5.h"
#include "TokenHandler.h"
#include "Logger.h"
#include "StringHelper.h"
#include <wx/filename.h>
#include <algorithm>



ChartSet::ChartSet(ChartSetInfo info, SettingsManager *manager,bool canDelete){
        this->info=info;
        this->charts=new ChartList();
        this->cache=NULL;
        this->active=true;
        this->numCandidates=0;
        this->rdwr=NULL;
        this->state=STATE_INIT;
        this->maxDiskCacheEntries=0;
        this->maxCacheEntries=0;
        this->dataDir=wxEmptyString;
        this->settings=manager;
        this->scales = new ZoomLevelScales(settings->GetBaseScale());
        this->openErrors=0;
        this->canDelete=canDelete;
        AddItem("info",&(this->info));
        AddItem("charts",charts);
        int cacheId=CACHE_VERSION_IDENTIFIER;
        MD5_ADD_VALUE(setToken,cacheId);
        numValidCharts=0;
    }

wxString ChartSet::GetCacheFileName(){
    wxFileName cacheFile(dataDir,info.name+".avcache");
    cacheFile.MakeAbsolute();
    return cacheFile.GetFullPath();
}
void ChartSet::CreateCache(wxString dataDir,long maxEntries,long maxFileEntries){
    this->maxCacheEntries=maxEntries;
    this->maxDiskCacheEntries=maxFileEntries;
    this->dataDir=dataDir;
    cache=new CacheHandler(GetKey(),maxEntries,maxFileEntries);
    AddItem("cache",cache);
    if (maxEntries < 1){
        LOG_INFO(wxT("no cache configured, do not start reader/writer"));
        return;
    }
    if (! active){
        LOG_INFO(wxT("ChartSet %s is not active, do not start caches"),GetKey());
        return;
    }   
    MD5 cacheToken=setToken;
    cacheToken.AddValue(info.userKey);
    cacheToken.AddFileInfo(wxT("Chartinfo.txt"),info.dirname);
    settings->AddSettingsToMD5(&cacheToken);
    rdwr=new CacheReaderWriter(GetCacheFileName(),cacheToken.GetHex(),cache,maxFileEntries);
    rdwr->start();
    AddItem("cacheWriter",rdwr);
}

void ChartSet::UpdateSettings(bool removeCacheFile){
    LOG_INFO(wxT("ChartSet %s: update settings"),GetKey());
    {
        Synchronized locker(settingsLock);
        if (scales != NULL) delete scales;
        scales=new ZoomLevelScales(settings->GetBaseScale());
    }
    //potentially we render a couple of tiles still with the old settings
    //but as we delete the caches afterwards...
    SetZoomLevels();
    LOG_INFO(wxT("ChartSet %s: resetting caches"),GetKey());
    if (maxCacheEntries < 1){
        LOG_INFO(wxT("no cache configured, do not start reader/writer"));
        return;
    }
    if (rdwr != NULL){
        RemoveItem("cacheWriter");
        rdwr->stop();
        rdwr->join();
        delete rdwr;
        rdwr=NULL;
    }
    LOG_INFO(wxT("ChartSet %s: writer stopped, resetting now"),GetKey());
    if (cache != NULL) cache->Reset();
    {
        Synchronized locker(lock);
        lastRequests.clear();
    }
    if (removeCacheFile){
        wxString cacheFile=GetCacheFileName();
        if (wxFileExists(cacheFile)){
            LOG_INFO(wxT("ChartSet %s: removing cache file %s"),GetKey(),cacheFile);
            if (!wxRemoveFile(cacheFile)){
                LOG_ERROR(wxT("ChartSet %s: unable to remove cache file"),GetKey());
            }
        }
    }
    if (! active){
        LOG_INFO(wxT("ChartSet %s is now inactive - do not start caches"),GetKey());
        return;
    }
    if (cache == NULL ){
        LOG_ERROR(wxT("ChartSet %s cannot be actived as it was not there during start"),GetKey());
        return;
    }    
    MD5 cacheToken=setToken;
    cacheToken.AddValue(info.userKey);
    cacheToken.AddFileInfo(wxT("Chartinfo.txt"),info.dirname);
    settings->AddSettingsToMD5(&cacheToken);
    rdwr=new CacheReaderWriter(GetCacheFileName(),cacheToken.GetHex(),cache,maxDiskCacheEntries);
    rdwr->start();
    AddItem("cacheWriter",rdwr);
}

void ChartSet::AddCandidate(ChartCandidate candidate){
    candidates.push_back(candidate);
    setToken.AddFileInfo(candidate.fileName);
    numCandidates++;
}
void ChartSet::AddError(wxString fileName){
    openErrors++;
}

bool ChartSet::SetEnabled(bool enabled,wxString disabledBy){
    LOG_INFO(wxT("ChartSet %s set enabled to "),GetKey(),(enabled?"true":"false"));
    if (enabled){
        this->disabledBy=wxEmptyString;
    }
    else{
        this->disabledBy=disabledBy;
    }
    if (active != enabled){
        active=enabled;
        return true;
    }
    return false;
}


double ChartSet::GetMppForZoom(int zoom) {
    Synchronized locker(settingsLock);
    return scales->GetMppForZoom(zoom);
}

void ChartSet::SetZoomLevels() {
    Synchronized locker(settingsLock);
    charts->UpdateZooms(scales);
}



void ChartSet::Stop(){
    if (rdwr != NULL){
        rdwr->stop();
        rdwr->join();
    }
}

bool ChartSet::CacheReady(){
    if (!active) return true;
    if (!rdwr) return false;
    return (
            rdwr->GetState() == CacheReaderWriter::STATE_WRITING
            ||
            rdwr->GetState() == CacheReaderWriter::STATE_ERROR
            );
}

bool ChartSet::SetTileCacheKey(TileInfo& tile){
    MD5 tileCacheKey;
    tileCacheKey.AddValue(info.userKey);
    tileCacheKey.AddValue(info.dirname);
    MD5_ADD_VALUE(tileCacheKey,tile.zoom);
    MD5_ADD_VALUE(tileCacheKey,tile.x);
    MD5_ADD_VALUE(tileCacheKey,tile.y);
    if (!tileCacheKey.IsOk()) return false;
    tile.cacheKey=tileCacheKey.GetValueCopy();
    return true;
}

void ChartSet::LastRequest(wxString sessionId, TileInfo tile){
    Synchronized locker(lock);
    if (lastRequests.size() < (MAX_CLIENTS*2)){
        lastRequests[sessionId]=tile;
    }
}

ChartSet::RequestList ChartSet::GetLastRequests(){
    RequestList rt;
    RequestMap::iterator it;
    {
        Synchronized locker(lock);
        for (it = lastRequests.begin();it!= lastRequests.end();it++){
            rt.push_back(it->second);
        }
        lastRequests.clear();
    }
    //remove duplicates
    RequestList finalRt;
    RequestList::iterator rit,fit;
    for (rit=rt.begin();rit!=rt.end();rit++){
        fit=std::find(finalRt.begin(),finalRt.end(),*rit);
        if (fit == finalRt.end()) finalRt.push_back(*rit);
    }
    return finalRt;
}

bool ChartSet::DisabledByErrors(){
    return openErrors >= MAX_ERRORS_RETRY;
}

wxString ChartSet::LocalJson(){
    wxString status = "INIT";
    if (DisabledByErrors()) {
        status = "ERROR";
    } else {
        switch (state) {
            case STATE_PARSING:
                status = "PARSING";
                break;
            case STATE_READY:
                status = "READY";
                break;
            case STATE_DELETED:
                status = "DELETED";
                break;
            default:
                break;
        }
    }
    return wxString::Format(
            JSON_IV(numCandidates,%d) ",\n"
            JSON_SV(status,%s) ",\n"
            JSON_IV(active,%s) ",\n"
            JSON_IV(ready,%s) ",\n"
            JSON_IV(errors,%d) ",\n"
            JSON_SV(disabledBy,%s) ",\n"
            JSON_IV(canDelete,%s) ",\n"
            JSON_IV(numValidCharts,%d) "\n",
            numCandidates,
            status, 
            PF_BOOL(active),
            PF_BOOL(IsReady()),
            openErrors,
            disabledBy,
            PF_BOOL(canDelete),
            numValidCharts
            );
}
void    ChartSet::SetReady(){
    state=STATE_READY;
    numValidCharts=charts->NumValidCharts();
}

void ChartSet::AddChart(ChartInfo* info){
    charts->AddChart(info);
    if (info->IsValid()){
        numValidCharts=charts->NumValidCharts();
    }
}
void ChartSet::GetOverview(int& minZoom, int& maxZoom, BoundingBox& boundings){
    minZoom=charts->GetMinZoom();
    maxZoom=charts->GetMaxZoom();
    boundings=charts->GetBoundings();
}
WeightedChartList  ChartSet::FindChartForTile(int minZoom,int maxZoom,LatLon &northwest,LatLon &southeast,int goUp){
    return charts->FindChartForTile(minZoom,maxZoom,northwest,southeast,goUp);
}
wxString ChartSet::GetSetToken(){
    return setToken.GetHex();
}


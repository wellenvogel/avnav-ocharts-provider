/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Cache Filler
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

#include "CacheFiller.h"
#include "Renderer.h"
#include "ItemStatus.h"
#include "TokenHandler.h"
#include "SystemHelper.h"
#include "StringHelper.h"

//limit the entries in the write queue that we fill
#define MAX_WRITE_QUEUE 200

    

CacheFiller::CacheFiller(unsigned long maxPerSet,long maxPrefillZoom,ChartManager *manager) : Thread(){
    this->manager=manager;
    this->maxPrefillZoom=maxPrefillZoom;
    this->maxPerSet=maxPerSet;
    paused=false;
    pauseTime=0;
    isPrefilling=false;
    isStarted=false;
    
}

CacheFiller::~CacheFiller() {
}

void CacheFiller::Pause(bool on) {
    if (on) pauseTime=wxGetLocalTime();
    this->paused=on;
}

wxString CacheFiller::ToJson(){
    Synchronized locker(statusLock);
    wxString rt=wxString::Format("{"
            JSON_IV(prefilling,%s) ",\n"
            JSON_IV(started,%s) ",\n"
            JSON_IV(paused,%s) ",\n"
            JSON_SV(currentSet,%s) ",\n"
            JSON_IV(currentZoom,%d) ",\n"
            JSON_IV(maxZoom,%d) ",\n"
            JSON_IV(numSets,%d) ",\n"
            JSON_IV(currentSetIndex,%d) ",\n"
            JSON_IV(prefillCounts,[) "\n",
            PF_BOOL(isPrefilling),
            PF_BOOL(isStarted),
            PF_BOOL(paused),
            StringHelper::safeJsonString(currentPrefillSet),
            currentPrefillZoom,
            (int)maxPrefillZoom,
            numSets,
            currentSetIndex);
    PrefillTiles::iterator si;
    ZoomTiles::iterator zi;
    for (si=prefillTiles.begin();si!=prefillTiles.end();si++){
        if (si != prefillTiles.begin()){
            rt.Append(",\n");
        }
        wxString zts="";
        for (zi=si->second.begin();zi!=si->second.end();zi++){
            if (zi != si->second.begin()) zts.Append(",");
            zts.Append(wxString::Format("\"%d\":%ld",zi->first,zi->second));
        }
        wxString title=si->first;
        ChartSet *set=manager->GetChartSet(si->first);
        if (set != NULL){
            title=set->info.title;
        }
        rt.Append(wxString::Format("{\n"
                JSON_SV(name,%s) ",\n"
                JSON_SV(title,%s) ",\n"
                JSON_IV(levels,{%s}) "\n"
                "}\n",
                StringHelper::safeJsonString(si->first),
                StringHelper::safeJsonString(title),
                zts));
    }
    rt.Append("]\n}\n");
    return rt;
    }

#define MAX_PAUSED (60*5)
void CacheFiller::SleepPaused() {
    if (! paused) return;
    bool notified=false;
    while(paused){
        long now=wxGetLocalTime();
        if (now > (pauseTime + MAX_PAUSED)){
            break;
        }
        if (! notified){
            LOG_INFO(wxT("Filler pausing"));
            notified=true;
        }
        if (shouldStop()) return;
        usleep(50000);
    }
    if (notified){
        LOG_INFO(wxT("Filler continuing"));
    }
    paused=false;
}


/**
 * compute the candidates we initially put into the cache
 * @param currentSet
 */
void CacheFiller::RenderPrefill(ChartSet *currentSet) {
    if (!currentSet->IsEnabled()){
        LOG_INFO(wxT("CachePrefill: skip set %s, not enabled"),currentSet->GetKey());
        return;
    }
    if (currentSet->DisabledByErrors()){
        LOG_INFO(wxT("CachePrefill: skip set %s, disabled by loading errors"),currentSet->GetKey());
        return;
    }
    CacheHandler *handler=currentSet->cache;
    {
        Synchronized locker(statusLock);
        currentPrefillSet=currentSet->info.title;
    }
    if (handler == NULL){
        LOG_ERROR(wxT("no cache created for set %s, unable to fill"),currentSet->info.name);
        return;
    }
    long numPerSet = maxPerSet; 
    LOG_INFO(wxT("ComputeCacheCandidates for chart set %s, max %ld entries"),
            currentSet->info.name,numPerSet);
    long numInSet = 0;
    int zoom = 0;
    std::vector<TileBox> boxes;
    int minZoom,maxZoom;
    BoundingBox boundings;
    currentSet->GetOverview(minZoom,maxZoom,boundings);
    for (zoom = minZoom;
            numInSet < numPerSet && zoom <= maxZoom; zoom++) {
        ChartList::InfoList zoomCharts=currentSet->GetZoomCharts(zoom);
        if (shouldStop()) return;
        SleepPaused();
        if (zoomCharts.size() < 1) continue;
        ChartList::InfoList::iterator it;
        //if we have charts on this layer, we use those
        //otherwise we use the boxes from the lower zoom
        boxes.clear();
        for (it=zoomCharts.begin();it!=zoomCharts.end();it++){
            boxes.push_back((*it)->GetTileBounds());
        }
        int renderZoom=zoom;
        //just go down again even if we potentially had those tiles already
        //will just give early cache hits
        {
            Synchronized locker(statusLock);
            currentPrefillZoom=zoom;
        }
        while ( (zoom-renderZoom) <= manager->GetSettings()->GetOverZoom()){
            int numInZoom = 0;
            std::vector<TileBox>::iterator it;
            for (it=boxes.begin();it != boxes.end();it++){
                TileBox bounds=(*it);
                if (renderZoom <= maxPrefillZoom) {
                    for (int x = bounds.xmin; x <= bounds.xmax; x++) {
                        for (int y = bounds.ymin; y <= bounds.ymax; y++) {
                            SleepPaused();
                            if (shouldStop()) return;
                            TileInfo info(
                                    renderZoom, x, y,
                                    currentSet->GetKey());                               
                            ProcessNextTile(info);
                            numInZoom++;
                            numInSet++;
                            if (numInSet > numPerSet) break;
                        }
                        if (numInSet > numPerSet) break;
                    }
                }
                else{
                    LOG_DEBUG(wxT("CacheFiller %s: ignoring zoom %d in prefill"),currentSet->info.name,renderZoom);
                }
                (*it).DownZoom();
            }
            LOG_INFO(wxT("CacheFiller %s: prefilled for zoom=%d: %d"), currentSet->info.name, renderZoom, numInZoom);
            renderZoom--;
        }
        if (numInSet > numPerSet) break;
    }
    if (zoom < maxZoom) {
        LOG_DEBUG(wxT("CacheFiller %s:  stopped caching on zoom %d as %lld per set is reached"),
                currentSet->info.name,
                zoom,
                numPerSet
                );
    }

    LOG_INFO(wxT("Cache filler %s prefilled %ld tiles"),
            currentSet->info.name,
            numInSet);
}


#define SURROUND 2 //gives 5x5 on each layer - i.e. 75 tiles on each request
#define MAX_RENDER_HINTS ((SURROUND * 2 + 1) *MAX_CLIENTS * 2)

void CacheFiller::CheckRenderHints() {
    if (renderHints.size() >= MAX_RENDER_HINTS) return;
    size_t initialSize=renderHints.size();
    ChartSetMap::iterator csit;
    ChartSetMap *sets=manager->GetChartSets();
    for (csit=sets->begin();csit != sets->end();csit++){
        ChartSet::RequestList renderRequests=csit->second->GetLastRequests();
        ChartSet::RequestList::iterator rit;
        int minZoom,maxZoom;
        BoundingBox boundings;
        csit->second->GetOverview(minZoom,maxZoom,boundings);
        for (rit = renderRequests.begin(); rit != renderRequests.end(); rit++) {
            //one down, current, one up
            for (int zd = 0; zd < 3; zd++) {
                TileInfo current(*rit);
                if ( zd == 1){
                    current.zoom--;
                    if (current.zoom < minZoom) continue;
                    current.x=current.x/2;
                    current.y=current.y/2;
                }
                if (zd == 2){
                    current.zoom++;
                    if (current.zoom > maxZoom) continue;
                    current.x=current.x*2;
                    current.y=current.y*2;
                }
                for (int x = current.x - SURROUND; x <= current.x + SURROUND; x++) {
                    if (x < 0) continue;
                    if (x >= (1 << current.zoom)) continue;
                    for (int y = current.y - SURROUND; y <= current.y + SURROUND; y++) {
                        if (y < 0) continue;
                        if (y >= (1 << current.zoom)) continue;
                        renderHints.push_back(TileInfo(current.zoom, x, y, current.chartSetKey));
                    }
                }
            }
        }
    }
    if (renderHints.size() > initialSize){
        LOG_DEBUG(wxT("CacheFiller:CheckRenderHints added %d tiles"),(int)(renderHints.size()-initialSize));
    }
}

void CacheFiller::ProcessRenderHints(){
    CheckRenderHints();
    while (renderHints.size()>0 && ! shouldStop()){
        TileInfo next = renderHints.front();
        renderHints.pop_front();
        LOG_DEBUG(wxT("CacheFiller render hint %s"),next.ToString());
        RenderTile(next,true);
        if (shouldStop()) break;
        CheckRenderHints();
    }
}

void CacheFiller::ProcessNextTile(TileInfo tile){
    ProcessRenderHints();
    LOG_DEBUG(wxT("CacheFiller prefill %s"),tile.ToString());
    RenderTile(tile,false);
}

void CacheFiller::RenderTile(TileInfo tile,bool processingRenderHint) {
    CacheEntry *entry = NULL;
    ChartSet *set = manager->GetChartSet(tile.chartSetKey);
    if (set == NULL) {
        LOG_DEBUG(wxT("unable to find a chart set for %s"), tile.chartSetKey);
        return;
    }
    CacheHandler *handler = set->cache;
    if (handler == NULL) {
        LOG_DEBUG(wxT("no cache for set %s"), tile.chartSetKey);
        return;
    }
    unsigned long currentDiskEntries = handler->CurrentDiskEntries();
    if (currentDiskEntries >= maxPerSet && !processingRenderHint) {
        LOG_DEBUG(wxT("Cache filler, max prefill disk entries %lld reached for %s, skip"),
                maxPerSet, set->GetKey());
        return;
    }
    if (currentDiskEntries >= handler->MaxDiskEntries()) {
        LOG_DEBUG(wxT("Cache filler, max disk entries %lld reached for %s, skip"),
                handler->MaxDiskEntries(), set->GetKey());
        return;
    }
    bool isWaiting = false;
    while (handler->GetWriteQueueSize() > MAX_WRITE_QUEUE) {
        if (!isWaiting) {
            isWaiting = true;
            LOG_DEBUG(wxT("Cache filler waiting for write queue at %s"), set->GetKey());
        }
        waitMillis(100);
        if (shouldStop()) return;
    }
    if (isWaiting) {
        LOG_DEBUG(wxT("Cache filler finished waiting for write queue at %s"), set->GetKey());
    }
    {
        Synchronized locker(statusLock);
        prefillTiles[set->GetKey()][tile.zoom]++;    
    }
    set->SetTileCacheKey(tile);
    Renderer::RenderResult rendered = Renderer::RENDER_QUEUE;
    LOG_DEBUG(wxT("Cache filler - render tile %s"), tile.ToString());
    while (!shouldStop() && rendered == Renderer::RENDER_QUEUE) {
        if ((entry = handler->FindEntry(tile.GetCacheKey(), false)) != NULL) {
            LOG_DEBUG(wxT("CacheFiller %s cache hit for %s"), tile.chartSetKey, tile.GetCacheKey().ToString());
            entry->Unref();
            break;
        }
        if (handler->HasDiskEntry(tile.GetCacheKey())) {
            LOG_DEBUG(wxT("CacheFiller %s disk cache hit for %s"), tile.chartSetKey, tile.GetCacheKey().ToString());
            break;
        }

        rendered = Renderer::Instance()->renderTile(
                set,
                tile, entry, 100, true);
        if (rendered == Renderer::RENDER_OK) {
            entry->Unref();
            LOG_DEBUG(wxT("Cache filler - finished render tile %s"), tile.ToString());
        }
        if (rendered == Renderer::RENDER_FAIL) {
            LOG_DEBUG(wxT("CacheFiller nothing to render for %s"), tile.ToString());
        }
    }
}


void CacheFiller::run() {
    LOG_INFO(wxT("cache filler started"));
    isStarted=true;
    int globalKb,ourKb;
    SystemHelper::GetMemInfo(&globalKb,&ourKb);
    LOG_DEBUG(wxT("Memory cache filler start global=%dkb,our=%dkb"),globalKb,ourKb);
    ChartSetMap::iterator csit;
    ChartSetMap *sets=manager->GetChartSets();
    isPrefilling=true;
    numSets=sets->size();
    currentSetIndex=0;
    for (csit=sets->begin();csit != sets->end();csit++){
        RenderPrefill(csit->second);
        currentSetIndex++;
    }
    isPrefilling=false;
    bool isActive = true;
    while (!shouldStop()) {                   
        if (! paused) CheckRenderHints();
        if (renderHints.size() < 1) {
            if (isActive) {
                LOG_INFO(wxT("Cache filler finished"));
                isActive = false;
            }
            waitMillis(100);
            continue;
        }
        if (!isActive) {
            LOG_INFO(wxT("Cache filler starts"));
            isActive = true;
        }
        ProcessRenderHints();
    }     
}



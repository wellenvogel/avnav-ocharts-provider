/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Chart Info
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

#include "Renderer.h"
#include <wx/log.h>
#include <wx/bitmap.h>
#include <wx/dcmemory.h>
#include "georef.h"
#include <algorithm> 
#include "Logger.h"
#include "CacheHandler.h"
#include "ChartManager.h"



RenderMessage::RenderMessage(TileInfo& tile, ChartSet *set, 
        Renderer *renderer,long settingsSequence): MainMessage() {
    this->tile = tile;
    renderOk = false;
    creationTime=Logger::MicroSeconds100();
    findTime=creationTime;
    dequeueTime=creationTime;
    afterRenderTime=creationTime;
    afterImageTime=creationTime;
    afterPngTime=creationTime;
    cacheResult=NULL;
    renderResult=NULL;
    this->set=set;
    this->renderer=renderer;
    this->settingsSequence=settingsSequence;
}
RenderMessage::~RenderMessage(){
    if (cacheResult != NULL) cacheResult->Unref();
    if (renderResult != NULL) free(renderResult);
}


void RenderMessage::SetDequeueTime(){
    dequeueTime=Logger::MicroSeconds100();
}

void RenderMessage::SetAfterImageTime(){
    afterImageTime=Logger::MicroSeconds100();
}


wxString RenderMessage::GetTimings(){
    return wxString::Format(_T("find=%ld,dequeue=%ld,render=%ld,image=%ld,png=%ld,all=%ld"),
            (findTime-creationTime)*100,
            (dequeueTime-findTime)*100,
            (afterRenderTime-dequeueTime)*100,
            (afterImageTime - afterRenderTime)*100,
            (afterPngTime - afterImageTime)*100,
            (afterPngTime - creationTime)*100);
}


void RenderMessage::StoreResult(wxImage& result, bool ok){
    renderOk=ok;
    //copy the image data here 
    //as we do not want to hand over the image to a different thread
    renderResult=(unsigned char *)malloc(TILE_SIZE*TILE_SIZE*3);
    int sz=TILE_SIZE*TILE_SIZE*3;
    int isz=result.GetWidth()*result.GetHeight()*3;
    if (isz < sz) {
        sz=isz;
    }
    memcpy(this->renderResult,result.GetData(),sz);
    afterRenderTime=Logger::MicroSeconds100();
    SetDone();
}

void RenderMessage::StoreResult(CacheEntry *entry, bool ok){
    cacheResult=entry;
    renderOk=true;
    afterRenderTime=Logger::MicroSeconds100();
    SetDone();
}

bool RenderMessage::CreateFinalResult(wxColor &back){
    if (cacheResult != NULL) return false;
    if (!renderOk) return false;
    if (renderResult == NULL) return false;
    wxImage renderImage(TILE_SIZE,TILE_SIZE,renderResult,false);
    renderImage.SetMaskColour(back.Red(),back.Green(),back.Blue());
    SetAfterImageTime();
    wxMemoryOutputStream *stream=new wxMemoryOutputStream();
    renderImage.SaveFile(*stream, wxBITMAP_TYPE_PNG);
    cacheResult=new CacheEntry(tile.GetCacheKey(),stream);
    afterPngTime=Logger::MicroSeconds100();
    renderResult=NULL; //should be freed when the image goes away
    return true;
}

CacheEntry * RenderMessage::GetCacheResult(){
    if (cacheResult != NULL){
        cacheResult->Ref();
        return cacheResult;
    }
    return NULL;
}

void RenderMessage::SetCharts(WeightedChartList charts){
    this->charts=charts;
    findTime=Logger::MicroSeconds100();
}

void RenderMessage::SetViewPort(PlugIn_ViewPort vp){
    this->viewport=vp;
}

void RenderMessage::Process(bool discard){
    if (discard) {
        SetDone();
        return;
    }
    renderer->DoRenderTile(this);
}


//must be called in main thread
Renderer::Renderer(ChartManager *manager,MainQueue *queue){
    this->manager=manager;
    this->queue=queue;
    stop=false;
    GetGlobalColor(_T("NODTA"), &backColor);
    //create an initial Bitmap that we can clone for each render
    initialBitmap=new wxBitmap(TILE_SIZE, TILE_SIZE, 32);
    wxMemoryDC initialDc(*initialBitmap);
    initialDc.SetBackground(wxBrush(backColor));
    initialDc.Clear();
    initialDc.SelectObject(wxNullBitmap);
}

Renderer *Renderer::_instance=NULL;

void Renderer::CreateInstance(ChartManager *manager,MainQueue *queue){
    if (_instance != NULL) return;
    Renderer * ni=new Renderer(manager,queue);
    _instance=ni;
}



void Renderer::DoRenderTile(RenderMessage *msg){
    long start=Logger::MicroSeconds100();
    TileInfo tile=msg->GetTile();
    if (msg->GetSettingsSequence() != manager->GetSettings()->GetCurrentSequence()){
        LOG_DEBUG(wxT("DoRenderTile: %s settings sequence changed, cancel"),tile.ToString());
        msg->SetDone();
    }
    //we need to check the cache again as maybe some requests already had
    //been in the queue
    ChartSet *set=msg->GetSet();
    msg->SetDequeueTime();
    //we only check the in memory cache again
    //it is very unlikely that a tile was not in the cache when the request started but now
    //already removed from the in memory cache and written to disk
    //just within the time the request was waiting in the queue
    //worst case we render again - no problem anyway - but in 99.xxx% this saves the time
    //to look up the disk cache entry
    if (set->cache != NULL){
        CacheEntry *ce=set->cache->FindEntry(tile.GetCacheKey(),false);
        if (ce){
            LOG_DEBUG(wxT("late cache hit for %s"),tile.ToString());
            msg->StoreResult(ce,true);
            return ;
        }
    }
    
    wxBitmap renderBitmap=initialBitmap->GetSubBitmap(wxRect(0,0,TILE_SIZE,TILE_SIZE));
    int startIndex=0;
    wxMemoryDC renderDc(renderBitmap);
    //see ChartPlugInWrapper::RenderRegionViewOnDC
    //see Quilt::DoRenderQuiltRegionViewOnDC
    PlugIn_ViewPort vpoint=msg->GetViewPort();
    WeightedChartList infos=msg->GetChartList();
    wxRegion region(0,0,TILE_SIZE,TILE_SIZE);
    LOG_DEBUG(_T("merge match for %d/%d/%d with %d entries"),tile.zoom,tile.x,tile.y,(int)infos.size());
    for (size_t i=startIndex;i<infos.size();i++){
        ChartInfo *chart=infos[i].info;
        vpoint.chart_scale=chart->GetNativeScale();
        manager->OpenChart(chart); //ensure the chart to be open
        chart->Render(renderDc,vpoint,region);
    }
    wxImage result=renderBitmap.ConvertToImage();
    msg->StoreResult(result,true);
}

/**
 * sort the weighted list
 * better ones (higher zoom, lower scale) at the end
 * @param first
 * @param second
 * @return 
 */
bool scaleSort(ChartInfoWithScale first, ChartInfoWithScale second){
    if (first.info->GetZoom() == second.info->GetZoom()){
        if (first.scale > second.scale) return true;
        return false;
    }
    if (first.info->GetZoom() < second.info->GetZoom()) return true;
    return false;
}

RenderMessage *Renderer::PrepareRenderMessage(ChartSet *set, TileInfo &tile){
    PlugIn_ViewPort vpoint;
    vpoint.pix_width=TILE_SIZE;
    vpoint.pix_height=TILE_SIZE;
    vpoint.rotation=0.0;
    vpoint.skew=0.0;
    vpoint.m_projection_type=PI_PROJECTION_MERCATOR;
    LatLon center=TileHelper::TileCenter(tile);
    //northwest: minlon,maxlat
    //southeast: maxlon,minlat
    LatLon northwest=TileHelper::TileNorthWest(tile);
    LatLon southeast=TileHelper::TileSouthEast(tile);
    vpoint.clat=center.lat;
    vpoint.clon=center.lon;
    vpoint.lat_min=southeast.lat;
    vpoint.lat_max=northwest.lat;
    vpoint.lon_min=northwest.lon;
    vpoint.lon_max=southeast.lon;
    vpoint.bValid=true;
    vpoint.b_quilt=false;
    ChartList *list=set->charts;
    double mpp=set->GetMppForZoom(tile.zoom);
    if (mpp <= 0) return NULL;
    RenderMessage *msg=new RenderMessage(tile,set,
            this,manager->GetSettings()->GetCurrentSequence());
    vpoint.view_scale_ppm=1/mpp;
    WeightedChartList infos=list->FindChartForTile(tile.zoom-manager->GetSettings()->GetOverZoom(),
                tile.zoom,
                northwest,
                southeast,
                manager->GetSettings()->GetUnderZoom());
    long timeFind=Logger::MicroSeconds100();
    if (infos.size() < 1) {
        msg->Unref();
        return NULL; //no matching chart found
    }
    std::sort(infos.begin(),infos.end(),scaleSort);
    LOG_DEBUG(wxT("render with %ld charts"),infos.size());
    msg->SetCharts(infos);
    msg->SetViewPort(vpoint);
    return msg;
} 

Renderer::RenderResult Renderer::renderTile(ChartSet *set,TileInfo &tile,CacheEntry *&out,long timeout,bool forCache){
    set->SetTileCacheKey(tile);
    if (! forCache && set->cache != NULL){
        out=set->cache->FindEntry(tile.GetCacheKey());
        if (out != NULL){
            out->prefill=false; //tile has now being requested...
            LOG_DEBUG(_T("render tile %s - request cache hit"),tile.ToString());
            return RENDER_OK;
        }
    }
    LOG_DEBUG(_T("render tile %s - %s must render"),tile.ToString(),(forCache?"prefill":"request"));
    RenderMessage *msg=PrepareRenderMessage(set,tile);
    if (msg == NULL) return RENDER_FAIL;
    if (!queue->Enqueue(msg,timeout,forCache)){
        msg->Unref(); //our own
        return RENDER_QUEUE;
    }
    bool rt=msg->WaitForResult(8000);
    if (! rt || ! msg->IsOk()) {
        LOG_ERROR(_T("render failed for %s"),tile.ToString());
        msg->Unref();
        return RENDER_FAIL;
    }
    long timeAfterRender = Logger::MicroSeconds100();
    wxColor back;
    GetGlobalColor(_T("NODTA"), &back);
    bool isNew=msg->CreateFinalResult(back);
    out=msg->GetCacheResult();
    if (isNew){
        if (forCache) out->prefill=true;
        if (set->cache != NULL) set->cache->AddEntry(out);
    }
    if (! forCache){
        out->prefill=false; //was a real render request - but could have been late hit
    }
    LOG_DEBUG(_T("render %s: %s"),
            tile.ToString(),msg->GetTimings()
            );
    
    msg->Unref();
    return RENDER_OK;
    
    
}
Renderer * Renderer::Instance(){
    return _instance;
}


Renderer::~Renderer(){
    
}

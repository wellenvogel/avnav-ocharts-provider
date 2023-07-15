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
#include "S57AttributeDecoder.h"



RenderMessageBase::RenderMessageBase(TileInfo& tile, ChartSet *set, 
        Renderer *renderer,long settingsSequence): MainMessage() {
    this->tile = tile;
    renderOk = false;
    creationTime=Logger::MicroSeconds100();
    findTime=creationTime;
    dequeueTime=creationTime;
    afterRenderTime=creationTime;
    afterImageTime=creationTime;
    afterPngTime=creationTime;
    this->set=set;
    this->renderer=renderer;
    this->settingsSequence=settingsSequence;
}
RenderMessageBase::~RenderMessageBase(){
    
}

RenderMessage::RenderMessage(TileInfo& tile, ChartSet *set, 
        Renderer *renderer,long settingsSequence):
        RenderMessageBase(tile,set,renderer,settingsSequence){
    cacheResult=NULL;
    renderResult=NULL;
}

RenderMessage::~RenderMessage(){
    if (cacheResult != NULL) cacheResult->Unref();
    if (renderResult != NULL) free(renderResult);
}

void RenderMessageBase::SetDequeueTime(){
    dequeueTime=Logger::MicroSeconds100();
}

void RenderMessageBase::SetAfterImageTime(){
    afterImageTime=Logger::MicroSeconds100();
}


wxString RenderMessageBase::GetTimings(){
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

void RenderMessageBase::SetCharts(WeightedChartList charts){
    this->charts=charts;
    findTime=Logger::MicroSeconds100();
}

void RenderMessageBase::SetViewPort(PlugIn_ViewPort vp){
    this->viewport=vp;
}

void RenderMessage::Process(bool discard){
    if (discard) {
        SetDone();
        return;
    }
    renderer->DoRenderTile(this);
}

FeatureInfoMessage::FeatureInfoMessage(
        TileInfo& tile, 
        ChartSet* set, 
        Renderer* renderer, 
        long settingsSequence,
        float  lat,
        float  lon,
        float  tolerance):
        RenderMessageBase(tile,set,renderer,settingsSequence){
    this->lat=lat;
    this->lon=lon;
    this->tolerance=tolerance;   
}


void FeatureInfoMessage::Process(bool discard){
    if (discard){
        SetDone();
        return;
    }
    long start=Logger::MicroSeconds100();
    TileInfo tile=GetTile();
    if (GetSettingsSequence() != manager->GetSettings()->GetCurrentSequence()){
        LOG_DEBUG(wxT("HandleFeatureRequest: %s settings sequence changed, cancel"),tile.ToString());
        SetDone();
        return;
    }
    //we need to check the cache again as maybe some requests already had
    //been in the queue
    ChartSet *set=GetSet();
    if (!set->IsActive()){
        LOG_DEBUG(wxT("HandleFeatureRequest: chart set no longer active: %s"),tile.ToString());
        SetDone();
        return;
    }
    SetDequeueTime();
    PlugIn_ViewPort vpoint=GetViewPort();
    WeightedChartList infos=GetChartList();
    wxRegion region(0,0,TILE_SIZE,TILE_SIZE);
    LOG_DEBUG(_T("merge match for %d/%d/%d with %d entries"),tile.zoom,tile.x,tile.y,(int)infos.size());

    for (int i=infos.size()-1;i>=0;i--){
        ChartInfo *chart=infos[i].info;
        vpoint.chart_scale=set->GetScaleForZoom(tile.zoom);//chart->GetNativeScale();
        if (!manager->OpenChart(chart,set->ShouldRetryReopen())){
            set->SetReopenStatus(chart->GetFileName(),false);
            //ensure the chart to be open
            LOG_DEBUG(wxT("HandleFeatureRequest: unable to open chart %s:%s"),chart->GetFileName(),tile.ToString());
            continue;
        }
        set->SetReopenStatus(chart->GetFileName(),true);
        ObjectList list=chart->FeatureInfo(vpoint,lat,lon,tolerance);
        result.insert(result.end(),list.begin(),list.end());
    }
    renderOk=true;
    SetDone();
}

ObjectList* FeatureInfoMessage::GetResult(){
    return &result;
}

//must be called in main thread
Renderer::Renderer(ChartManager *manager,MainQueue *queue, long timeout){
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
    renderTimeout=timeout;
}

Renderer *Renderer::_instance=NULL;

void Renderer::CreateInstance(ChartManager *manager,MainQueue *queue, long timeout){
    if (_instance != NULL) return;
    Renderer * ni=new Renderer(manager,queue,timeout);
    _instance=ni;
}



void Renderer::DoRenderTile(RenderMessage *msg){
    long start=Logger::MicroSeconds100();
    TileInfo tile=msg->GetTile();
    if (msg->GetSettingsSequence() != manager->GetSettings()->GetCurrentSequence()){
        LOG_DEBUG(wxT("DoRenderTile: %s settings sequence changed, cancel"),tile.ToString());
        msg->SetDone();
        return;
    }
    //we need to check the cache again as maybe some requests already had
    //been in the queue
    ChartSet *set=msg->GetSet();
    if (!set->IsActive()){
        LOG_DEBUG(wxT("DoRenderTile: chart set no longer active"),tile.ToString());
        msg->SetDone();
        return;
    }
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
    LOG_DEBUG(_T("do render for %s with %d entries"),tile.ToString(),(int)infos.size());
    for (size_t i=startIndex;i<infos.size();i++){
        ChartInfo *chart=infos[i].info;
        vpoint.chart_scale=set->GetScaleForZoom(tile.zoom);//chart->GetNativeScale();
        if (!manager->OpenChart(chart,set->ShouldRetryReopen())){ //ensure the chart to be open
            set->SetReopenStatus(chart->GetFileName(),false);
            LOG_ERROR("unable to open chart %s, cannot render %s",chart->GetFileName(),tile.ToString());
            msg->SetDone();
            return;
        } 
        else{
            set->SetReopenStatus(chart->GetFileName(),true);
            chart->Render(renderDc,vpoint,region,tile.zoom);
        }
    }
    wxImage result=renderBitmap.ConvertToImage();
    msg->StoreResult(result,true);
}

/**
 * sort the weighted list
 * better ones (higher zoom, lower scale) at the end
 * put overlays always after all other charts
 * @param first
 * @param second
 * @return 
 */
bool scaleSort(ChartInfoWithScale first, ChartInfoWithScale second){
    if (first.info->IsOverlay() != second.info->IsOverlay() ){
        return second.info->IsOverlay(); //if the second one is an overlay it is "bigger"
    }
    if (first.info->GetZoom() == second.info->GetZoom()){
        if (first.scale > second.scale) return true;
        return false;
    }
    if (first.info->GetZoom() < second.info->GetZoom()) return true;
    return false;
}

 bool Renderer::PrepareRenderMessage(
        ChartSet *set, 
        TileInfo &tile,
        RenderMessageBase *msg,
        bool allLower  
    ){
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
    double mpp=set->GetMppForZoom(tile.zoom);
    if (mpp <= 0) {
        msg->Unref();
        return false;
    }
    vpoint.view_scale_ppm=1/mpp;
    int minZoom=allLower?set->GetMinZoom():tile.zoom-manager->GetSettings()->GetOverZoom();
    LOG_DEBUG(wxT("prepare render tile=%s, nlat=%f,wlon=%f,slat=%f,elon=%f"),tile.ToString(true),northwest.lat,northwest.lon,southeast.lat,southeast.lon);
    WeightedChartList infos=set->FindChartForTile(minZoom,
                tile.zoom,
                northwest,
                southeast,
                manager->GetSettings()->GetUnderZoom());
    long timeFind=Logger::MicroSeconds100();
    if (infos.size() < 1) {
        LOG_DEBUG(wxT("prepare render %s no charts found"),tile.ToString(true));
        msg->Unref();
        return false; //no matching chart found
    }
    std::sort(infos.begin(),infos.end(),scaleSort);
    wxString listInfo;
    if (Logger::instance()->HasLevel(LOG_LEVEL_DEBUG)){
        for (auto it=infos.begin();it!=infos.end();it++){
            if (it != infos.begin()) listInfo << ",";
            listInfo << it->info->GetIndex();
        }
    }
    LOG_DEBUG(wxT("prepare render %s with %ld charts [%s]"),tile.ToString(true),infos.size(),listInfo);
    msg->SetCharts(infos);
    msg->SetViewPort(vpoint);
    msg->SetManager(manager);
    return true;
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
    RenderMessage *msg=new RenderMessage(tile,set,
            this,manager->GetSettings()->GetCurrentSequence());
    if (! PrepareRenderMessage(set,tile,msg))return RENDER_NOCHART;
    if (!queue->Enqueue(msg,timeout,forCache)){
        LOG_DEBUG(wxT("queue full for %s"),tile.ToString(true));
        msg->Unref(); //our own
        return RENDER_QUEUE;
    }
    bool rt=msg->WaitForResult(renderTimeout);
    if (! rt) {
        LOG_ERROR(_T("render timeout for %s"),tile.ToString(true));
        msg->Unref();
        return RENDER_FAIL;
    }
    if ( ! msg->IsOk()) {
        LOG_ERROR(_T("render failed for %s"),tile.ToString(true));
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
    LOG_DEBUG(_T("render %s: %s, sz=%lld"),
            tile.ToString(true),msg->GetTimings(),
            (long long)out->GetLength()
            );
    
    msg->Unref();
    return RENDER_OK;
    
    
}

bool objectDescriptionSort(ObjectDescription first, ObjectDescription second){
    //1.we prefer points
    //2.we sort by distance
    //3.we prefer lights
    if (first.IsPoint() && ! second.IsPoint())return true;
    if (second.IsPoint() && ! first.IsPoint()) return false;    
    if (first.distance < second.distance) return true;
    if (first.distance > second.distance) return false;
    if (strcmp("LIGHTS",first.featureName) == 0 && strcmp("LIGHTS",second.featureName) != 0) return true;
    return false;
}

typedef std::vector<wxString> StringList;
class AttributeEntry{
public:
    StringList attributes;
    StringList features;
    wxString target;
    AttributeEntry(wxString target, StringList features,StringList attributes){
        this->target=target;
        this->attributes=attributes;
        this->features=features;
    }
    bool MatchesFeature(wxString featureName){
        return features.size() == 0 || (std::find(features.begin(),features.end(),featureName) != features.end());
    }
    bool MatchesAttributeName(wxString attributeName){
        return (std::find(attributes.begin(),attributes.end(),attributeName) != attributes.end());
    }
    bool MatchesFeatureAndAttribute(wxString featureName,wxString attributeName){
        return MatchesFeature(featureName) && MatchesAttributeName(attributeName);
    }
};

typedef std::vector<AttributeEntry*> AttributeMappings;
static AttributeMappings mappings={ 
  new AttributeEntry("buoy",{"BOYSPP","BOYCAR","BOYINB","BOYISD","BOYLAT","BOYSAW"},
    {"OBJNAM","BOYSHP","COLOUR"}),
  new AttributeEntry("top",{"TOPMAR"},
    {"OBJNAM","COLOUR","COLPAT","HEIGHT"}),
  new AttributeEntry("light",{"LIGHTS"},{}) //only added to allow a light for nextTarget
};

wxString formatCoordinate(double coordinate,bool isLat){
    //taken from avnav js
    if (coordinate > 180) coordinate=coordinate-360;
    if (coordinate < -180) coordinate=coordinate+360;
    bool isNeg=false;
    if (coordinate < 0){
        isNeg=true;
        coordinate=-coordinate;
    }
    double abs=floor(coordinate);
    double minutes=60*(coordinate-abs);
    if (!isLat){
        return wxString::Format(wxT("%03.0f\u00B0%2.4f%c"),abs,minutes,(isNeg?'W':'E'));
    }
    else{
        return wxString::Format(wxT("%02.0f\u00B0%2.4f%c"),abs,minutes,(isNeg?'S':'N'));
    }
}

void addIfExists(wxString &dest /*out*/,NameValueMap &map,wxString key,
        wxString post=wxEmptyString,wxString pre=wxEmptyString){
    NameValueMap::iterator it;
    it=map.find(key);
    if (it == map.end()) return;
    dest.Append(pre);
    dest.Append(it->second);
    dest.Append(post);
}

wxString formatLight(ObjectDescription *obj){
    wxString rt=wxEmptyString;
    if (obj->featureName != wxT("LIGHTS")) return rt;
    addIfExists(rt,obj->param,"LITCHR"," ");
    addIfExists(rt,obj->param,"COLOUR"," ");
    addIfExists(rt,obj->param,"SIGGRP"," ");
    addIfExists(rt,obj->param,"SIGPER","s ");
    addIfExists(rt,obj->param,"HEIGHT","m ");
    addIfExists(rt,obj->param,"VALNMR","nm ");
    addIfExists(rt,obj->param,"SECTR1",wxT("\u00B0 - "),"(");
    addIfExists(rt,obj->param,"SECTR2",wxT("\u00B0)"));
    if (rt != wxEmptyString) rt.Append(" ");
    return rt;
}
wxString objectToHtml(ObjectDescription *obj){
    S57AttributeDecoder *decoder=S57AttributeDecoder::GetInstance();
    wxString rt=wxT("<div class=\"S57Object\">");
    rt.Append(wxString::Format(
    wxT("<div class=\"name\">%s</div>"),
    StringHelper::safeHtmlString(decoder->GetFeatureText(obj->featureName,true))
    ));
    if (obj->IsPoint()){
        rt.Append("<div class=\"coordinate\">")
            .Append(StringHelper::safeHtmlString(formatCoordinate(obj->lat,true))).Append(" ")
            .Append(StringHelper::safeHtmlString(formatCoordinate(obj->lon,false)))
            .Append("</div>");
    }
    NameValueMap::iterator it;
    for (it=obj->param.begin();it!=obj->param.end();it++){
        rt.Append(wxString::Format(
            wxT("<div class=\"param\">"
                "<span class=\"label\">%s</span>"
                "<span class=\"labelText\">%s</span>"
                "<span class=\"value\">%s</span>"
                "</div>"
            ),
            it->first,
            StringHelper::safeHtmlString(decoder->GetAttributeText(it->first)),
            StringHelper::safeHtmlString(it->second)    
            ));
    }
    rt.Append("</div>");
    return rt;
}
wxString Renderer::FeatureRequest(
        ChartSet* set, 
        TileInfo& tile, 
        double lat, double lon, double tolerance) {
    static const wxString fct("Renderer::FeatureRequest");
    LOG_DEBUG(wxT("%s: set=%s, tile=%s"),fct,
            set->GetKey(),tile.ToString());
    FeatureInfoMessage *msg=new FeatureInfoMessage(tile,set,
            this,manager->GetSettings()->GetCurrentSequence(),lat,lon,tolerance);
    if (! PrepareRenderMessage(set,tile,msg,true))return wxEmptyString;
    if (!queue->Enqueue(msg,1000,false)){
        msg->Unref(); //our own
        return wxEmptyString;
    }
    bool rt=msg->WaitForResult(800000);
    if (! rt || ! msg->IsOk()) {
        LOG_ERROR(_T("%s failed for %s"),fct,tile.ToString());
        msg->Unref();
        return wxEmptyString;
    }
    ObjectList *completeList=msg->GetResult();
    std::sort(completeList->begin(),completeList->end(),objectDescriptionSort);
    ObjectList::iterator it;
    NameValueMap properties;
    bool isFirst = true;
    AttributeMappings::iterator mit;
    NameValueMap::iterator nvit;
    std::vector<wxString>::iterator sit;
    typedef std::vector<ObjectDescription*> ObjectPtrList;
    ObjectPtrList handled;
    ObjectPtrList::iterator hit;
    ObjectDescription *first=NULL;
    wxString html;
    for (it = completeList->begin(); it != completeList->end(); it++) {
        bool skip=false;
        if (handled.size() > 0){
            for (hit=handled.begin() ;hit!=handled.end();hit++){
                if (it->IsSimilar(**hit)){
                    LOG_DEBUG(wxT("%s: skip s57object %s, already in list"),fct,it->ToJson());
                    skip=true;
                    break;
                }
            }
        }
        if (skip) continue;
        handled.push_back(&(*it));            
        html.Append(objectToHtml(&(*it)));
        if (!it->IsPoint()) continue; //leave out others for now
        if (first == NULL) first=&(*it);
        if (it->lat != first->lat || it->lon != first->lon){
            LOG_DEBUG(wxT("%s: skip s57 object %s, other coordinate"),fct,it->ToJson());
            //only consider objects with the same coordinates like the first
            continue;
        }
        wxString light=formatLight(&(*it));
        if (light != wxEmptyString) properties["light"].Append(light);
        for (mit=mappings.begin();mit!=mappings.end();mit++){
            if (!(*mit)->MatchesFeature(it->featureName)) continue;          
            for (sit=(*mit)->attributes.begin();sit!=(*mit)->attributes.end();sit++){
                nvit=it->param.find(*sit);
                if (nvit != it->param.end()){
                    properties[(*mit)->target].Append(nvit->second).Append(" ");
                }
            }
        }
    }
    
    wxString result(wxT("{"));
    if (first){
        bool hasNextTarget=false;
        for (AttributeMappings::iterator it=mappings.begin();it!=mappings.end();it++){
            if ((*it)->MatchesFeature(first->featureName)){
                hasNextTarget=true;
                break;
            }
        }
        if (hasNextTarget){
            result.Append(wxString::Format(wxT(
                JSON_SV(firstType,%s) ",\n"
                "\"nextTarget\":[%f,%f],\n"
                ),
                first->featureName,    
                first->lon,
                first->lat   
            ));
        }
        if (first->name != wxEmptyString){
            result.Append(wxString::Format(wxT(
                JSON_SV(name,%s) ",\n"
                ),
                StringHelper::safeJsonString(first->name)    
            ));
        }
        for (nvit=properties.begin();nvit!=properties.end();nvit++){
            result.Append(wxString::Format(wxT(            
            JSON_SV(%s,%s)
            ),
                    nvit->first,
                    StringHelper::safeJsonString(nvit->second)
            ));
            result.Append(",\n");
        }
    }
    result.Append(wxString::Format(wxT(
        JSON_SV(htmlInfo,%s)
        ),
        StringHelper::safeJsonString(html)
    ));
    result.Append(wxT("}"));
    LOG_DEBUG("%s for %s: %s, res=%s",fct,tile.ToString(),msg->GetTimings(),result);
    msg->Unref();
    return result;
}

Renderer * Renderer::Instance(){
    return _instance;
}


Renderer::~Renderer(){
    
}

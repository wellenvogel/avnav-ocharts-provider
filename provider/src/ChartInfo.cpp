/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Chart Info
 * Author:   Andreas Vogel
 *
 ***************************************************************************
 *   Copyright (C) 2010 by Andreas Vogel   *
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
#include <wait.h>
#include "ChartInfo.h"
#include "Tiles.h"
#include "georef.h"
#include <wx/dcmemory.h>
#include <wx/time.h>
#include "Logger.h"
#include "StringHelper.h"
#include "pi_s52s57.h"
#include "S57AttributeDecoder.h"


ZoomLevelScales::ZoomLevelScales(double scaleLevel) {
    double resolution=BASE_MPP * scaleLevel;
    //OpenCPN uses some correction for the major axis
    //this is no big problem anyway but we like to be consistent
    zoomMpp[0] = 2*PI*WGS84_semimajor_axis_meters*mercator_k0/TILE_SIZE;
    for (int i = 1; i <= MAX_ZOOM; i++) {
        zoomMpp[i] = zoomMpp[i - 1] / 2;
    }
    for (int i = 0; i <= MAX_ZOOM; i++) {
        zoomScales[i] = zoomMpp[i] / resolution;
    }
}
double ZoomLevelScales::GetScaleForZoom(int zoom) const{
    if (zoom < 0) zoom=0;
    if (zoom > MAX_ZOOM ) zoom=MAX_ZOOM;
    return zoomScales[zoom];
}
double ZoomLevelScales::GetMppForZoom(int zoom) const{
    if (zoom < 0) zoom=0;
    if (zoom > MAX_ZOOM ) zoom=MAX_ZOOM;
    return zoomMpp[zoom];
}
int ZoomLevelScales::FindZoomForScale(double scale) const{
    //currently we simply take the next lower zoom
    //can be improved
    for (int i=0;i<MAX_ZOOM;i++){
        if (zoomScales[i]<scale) {
            if (i > 0) return i-1;
            return i;
        }
    }
    return MAX_ZOOM;
}

ChartInfo::ChartInfo(wxString className,wxString fileName) {
    this->classname=className;
    this->chart=NULL;
    this->filename=fileName;
    this->isValid=false;
}

ChartInfo::~ChartInfo() {
    delete this->chart;
    this->chart = NULL;
}

bool ChartInfo::Reopen(bool fullInit,bool allowRetry){
    if (this->chart != NULL) return true;
    LOG_INFO(_T("opening %s"), filename);
    wxObject *chartObject = ::wxCreateDynamicObject(classname);
    PlugInChartBase *chart=wxDynamicCast(chartObject, PlugInChartBase);
    if (chart == NULL) return false;
    this->chart=chart;
    int rt = this->chart->Init(filename,fullInit?PI_FULL_INIT:PI_HEADER_ONLY);
    if (rt != PI_INIT_OK) {
        LOG_ERROR(_T("opening %s failed with error %d"), filename, rt);
        if (allowRetry){
            //kill all oeserverd children
            //we do this be sending a signal to our process group that we ignore...
            LOG_ERROR(_T("killing all children"));
            killpg(0,SIGUSR1);
            waitpid(-1,NULL,WNOHANG);
            rt = this->chart->Init(filename,fullInit?PI_FULL_INIT:PI_HEADER_ONLY);
            if (rt == PI_INIT_OK){
                LOG_INFO(_T("opening succeeded on retry for %s"),filename);
                return true;
            }
            LOG_ERROR(_T("opening %s finally failed after retry"),filename);
        }
        return false;
    }
    return true;
}

bool ChartInfo::IsOpen(){
    return chart != NULL;
}

long ChartInfo::GetLastRender(){
    return lastRender;
}

bool ChartInfo::Close(){
    if (chart == NULL) return true;
    LOG_INFO(wxT("closing chart %s"),filename);
    //try to render a 1x1 region as it seems it does not free the bitmaps...
    PlugIn_ViewPort vpoint;
    vpoint.pix_width=1;
    vpoint.pix_height=1;
    vpoint.rotation=0.0;
    vpoint.skew=0.0;
    vpoint.m_projection_type=PI_PROJECTION_MERCATOR;
    vpoint.clat=0;
    vpoint.clon=0;
    vpoint.lat_min=0;
    vpoint.lat_max=0;
    vpoint.lon_min=0;
    vpoint.lon_max=0;
    vpoint.bValid=true;
    vpoint.b_quilt=false;
    vpoint.view_scale_ppm=1;
    wxRegion region(0,0,1,1);
    chart->RenderRegionView(vpoint,region);
    delete chart;
    chart=NULL;
    return true;
}

int ChartInfo::Init(bool allowRetry) {
    if (! Reopen(false,allowRetry)) return PI_INIT_FAIL_REMOVE;
    nativeScale=chart->GetNativeScale();
    chart->GetChartExtent(&extent);
    isValid=true;
    return PI_INIT_OK;
}

int ChartInfo::FillInfo(const ZoomLevelScales *scales) {
    zoom=scales->FindZoomForScale(nativeScale);
    xmin=TileHelper::long2tilex(extent.WLON,zoom);
    ymin=TileHelper::lat2tiley(extent.NLAT,zoom);
    xmax=TileHelper::long2tilex(extent.ELON,zoom);
    ymax=TileHelper::lat2tiley(extent.SLAT,zoom);
    LOG_INFO("ChartInfo::FillInfo %s: zoom=%d, %s",filename,zoom, GetXmlBounds());
    return PI_INIT_OK;
}

wxString ChartInfo::GetXmlBounds(){
    return wxString::Format(_T("<BoundingBox minx=\"%d\" maxx=\"%d\" miny=\"%d\" maxy=\"%d\"></BoundingBox>"),
            xmin,xmax,ymin,ymax);
}

wxString ChartInfo::ToString(){
    return wxString::Format(_T("Chart file=%s,valid=%s,scale=%d,nlat=%f,wlon=%f,slat=%f,elon=%f,zoom=%d,bounds=%s"),
            filename,PF_BOOL(isValid),nativeScale,extent.NLAT,extent.WLON,extent.SLAT,extent.ELON,zoom,GetXmlBounds());
}

int ChartInfo::HasTile(LatLon &northwest,LatLon &southeast){
    if (southeast.lat > extent.NLAT) return 0;
    if (northwest.lon > extent.ELON) return 0;
    if (southeast.lon < extent.WLON) return 0;
    if (northwest.lat < extent.SLAT) return 0;
    return nativeScale;
}

bool ChartInfo::UpdateBoundings(BoundingBox* box){
    bool rt=false;
    if (extent.NLAT > box->maxLat){
        rt=true;
        box->maxLat=extent.NLAT;
    }
    if (extent.SLAT < box->minLat){
        rt=true;
        box->minLat=extent.SLAT;
    }
    if (extent.WLON < box->minLon){
        rt=true;
        box->minLon=extent.WLON;
    }
    if (extent.ELON > box->maxLon){
        rt=true;
        box->maxLon=extent.ELON;
    }
    return rt;
}

void ChartInfo::GetTileBounds(int& xmin, int& xmax, int& ymin, int& ymax){
    xmin=this->xmin;
    xmax=this->xmax;
    ymin=this->ymin;
    ymax=this->ymax;
}

TileBox ChartInfo::GetTileBounds(){
    TileBox rt;
    rt.xmin=xmin;
    rt.xmax=xmax;
    rt.ymin=ymin;
    rt.ymax=ymax;
    rt.zoom=zoom;
    return rt;
}

bool ChartInfo::Render(wxDC &out,const PlugIn_ViewPort& VPoint, const wxRegion &Region){
    if (chart == NULL){
        if (!Reopen(true,false)) return false;
    }
    lastRender=wxGetLocalTime();
    wxBitmap bitmap;
    bitmap=chart->RenderRegionView(VPoint,Region);
    wxColour nodat;
    GetGlobalColor( _T ( "NODTA" ),&nodat );
    wxMask *mask= new wxMask(bitmap,nodat);
    bitmap.SetMask(mask);
    wxMemoryDC tempDC(bitmap);
    out.Blit(0,0,TILE_SIZE,TILE_SIZE,&tempDC,0,0,wxCOPY,true);
    return true;
}

ObjectList ChartInfo::FeatureInfo(PlugIn_ViewPort& VPoint,
            float lat, float lon, float tolerance){
    ObjectList rt;
    if (chart == NULL){
        if (!Reopen(true,false)) return rt;
    }
    PlugInChartBaseExtended *pluginChart=wxDynamicCast(chart, PlugInChartBaseExtended);
    if (pluginChart == NULL){
        LOG_DEBUG(wxT("FeatureInfo: chart %s is no extended chart"),GetFileName());
        return rt;
    }
    ListOfPI_S57Obj *objList= pluginChart->GetObjRuleListAtLatLon(lat,lon,tolerance,&VPoint);
    ListOfPI_S57Obj::iterator it;
    for (it=objList->begin();it!=objList->end();it++){
        PI_S57Obj *obj=*it;
        ObjectDescription desc(obj);
        ListOfPI_S57Obj oneElement;
        oneElement.Append(obj);
        oneElement.DeleteContents(false);
        desc.html=pluginChart->CreateObjDescriptions(&oneElement);
        desc.ComputeDistance(lon,lat);
        rt.push_back(desc);
    }
    delete objList;
    LOG_DEBUG(wxT("FeatureInfo(leave): chart %s"),GetFileName());
    return rt;
}


void ChartInfo::FromCache(int nativeScale, ExtentPI extent){
    this->nativeScale=nativeScale;
    this->extent=extent;
    this->isValid=true;
}

class AttributeEntry{
public:
    std::vector<wxString> attributes;
    wxString target;
    AttributeEntry(wxString target, std::vector<wxString> attributes){
        this->target=target;
        this->attributes=attributes;
    }
};

static std::vector<AttributeEntry*> mappings={
  new AttributeEntry("light",{"LITCHR","COLOUR","SIGGRP","SIGPER","SECTR1","SECTR2"}),  
  new AttributeEntry("color",{"COLOUR"})  
};

wxString getKeyFromAttr(wxString attr){
    std::vector<AttributeEntry*>::iterator it;
    std::vector<wxString>::iterator ait;
    for (it=mappings.begin();it!=mappings.end();it++){
        for (ait=(*it)->attributes.begin();ait!=(*it)->attributes.end();ait++){
            if (*ait == attr) return (*it)->target;
        }
    }
    return wxEmptyString;
}
void initializeParameterMap(std::map<wxString,wxString> *map){
    std::vector<AttributeEntry*>::iterator it;
    for (it=mappings.begin();it!=mappings.end();it++){
        (*map)[(*it)->target]=wxEmptyString;
    }
}

ObjectDescription::ObjectDescription(PI_S57Obj* obj) {
    memcpy(featureName,obj->FeatureName,sizeof(featureName));
    primitiveType=obj->Primitive_type;
    html=wxEmptyString;
    //TODO: check if this is reliable
    lat=obj->m_lat;
    lon=obj->m_lon;
    initializeParameterMap(&param);
    char *curAttr=obj->att_array;
    for (int i=0;i< obj->n_attr;i++){
        wxString attrName=wxString(curAttr,wxConvUTF8,6);
        curAttr+=6;
        wxString key=getKeyFromAttr(attrName);
        if (key != wxEmptyString){
            if (obj->attVal->Item(i)->valType == OGR_STR){
                //for now only strings
                wxString encoded=(const char *)(obj->attVal->Item(i)->value);
                wxString value=S57AttributeDecoder::GetInstance()->DecodeAttribute(attrName,encoded);
                if (value != wxEmptyString){
                    param[key].Append(value).Append(" ");
                }
            }
        }
        if (attrName == wxString("OBJNAM")){
            wxString name=(const char *)(obj->attVal->Item(i)->value);
            this->name=name;
        }
    }
    distance=-1;
}
bool ObjectDescription::IsPoint(){
    return this->primitiveType == GEO_POINT;
}
double ObjectDescription::ComputeDistance(double lon, double lat){
    double od=(lon-this->lon);
    double ad=(lat-this->lat);
    distance=std::sqrt(od*od+ad*ad);
    return distance;
}


wxString ObjectDescription::ToJson(){
    wxString rt=wxString::Format(
            "{"
            JSON_SV(s57featureName,%s)
            ","
            JSON_SV(name,%s)
            ","
            JSON_IV(lat,%f)
            ","
            JSON_IV(lon,%f)
            "\n"
            ,
            StringHelper::safeJsonString(featureName),
            name,
            lat,
            lon
            );
    if (IsPoint()){
        rt.Append(wxString::Format(
                ","
                "\"nextTarget\":[%f,%f]"
                ,
                lon,
                lat
                ));
    }
    std::map<wxString,wxString>::iterator it;
    for (it=param.begin();it != param.end();it++){
        if (it->second != wxEmptyString){
            rt.Append(wxString::Format(
            ","
            JSON_SV(%s,%s)
            ,
                    it->first,
                    StringHelper::safeJsonString(it->second)
            ));
        }
    }
    rt.Append("}");
    return rt;
}

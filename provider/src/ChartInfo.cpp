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
#include <wx-3.0/wx/tokenzr.h>
#include "Logger.h"
#include "StringHelper.h"
#include "pi_s52s57.h"
#include "S57AttributeDecoder.h"
#include <algorithm>


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
    this->fullyInitialized=false;
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
                this->fullyInitialized=fullInit;
                LOG_INFO(_T("opening succeeded on retry for %s"),filename);
                return true;
            }
            LOG_ERROR(_T("opening %s finally failed after retry"),filename);
        }
        return false;
    }
    this->fullyInitialized=fullInit;
    return true;
}

bool ChartInfo::IsOpen(){
    return chart != NULL;
}

bool ChartInfo::IsRaster(){
    return (classname == wxString("Chart_oeuRNC"));
}

long ChartInfo::GetLastRender(){
    return lastRender;
}

bool ChartInfo::Close(){
    if (chart == NULL) return true;
    LOG_INFO(wxT("closing chart %s"),filename);
    if (fullyInitialized) {
        //try to render a 1x1 region as it seems it does not free the bitmaps...
        PlugIn_ViewPort vpoint;
        vpoint.pix_width = 1;
        vpoint.pix_height = 1;
        vpoint.rotation = 0.0;
        vpoint.skew = 0.0;
        vpoint.m_projection_type = PI_PROJECTION_MERCATOR;
        vpoint.clat = 0;
        vpoint.clon = 0;
        vpoint.lat_min = 0;
        vpoint.lat_max = 0;
        vpoint.lon_min = 0;
        vpoint.lon_max = 0;
        vpoint.bValid = true;
        vpoint.b_quilt = false;
        vpoint.view_scale_ppm = 1;
        wxRegion region(0, 0, 1, 1);
        chart->RenderRegionView(vpoint, region);
    }
    fullyInitialized=false;
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

ChartInfo::RenderResult ChartInfo::Render(wxDC &out,const PlugIn_ViewPort& VPoint, const wxRegion &Region, int zoom){
    if (chart == NULL){
        if (!Reopen(true,false)) return ChartInfo::FAIL;
    }
    lastRender=wxGetLocalTime();
    wxBitmap bitmap;
    int bltx,blty,w,h;
    Region.GetBox(bltx,blty,w,h);
    ChartInfo::RenderResult rt=ChartInfo::FAIL;
    if (IsRaster()){
        //compute restricted region for raster charts
        //still somehow experimental
        int x=0;
        int y=0;
        int xmax=TILE_SIZE;
        int ymax=TILE_SIZE;
        bool mustRecomputeRegion=false;
        if (VPoint.lat_max < extent.SLAT || VPoint.lat_min > extent.NLAT||
                VPoint.lon_min > extent.ELON || VPoint.lon_max < extent.WLON){
            LOG_DEBUG("nothing left to render for tile");
            return rt;
        }
        if (VPoint.lat_min < extent.SLAT) {            
            mustRecomputeRegion=true;
            ymax=(int)ceil(TileHelper::lat2tileyOffset(extent.SLAT,zoom));          
            if (ymax > TILE_SIZE) ymax=TILE_SIZE;
        }
        if (VPoint.lat_max > extent.NLAT){           
            mustRecomputeRegion=true;
            y=(int)floor(TileHelper::lat2tileyOffset(extent.NLAT,zoom));            
            if (y < 0) y=0;
        }
        if (VPoint.lon_min < extent.WLON) {            
            x=(int)floor(TileHelper::lon2tilexOffset(extent.WLON,zoom));            
            if (x < 0) x=0;
            mustRecomputeRegion=true;
        }
        if (VPoint.lon_max > extent.ELON) {            
            mustRecomputeRegion=true;
            xmax=(int)ceil(TileHelper::lon2tilexOffset(extent.ELON,zoom));            
            if (xmax > TILE_SIZE) xmax=TILE_SIZE;
        }        
        if (mustRecomputeRegion){
            wxRegion cpRegion(
                x,
                y,
                xmax-x,
                ymax-y    
                );
            bitmap=chart->RenderRegionView(VPoint,cpRegion);
            cpRegion.GetBox(bltx,blty,w,h);
            rt=ChartInfo::OK;
        }
        else{
            bitmap=chart->RenderRegionView(VPoint,Region);
            rt=ChartInfo::FULL;
        }
    }
    else{
        bitmap=chart->RenderRegionView(VPoint,Region);
        rt=ChartInfo::OK;
    }
    wxColour nodat;
    GetGlobalColor( _T ( "NODTA" ),&nodat );
    wxMask *mask= new wxMask(bitmap,nodat);
    bitmap.SetMask(mask);
    wxMemoryDC tempDC(bitmap);
    out.Blit(bltx,blty,w,h,&tempDC,bltx,blty,wxCOPY,true);
    return rt;
}

ObjectList ChartInfo::FeatureInfo(PlugIn_ViewPort& VPoint,
            float lat, float lon, float tolerance){
    ObjectList rt;
    if (IsRaster()){
        //if we do not handle this here
        //the dynamic cast below will succeed
        //but the chart is corrupted afterwards
        LOG_DEBUG(wxT("FeatureInfo: chart %s is no extended chart"),GetFileName());
        return rt;
    }
    if (chart == NULL){
        if (!Reopen(true,false)) return rt;
    }
    PlugInChartBaseExtended *pluginChart=wxDynamicCast(chart, PlugInChartBaseExtended);
    if (pluginChart == NULL){
        LOG_DEBUG(wxT("FeatureInfo: chart %s is no extended chart"),GetFileName());
        return rt;
    }
    ListOfPI_S57Obj *objList= pluginChart->GetObjRuleListAtLatLon(lat,lon,tolerance,&VPoint);
    if (objList == NULL){
        LOG_DEBUG(wxT("FeatureInfo(leave empty): chart %s"),GetFileName());
        return rt;
    }
    ListOfPI_S57Obj::iterator it;
    for (it=objList->begin();it!=objList->end();it++){
        PI_S57Obj *obj=*it;
        ObjectDescription desc(obj);
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


wxString s57AttrToString(wxString attrName,_S57attVal *value){
    long ival;
    switch (value->valType){
        case OGR_STR:
        {
            wxString encoded((char*) value->value, wxConvUTF8);
            wxString rt;
            wxStringTokenizer tok(encoded, wxT(","));
            bool isFirst = true;
            while (tok.HasMoreTokens()) {
                if (!isFirst) {
                    rt.Append(", ");
                }
                else{
                    isFirst = false;
                }
                wxString current = tok.GetNextToken();
                if (current.ToLong(&ival)) {
                    if (ival == 0) rt.Append(wxT("UNKNOWN"));
                    else {
                        wxString converted = S57AttributeDecoder::GetInstance()->DecodeAttribute(attrName, current);
                        if (converted.IsEmpty()) {
                            rt.Append(current);
                        } else {
                            rt.Append(converted);
                        }
                    }
                }
                else{
                    rt.Append(current);
                }
            }
            return rt;
        }
        case OGR_INT:
        {
            wxString rt;
            rt.Printf("%d", *((int*) value->value));
            wxString decoded = S57AttributeDecoder::GetInstance()->DecodeAttribute(attrName, rt);
            return decoded.IsEmpty() ? rt : decoded;
        }
        case OGR_REAL:
        {
            return wxString::Format(wxT("%4.1f"),*((double *)value->value));
        }
        default:
            return wxT("UNKNOWN");
    }
}

ObjectDescription::ObjectDescription(PI_S57Obj* obj) {
    featureName=wxString( obj->FeatureName, wxConvUTF8 );
    primitiveType=obj->Primitive_type;
    //TODO: check if this is reliable
    lat=(primitiveType == GEO_POINT)?obj->m_lat:-1;
    lon=(primitiveType == GEO_POINT)?obj->m_lon:-1;
    char *curAttr=obj->att_array;
    for (int i=0;i< obj->n_attr;i++){
        wxString attrName=wxString(curAttr,wxConvUTF8,6);
        curAttr+=6;
        wxString value=s57AttrToString(attrName,obj->attVal->Item(i));
        if (attrName == wxString("OBJNAM")){
            this->name=value;
        }
        param[attrName]=value;
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
    NameValueMap::iterator it;
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
//we ignore a couple of attributes if when checking for equality
//to avoid getting the same object twice from different charts
std::vector<wxString> IGNORED_ATTRIBUTES={"SCAMIN","SORIND","SORDAT","SIGSEQ"};
bool ObjectDescription::IsSimilar(ObjectDescription& other){
    if (featureName != other.featureName ||
            lat != other.lat || 
            lon != other.lon || 
            name != other.name) return false;
    NameValueMap::iterator it,oit;
    for (it=other.param.begin();it!=other.param.end();it++){       
        if (std::find(IGNORED_ATTRIBUTES.begin(),IGNORED_ATTRIBUTES.end(),it->first)!= IGNORED_ATTRIBUTES.end()){
            continue;
        }
        oit=param.find(it->first);
        if (oit == param.end()|| oit->second != it->second){
            return false;
        }
    }
    for (it=param.begin();it!=param.end();it++){
        if (std::find(IGNORED_ATTRIBUTES.begin(),IGNORED_ATTRIBUTES.end(),it->first)!= IGNORED_ATTRIBUTES.end()){
            continue;
        }
        oit=other.param.find(it->first);
        if (oit == other.param.end() || oit->second != it->second){
            return false;
        }
    }
    return true;
}

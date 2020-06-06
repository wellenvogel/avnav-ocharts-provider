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
#include "ChartInfo.h"
#include "Tiles.h"
#include "georef.h"
#include <wx/dcmemory.h>
#include <wx/time.h>
#include "Logger.h"


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
}

ChartInfo::~ChartInfo() {
    delete this->chart;
    this->chart = NULL;
}

bool ChartInfo::Reopen(bool fullInit){
    if (this->chart != NULL) return true;
    LOG_INFO(_T("opening %s"), filename);
    wxObject *chartObject = ::wxCreateDynamicObject(classname);
    PlugInChartBase *chart=wxDynamicCast(chartObject, PlugInChartBase);
    if (chart == NULL) return false;
    this->chart=chart;
    int rt = this->chart->Init(filename,fullInit?PI_FULL_INIT:PI_HEADER_ONLY);
    if (rt != PI_INIT_OK) {
        LOG_ERROR(_T("opening %s failed with error %d"), filename, rt);
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
    delete chart;
    chart=NULL;
    return true;
}

int ChartInfo::Init() {
    if (! Reopen()) return PI_INIT_FAIL_REMOVE;
    nativeScale=chart->GetNativeScale();
    chart->GetChartExtent(&extent);
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
    return wxString::Format(_T("Chart file=%s,scale=%d,nlat=%f,wlon=%f,slat=%f,elon=%f,zoom=%d,bounds=%s"),
            filename,nativeScale,extent.NLAT,extent.WLON,extent.SLAT,extent.ELON,zoom,GetXmlBounds());
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
        if (!Reopen()) return false;
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

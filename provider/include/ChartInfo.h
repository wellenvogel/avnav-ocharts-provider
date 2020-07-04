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
#ifndef _CHARTINFO_H
#define _CHARTINFO_H
#include <vector>
#include "ocpn_plugin.h"
#include <wx/log.h>
#include <wx/bitmap.h>
#include <wx/dynarray.h>
#include <wx/dc.h>
#include "Tiles.h"

/**
 * definition of the max. zoom level we compute or scales for
 */
#define MAX_ZOOM 24

class ZoomLevelScales{
private:
    double zoomMpp[MAX_ZOOM+1];
    double zoomScales[MAX_ZOOM+1];
    const double BASE_MPP=0.264583333 / 1000; //meters/pixel for 96dpi
    //the factor here affects which details we will see at which zoom levels
        
public:
    /**
     * set up our list of scales
     * @param scaleLevel - factor to multiply with BASE_MPP
     */
    ZoomLevelScales(double scaleLevel);
    double GetScaleForZoom(int zoom) const;
    double GetMppForZoom(int zoom) const;
    int FindZoomForScale(double scale) const;
};

class BoundingBox{
public:
    double minLon=180.0;
    double maxLon=-180.0;
    double minLat=85.0;
    double maxLat=-85.0;
    bool Valid(){
        return (maxLon>=minLon) && (maxLat >= minLat);
    }
};

class TileBox{
public:
    int zoom;
    int xmin;
    int xmax;
    int ymin;
    int ymax;
    TileBox(){
        zoom=-1;
        xmin=-1;
        xmax=-1;
        ymin=-1;
        ymax=-1;
    }
    bool Valid(){
        return (zoom != -1 && xmin != -1 && ymin != -1 &&xmax != -1 && ymax != -1);
    }
    bool Extend(const TileBox &other){
        if (other.zoom != zoom) return false;
        if (other.xmin<xmin)xmin=other.xmin;
        if (other.ymin<ymin)ymin=other.ymin;
        if (other.xmax>xmax)xmax=other.xmax;
        if (other.ymax>ymax)ymax=other.ymax;
        return true;
    }
    void UpZoom(){
        zoom++;
        xmin=xmin*2;
        xmax=xmax*2;
        ymin=ymin*2;
        ymax=ymax*2;
    }
    void DownZoom(){
        zoom--;
        xmin=xmin/2;
        ymin=ymin/2;
        xmax=xmax/2;
        ymax=ymax/2;
    }
};

class ChartInfo{
private:
    PlugInChartBase *chart;
    wxString        classname;
    wxString        filename;
    int             zoom=-1;
    ExtentPI        extent;
    //min/max tiles only for xml boundings
    int             xmin;
    int             xmax;
    int             ymin;
    int             ymax;
    int             nativeScale;
    wxMutex         renderLock;
         
public:
    ChartInfo(wxString className,wxString fileName);
    ~ChartInfo();
    int         Init(bool allowRetry=false);
    wxString    GetXmlBounds();
    wxString    ToString();
    int         GetZoom(){return zoom;}
    int         GetNativeScale(){return nativeScale;}
    /**
     * get a weight value on how good a tile fits
     * 100 means complete coverage
     * @param northwest
     * @param southeast
     * @return 
     */
    int         HasTile(LatLon &northwest,LatLon &southeast);
    bool        UpdateBoundings(/*inout*/BoundingBox *box);
    bool        Render(wxDC &out,const PlugIn_ViewPort& VPoint, const wxRegion &Region);
    void        GetTileBounds(/*out*/int &xmin,int &xmax,int &ymin,int &ymax);
    TileBox     GetTileBounds();
    bool        IsOpen();
    long        GetLastRender();
    bool        Reopen(bool fullInit=false,bool allowRetry=false);
    bool        Close();
    wxString    GetFileName(){return filename;}
    int         FillInfo(const ZoomLevelScales *);
    
private:
    long    lastRender;
};

class ChartInfoWithScale{
public:
    ChartInfo * info;
    int scale;
    ChartInfoWithScale(int weight, ChartInfo *info){
        this->scale=weight;
        this->info=info;
    }
    ChartInfoWithScale(const ChartInfoWithScale &other){
        this->scale=other.scale;
        this->info=other.info;
    }
};

typedef std::vector<ChartInfoWithScale> WeightedChartList;




#endif //_PLUGIN_H_

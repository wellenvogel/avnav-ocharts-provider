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
#ifndef _TILES_H
#define _TILES_H

#include <sys/time.h>
#include "georef.h"
#include "MD5.h"

#define TILE_SIZE 256


//taken from http://wiki.openstreetmap.org/wiki/Slippy_map_tilenames


class LatLon{
public:
    double lat;
    double lon;
    LatLon(double lat,double lon){
        this->lat=lat;
        this->lon=lon;
    }
    LatLon(const LatLon &other){
        this->lat=other.lat;
        this->lon=other.lon;
    }
};
class TileInfo{
public:
    int x=0;
    int y=0;
    int zoom=0;
    bool valid=false;
    wxString chartSetKey;
    MD5Name  cacheKey;
    TileInfo(){}
    TileInfo(wxString url,wxString chartSetKey){
        if (sscanf(url.c_str(), "%d/%d/%d", &zoom, &x, &y) != 3) {
            valid=false;
        }
        else{
            valid=true;
        }
        this->chartSetKey=chartSetKey;       
    }
    TileInfo(int zoom, int x, int y,wxString chartSetKey){
        valid=true;
        this->zoom=zoom;
        this->x=x;
        this->y=y;
        this->chartSetKey=chartSetKey;
    }
    TileInfo(const TileInfo &other){
        this->zoom=other.zoom;
        this->x=other.x;
        this->y=other.y;
        this->chartSetKey=other.chartSetKey;
        this->valid=other.valid;
        this->cacheKey=other.cacheKey;
    }
    bool operator==(const TileInfo &other){
        if (other.chartSetKey != chartSetKey) return false;
        if (other.zoom != zoom) return false;
        if (other.x != x) return false;
        if (other.y != y) return false;
        return true;
    }
    wxString ToString(){
        return wxString::Format(_T("tile %s,z=%d,x=%d,y=%d"),chartSetKey,zoom,x,y);
    }
    MD5Name GetCacheKey(){
        return cacheKey;
    }
};

/*
 * tiles: X=0 180W.... 2^^zoom -1 180E
 *        Y=0 85N .....2^^zoom -1 85S 
 */


class TileHelper {
public:
    static int long2tilex(double lon, int z) {
        return (int) (floor((lon + 180.0) / 360.0 * (1 << z)));
    }

    static int lat2tiley(double lat, int z) {
        double latrad = lat * PI / 180.0;
        return (int) (floor((1.0 - asinh(tan(latrad)) / PI) / 2.0 * (1 << z)));
    }

    static double tilex2long(int x, int z) {
        return x / (double) (1 << z) * 360.0 - 180;
    }
    static double tilex2longOffset(int x, int z,int offset) {
        return ((double)x + (double)offset/(double)TILE_SIZE) / (double) (1 << z) * 360.0 - 180;
    }

    static double tiley2lat(int y, int z) {
        double n = PI - 2.0 * PI * y / (double) (1 << z);
        return 180.0 / PI * atan(0.5 * (exp(n) - exp(-n)));
    }
    static double tiley2latOffset(int y, int z,int offset) {
        double n = PI - 2.0 * PI * ((double)y + (double)offset/(double)TILE_SIZE)/ (double) (1 << z);
        return 180.0 / PI * atan(0.5 * (exp(n) - exp(-n)));
    }

    static LatLon TileCenter(TileInfo &info){
        LatLon rt(
            tiley2latOffset(info.y,info.zoom,TILE_SIZE/2),
            tilex2longOffset(info.x,info.zoom,TILE_SIZE/2)    
                );
        return rt;
    }
    static LatLon TileNorthWest(TileInfo &info){
        //minx,miny
        LatLon rt(
            tiley2lat(info.y,info.zoom),
            tilex2long(info.x,info.zoom)    
        );
        return rt;
    }
    static LatLon TileSouthEast(TileInfo &info){
        //maxx,maxy
        LatLon rt(
            tiley2lat(info.y+1,info.zoom),
            tilex2long(info.x+1,info.zoom)    
        );
        return rt;
    }
    

    
};

#endif 

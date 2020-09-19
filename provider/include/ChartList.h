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
#ifndef _CHARTLIST_H
#define _CHARTLIST_H


#include <wx/hashmap.h>
#include <wx/dynarray.h>
#include "ocpn_plugin.h"
#include "Tiles.h"
#include "ChartInfo.h"
#include "ItemStatus.h"


class ChartList : public ItemStatus{
    BoundingBox boundings;
public:
    typedef std::vector<ChartInfo*> InfoList;
    ChartList();
    ~ChartList();
    void                AddChart(ChartInfo *chart);
    WeightedChartList   FindChartForTile(int minZoom,int maxZoom,LatLon &northwest,LatLon &southeast,int goUp=2);
    int                 GetSize(){return chartList.size();}
    BoundingBox &       GetBoundings(){return boundings;}
    int                 GetMinZoom(){return minZoom;}
    int                 GetMaxZoom(){return maxZoom;}
    InfoList            GetZoomCharts(int zoom);
    InfoList            GetAllCharts();
    void                UpdateZooms(ZoomLevelScales *scales);
    virtual wxString    ToJson();
    int                 NumValidCharts();
private:
    InfoList            chartList;
    int                 minZoom;
    int                 maxZoom;
    
};

#endif
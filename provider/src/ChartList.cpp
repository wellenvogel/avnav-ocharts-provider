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
#include <wx-3.0/wx/arrimpl.cpp>

#include "ChartList.h"
#include <wx/arrimpl.cpp> 
#include <wx/log.h>
#include "StringHelper.h"



ChartList::ChartList() {
   
    
};
ChartList::~ChartList(){
    InfoList::iterator it;
    for (it=chartList.begin() ; it != chartList.end();it++){
        delete (*it);
    }
}
void ChartList::AddChart(ChartInfo *chart){
    chartList.push_back(chart);
    if (! chart->IsValid()) return;
    chart->UpdateBoundings(&boundings);
}

WeightedChartList ChartList::FindChartForTile(int minZoom,int maxZoom,LatLon &northwest,LatLon &southeast,int goUp){
    WeightedChartList rt;
    if (minZoom > maxZoom) return rt;
    if (minZoom < 0) minZoom=0;
    if (maxZoom > MAX_ZOOM) maxZoom=MAX_ZOOM;
    bool foundZooms[MAX_ZOOM+1];
    for (int i=0;i<=MAX_ZOOM;i++) foundZooms[i]=false;
    InfoList::iterator it;
    for (it=chartList.begin();it!= chartList.end();it++){
        ChartInfo *info=(*it);
        if (! info->IsValid()) {
            continue;
        }
        if (info->GetZoom()<minZoom || info->GetZoom()>maxZoom){
            continue;
        }
        int scale=(info->HasTile(northwest,southeast));
        if (scale > 0){
            if (!info->IsOverlay()) foundZooms[info->GetZoom()]=true;
            ChartInfoWithScale winfo(scale,info);
            rt.push_back(winfo);            
        }
    }
    int upperZoom=maxZoom+goUp;
    if (upperZoom > MAX_ZOOM) upperZoom=MAX_ZOOM;
    if (upperZoom > maxZoom ) {
        //tmp: if we did not find a tile at the wanted zoom - go x levels up
        bool ok = foundZooms[maxZoom];        
        if (!ok) {
            WeightedChartList add = FindChartForTile(maxZoom + 1, upperZoom, northwest, southeast, 0);
            if (add.size() > 0) {
                bool found=false;
                for (int z=maxZoom+1;z<=upperZoom && ! found;z++){
                    WeightedChartList::iterator it;
                    bool foundInLevel=false;
                    for (it = add.begin(); it != add.end(); it++) {
                        if (it->info->GetZoom() == z){
                            rt.push_back(*it);
                            if (! it->info->IsOverlay()) foundInLevel=true;
                        }
                    }
                    if (foundInLevel){
                        found=true;
                        break;
                    }
                }
            }
        }
    }
    return rt;
}

void ChartList::UpdateZooms(ZoomLevelScales* scales){
    InfoList::iterator it;
    minZoom=24;
    maxZoom=0;
    for (it=chartList.begin();it!=chartList.end();it++){
        ChartInfo *info=(*it);
        if (! info->IsValid()) {
            continue;
        }
        info->FillInfo(scales);
        if (info->GetZoom() < minZoom) minZoom=info->GetZoom();
        if (info->GetZoom() > maxZoom) maxZoom=info->GetZoom();
    }
}

ChartList::InfoList ChartList::GetZoomCharts(int zoom){
    InfoList rt;
    InfoList::iterator it;
    for (it=chartList.begin();it!=chartList.end();it++){
        ChartInfo *info=(*it);
        if (! info->IsValid()) {
            continue;
        }
        if (info->GetZoom() == zoom) rt.push_back(info);
    }
    return rt;
}
ChartList::InfoList ChartList::GetAllCharts(){
    return chartList;
}


wxString ChartList::ToJson(){
    wxString rt=wxString::Format("{"
            JSON_IV(numCharts,%d) ",\n"
            JSON_IV(minZoom,%d) ",\n"
            JSON_IV(maxZoom,%d) "\n"
            "}",
            GetSize(),
            GetMinZoom(),
            GetMaxZoom());
    return rt;
}
int ChartList::NumValidCharts(){
    int rt=0;
    InfoList::iterator it;
    for (it=chartList.begin();it!=chartList.end();it++){
        ChartInfo *info=(*it);
        if (! info->IsValid()) {
            continue;
        }
        rt++;
    }
    return rt;
}


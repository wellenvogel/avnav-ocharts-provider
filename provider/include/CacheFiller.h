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

#ifndef CACHEFILLER_H
#define CACHEFILLER_H
#include <deque>
#include <map>
#include <wx/string.h>
#include "ChartManager.h"
#include "SimpleThread.h"
#include "Logger.h"
class CacheFiller :public Thread{
public:
    CacheFiller(unsigned long maxPerSet,long maxPrefillZoom,ChartManager *);
    virtual                 ~CacheFiller();
    virtual void            run();
    virtual wxString        ToJson() override;

private:
    typedef  std::map<int,long> ZoomTiles;
    typedef  std::map<wxString,ZoomTiles> PrefillTiles;
    std::mutex              statusLock;
    ChartManager            *manager;
    std::deque<TileInfo>    renderHints;
    void                    RenderPrefill(ChartSet *set);
    void                    CheckRenderHints();
    void                    ProcessRenderHints();
    void                    ProcessNextTile(TileInfo tile);
    void                    RenderTile(TileInfo tile,bool processingRenderHint);
    long                    maxPrefillZoom;
    unsigned long           maxPerSet;
    wxString                currentPrefillSet;
    bool                    isPrefilling;
    bool                    isStarted;
    int                     currentPrefillZoom;
    int                     numSets;
    int                     currentSetIndex;
    PrefillTiles            prefillTiles;
    
};

#endif /* CACHEFILLER_H */


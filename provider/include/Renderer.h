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
#ifndef _RENDERER_H
#define _RENDERER_H


#include <wx/image.h>
#include <wx/msgqueue.h>
#include "SimpleThread.h"
#include "ocpn_plugin.h"
#include "Tiles.h"
#include "ChartInfo.h"
#include "ChartList.h"
#include "RequestQueue.h"
#include "CacheHandler.h"
#include "ChartList.h"
#include "ChartManager.h"
#include "MainQueue.h"

class CacheEntry;
class Renderer;
class RenderMessage : public MainMessage{
private:
    bool            renderOk;
    unsigned char * renderResult;
    CacheEntry    * cacheResult;
    ChartSet      * set;
    TileInfo        tile;
    WeightedChartList charts;
    PlugIn_ViewPort viewport;
    long            creationTime;
    long            findTime;
    long            dequeueTime;
    long            afterRenderTime;
    long            afterImageTime;
    long            afterPngTime;
    long            settingsSequence;
    Renderer        *renderer;
    ~RenderMessage();
public:
    RenderMessage(TileInfo &tile,ChartSet *set,Renderer *renderer,
            long settingsSequence);
    virtual void        Process(bool discard=false);
    void                StoreResult(CacheEntry *e,bool ok);
    void                StoreResult(wxImage &result,bool ok);
    TileInfo            GetTile(){return tile;}
    /**
     * create the final result (if not yet available)
     * the final result is the png encoded data in a CacheEntry
     * will do nothing if already there
     * @return 
     */
    
    bool                CreateFinalResult(wxColor &back);
    /**
     * get the cached result (if any)
     * will ref the result
     * @return 
     */
    CacheEntry          *GetCacheResult();
    wxString            GetTimings();
    void                SetDequeueTime();
    void                SetAfterImageTime();
    void                SetCharts(WeightedChartList charts);
    void                SetViewPort(PlugIn_ViewPort vp);
    PlugIn_ViewPort &   GetViewPort(){return viewport;}
    WeightedChartList & GetChartList(){return charts;}
    ChartSet *          GetSet(){ return set;}
    bool                IsOk(){return renderOk;}
    long                GetSettingsSequence(){return settingsSequence;}
};

class Renderer{
public:
typedef enum {
    RENDER_OK,
    RENDER_FAIL,
    RENDER_QUEUE        
} RenderResult;    
private:
    static Renderer *_instance;
    ChartManager    *manager;
    bool            stop;
    Renderer(ChartManager *manager,MainQueue *queue);
    RenderMessage   *PrepareRenderMessage(ChartSet *set, TileInfo &tile);
    wxBitmap        *initialBitmap;
    wxColor         backColor;
    
    
public:
    MainQueue           *queue;
    ~Renderer();
    static Renderer*    Instance();
    static void         CreateInstance(ChartManager *manager,MainQueue *queue);
    
    RenderResult        renderTile(ChartSet *set,TileInfo &tile, /*out*/CacheEntry *&result,long timeout=0,bool forCache=false);
    /**
     * must be called in the main thread
     * @param msg
     * @param manager
     */
    void                DoRenderTile(RenderMessage *msg);
};

#endif
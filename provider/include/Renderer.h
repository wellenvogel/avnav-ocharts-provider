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
class RenderMessageBase : public MainMessage{
protected:
    bool            renderOk;
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
    ChartManager    *manager;
    virtual ~RenderMessageBase();
public:
    RenderMessageBase(TileInfo &tile,ChartSet *set,Renderer *renderer,
            long settingsSequence);
    TileInfo            GetTile(){return tile;}
    wxString            GetTimings();
    void                SetDequeueTime();
    void                SetAfterImageTime();
    void                SetCharts(WeightedChartList charts);
    void                SetViewPort(PlugIn_ViewPort vp);
    PlugIn_ViewPort &   GetViewPort(){return viewport;}
    WeightedChartList & GetChartList(){return charts;}
    ChartSet *          GetSet(){ return set;}
    bool                IsOk(){return renderOk;}
    void                SetManager(ChartManager *manager){this->manager=manager;}
    long                GetSettingsSequence(){return settingsSequence;}
};

class RenderMessage : public RenderMessageBase{
public:
    RenderMessage(TileInfo &tile,ChartSet *set,Renderer *renderer,
            long settingsSequence);
    void                StoreResult(CacheEntry *e,bool ok);
    void                StoreResult(wxImage &result,bool ok); 
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
    virtual void        Process(bool discard=false);
    
    virtual ~RenderMessage();
    
protected:
    CacheEntry    * cacheResult;
    unsigned char * renderResult;
   
};
class FeatureInfoMessage : public RenderMessageBase{
public:
    FeatureInfoMessage(TileInfo &tile,ChartSet *set,Renderer *renderer,
            long settingsSequence,
            float lat,
            float lon,
            float tolerance);
    virtual     void Process(bool discard=false);
    ObjectList*  GetResult();
private:
    float  lat;
    float  lon;
    float  tolerance;
    ObjectList result;
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
    /**
     * prepare a message for rendering
     * @param set
     * @param tile
     * @param msg
     * @param allLower: use all lower zoom levels (for feature request)
     * @return true: message ok, false: message deleted (via unref)
     */
    bool            PrepareRenderMessage(ChartSet *set, TileInfo &tile
                        ,RenderMessageBase* msg, bool allLower=false);
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
    wxString            FeatureRequest(ChartSet *set,TileInfo &tile,double lat, double lon, double tolerance);
};

#endif
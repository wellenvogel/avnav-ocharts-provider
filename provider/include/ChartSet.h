/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Chart Set
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

#ifndef CHARTSET_H
#define CHARTSET_H
#include "ChartSetInfo.h"
#include "ChartInfo.h"
#include "ChartList.h"
#include "CacheHandler.h"
#include "StatusCollector.h"
#include "SettingsManager.h"
#include "MD5.h"
#include <vector>
#include <map>
class CacheHandler;
class CacheReaderWriter;
class ChartList;
class UpdateReceiverImpl;
class ChartSet : public StatusCollector{
public:
    const int MAX_ERRORS_RETRY=3; //stop retrying after that many errors
    typedef enum{
        STATE_INIT,
        STATE_PARSING,
        STATE_READY,
        STATE_DELETED  //as we cannot delete a set we set this to deleted...
    } SetState;
    typedef std::vector<TileInfo> RequestList;
    ChartSetInfo        info;
    ChartList           *charts;
    CacheHandler        *cache;
    CacheReaderWriter   *rdwr;
    int                 numCandidates;
    SetState            state;
    ChartSet(ChartSetInfo info, SettingsManager *settings, bool canDelete=false);
    void                CreateCache(wxString dataDir,long maxEntries,long maxFileEntries);
    void                UpdateSettings(bool removeCacheFile=false);
    virtual             ~ChartSet(){
                            //TODO: remove cache and charts
                        }
    wxString            GetKey(){
                            return info.name;
                        }
    bool                IsActive(){ return active && state == STATE_READY && (charts->GetSize()>0);}
    /**
     * change the enabled/disabled state
     * @param enabled
     * @return true if state has changed
     */
    bool                SetEnabled(bool enabled=true,wxString disabledBy=wxEmptyString);
    bool                IsEnabled(){return active;}
    void                AddCandidate(wxString fileName);
    void                AddError(wxString fileName);
    void                StartParsing(){state=STATE_PARSING;}
    void                SetZoomLevels();
    void                SetReady(){state=STATE_READY;}
    void                Stop();
    bool                CacheReady();
    bool                CanDelete(){return canDelete;}
    bool                IsReady(){ return CacheReady() && state==STATE_READY;}
    bool                SetTileCacheKey(/*inout*/TileInfo &tile);
    //set a cache render hint
    void                LastRequest(wxString sessionId,TileInfo tile);
    //get the list of last requests (and empty the internal store)
    RequestList         GetLastRequests();
    virtual wxString    LocalJson() override;
    double              GetMppForZoom(int zoom);
    void                ResetOpenErrors(){openErrors=0;}
    bool                AllowOpenRetry();
    

    
    
private:
    wxString            GetCacheFileName();
    typedef std::map<wxString,TileInfo> RequestMap;
    std::mutex          lock;
    RequestMap          lastRequests;
    MD5                 setToken;
    long                maxCacheEntries;
    long                maxDiskCacheEntries;
    wxString            dataDir;
    SettingsManager *   settings;
    UpdateReceiverImpl *updater;
    ZoomLevelScales    *scales;
    std::mutex          settingsLock;
    bool                active;
    int                 numErrors;
    bool                canDelete;
    wxString            disabledBy;
    int                 openErrors; //consecutive openErrors, disable retry when limit reached
};


#endif /* CHARTSET_H */


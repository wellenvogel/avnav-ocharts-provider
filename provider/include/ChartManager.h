/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Chart Manager
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

#ifndef CHARTMANAGER_H
#define CHARTMANAGER_H

#include <map>
#include <vector>
#include <deque>
#include "ChartInfo.h"
#include "ChartSetInfo.h"
#include "ChartList.h"
#include "Logger.h"
#include "SimpleThread.h"
#include "CacheHandler.h"
#include <wx/wx.h>
#include <wx/filename.h>
#include "ChartSet.h"
#include "StatusCollector.h"
#include "SettingsManager.h"
#include "StringHelper.h"

class CacheFiller;
class ExtensionEntry{
public:
    wxString    classname;
    ExtensionEntry(wxString &classname){
        this->classname=classname;
    }
    ExtensionEntry(){
        this->classname=wxEmptyString;
    }
};

typedef std::map<wxString,ExtensionEntry> ExtensionList;
typedef std::map<wxString,ChartSet*> ChartSetMap;
class ChartManager : public StatusCollector{
public:
    typedef enum{
            STATE_INIT,
            STATE_PREPARE,
            STATE_READING,
            STATE_READY        
    } ManagerState;
    ChartManager(SettingsManager *settings,ExtensionList *extensions);
    typedef std::deque<ChartInfo*> ChartInfoQueue;
    /**
     * read all dirs and files and initially prepare the sets
     * this includes reading the chart info files
     * @param dirsAndFiles
     * @return 
     */
    int                 PrepareChartSets(wxArrayString &dirsAndFiles, bool setState=true,bool canDelete=false);
    
    /**
     * compute the active/inactive sets
     * based on the SettingsManager
     * must be called before ReadCharts
     * @param setKeys only change those sets if set
     * @return 
     */
    int                 ComputeActiveSets(StringVector *setKeys=NULL);
    /**
     * really start reading the charts
     * beside initially opening them it will also monitor the mem usage
     * and define how many charts we can keep open
     * memSizeKb is the max allowed size
     * so we need to compute:
     * currentUsedMemKb-currentCacheKb+maxCacheKb<memSizeKb
     * @param dirsAndFiles
     * @param knownExtensions
     * @param memKb
     * @return 
     */   
    int                 ReadCharts(wxArrayString &dirsAndFiles,int memKb);    
    virtual             ~ChartManager();
    ChartSetMap *       GetChartSets();
    int                 GetNumCandidates();
    int                 GetNumCharts();
    bool                StartCaches(wxString dataDir,long maxCacheEntries,long maxFileEntries);
    bool                StartFiller(long maxPerSet,long maxPrefillZoom,bool waitReady=true);
    /**
     * must be called from the main thread after
     * the settings manager did some updates
     * @return 
     */
    bool                UpdateSettings();
    /**
     * enable/disable a chart set
     * must be called from the main thread and will persistently store the change
     * afterwards if any change it will call UpdateSettings at the set and
     * CloseDisabled
     * @param key
     * @param enable
     * @return true if changed
     */
    bool                EnableChartSet(wxString key,bool enable=true);
    /**
     * disable a set and afterwards
     * delete a chart set from all maps
     * the set itself will not really be removed as we cannot handle this
     * this will give a certain memory leak but as this happens seldom
     * it should be acceptable
     * @param key
     * @return 
     */
    bool                DeleteChartSet(wxString key);
    /**
     * try to open a chart file (used after uploading),
     * the file is not assigned to any set and is closed immediately
     * @param chartFile
     * @return false in case of errors
     */
    bool                TryOpenChart(wxFileName chartFile);
    bool                HasKnownExtension(wxFileName chartFile);
    
    bool                Stop();
    ChartSet *          GetChartSet(wxString key);
    bool                OpenChart(ChartInfo *chart);
    virtual wxString    LocalJson();
    SettingsManager     *GetSettings();
    ManagerState        GetState();
    unsigned long       GetCurrentCacheSizeKb();
    unsigned long       GetMaxCacheSizeKb();
    wxString            GetCacheFileName(wxString fileName);
    /**
     * write out extensions and native scale for all charts
     * @param config
     * @return true if written
     */
    bool                WriteChartCache(wxFileConfig *config);
    /**
     * read extension an native scale from the cache file
     * is used as a replacement for ReadCharts on fast start
     * @param config
     * @return 
     */
    bool                ReadChartCache(wxFileConfig *config);
private:
    std::mutex          statusLock;
    ChartInfoQueue      openCharts;
    int                 maxOpenCharts;
    SettingsManager     *settings;
    unsigned int        memKb;
    ChartSetMap         chartSets;
    std::mutex          lock;   
    ChartSet           *findOrCreateChartSet(wxFileName chartFile,bool mustExist=false,bool canDelete=false);
    int                 HandleCharts(wxArrayString &dirsAndFiles,bool setsOnly, bool canDelete=false);
    bool                HandleChart(wxFileName chartFile,bool setsOnly,bool canDeleteSet, int number);
    void                CheckMemoryLimit();
    /**
     * cleanup currently open charts fro disabled chart sets
     * main thread only
     */
    void                CloseDisabled();
    CacheFiller         *filler;
    ManagerState        state;
    int                 numCandidates;
    int                 numRead;
    long                maxPrefillPerSet;
    long                maxPrefillZoom;
    ExtensionList       *extensions;

};

#endif /* CHARTMANAGER_H */


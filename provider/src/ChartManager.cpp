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

#include <wx/filename.h>
#include <wx/dir.h>

#include "ChartManager.h"
#include "CacheFiller.h"
#include "ocpn_plugin.h"
#include "SystemHelper.h"
#include <algorithm>
#include <unordered_set>
#include "StatusCollector.h"

ChartManager::ChartManager(SettingsManager *settings,ExtensionList *extensions) {
    this->settings=settings;
    this->extensions=extensions;
    filler=NULL;
    this->memKb=0;    
    maxOpenCharts=-1; //will be estimated during load
    state=STATE_INIT;
    numCandidates=0;
    numRead=0;
    maxPrefillPerSet=0;
    maxPrefillZoom=0;
}

ChartManager::~ChartManager() {
}

SettingsManager* ChartManager::GetSettings() {
    return settings;
}


wxString ChartManager::LocalJson(){
    int memkb;
    SystemHelper::GetMemInfo(NULL,&memkb);
    Synchronized locker(statusLock);
    wxString status="INIT";
    switch(state){
        case STATE_PREPARE:
            status="PREPARE";
            break;
        case STATE_READING:
            status="READING";
            break;
        case STATE_READY:
            status="READY";
            break;
        default:
            break;
    }
    wxString rt=wxString::Format(
            JSON_IV(openCharts,%ld) ",\n"
            JSON_SV(state,%s) ",\n"
            JSON_IV(numCandidates,%d) ",\n"
            JSON_IV(numRead,%d) ",\n"
            JSON_IV(memoryKb,%d) "\n",
            openCharts.size(),
            status,
            numCandidates,
            numRead,
            memkb
            );   
    return rt;
}

ChartSet *ChartManager::findOrCreateChartSet(wxFileName chartFile,bool mustExist, bool canDelete){
        wxString chartDir=chartFile.GetPath();
        wxString key=ChartSetInfo::KeyFromChartDir(chartDir);
        ChartSetMap::iterator it;
        {
            Synchronized locker(lock);
            it=chartSets.find(key);
            if (it != chartSets.end()){
                if (it->second->info.dirname != chartDir){
                    LOG_ERROR(wxT("found a chart dir %s that has the same short name like %s, cannot handle this")
                        ,chartDir,it->second->info.dirname);
                    return NULL;
                }
                if (mustExist && ! it->second->IsEnabled()){
                    LOG_INFO(wxT("chart set %s is disabled, do not load charts"),
                            it->second->GetKey());
                    return NULL;
                }
                return it->second;
            }
        }
        if (mustExist){
            LOG_ERROR(wxT("no chart info created for file %s"),chartFile.GetFullPath());
            return NULL;
        }
        ChartSetInfo info=ChartSetInfo::ParseChartInfo(chartDir,true);
        if (! info.infoParsed){
            LOG_INFO(wxT("unable to retrieve chart set info for %s, trying anyway with defaults"),chartDir);
        }
        else{
            LOG_INFO(wxT("created chart set with key %s for directory %s"),key,chartDir);
        }
        {
            Synchronized locker(lock);
            //check again - should normally not happen...
            ChartSetMap::iterator it=chartSets.find(key);
            if (it != chartSets.end()){
                return it->second;
            }
            ChartSet *newSet=new ChartSet(info,settings,canDelete);
            chartSets[key]=newSet;
            AddItem("chartSets",newSet,true);
            return newSet;     
        }
    }
//main thread only!
void ChartManager::CheckMemoryLimit(){
    if (maxOpenCharts >= 0) return;
    int ourKb;
    int currentOpen=openCharts.size();
    SystemHelper::GetMemInfo(NULL, &ourKb);
    unsigned int maxExpected=((unsigned int)ourKb - GetCurrentCacheSizeKb() + GetMaxCacheSizeKb());
    LOG_INFO(wxT("ChartManager::CheckMemoryLimit our=%dkb, expected=%dkb, limit=%dkb"), ourKb,maxExpected,memKb);
    bool limitReached=maxExpected > memKb;
    if (limitReached ) {
        LOG_INFO(wxT("memory limit of %d kb reached, limiting open charts to %d"),
                    memKb, currentOpen);
            maxOpenCharts = currentOpen;
    }
}

bool ChartManager::HasKnownExtension(wxFileName chartFile){
    wxString ext = chartFile.GetExt().Upper();
    ext.Prepend(_T("*."));
    ExtensionList::iterator it=extensions->find(ext);
    if (it == extensions->end()){
        return false;
    }
    return true;
}
bool ChartManager::TryOpenChart(wxFileName chartFile){
    LOG_INFO(wxT("ChartManager: TryOpenChart %s"),chartFile.GetFullPath());
    wxString ext = chartFile.GetExt().Upper();
    ext.Prepend(_T("*."));
    ExtensionList::iterator it=extensions->find(ext);
    if (it == extensions->end()){
        LOG_INFO(wxT("unknown extension for chart file %s, skip"),chartFile.GetFullPath());
        return false;
    }
    ChartInfo *info = new ChartInfo(it->second.classname,chartFile.GetFullPath());    
    int rt = info->Init(true);
    info->Close();
    LOG_INFO(wxT("ChartManager: TryOpenChart %s returns %d"),chartFile.GetFullPath(),rt);
    return rt == PI_INIT_OK;
}

bool ChartManager::HandleChart(wxFileName chartFile,bool setsOnly,bool canDeleteSet,int number){
    LOG_INFO(wxT("ChartManager: HandleChart %s, mode=%s"),chartFile.GetFullPath(),(setsOnly?"prepare":"read"));
    wxString ext = chartFile.GetExt().Upper();
    ext.Prepend(_T("*."));
    ExtensionList::iterator it=extensions->find(ext);
    if (it == extensions->end()){
        LOG_INFO(wxT("unknown extension for chart file %s, skip"),chartFile.GetFullPath());
        return false;
    }
    ChartSet *set=findOrCreateChartSet(chartFile,!setsOnly,canDeleteSet);
    if (set == NULL) return false;
    if (setsOnly) {
        ChartSet::ChartCandidate candidate(ext,chartFile.GetFullPath());
        set->AddCandidate(candidate);
        return true;
    }
    if (! set->IsParsing()){
        LOG_INFO(wxT("skip reading chart %s as set is already complete"),chartFile.GetFullPath());
        return false;
    }
    ChartInfo *info = new ChartInfo(it->second.classname,chartFile.GetFullPath(),it->second.isRaster);
    int rt = 0;
    int globalKb,ourKb;
    SystemHelper::GetMemInfo(&globalKb,&ourKb);
    LOG_DEBUG(wxT("Memory before chart global=%dkb,local=%dkb"),globalKb,ourKb);
    if (!set->DisabledByErrors()) {
        if ((rt = info->Init(true)) == PI_INIT_OK) {
            info->Close();
            set->AddChart(info);
            set->ResetOpenErrors();
            SystemHelper::GetMemInfo(&globalKb, &ourKb);
            LOG_DEBUG(wxT("memory after chart global=%dkb,our=%dkb"), globalKb, ourKb);
            return true;
        }
        LOG_ERROR(_T("loading chart failed wit code %d"), rt); 
    }
    else{
        LOG_ERROR(_T("loading chart failed due to too many errors in set"));         
    }
    set->AddChart(info);
    set->AddError(chartFile.GetFullPath());
    return false;
    
}

int ChartManager::HandleCharts(wxArrayString& dirsAndFiles,bool prepareOnly, bool canDelete ){
    int *numHandled=prepareOnly?&numCandidates:&numRead;
    for (unsigned int fc=0;fc<dirsAndFiles.Count();fc++){
        wxFileName chartFile(dirsAndFiles.Item(fc));
        if (!chartFile.Exists()) {
            LOG_INFO(_T("skipping non existing file/dir %s"), dirsAndFiles.Item(fc));
            continue;
        }
        if (wxDirExists(chartFile.GetFullPath())) {
            wxDir dir(chartFile.GetFullPath());
            if (!dir.IsOpened()) {
                LOG_ERROR(_T("unable to read directory %s"), chartFile.GetFullName());
                continue;
            }
            wxString fileName;
            bool hasNext = dir.GetFirst(&fileName);
            while (hasNext) {
                wxFileName localFile(dir.GetName(), fileName);
                if (localFile.IsDir()) {
                    LOG_INFO(_T("skipping sub dir %s"), localFile.GetFullPath());
                } else {
                    if (HandleChart(localFile,prepareOnly,canDelete,(*numHandled)+1)){
                        (*numHandled)++;
                    }
                }
                hasNext = dir.GetNext(&fileName);
                }
        } else {
            if(HandleChart(chartFile,prepareOnly,canDelete,(*numHandled)+1)        )
                (*numHandled)++;
        }
        
    }    
    return (*numHandled);
}

ChartSetMap * ChartManager::GetChartSets(){
    return &chartSets;
}

int ChartManager::PrepareChartSets(wxArrayString& dirsAndFiles, bool setState, bool canDelete){
    if (setState) state=STATE_PREPARE;
    LOG_INFO(wxT("ChartManager: PrepareChartSets"));
    int rt=HandleCharts(dirsAndFiles,true,canDelete);
    LOG_INFO(wxT("ChartManager: PrepareChartSets returned %d"),rt);
    
    return rt;
}

//we have: <system name>-<chart code>-<year>-<edition>
//new scheme <system name>-<chart code>-<year>/<edition>-<update>
class NameAndVersion{
public:
    wxString name;
    wxString base;
    wxString year;
    int      iyear;
    wxString version;
    int      iversion;
    bool valid=false;
    NameAndVersion(){}
    /**
     * 
     * @param name the chart set name
     * @param infoVersion parsed version from chartInfo if not empty
     */
    
    NameAndVersion(wxString name,wxString infoVersion){
        this->name=name;
        base=name;
        version=wxEmptyString;
        year=wxEmptyString;
        int numDel=0;
        for (size_t i=0;i<name.size();i++){
            if (name.GetChar(i) == '-') numDel++;
        }
        if (numDel >= 2){
            wxString rest=name.BeforeLast('-',&version);
            base=rest.BeforeLast('-',&year);
        }
        if (infoVersion != wxEmptyString && infoVersion.Find('-') != wxNOT_FOUND){
            //take the version info from chart info
            year=infoVersion.BeforeFirst('-',&version);
        }
        if (year == wxEmptyString) return;
        iversion=std::atoi(version.c_str());
        if (year.Find('/') != wxNOT_FOUND){
            //new versioning schema
            wxString edition;
            year=year.BeforeLast('/',&edition);
            //simple approach: multiply the edition with 10000 - should give enough room for updates
            iversion=iversion*10000 + atoi(edition.c_str());
        }
        iyear=std::atoi(year.c_str());
        LOG_INFO(wxT("parsed %s to base=%s,year=%d,version=%d"),name,base,iyear,iversion);
        valid=true;
    }
    bool IsBetter(const NameAndVersion &other){
        if (base != other.base) return false;
        if (valid && ! other.valid) return true;
        if (!valid) return false;
        if (iyear > other.iyear) return true;
        if (other.iyear> iyear) return false;
        return iversion > other.iversion;
    }
};


class EnabledState{
public:
    NameAndVersion                  set;
    SettingsManager::EnabledState   state;
    EnabledState(){}
    EnabledState(wxString setName,wxString infoVersion,SettingsManager::EnabledState   state):set(setName,infoVersion),state(state){
        
    }
    bool IsBetter(const EnabledState &other){
        if (state == SettingsManager::ENABLED && other.state != SettingsManager::ENABLED) return true;
        if (other.state == SettingsManager::ENABLED && state != SettingsManager::ENABLED) return false;
        return set.IsBetter(other.set);
    }
};



int ChartManager::ComputeActiveSets(StringVector *setKeys){
    LOG_INFO(wxT("ChartManager::ComnputeActiveSets"));
    ChartSetMap::iterator it;
    int numEnabled=0;
    //hold the found best versions for charts
    std::map<wxString,EnabledState> bestVersions;
    std::map<wxString,EnabledState>::iterator vit;
    for (it=chartSets.begin();it != chartSets.end();it++){
        ChartSet *set=it->second;
        SettingsManager::EnabledState isActive=settings->IsChartSetEnabled(set->GetKey());
        if (set->CanDelete()){
            EnabledState enabled(set->GetKey(),set->info.version,isActive);
            if (isActive == SettingsManager::ENABLED){
                //if we have at least one explicitely enabled set - keep this in mind
                LOG_INFO(wxT("found set %s being explicitely enabled,base=%s"),
                        enabled.set.name,
                        enabled.set.base);
                bestVersions[enabled.set.base]=enabled;
            }
            if (isActive == SettingsManager::UNCONFIGURED){                
                vit=bestVersions.find(enabled.set.base);
                if (vit == bestVersions.end() || enabled.IsBetter(vit->second)){
                    bestVersions[enabled.set.base]=enabled;
                    LOG_INFO(wxT("found better version %s for base %s"),enabled.set.name,enabled.set.base);
                }
            }
            
        }
    }
    for (it=chartSets.begin();it != chartSets.end();it++){
        ChartSet *set=it->second;
        if (setKeys != NULL){
            bool included=false;
            StringVector::iterator skit;
            for (skit=setKeys->begin();skit!=setKeys->end();skit++){
                if (*skit == it->second->GetKey()){
                    included=true;
                    break;
                }
            }
            if (! included){
                LOG_DEBUG(wxT("do not set enabled state for %s, not in list"),it->second->GetKey());
                continue;
            }
        }
        SettingsManager::EnabledState isActive=settings->IsChartSetEnabled(set->GetKey());
        bool enabled=false;
        wxString disabledBy=wxEmptyString;
        if (set->CanDelete() && isActive == SettingsManager::UNCONFIGURED){
             EnabledState enabledState(set->GetKey(),set->info.version,isActive);
             vit=bestVersions.find(enabledState.set.base);
             if (vit == bestVersions.end() || vit->second.set.name==enabledState.set.name){
                 enabled=true;
             }
             else {
                 LOG_INFO(wxT("set %s is better then %s, disabling"),vit->second.set.name,enabledState.set.name);
                 disabledBy=vit->second.set.name;
             }
        }
        else{
            enabled=(isActive == SettingsManager::UNCONFIGURED || 
                 isActive == SettingsManager::ENABLED);        
        }
        set->SetEnabled(enabled,disabledBy);
        if (enabled) numEnabled++;
    }
    return numEnabled;
}

bool ChartManager::EnableChartSet(wxString key, bool enable){
    LOG_INFO(wxT("ChartManager::EnableChartSet %s to %s"),
            key,(enable?"true":"false"));
    ChartSetMap::iterator it=chartSets.find(key); 
    if (it == chartSets.end()){
        LOG_ERROR(wxT("chart set %s not found"),key);
        return false;
    }
    ChartSet::SetState oldState=it->second->state;
    if (oldState == ChartSet::STATE_DELETED){
        LOG_ERROR(wxT("we cannot change the state of a deleted set: %s"),key);
        return false;
    }
    bool changed=it->second->SetEnabled(enable);
    if (! changed) return false;
    it->second->UpdateSettings();
    settings->SetChartSetEnabled(key,enable);
    if (! enable){
        CloseDisabled();
    }
    return true;
}

bool ChartManager::DeleteChartSet(wxString key){
    LOG_INFO(wxT("ChartManager::DeleteChartSet %s "),key);
    ChartSet *set=GetChartSet(key);
    if (set == NULL){
        LOG_ERROR(wxT("chart set %s not found"),key);
        return false;
    }
    if (filler != NULL){
        LOG_INFO(wxT("ChartManager: stopping cache filler"));
        RemoveItem("cacheFiller");
        filler->stop();
        filler->join();
        delete filler;
        filler=NULL;
    }
    ChartSet::SetState oldState=set->state;
    bool changed=set->SetEnabled(false);
    set->state=ChartSet::STATE_DELETED;
    if (changed){
        set->UpdateSettings(true);        
        CloseDisabled();
    }
    settings->SetChartSetEnabled(key,false,true);
    RemoveItem("chartSets",set);
    
    {
        Synchronized locker(lock);
        //TODO: find a strategy to safely delete the chart set
        chartSets.erase(key);
    }
    LOG_INFO(wxT("ChartManager: starting filler"));
    filler=new CacheFiller(maxPrefillPerSet,maxPrefillZoom,this);
    AddItem("cacheFiller",filler);
    filler->start();
    return true;
}

int ChartManager::ReadCharts(wxArrayString& dirsAndFiles,int memKb){
    state=STATE_READING;
    this->memKb=memKb;
    LOG_INFOC(wxT("ChartManager: ReadCharts"));
    ChartSetMap::iterator it;
    uint rt=HandleCharts(dirsAndFiles,false);
    LOG_INFOC(wxT("ChartManager: ReadCharts returned %d"),rt);
    for (it=chartSets.begin();it != chartSets.end();it++){
        it->second->SetZoomLevels();
        if (it->second->IsEnabled()) it->second->SetReady();
    }
    state=STATE_READY;
    return rt;
}

bool ChartManager::StartCaches(wxString dataDir,long maxCacheEntries,long maxFileEntries) {
    if (chartSets.size() < 1) return false;
    int numCharts = 0;
    ChartSetMap::iterator it;
    for (it = chartSets.begin(); it != chartSets.end(); it++) {
        numCharts += it->second->numCandidates;
    }
    if (numCharts < 1) {
        LOG_INFO(wxT("no chart candidates found, do not start caches"));
        return false;
    }
    for (it = chartSets.begin(); it != chartSets.end(); it++) {
        long maxCachePerSet = (maxCacheEntries * it->second->numCandidates) / numCharts;
        LOG_INFO(wxT("creating cache for chart set %s with size %ld, file size %ld"),
                it->second->GetKey(),
                maxCachePerSet,maxFileEntries);
        it->second->CreateCache(dataDir,maxCachePerSet,maxFileEntries);
    }
    return true;
}


int ChartManager::GetNumCharts(){
    Synchronized locker(lock);
    ChartSetMap::iterator it;
    int rt=0;
    for (it=chartSets.begin();it != chartSets.end();it++){
        rt+=it->second->GetNumValidCharts();
    }
    return rt;
}


ChartManager::ManagerState ChartManager::GetState() {
    return state;
}

unsigned long ChartManager::GetCurrentCacheSizeKb(){
    Synchronized locker(lock);
    ChartSetMap::iterator it;
    unsigned long rt=0;
    for (it=chartSets.begin();it != chartSets.end();it++){
        if (it->second->cache == NULL) continue;
        rt+=it->second->cache->GetCompleteSizeKb();
    }
    return rt;
}
//makes only sense after StartCaches
unsigned long ChartManager::GetMaxCacheSizeKb(){
    Synchronized locker(lock);
    ChartSetMap::iterator it;
    unsigned long rt=0;
    for (it=chartSets.begin();it != chartSets.end();it++){
        if (it->second->cache == NULL) continue;
        rt+=it->second->cache->GetMaxSizeKb();
    }
    return rt;
}


ChartSet * ChartManager::GetChartSet(wxString key){
    Synchronized locker(lock);
    ChartSetMap::iterator it=chartSets.find(key);
    if (it == chartSets.end()) return NULL;
    return it->second;
}

bool ChartManager::StartFiller(long maxPerSet,long maxPrefillZoom,bool waitReady){
    this->maxPrefillPerSet=maxPerSet;
    this->maxPrefillZoom=maxPrefillZoom;
    ChartSetMap::iterator it;
    if (waitReady){
        LOG_INFO(wxT("waiting for caches to be ready"));
        bool isReady=false;
        while (!isReady){
            isReady=true;
            for (it=chartSets.begin();it != chartSets.end();it++){
                if (it->second->cache == NULL) continue;
                if (it->second->CacheReady()) continue;
                isReady=false;
                break;
            }
            if (! isReady){
                wxMilliSleep(100);
            }
        }
    }
    filler=new CacheFiller(maxPerSet,maxPrefillZoom,this);
    AddItem("cacheFiller",filler);
    filler->start();
    return true;
}

bool ChartManager::UpdateSettings(){
    if (filler != NULL){
        LOG_INFO(wxT("ChartManager: stopping cache filler"));
        RemoveItem("cacheFiller");
        filler->stop();
        filler->join();
        delete filler;
        filler=NULL;
    }
    LOG_INFO(wxT("ChartManager: updating chart sets"));
    ChartSetMap::iterator it;
    for (it=chartSets.begin();it!=chartSets.end();it++){
        it->second->UpdateSettings();
    }
    LOG_INFO(wxT("ChartManager: starting filler"));
    filler=new CacheFiller(maxPrefillPerSet,maxPrefillZoom,this);
    AddItem("cacheFiller",filler);
    filler->start();
    return true;
}

bool ChartManager::Stop(){
    LOG_INFO(wxT("stopping chart manager"));
    if (filler != NULL){
        filler->stop();
        filler->join();
    }
    ChartSetMap::iterator it;
    for (it=chartSets.begin();it != chartSets.end();it++){
        it->second->SetEnabled(false);
        it->second->Stop();
    }
    LOG_INFO(wxT("stopping chart manager done"));
    return true;
}
typedef std::unordered_set<ChartInfo*> ChartInfoSet;
void ChartManager::CloseDisabled(){
    LOG_INFO(wxT("ChartManager::CloseDisabled"));
    ChartInfoSet disabled;
    ChartSetMap::iterator it;
    int numClosed=0;
    for (it=chartSets.begin();it!=chartSets.end();it++){
        ChartSet *set=it->second;
        if (set->IsEnabled()) continue;
        ChartList::InfoList::iterator cit;
        ChartList::InfoList charts=set->GetAllCharts();
        for (cit=charts.begin();cit!=charts.end();cit++){
            disabled.insert((*cit));
        }
    }
    ChartInfoQueue newOpenCharts;
    while (openCharts.size() > 0){
        ChartInfo *info=openCharts.front();
        openCharts.pop_front();
        if (! info->IsOpen()) continue;
        if (disabled.find(info) != disabled.end()){
            LOG_INFO(wxT("ChartManager::CloseDisabled closing %s"),info->GetFileName());
            info->Close();
            numClosed++;
        }
        else{
            newOpenCharts.push_back(info);
        }
    }
    openCharts=newOpenCharts;
    LOG_INFO(wxT("ChartManager::CloseDisabled finished and closed %d charts"),numClosed);
}
//must be called from main thread
bool ChartManager::OpenChart(ChartInfo* chart){
    if (chart == NULL) return false;
    if (!chart->IsValid()) return false;
    if (chart->IsOpen()) return true;
    if (maxOpenCharts > 0){
        while (openCharts.size() >= (size_t)maxOpenCharts){
            openCharts.front()->Close();
            openCharts.pop_front();
        }
    }
    int globalKb,ourKb;
    SystemHelper::GetMemInfo(&globalKb,&ourKb);
    LOG_DEBUG(wxT("Memory before chart open global=%dkb,our=%dkb"),globalKb,ourKb);
    if (!chart->Reopen(true,true)){
        return false;
    }
    SystemHelper::GetMemInfo(&globalKb,&ourKb);
    LOG_DEBUG(wxT("Memory after chart open global=%dkb,our=%dkb"),globalKb,ourKb);
    openCharts.push_back(chart);
    CheckMemoryLimit();
    return true;
}

wxString ChartManager::GetCacheFileName(wxString fileName){
    wxFileName name=wxFileName::FileName(fileName);
    return StringHelper::SanitizeString(name.GetFullName());
}

void ChartManager::PauseFiller(bool on){
    if (! filler) return;
    filler->Pause(on);
}

bool ChartManager::WriteChartInfoCache(wxFileConfig* config){
    LOG_INFO(wxT("writing chart info cache"));
    if (config == NULL){
        LOG_ERROR(wxT("chart info cache file not open in write chart cache"));
        return false;
    }
    ChartSetMap::iterator it;
    int numWritten=0;
    for (it=chartSets.begin();it != chartSets.end();it++){
        ChartSet *set=it->second;
        if (!set->IsEnabled()) continue;
        if (set->DisabledByErrors()) continue; //if the set has errors we always will reparse
        LOG_DEBUG("writing chart info cache entry for set %s",set->GetKey());
        config->SetPath(wxT("/")+set->GetKey());
        config->Write("token",set->GetSetToken());
        ChartList::InfoList::iterator cit;
        ChartList::InfoList charts=set->GetAllCharts();
        for (cit=charts.begin();cit!=charts.end();cit++){
            ChartInfo *info=(*cit);
            LOG_DEBUG("writing chart info cache entry for %s",info->GetFileName());
            config->SetPath(wxT("/")+set->GetKey());
            config->SetPath(GetCacheFileName(info->GetFileName()));
            config->Write("valid",info->IsValid());
            if (info->IsValid()) {
                config->Write("scale", info->GetNativeScale());
                ExtentPI extent = info->GetExtent();
                config->Write("slat", extent.SLAT);
                config->Write("wlon", extent.WLON);
                config->Write("nlat", extent.NLAT);
                config->Write("elon", extent.ELON);
            }
            numWritten++;
        }
    }
    config->Flush();
    LOG_INFO("written %d chart info cache entries",numWritten);
    return true;
}
bool ChartManager::ReadChartInfoCache(wxFileConfig* config, int memKb){
    LOG_INFO(wxT("reading chart info cache"));
    bool rt=false;
    this->memKb=memKb;
    if (config == NULL){
        LOG_ERROR(wxT("chart cache file not open in read chart info cache"));
        return true;
    }
    ChartSetMap::iterator it;
    //we read in 2 rounds
    //first we only check if we can find all, in the second we really set the 
    //infos
    //this way we can safely read the charts completely if we fail in the first round
    for (int round = 0; round <= 1; round++) {
        for (it = chartSets.begin(); it != chartSets.end(); it++) {
            ChartSet *set = it->second;
            if (!set->IsEnabled()) continue;
            if (round >= 1  && set->IsParsing()) continue; //no need to try this again
            ChartSet::CandidateList::iterator cit;
            ChartSet::CandidateList charts = set->GetCandidates();
            config->SetPath(wxT("/")+set->GetKey());
            if (! config->HasEntry("token")){
                LOG_ERROR("missing entry token for chart set %s in chart info cache",set->GetKey());
                set->StartParsing();
                rt=true;
                continue;
            }
            wxString cacheToken;
            cacheToken=config->Read("token","");
            if (cacheToken != set->GetSetToken()){
                LOG_ERROR("set token has changed for set %s (cache=%s,current=%s)",
                        set->GetKey(),
                        cacheToken,set->GetSetToken()
                        );
                set->StartParsing();
                rt=true;
                continue;
            }
            for (cit = charts.begin(); cit != charts.end(); cit++) {
                ChartSet::ChartCandidate candidate = (*cit);
                ExtensionList::iterator it=extensions->find(candidate.extension);
                if (it == extensions->end()){
                    LOG_ERROR(wxT("unknown extension for chart file %s when reading chart info cache, skip"),candidate.fileName);
                    continue;
                }
                LOG_DEBUG("reading chart info cache entry for %s round %d", candidate.fileName,round);
                config->SetPath(wxT("/") + set->GetKey());
                config->SetPath(GetCacheFileName(candidate.fileName));
                if (! config->HasEntry("valid")){
                    LOG_ERROR("missing valid entry for %s in chart info cache", candidate.fileName);
                    set->StartParsing();
                    rt=true;
                    break;
                }
                bool valid=false;
                config->Read("valid",&valid);
                if (valid) {
                    if (!config->HasEntry("scale")) {
                        LOG_ERROR("missing scale entry for %s in chart info cache", candidate.fileName);
                        set->StartParsing();
                        rt=true;
                        break;                     
                    }
                    if (!config->HasEntry("slat")) {
                        LOG_ERROR("missing slat entry for %s in chart info cache", candidate.fileName);
                        set->StartParsing();
                        rt=true;
                        break;                        
                    }
                    if (!config->HasEntry("wlon")) {
                        LOG_ERROR("missing wlon entry for %s in chart info cache", candidate.fileName);
                        set->StartParsing();
                        rt=true;
                        break;                    
                    }
                    if (!config->HasEntry("nlat")) {
                        LOG_ERROR("missing nlat entry for %s in chart info cache", candidate.fileName);
                        set->StartParsing();
                        rt=true;
                        break; 
                    }
                    if (!config->HasEntry("elon")) {
                        LOG_ERROR("missing elon entry for %s in chart info cache", candidate.fileName);
                        set->StartParsing();
                        rt=true;
                        break;
                    }
                }
                if (round != 1) continue;
                ChartInfo *info=new ChartInfo(it->second.classname,candidate.fileName);
                if (valid){
                    long nativeScale = -1;
                    config->Read("scale", &nativeScale);
                    ExtentPI extent;
                    config->Read("slat", &extent.SLAT);
                    config->Read("wlon", &extent.WLON);
                    config->Read("nlat", &extent.NLAT);
                    config->Read("elon", &extent.ELON);
                    info->FromCache(nativeScale,extent);
                    numRead++;
                }
                else {
                    LOG_ERROR(wxT("adding invalid chart entry %s to set %s"),candidate.fileName,set->GetKey());
                    set->AddError(candidate.fileName);
                }
                set->AddChart(info);
            }
        }
    }
    int numParsing=0;
    for (it=chartSets.begin();it != chartSets.end();it++){
        if (it->second->IsParsing()){
            numParsing++;
            continue;
        }
        it->second->SetZoomLevels();
        if (it->second->IsEnabled()) it->second->SetReady();
    }
    if (! rt) state=STATE_READY;
    LOG_INFO(wxString::Format("read %d chart info cache entries, %d sets still need parsing",numRead,numParsing));
    return rt;
}


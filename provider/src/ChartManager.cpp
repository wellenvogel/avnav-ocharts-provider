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
        ChartSetInfo info=ChartSetInfo::ParseChartInfo(chartDir);
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
        set->AddCandidate(chartFile.GetFullPath());
        return true;
    }
    ChartInfo *info = new ChartInfo(it->second.classname,chartFile.GetFullPath());
    int rt = 0;
    int globalKb,ourKb;
    SystemHelper::GetMemInfo(&globalKb,&ourKb);
    LOG_DEBUG(wxT("Memory before chart global=%dkb,local=%dkb"),globalKb,ourKb);
    if ((rt = info->Init()) == PI_INIT_OK) {
        //openCharts.push_back(info);
        info->Close();
        set->charts->AddChart(info);
        SystemHelper::GetMemInfo(&globalKb, &ourKb);
        LOG_DEBUG(wxT("memory after chart global=%dkb,our=%dkb"), globalKb, ourKb);
        /*
        CheckMemoryLimit();
        if (maxOpenCharts >= 0 && openCharts.size() > (size_t) maxOpenCharts) {
            openCharts.front()->Close();
            openCharts.pop_front();
        }
         */

        return true;
    } else {
        LOG_ERROR(_T("loading chart failed wit code %d"), rt);
        set->AddError(chartFile.GetFullPath());
        return false;
    }
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
    NameAndVersion(wxString name){
        this->name=name;
        base=name;
        version=wxEmptyString;
        year=wxEmptyString;
        int numDel=0;
        for (size_t i=0;i<name.size();i++){
            if (name.GetChar(i) == '-') numDel++;
        }
        if (numDel < 2)return;
        wxString rest=name.BeforeLast('-',&version);
        base=rest.BeforeLast('-',&year);
        iyear=std::atoi(year.c_str());
        iversion=std::atoi(version.c_str());
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
    EnabledState(wxString setName,SettingsManager::EnabledState   state):set(setName),state(state){
        
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
            EnabledState enabled(set->GetKey(),isActive);
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
             EnabledState enabledState(set->GetKey(),isActive);
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
    return true;
}

int ChartManager::ReadCharts(wxArrayString& dirsAndFiles,int memKb){
    state=STATE_READING;
    this->memKb=memKb;
    LOG_INFOC(wxT("ChartManager: ReadCharts"));
    ChartSetMap::iterator it;
    for (it=chartSets.begin();it != chartSets.end();it++){
        if (it->second->IsEnabled())it->second->StartParsing();
    }
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
        rt+=it->second->charts->GetSize();
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
        ChartList::InfoList charts=set->charts->GetAllCharts();
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
    chart->Reopen(true);
    SystemHelper::GetMemInfo(&globalKb,&ourKb);
    LOG_DEBUG(wxT("Memory after chart open global=%dkb,our=%dkb"),globalKb,ourKb);
    openCharts.push_back(chart);
    CheckMemoryLimit();
    return true;
}

/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Settings
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

#include "SettingsManager.h"
#include "UserSettings.h"
#include "pluginmanager.h"
#include "Logger.h"
#include "SimpleThread.h"

SettingsManager::SettingsManager(wxString configDir, wxString dataDir,wxString exeDir) {
    this->configDir=configDir;
    this->dataDir=dataDir;
    this->exeDir=exeDir;
    this->config=NULL;
    this->configSequence=wxGetLocalTime();
    wxFileName fn(configDir,wxT("avnav.conf"));
    this->configFile=fn.GetFullPath();
    fn.MakeAbsolute();
    if (! wxFileExists(fn.GetFullPath())){
        LOG_ERRORC(_T("config file %s not found"),fn.GetFullPath());
    }
    else{
        config = new wxFileConfig( _T (""), _T (""), fn.GetFullPath(), _T (""),  wxCONFIG_USE_LOCAL_FILE );
        LOG_INFOC(_T("using cfg file %s"),fn.GetFullPath());
    }
    baseScale=1.0;
    overZoom=4;
    underZoom=2;
}


SettingsManager::~SettingsManager() {
    delete config;
}
const UserSettingsEntry * SettingsManager::GetConfigDescription(wxString name){
    UserSettingsList::iterator it;
    for (it=userSettings.begin();it!=userSettings.end();it++){
        if ((*it)->name == name) return *it;
    }
    return NULL;
}

static int getIntVal(wxFileConfig *config,const UserSettingsEntry *e,bool noPath=false){
    if (! e) return 1;
    if (! noPath) config->SetPath(e->path);
    int val=config->Read(e->name,e->GetIntDefault());
    return val;
}
static double getDoubleVal(wxFileConfig *config,const UserSettingsEntry *e,bool noPath=false){
    if (! e) return 1;
    if (! noPath) config->SetPath(e->path);
    double val=config->ReadDouble(e->name,e->GetDoubleDefault());
    return val;
}
#define CHARTSETBASE wxT("/Settings/AvNav/ChartSets")
bool SettingsManager::StoreBaseSettings(bool sendJson){
    if (! config){
        LOG_ERROR(wxT("SettingsManager: no config file"));
        return false;
    }
    UserSettingsEntry *entry;
    PluginConfigBase base;
    base.configDir=configDir;
    base.exeDir=exeDir;  
    base.s57BaseDir=dataDir;
    base.baseFontScale=getDoubleVal(config,GetConfigDescription(wxT("chartFont")));
    base.soundingsFontScale=getDoubleVal(config,GetConfigDescription(wxT("soundingsFont")));
    base.depthUnits=getIntVal(config,GetConfigDescription(wxT("S52_DEPTH_UNIT_SHOW")));
    base.boundaryStyle=(PI_LUPname)getIntVal(config,GetConfigDescription(wxT("nBoundaryStyle")));
    base.symbolStyle=(PI_LUPname)getIntVal(config,GetConfigDescription(wxT("nSymbolStyle")));
    base.bShowS57Text=(getIntVal(config,GetConfigDescription(wxT("bShowS57Text")))!=0);
    base.bShowSoundg=(getIntVal(config,GetConfigDescription(wxT("bShowSoundg")))!=0);
    base.nDisplayCategory=getIntVal(config,GetConfigDescription(wxT("nDisplayCategory")));
    base.showLights=getIntVal(config,GetConfigDescription(wxT("showLights")));
    base.configFile=config;
    base.settingsSequence=configSequence;
    LOG_INFO(wxT("SettingsManager: setting plugin base config"));
    setPluginBaseConfig(base,sendJson);
    baseScale=getDoubleVal(config,GetConfigDescription(wxT("scale")));
    overZoom=getIntVal(config,GetConfigDescription(wxT("overZoom")));
    underZoom=getIntVal(config,GetConfigDescription(wxT("underZoom")));
    EnabledMap newEnabled;
    config->SetPath(CHARTSETBASE);
    wxString entryName;
    long dummy;
    bool val;
    bool hasEntry=config->GetFirstEntry(entryName,dummy);
    while (hasEntry){
        config->Read(entryName,&val);
        LOG_DEBUG(wxT("SettingsManager enabled for %s is %s"),entryName,(val?"true":"false"));
        newEnabled[entryName]=val;
        hasEntry=config->GetNextEntry(entryName,dummy);
    }
    enabledMap=newEnabled;
    return true;
}

SettingsManager::EnabledState SettingsManager::IsChartSetEnabled(wxString key){
    EnabledMap::iterator it=enabledMap.find(key);
    if (it == enabledMap.end()) return UNCONFIGURED;
    return it->second?ENABLED:DISABLED;
}
/**
main thread only!
 **/
bool SettingsManager::SetChartSetEnabled(wxString key, bool enabled, bool remove){
    LOG_INFO(wxT("SettingsManager::SetChartSetEnabled for %s to %s"),key,(enabled?"true":"false"));
    enabledMap[key]=enabled;
    if (remove){
        enabledMap.erase(key);
    }
    config->SetPath(CHARTSETBASE);
    bool mustFlush=false;
    if (! config->HasEntry(key)){
        mustFlush=!remove;
    }
    else{
        bool oldV=!enabled;
        config->Read(key,&oldV);
        if (oldV != enabled)mustFlush=true;
        if (remove) mustFlush=true;
    }
    if (mustFlush){
        if (! remove) config->Write(key,enabled);
        else config->DeleteEntry(key);
        config->Flush();
        return true;
    }
    return false;
}

double SettingsManager::GetBaseScale(){
    return baseScale;
}

int SettingsManager::GetOverZoom() {
    return overZoom;
}

int SettingsManager::GetUnderZoom() {
    return underZoom;
}


long SettingsManager::GetCurrentSequence() {
    return configSequence;
}



bool SettingsManager::AddSettingsToMD5(MD5* md5){
    wxFileInputStream is(configFile);
    if (!is.IsOk()){
        LOG_ERROR(wxT("SettingsManager: unable to reopen config file %s"),configFile);
        return false;
    }
    wxFileConfig localConfig(is);
    UserSettingsList::iterator it;
    wxString lastPath=wxEmptyString;
    for (it=userSettings.begin();it!=userSettings.end();it++){
        UserSettingsEntry *e=(*it);
        if (lastPath != e->path){
           localConfig.SetPath(e->path);
           lastPath=e->path;
        }
        md5->AddValue(e->name);
        if (!localConfig.HasEntry(e->name)){
            continue;
        }
        if (e->ShouldReadDouble()){
            float ev=getDoubleVal(&localConfig,e);
            MD5_ADD_VALUEP(md5,ev);
        }
        else{
            int ev=getIntVal(&localConfig,e);
            MD5_ADD_VALUEP(md5,ev);
        }       
    }
    return true;
}


static bool checkAndWriteValue(wxFileConfig *cfg,const UserSettingsEntry *e,wxString newVal,const UserSettingsEntry *last=NULL){
    //TODO: checks?
    if (! e) return false;
    if (! cfg) return false;
    if (last == NULL || last->path != e->path){
        cfg->SetPath(e->path);
    }
    bool change=!cfg->HasEntry(e->name);
    if (e->ShouldReadDouble()){
        double nv=std::atof(newVal.ToAscii().data());
        if (!change){
            double oldv=getDoubleVal(cfg,e,true);
            change=oldv != nv;
        }
        if (change){
            cfg->Write(e->name,nv);
        }
    }
    else{
        int nv=std::atoi(newVal.ToAscii().data());
        if (!change){
            int oldv=getIntVal(cfg,e,true);
            change=oldv!=nv;
        }
        if (change){
            cfg->Write(e->name,nv);
        }
    }
    if (change){
        LOG_DEBUG(wxT("SettingsManager: change setting %s to %s"),e->name,newVal);
    }
    return change;
}

SettingsManager::SetReturn SettingsManager::ChangeSettings(NameValueMap* newValues){
    NameValueMap::iterator it;
    bool hasChanges=false;
    LOG_INFO(wxT("SettingsManager::ChangeSettings with %ld entries"),(long)newValues->size());
    if (config == NULL){
        LOG_ERROR(wxT("SettingsManager::ChangeSettings no config file open"));
        return SetReturn(wxT("no config file open"));
    }
    //check all values for allowed ranges
    for (it=newValues->begin();it!=newValues->end();it++){
        wxString newVal=it->second;
        const UserSettingsEntry *e=GetConfigDescription(it->first);
        if (! e){
            return SetReturn(wxString::Format(wxT("unknown setting %s"),it->first));
        }
        if (e->ShouldReadDouble()){
            double nv=std::atof(newVal.ToAscii().data());
            if (! e->CheckValue(nv)){
                return SetReturn(wxString::Format(wxT("invalid value for %s"),it->first));
            }
        }
        else{
            int nv=std::atoi(newVal.ToAscii().data());
            if (! e->CheckValue(nv)){
                return SetReturn(wxString::Format(wxT("invalid value for %s"),it->first));
            }
        }
        
    }
    const UserSettingsEntry *last=NULL;
    for (it=newValues->begin();it!=newValues->end();it++){
        const UserSettingsEntry *e=GetConfigDescription(it->first);
        if (! e){
            LOG_INFO(wxT("SettingsManager::ChangeSettings: unknown setting %s, ignored"),it->first);
            continue;
        }
        if (checkAndWriteValue(config,e,it->second,last)) hasChanges=true;;
        last=e; 
    }
    if (hasChanges){
        LOG_INFO(wxT("SettingsManager::ChangeSettings settings have changed"));
        {
            //TODO: lock?
            configSequence++;
        }
        StoreBaseSettings(true);
        if (!config->Flush()){
            LOG_ERROR(wxT("SettingsManager::ChangeSettings error storing settings"));
        }
    }
    else{
        LOG_INFO(wxT("SettingsManager::ChangeSettings nothing changed"));
    }
    return SetResult(hasChanges);
}

wxString SettingsManager::GetCurrentAsJson(){
    wxFileInputStream is(configFile);
    if (!is.IsOk()){
        LOG_ERROR(wxT("SettingsManager: unable to reopen config file %s"),configFile);
        return wxString("{\"status\":\"ERROR\",\"info\":\"unable to open cfg\"}");
    }
    wxString rt="{\"status\":\"OK\",\"data\":{\n";
    wxFileConfig localConfig(is);
    UserSettingsList::iterator it;
    wxString lastPath=wxEmptyString;
    for (it=userSettings.begin();it!=userSettings.end();it++){
        bool isFirst=it==userSettings.begin();
        UserSettingsEntry *e=(*it);
        if (lastPath != e->path){
           localConfig.SetPath(e->path);
           lastPath=e->path;
        }
        if (! isFirst){
            rt.Append(",\n");
        }
        if (e->ShouldReadDouble()){
            float ev=0;
            if (!localConfig.HasEntry(e->name)){
                ev=e->GetDoubleDefault();
            }
            else{
                ev=getDoubleVal(&localConfig,e);
            }
            rt.Append(wxString::Format("\"%s\":%f",e->name,ev));
        }
        else{
            int ev=0;
            if (!localConfig.HasEntry(e->name)){
                ev=e->GetIntDefault();
            }
            else{
                ev=getIntVal(&localConfig,e);
            }
            rt.Append(wxString::Format("\"%s\":%d",e->name,ev));
        }  
    }
    rt.append("}\n\n}");
    return rt;
}

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
#ifndef SETTINGSMANAGER_H
#define SETTINGSMANAGER_H
#include "UserSettingsBase.h"
#include "MD5.h"
#include "Types.h"
#include <wx/fileconf.h>




class SettingsManager {
public:
    SettingsManager(wxString configDir,wxString dataDir,wxString exeDir);
    virtual                 ~SettingsManager();
    wxFileConfig            *GetConfig();
    const UserSettingsEntry *GetConfigDescription(wxString name);
    bool                    AddSettingsToMD5(MD5 *md5);
    long                    GetCurrentSequence();
    bool                    StoreBaseSettings(bool sendJson=false);
    typedef enum{
        SET_CHANGE,
        SET_NOCHANGE,
        SET_ERROR        
    } SetResult;
    
    class SetReturn{
    public:
        SetResult state;
        wxString  info;
        SetReturn(bool change=false){
            state=change?SET_CHANGE:SET_NOCHANGE;
        }
        SetReturn(wxString error){
            state=SET_ERROR;
            info=error;
        }
    };
    /**
     * must be called in the main thread
     * afterwards you need to call Update at the chart manager
     * @param newValues
     * @return SET_CHANGE if anything changed (no need to call update at the
     *         chart manager if SET_NOCHANGE is returned)
     */
    SetReturn               ChangeSettings(NameValueMap *newValues);
    typedef enum{
        ENABLED,
        DISABLED,
        UNCONFIGURED        
    } EnabledState;
    EnabledState            IsChartSetEnabled(wxString key);
    bool                    SetChartSetEnabled(wxString key,bool enabled=true,bool remove=false);
    wxString                GetCurrentAsJson();
    double                  GetBaseScale();
    int                     GetOverZoom();
    int                     GetUnderZoom();
    wxString                GetConfigDir(){return configDir;}
private:
    wxString        configDir;
    wxString        dataDir;
    wxString        exeDir;
    wxString        configFile;
    wxFileConfig *  config;
    long            configSequence;
    double          baseScale;
    int             overZoom;
    int             underZoom;
    typedef std::map<wxString,bool> EnabledMap;
    EnabledMap      enabledMap;
   
};

#endif /* SETTINGSMANAGER_H */


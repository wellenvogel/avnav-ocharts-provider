/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Chart Set Info 
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

#ifndef CHARTSETINFO_H
#define CHARTSETINFO_H

#include <wx/wx.h>
#include <wx/fileconf.h>
#include <vector>
#include "ItemStatus.h"

typedef enum {
    SHOW_NEVER,
    SHOW_ONCE,
    SHOW_SESSION    
} ShowMode;
class ChartSetInfo: public ItemStatus{
public:
    ChartSetInfo(){
        name=wxEmptyString;
        eulaMode=SHOW_NEVER;
        chartInfoMode=SHOW_NEVER;
        validTo=wxEmptyString;
        version=wxEmptyString;
        userKey=wxEmptyString;
        infoParsed=false;
    }
    wxString                name;
    ShowMode                eulaMode;
    ShowMode                chartInfoMode;
    wxString                validTo;
    wxString                version;
    std::vector<wxString>   eulaFiles;
    wxString                dirname;
    wxString                title;
    wxString                userKey;
    bool                    infoParsed;
    long                    mtime;
    
    wxString                ToString();
    virtual wxString        ToJson();
    
    static ChartSetInfo     ParseChartInfo(wxString chartDir);
    /**
     * some workaround to inform the plugin that we already had all EULAs seen
     * @param config
     * @param infos
     * @return 
     */
    static bool             WriteEulasToConfig(wxFileConfig *config,std::vector<ChartSetInfo> *infos);
    static wxString         KeyFromChartDir(wxString chartDir);
};

typedef std::vector<ChartSetInfo> ChartSetInfoList;

#endif /* CHARTSETINFO_H */


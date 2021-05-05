/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Chart Set Info handler
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
#include <wx/textfile.h>
#include <vector>
#include <wx/tokenzr.h>
#include <wx/fileconf.h>
#include <wx/regex.h>

#include "ChartSetInfo.h"
#include "Logger.h"
#include "StringHelper.h"


wxString ChartSetInfo::KeyFromChartDir(wxString chartDir){
    wxFileName chartDirName=wxFileName::DirName(chartDir);
    chartDirName.MakeAbsolute();
    return StringHelper::SanitizeString(wxT("CS")+chartDirName.GetPath());
}
ChartSetInfo ChartSetInfo::ParseChartInfo(wxString chartSetDirectory,bool writeEmpty){
    LOG_DEBUG(wxT("parse chart info for %s"),chartSetDirectory);
    ChartSetInfo parsedInfo;
    parsedInfo.dirname=chartSetDirectory;
    wxFileName chartDir=wxFileName::DirName(chartSetDirectory);
    parsedInfo.name=KeyFromChartDir(chartSetDirectory);
    parsedInfo.title=parsedInfo.name;
    if (! wxDirExists(chartDir.GetLongPath())){
        LOG_ERROR(wxT("chart directory %s not found, cannot parse info"),chartSetDirectory);
        return parsedInfo;
    }
    wxFileName infoFileName(chartDir.GetLongPath(),wxT("Chartinfo.txt"));
    if (! infoFileName.FileExists()){
        LOG_ERROR(wxT("no chart info file %s found"),infoFileName.GetFullPath());
        if (writeEmpty){
            LOG_INFO("writing empty chart info %s",infoFileName.GetFullPath());
            wxFile infoFile(infoFileName.GetFullPath(),wxFile::write);
            infoFile.Write(wxString("Empty\n"));
            infoFile.Close();
        }
        return parsedInfo;
    }
    parsedInfo.mtime=infoFileName.GetModificationTime().GetTicks();
    wxTextFile infoFile(infoFileName.GetFullPath());
    if( infoFile.Open() ){
        wxString line = infoFile.GetFirstLine();
        while( !infoFile.Eof() ){
            //oesencEULAFile:EN_rrc_eula_ChartSetsForOpenCPN.html
            if(line.StartsWith( _T("oesencEULAFile:" ) ) || line.StartsWith( _T("ochartsEULAFile:" ) ) ) {
                wxString eulaFile = line.AfterFirst(':').Trim(false);
                parsedInfo.eulaFiles.push_back(eulaFile);
            }
            //oesencEULAShow:once
            else if(line.StartsWith( _T("oesencEULAShow:" ) ) || line.StartsWith( _T("ochartsEULAShow:" ) ) ) {
                wxString eulaMode = line.AfterFirst(':').Trim(false).Trim();
                if (eulaMode.Upper().Find((wxT("ONCE"))) != wxNOT_FOUND) 
                    parsedInfo.eulaMode=SHOW_ONCE;
                else if (eulaMode.Upper().Find((wxT("ALWAYS"))) != wxNOT_FOUND) 
                    parsedInfo.eulaMode=SHOW_SESSION;
                LOG_INFO(wxT("eula mode for %s is %s:%d"),
                        chartSetDirectory,eulaMode,(int)parsedInfo.eulaMode);
            }
            //ChartInfo:Deutsche Gewässer 2020;2020-13;2021-03-28
            else if(line.StartsWith( _T("ChartInfo:" ) ) ) {
                    wxString content = line.AfterFirst(':');
                    wxStringTokenizer tokenizer(content,";");
                    int num=0;
                    while(tokenizer.HasMoreTokens() && num <=2){
                        switch(num){
                            case 0:
                                parsedInfo.title=tokenizer.GetNextToken();
                                break;
                            case 1:
                                parsedInfo.version=tokenizer.GetNextToken();
                                break;
                            case 2:
                                parsedInfo.validTo=tokenizer.GetNextToken();
                                break;
                                
                        }
                        num++;
                    }
                            
            }
            //ChartInfoShow:Session
            else if(line.StartsWith( _T("ChartInfoShow:" ))){
                wxString mode = line.AfterFirst(':');
                if (mode.Upper().Find((wxT("ONCE"))) != wxNOT_FOUND) 
                    parsedInfo.chartInfoMode=SHOW_ONCE;
                else if (mode.Upper().Find((wxT("SESSION"))) != wxNOT_FOUND) 
                    parsedInfo.chartInfoMode=SHOW_SESSION;
                LOG_INFO(wxT("info mode for %s is %s:%d"),
                        chartSetDirectory,mode,(int)parsedInfo.chartInfoMode);
                
            }
            //UserKey:xxxxxx
            else if (line.StartsWith("UserKey:")){
                parsedInfo.userKey=line.AfterFirst(':').Trim().Trim(true);
            }
            line=infoFile.GetNextLine();
        }
        infoFile.Close();
    }
    else{
        LOG_ERROR(wxT("unable to open chartinfo in %s for reading"),chartSetDirectory);
    }
    parsedInfo.infoParsed=true;
    if (parsedInfo.eulaMode != SHOW_NEVER && parsedInfo.eulaFiles.size() <1){
        LOG_ERROR(wxT("eula required for %s but no eula files"),chartSetDirectory);
        parsedInfo.eulaMode =SHOW_NEVER;
    }
    if (parsedInfo.title == wxEmptyString || parsedInfo.title.IsEmpty()){
        parsedInfo.title=parsedInfo.name;
    }
    LOG_INFO(wxT("%s"),parsedInfo.ToString());
    return parsedInfo;
}

bool ChartSetInfo::WriteEulasToConfig(wxFileConfig* config, ChartSetInfoList* infos){
    LOG_INFO(wxT("ChartSetInfo:WriteEulasToConfig"));
    ChartSetInfoList::iterator it;
    //see saveConfig in oesenc_pi.cpp
    //and processChartInfo
    StringVector eulaPathes{"/PlugIns/oesenc/EULA","/PlugIns/ocharts/EULA"};
    StringVector::iterator pathIt;
    for (pathIt = eulaPathes.begin(); pathIt != eulaPathes.end(); pathIt++) {
        config->DeleteGroup(*pathIt);
        config->SetPath(*pathIt);
        int i = 0;
        for (it = infos->begin(); it != infos->end(); it++) {
            wxString val("never");
            val.Append(";1;"); //always shown
            std::vector<wxString>::iterator fi;
            wxString baseName = it->dirname + wxFileName::GetPathSeparator();
            baseName.Replace(wxFileName::GetPathSeparator(), '!');
            for (fi = it->eulaFiles.begin(); fi != it->eulaFiles.end(); fi++) {
                wxString fileName = baseName + (*fi);
                fileName.Replace(wxFileName::GetPathSeparator(), '!');
                wxString key = wxString::Format(wxT("EULA_%02d"), i);
                wxString cfgValue = val + fileName;
                LOG_DEBUG(wxT("Write EULA entry %s=%s"), key, cfgValue);
                config->Write(key, cfgValue);
                i++;
            }
            //write an empty entry - potentially a file has not been found
            wxString key = wxString::Format(wxT("EULA_%02d"), i);
            wxString cfgValue = val + baseName;
            LOG_DEBUG(wxT("Write EULA entry %s=%s"), key, cfgValue);
            config->Write(key, cfgValue);
            i++;

        }
    }
    config->Flush();
    return true;
}



wxString ChartSetInfo::ToString(){
    return wxString::Format(wxT("Chart Set: parsed=%s,dir=%s, name=%s, title=%s, from=%s, to=%s, eulaMode=%d, infoMode=%d, numEula=%d"),
            (infoParsed?"true":"false"),
            dirname,
            name,
            title,
            version,
            validTo,
            (int)eulaMode,
            (int)chartInfoMode,
            (int)eulaFiles.size()
            );
}
wxString ChartSetInfo::ToJson(){
    wxString rt=wxString::Format("{"
            JSON_SV(name,%s) ",\n"
            JSON_SV(directory,%s) ",\n"
            JSON_SV(version,%s) ",\n"
            JSON_SV(validTo,%s) ",\n"
            JSON_SV(title,%s) "\n"
            "}",
            name,
            StringHelper::safeJsonString(dirname),
            StringHelper::safeJsonString(version),
            StringHelper::safeJsonString(validTo),
            StringHelper::safeJsonString(title));
    return rt;
}
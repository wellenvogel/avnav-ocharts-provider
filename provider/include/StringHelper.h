/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  String Helper
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

#ifndef STRINGHELPER_H
#define STRINGHELPER_H

#include <wx/string.h>
#include <wx/regex.h>
#include <vector>


#define JSON_SV(name,value) "\"" #name "\":\"" #value "\""
#define JSON_IV(name,value) "\"" #name "\":" #value 
#define PF_BOOL(val) (val?"true":"false")


typedef std::vector<wxString> StringVector;

class StringHelper{
public:
    static wxString safeJsonString(wxString in){
        wxString rt=in.Clone();
        rt.Replace("\"","\\\"",true);
        return rt;
        }
    static wxString         SanitizeString(wxString input){        
        wxRegEx allowed("[^a-zA-Z0-9.,_\\-]");
        wxString rt(input);
        allowed.ReplaceAll(&rt,wxT("_"));
        return rt;
    }

};


#endif /* STRINGHELPER_H */


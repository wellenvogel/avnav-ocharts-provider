/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Color table
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
#ifndef COLORTABLE_H
#define COLORTABLE_H
#include <map>
#include <wx/wx.h>
#include <wx/xml/xml.h>
typedef std::map<wxString,wxColor> ColorTable;
typedef std::map<wxString,ColorTable> ColorMap;

class ColorTableReader{
    ColorTable  defaultTable;
    ColorMap    colorMap;
    wxString    s57Dir;
    int         entries;
    void parseColorTable(wxXmlNode *table);
    void parseColorTables(wxXmlNode *node);
public:
    ColorTableReader(wxString s57dir);
    int ReadColors();
    ColorTable GetTable(wxString name,bool useDefaults);
};



#endif /* COLORTABLE_H */


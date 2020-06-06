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
#include <wx/filename.h>
#include "ColorTable.h"
#include "Logger.h"

void ColorTableReader::parseColorTable(wxXmlNode *table) {
    wxString tableName = table->GetAttribute("name", wxEmptyString);
    if (tableName == wxEmptyString) {
        LOG_ERROR(wxT("ColorTable: found color table without name in line %d"), table->GetLineNumber());
        return;
    }
    LOG_INFO(wxT("ColorTable: parse table %s from line %d"), tableName, table->GetLineNumber());
    ColorTable colorTable;
    wxXmlNode *colorEntry = table->GetChildren();
    while (colorEntry != NULL) {
        if (colorEntry->GetName() == "color") {
            wxString name = colorEntry->GetAttribute("name", wxEmptyString);
            if (name == wxEmptyString) {
                LOG_ERROR(wxT("ColorTable: entry in line %d without name"),
                        colorEntry->GetLineNumber());
                colorEntry = colorEntry->GetNext();
                continue;
            }
            wxString r = colorEntry->GetAttribute("r", wxEmptyString);
            wxString g = colorEntry->GetAttribute("g", wxEmptyString);
            wxString b = colorEntry->GetAttribute("b", wxEmptyString);
            if (r == wxEmptyString || g == wxEmptyString || b == wxEmptyString) {
                LOG_ERROR(wxT("ColorTable: entry in line %d with incomplete colors"),
                        colorEntry->GetLineNumber());
                colorEntry = colorEntry->GetNext();
                continue;
            }
            int rv = std::atoi(r);
            int bv = std::atoi(b);
            int gv = std::atoi(g);
            if (rv < 0 || rv > 255 || gv < 0 || gv > 255 || bv < 0 || bv > 255) {
                LOG_ERROR(wxT("ColorTable: entry in line %d with invalid colors"),
                        colorEntry->GetLineNumber());
                colorEntry = colorEntry->GetNext();
                continue;
            }
            wxColor c;
            c.Set(rv, gv, bv);
            colorTable[name] = c;
            entries++;
        }
        colorEntry = colorEntry->GetNext();
    }
    if (colorTable.size() > 0) {
        LOG_INFO(wxT("ColorTable: inserting table for %s with %d entries"), tableName, (int) colorTable.size());
        colorMap[tableName] = colorTable;
    } else {
        LOG_ERROR(wxT("ColorTable: skipping colorTable %s as it has no entries"), tableName);
    }
}

void ColorTableReader::parseColorTables(wxXmlNode *node) {
    wxXmlNode *table = node->GetChildren();
    while (table != NULL) {
        if (table->GetName() == "color-table") {
            parseColorTable(table);
        }
        table = table->GetNext();
    }
}

ColorTableReader::ColorTableReader(wxString s57dir) {
    this->s57Dir = s57dir;
    entries = 0;
    defaultTable["NODTA"] = wxColor(163, 180, 183);
    defaultTable["SNDG1"] = wxColor(125, 137, 140);
    defaultTable["SNDG2"] = wxColor(7, 7, 7);
}

int ColorTableReader::ReadColors() {
    colorMap.clear();
    entries = 0;
    wxString fileName = s57Dir + wxFileName::GetPathSeparators() + "chartsymbols.xml";
    if (!wxFileExists(fileName)) {
        LOG_ERRORC(wxT("ColorTable: file %s not found"), fileName);
        return -1;
    }
    wxXmlDocument doc;
    if (!doc.Load(fileName)) {
        LOG_ERRORC(wxT("ColorTable: unable to parse %s"), fileName);
        return -1;
    }
    wxXmlNode *node = doc.GetRoot()->GetChildren();

    while (node != NULL) {
        if (node->GetName() == "color-tables") {
            parseColorTables(node);
        }
        node = node->GetNext();
    }
    return entries;
}

ColorTable ColorTableReader::GetTable(wxString name, bool useDefaults) {
    ColorMap::iterator it = colorMap.find(name);
    if (it != colorMap.end()) return it->second;
    if (useDefaults) return defaultTable;
    ColorTable empty;
    return empty;
}

/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Chart Info
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

#ifndef USERSETTINGSBASE_H
#define USERSETTINGSBASE_H
#include <wx/wx.h>
#include <vector>

class UserSettingsEntry{
protected:
    UserSettingsEntry(){};
public:
    typedef enum{
        TYPE_BOOL,
        TYPE_ENUM,
        TYPE_FLOAT,
        TYPE_INT,        
        TYPE_DEPTH,
        TYPE_COLORMODE,
        TYPE_FONT        
    } SettingsType;
    wxString            category;
    wxString            name;
    wxString            path;
    SettingsType        type;
    wxString            title;
    int                 defaultint;
    double              defaultdouble;
    
    int GetIntDefault() const{
        return ShouldReadDouble()?defaultdouble:defaultint;
    }
    double GetDoubleDefault()const {
        return ShouldReadDouble()?defaultdouble:defaultint;
    }
    virtual bool ShouldReadDouble() const=0;
    virtual bool CheckValue (int value)const {return false;}
    virtual bool CheckValue (double value)const{return false;}
};

class UserSettingsEntryInt : public UserSettingsEntry{
public:
    int min;
    int max;
    UserSettingsEntryInt(wxString category,wxString path,wxString name,SettingsType type,int defaultv,wxString title,int min, int max){
        this->name=name;
        this->category=category;
        this->path=path;
        this->type=type;
        this->title=title;
        this->defaultint=defaultv;
        this->min=min;
        this->max=max;
    }
    virtual bool CheckValue (int val)const{
        if (val >= min && val <= max) return true;
        return false;
    }
    virtual bool ShouldReadDouble() const{
        return false;
    }
    
};

class UserSettingsEntryBool : public UserSettingsEntry{
public:
    UserSettingsEntryBool(wxString category,wxString path,wxString name,SettingsType type,int defaultv,wxString title){
        this->name=name;
        this->category=category;
        this->path=path;
        this->type=type;
        this->title=title;
        this->defaultint=defaultv;
    }
    virtual bool CheckValue(int val)const{
        if (val == 0 || val == 1 ) return true;
        return false;
    }
    virtual bool ShouldReadDouble() const{
        return false;
    }
    
};

class UserSettingsEntryDouble : public UserSettingsEntry{
public:
    double min;
    double max;
    UserSettingsEntryDouble(wxString category,wxString path,wxString name,SettingsType type,double defaultv,wxString title,double min, double max){
        this->name=name;
        this->category=category;
        this->path=path;
        this->type=type;
        this->title=title;
        this->defaultdouble=defaultv;
        this->min=min;
        this->max=max;
    }
    virtual bool CheckValue(double val)const{
        if (val >= min && val <= max) return true;
        return false;
    }
    virtual bool ShouldReadDouble() const{
        return true;
    }
    
};
class UserSettingsEntryEnum : public UserSettingsEntry{
public:
    
    typedef std::vector<int> Values;
    Values   values;
    wxString choices;
    UserSettingsEntryEnum(wxString category,wxString path,wxString name,SettingsType type,int defaultv,wxString title,Values values, wxString choices){
        this->name=name;
        this->category=category;
        this->path=path;
        this->type=type;
        this->title=title;
        this->choices=choices;
        this->defaultint=defaultv;
        this->values=values;
    }
    virtual bool CheckValue(int val)const{
        Values::const_iterator it;
        for (it=values.begin();it!= values.end();it++){
            if ((*it) == val) return true;
        }
        return false;
    }
    virtual bool ShouldReadDouble() const{
        return false;
    }
    
};

typedef std::vector<UserSettingsEntry*> UserSettingsList;


#endif /* USERSETTINGSBASE_H */


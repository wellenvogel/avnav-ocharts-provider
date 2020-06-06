/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Status Collector
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

#include <wx/string.h>

#include "StatusCollector.h"
#include <unordered_set>

typedef std::unordered_set<ItemStatus*> HolderItems;

class StatusCollector::ItemHolder : public ItemStatus{
private:
    HolderItems items;
    bool        alwaysArray=false;
public:
    ItemHolder(ItemStatus *item,bool alwaysArray=false){
        items.insert(item);
        this->alwaysArray=alwaysArray;
    }
    virtual wxString ToJson(){
        if (items.size() < 1) return alwaysArray?wxT("[]"):wxT("{}");
        if (items.size() == 1 && ! alwaysArray){
            return (*(items.begin()))->ToJson();
        }
        wxString rt=wxT("[");
        HolderItems::iterator it;
        for (it=items.begin();it!=items.end();it++){
            if (it != items.begin()) rt.Append(',');
            rt.append((*it)->ToJson());
            rt.Append("\n");
        }
        rt.Append("]\n");
        return rt;
    }
    void AddItem(ItemStatus *item){
        items.insert(item);
    }
    void RemoveItem(ItemStatus *item){
        items.erase(item);
    }
    bool Empty(){
        return items.size() < 1;
    }
};

StatusCollector::StatusCollector() {
}

wxString StatusCollector::ToJson() {
    Synchronized locker(lock);
    wxString newStatus="{\n";
    wxString local=LocalJson();
    if (local != wxEmptyString && local != wxT("")){
        newStatus.Append(local);
        if (items.size()>0) newStatus.Append(',');
        newStatus.Append("\n");
    }
    StatusItems::iterator it;
    for (it=items.begin();it!=items.end();it++){
        if (it != items.begin()) newStatus.Append(",\n");
        newStatus.Append('"').append(it->first).Append('"').Append(":");
        newStatus.Append(it->second->ToJson());
        newStatus.Append("\n");
    }
    newStatus.Append("}\n");
    return newStatus;
}
void StatusCollector::AddItem(wxString name,ItemStatus* item,bool array){
    Synchronized locker(lock);
    StatusItems::iterator it=items.find(name);
    if (it == items.end()){
        items[name]=new ItemHolder(item,array);
    }
    else{
        it->second->AddItem(item);
    }
}
void StatusCollector::RemoveItem(wxString name,ItemStatus *item){
    Synchronized locker(lock);
    if (item == NULL){
        items.erase(name);
    }
    else{
        StatusItems::iterator it=items.find(name);
        if (it != items.end()){
            it->second->RemoveItem(item);
            if (it->second->Empty()) items.erase(it);
        }
    }
}

StatusCollector::~StatusCollector() {
    StatusItems::iterator it;
    for (it=items.begin();it!=items.end();it++){
        delete it->second;
    }
}


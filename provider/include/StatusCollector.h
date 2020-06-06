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

#ifndef STATUSCOLLECTOR_H
#define STATUSCOLLECTOR_H
#include "ItemStatus.h"
#include "SimpleThread.h"
#include <map>
#include <wx/string.h>

class StatusCollector :public ItemStatus{
public:
    StatusCollector();
    virtual             ~StatusCollector();
    virtual wxString    ToJson();
    void                AddItem(wxString name,ItemStatus *item,bool array=false);
    void                RemoveItem(wxString name,ItemStatus *item=NULL);
private:
    class   ItemHolder;
    typedef std::map<wxString,ItemHolder*>     StatusItems;
    StatusItems         items;    
    std::mutex          lock;   
protected:
    /**
     * get the local status objects WITHOUT {}
     * @return 
     */
    
    virtual wxString    LocalJson(){return wxT("");}
        

};

#endif /* STATUSCOLLECTOR_H */


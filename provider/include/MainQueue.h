/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Main Queue
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
#ifndef MAINQUEUE_H
#define MAINQUEUE_H
#include <wx/wx.h>
#include "RefCount.h"
#include "RequestQueue.h"
#include <mutex>
class MainMessage: public RefCount{
public:
    MainMessage();
    virtual void    Process(bool discard=false)=0;
    virtual void    SetDone();
    bool            WaitForResult(long timeout=0);
protected:
    virtual         ~MainMessage();
    std::mutex      lock;
    Condition       *waiter;
    bool            isDone;    
};


class MainQueue {
public:
    MainQueue();
    void        Loop(wxApp * app);
    void        Stop();
    virtual     ~MainQueue();
    bool        Enqueue(MainMessage *msg,long timeout,bool onlyIfEmpty=false);
private:
    typedef RequestQueue<MainMessage> Queue;
    Queue   queue;
    bool    shouldStop;
};

#endif /* MAINQUEUE_H */


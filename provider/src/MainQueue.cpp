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

#include "MainQueue.h"
#include "Logger.h"

MainMessage::MainMessage():RefCount(){
    waiter=new Condition(lock);
    isDone=false;
}

void MainMessage::SetDone(){
    Synchronized locker(lock);
    isDone=true;
    waiter->notifyAll(locker);
}

bool MainMessage::WaitForResult(long timeout){
    wxLongLong start = wxGetLocalTimeMillis();
    while (true) {
        Synchronized locker(lock);
        if (isDone) {
            return true;
        }
        wxLongLong nextTimeout = 100;
        if (timeout > 0) {
            wxLongLong now = wxGetLocalTimeMillis();
            if (now > (start + timeout)) {
                LOG_DEBUG(_T("timeout waiting for MessageResult"));
                return false;
            }
            if ((now + nextTimeout) > (start + timeout)) nextTimeout =(start + timeout - now);
        }
        waiter->wait(locker,nextTimeout.ToLong());
    }
}

MainMessage::~MainMessage(){
    delete waiter;
}

MainQueue::MainQueue() {
    shouldStop=false;
}

void MainQueue::Loop(wxApp* app) {
    LOG_INFO(wxT("MainQueue::Loop started"));
    MainMessage *msg=NULL;
    while(! shouldStop){
        msg=queue.Dequeue(100);
        if (msg != NULL){
            msg->Process();
            msg->Unref();
        }
        app->Yield(true);
    }
    while (( msg = queue.Dequeue(1))!= NULL) {
        msg->Process(true);
        msg->Unref();
    }
    LOG_INFOC(wxT("MainLoop finished"));
}

bool MainQueue::Enqueue(MainMessage* msg,long timeout,bool onlyIfEmpty){
    if (shouldStop) return false;
    msg->Ref();
    bool rt=queue.Enqueue(msg,timeout,onlyIfEmpty);
    if (! rt) msg->Unref();
    return rt;
}

void MainQueue::Stop(){
    LOG_INFO(wxT("MainQueue::Stop"));
    shouldStop=true;
}


MainQueue::~MainQueue() {
    //TODO: empty queue?
}


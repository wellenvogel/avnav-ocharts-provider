/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  HTTP request queue
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

#ifndef REQUESTQUEUE_H
#define REQUESTQUEUE_H
#include <wx/time.h>
#include <wx/longlong.h>
#include <deque>
#include "Logger.h"
#include "SimpleThread.h"

template <class T> class RequestQueue{
    std::deque<T*>     queue;
    std::mutex    readLock;
    Condition *   readCondition=NULL;
    std::mutex    writeLock;
    Condition *   writeCondition=NULL;
    unsigned int  maxSize;
    bool          finish;
public:
    /**
     * if maxSize=0 : no size limits, no wait on write
     * @param maxSize
     */
    RequestQueue(unsigned int maxSize=0){
        this->maxSize=maxSize;
        readCondition=new Condition(readLock);
        if (maxSize > 0){
            writeCondition=new Condition(writeLock);
        }
        finish=false;
    }
    ~RequestQueue(){
        delete readCondition;
        if (writeCondition != NULL) delete writeCondition;
    }
    /**
     * enqueue the message, it queue is full wait at most timeout
     * @param message the message (consumed it returned true)
     * @param timeout the timeout in ms, 0 for no timeout
     * @param onlyIfEmpty - enqueue the message only if the queue is empty
     *                      if the queue size is 0 this will check in short intervals
     *                      of 10ms as there is no input notification
     * @return true if enqueued (message consumed)
     */
    bool Enqueue(T *message,long timeout,bool onlyIfEmpty=false);
    T *  Dequeue(long timeout);
    void WakeAll();
};


template <class T> bool RequestQueue<T>::Enqueue(T *message,long timeout,bool onlyIfEmpty){
    wxLongLong start = wxGetLocalTimeMillis();
    wxLongLong current = start;
    wxLongLong end=start+timeout;
    //loop until timeout (or if time shift backwards...)
    while (((current >= start && current < end) || (timeout == 0)) && ! finish)
    {
        {
            Synchronized locker(readLock);
            if ( onlyIfEmpty){
                if (queue.size() == 0){
                    queue.push_back(message);
                    readCondition->notifyAll(locker);
                    return true;
                }
            }
            else{
                if (queue.size() < maxSize || maxSize <= 0){
                    queue.push_back(message);
                    readCondition->notifyAll(locker);
                    return true;
                }
            }
        }
        if (maxSize <= 0) {
            if (onlyIfEmpty){
                wxMicroSleep(10000);
                current=wxGetLocalTimeMillis();
                continue;
            }
            return false; //should not happen...
        }
        {
            Synchronized locker(writeLock);
            wxLongLong nextTimeout=100;
            if (timeout != 0 && (end-current) < 100) nextTimeout=end-current;
            if (nextTimeout < 0) return false; //unable to enqueue
            writeCondition->wait(locker,nextTimeout.ToLong());
        }
        current=wxGetLocalTimeMillis();
        
    }
    return false;   
}
template <class T> T *  RequestQueue<T>::Dequeue(long timeout){
    wxLongLong start = wxGetLocalTimeMillis();
    wxLongLong current = start;
    wxLongLong end=start+timeout;
    //loop until timeout (or if time shift backwards...)
    T *rt=NULL;
    while (current >= start && current < end && ! finish)
    {
        {
            Synchronized locker(readLock);
            if (queue.size() > 0){
                rt=queue.front();
                queue.pop_front();
                LOG_DEBUG(wxT("dequeue with len %ld"),queue.size());
                break;
            }
            wxLongLong nextTimeout=100;
            if (timeout != 0 && (end-current) < 100) nextTimeout=end-current;
            if (nextTimeout < 0) break; //unable to dequeue
            readCondition->wait(locker,nextTimeout.ToLong());
        }
        current=wxGetLocalTimeMillis();
        
    }
    if (! finish && maxSize > 0){
        //we should in any case notify the writer to continue
        writeCondition->notifyAll();
    }
    return rt;   
}

template <class T> void RequestQueue<T>::WakeAll(){
    finish=true;
    readCondition->notifyAll();
    if (maxSize > 0){
        writeCondition->notifyAll();
    }
    
}


#endif /* REQUESTQUEUE_H */


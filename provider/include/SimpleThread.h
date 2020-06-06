/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Object oriented Threading using std::thread
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

#ifndef SIMPLETHREAD_H
#define SIMPLETHREAD_H
#include <thread>
#include <mutex>
#include <condition_variable>
#include "ItemStatus.h"
//simple automatic unlocking mutex
typedef std::unique_lock<std::mutex> Synchronized;

//simple condition variable that encapsulates the monitor
//you need to ensure that the monitor life cycle fits
//to the condition life cycle
class Condition{
private:
    std::mutex *mutex;
    std::condition_variable cond;
    bool ownsMutex=false;
public:
    Condition(std::mutex &m){
        mutex=&m;
    }
    Condition(){
        mutex=new std::mutex();
        ownsMutex=true;
    }
    ~Condition(){
        if (ownsMutex) delete mutex;
    }
    void wait(){
        Synchronized l(*mutex);
        cond.wait(l);
    };
    void wait(long millis){
        Synchronized l(*mutex);
        cond.wait_for(l,std::chrono::milliseconds(millis));
    }
    void wait(Synchronized &s){
        cond.wait(s);
    }
    void wait(Synchronized &s,long millis){
        cond.wait_for(s,std::chrono::milliseconds(millis));
    }
    void notify(){
        Synchronized g(*mutex);
        cond.notify_one();
    }
    void notify(Synchronized &s){
        cond.notify_one();
    }
    void notifyAll(){
        Synchronized g(*mutex);
        cond.notify_all();
    }
    void notifyAll(Synchronized &s){
        cond.notify_all();
    }
};

//java like runnable interface
class Runnable : public ItemStatus{
protected:
    bool finish=false;
public:
    virtual void run()=0;
    virtual ~Runnable(){}
    virtual void stop(){finish=true;}
    virtual wxString ToJson(){return wxT("{}");}
};

/**
 * simple thread class
 * allows for 2 models:
 * either inheriting
 * or     using a separate runnable
 */

class Thread : public ItemStatus{
private:
    Runnable *runnable;
    std::thread *mthread=NULL;
    std::mutex  lock;
    Condition   *waiter=NULL;
    bool finish;
protected:
    virtual void run(){
        runnable->run();
    }
    bool shouldStop(){
        return finish;
    }
public:
    /**
     * ctor for overloading
     */
    Thread(){
        runnable=NULL;
        finish=false;
        waiter=new Condition(lock);
    }
    /**
     * ctor for using a runnable
     * @param runnable will not be owned, i.e. not destroyed
     */
    Thread(Runnable *runnable){
        this->runnable=runnable;
        finish=false;
    };
    ~Thread(){
        if (mthread) delete mthread;
        if (waiter) delete waiter;
    }
    void start(){
        if (mthread) return;
        mthread=new std::thread([this]{this->run();});
    }
    
    void stop(){
        finish=true;
        if(waiter != NULL) waiter->notifyAll();
        if (runnable) runnable->stop();
    }
    void join(){
        if (! mthread) return;
        if (! mthread ->joinable()) return;
        mthread->join();
        delete mthread;
        mthread=NULL;
    };
    
    void detach(){
        if (!mthread) return;
        mthread->detach();
    }
    
    bool waitMillis(long millis){
        if (finish) return true;
        waiter->wait(millis);
        return finish;
    }
    
    Runnable * getRunnable(){
        return runnable;
    }
    virtual wxString ToJson(){
        if (runnable != NULL) return runnable->ToJson();
        return wxT("{}");
    }
};


#endif /* SIMPLETHREAD_H */


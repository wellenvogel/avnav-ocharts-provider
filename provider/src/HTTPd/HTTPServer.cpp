/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  HTTP server
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
#include "HTTPServer.h"
#include "Logger.h"
#include "Worker.h"
#include "SocketHelper.h"



RequestHandler *HandlerMap::GetHandler(wxString url)
{
    LOG_DEBUG(wxT("HTTPd::GetHandler(%s)"),url);
    HandlerList::iterator it;
    wxString baseName;
    for (it=handlers.begin();it<handlers.end();it++){
        wxString prfx=(*it)->GetUrlPattern();
        if (prfx == url){
            return *it;
        }
        if (prfx.EndsWith(_T("*"),&baseName)){
            if (url.StartsWith(baseName)){
                return *it;
            }
        }
    }
    return NULL;
}

HandlerMap::~HandlerMap(){}
HandlerMap::HandlerMap(){ }

void HandlerMap::AddHandler(RequestHandler* handler){
    handlers.push_back(handler);
}


class InterfaceListProvider: public Thread{
private:
    SocketHelper::IfAddressList interfaces;
    std::mutex                  lock;
    long                        loopMs;
public:
    InterfaceListProvider(long loopMs=3000): Thread(){
        this->loopMs=loopMs;
    }
    virtual ~InterfaceListProvider(){
       
    }
    virtual void run(){
        while (! shouldStop()){
            SocketHelper::IfAddressList newInterfaces=SocketHelper::GetNetworkInterfaces();
            {
                Synchronized locker(lock);
                interfaces=newInterfaces;
            }
            LOG_DEBUG(wxT("InterfaceListProvider: fetched %ld interface addresses"),
                newInterfaces.size());
            SocketHelper::IfAddressList::iterator it;
            for (it=newInterfaces.begin();it!=newInterfaces.end();it++){
                LOG_DEBUG(wxT("InterfaceListProvider: interface %s, mask %s"),
                        SocketHelper::GetAddress(it->base),
                        SocketHelper::GetAddress(it->netmask));
            }
            waitMillis(loopMs);
        }
    }
    bool IsLocalNet(SocketAddress *other){
        Synchronized locker(lock);
        SocketHelper::IfAddressList::iterator it;
        for (it=interfaces.begin();it != interfaces.end();it++){
            if ((*it).IsInNet(other)) return true;
        }
        return false;
    }
};



HTTPServer::HTTPServer(int port,int numThreads) {
    this->port=port;
    this->numThreads=numThreads;
    this->started=false;
    this->acceptCondition=new Condition(acceptMutex);
    this->acceptBusy=false;
    this->handlers=new HandlerMap();
    this->interfaceLister=new InterfaceListProvider();
}

HTTPServer::~HTTPServer() {
    if (started) {
        Stop();        
        delete interfaceLister;
        interfaceLister=NULL;
    }
    delete this->acceptCondition;
}

bool HTTPServer::Start(){
    if (started) return false;
    LOG_INFO(wxT("HTTPServer start"));
    interfaceLister->start();
    listener=SocketHelper::CreateAndBind(NULL,port);
    if (listener < 0) return false;
    for (int i=0;i<numThreads;i++){
        Worker *w=new Worker(this,handlers);
        w->start();
        workers.push_back(w);
    }
    
    LOG_INFO(wxT("HTTP Server starting at port %d listening with fd %d"), port,listener);
    int rt=SocketHelper::Listen(listener);
    if (rt < 0){
        close(listener);
        return false;
        LOG_ERROR(wxT("unable to listen at port %d"),port);
    }
    SocketHelper::SetNonBlocking(listener);
    started=true;
    return true;
}
void HTTPServer::Stop(){
    if (!started) return;
    LOG_INFO(wxT("stopping HTTP server"));
    WorkerList::iterator it;
    for (it=workers.begin();it<workers.end();it++){
        (*it)->stop();
    }
    started=false;
    close(listener);
    acceptCondition->notifyAll();
    for (it=workers.begin();it<workers.end();it++){
        (*it)->join();
        delete *(it);
    }
    interfaceLister->stop();
    interfaceLister->join();
    LOG_INFO(wxT("HTTP server stopped"));
}
void HTTPServer::AddHandler(RequestHandler * handler){
    handlers->AddHandler(handler);
}

int HTTPServer::Accept(){
    bool canAccept=false;
    while (! canAccept && started){
        {
            Synchronized x(acceptMutex);
            canAccept=!acceptBusy;
            if (canAccept) acceptBusy=true;
        }
        if (canAccept){
            int socket=SocketHelper::Accept(listener,500);
            {
                Synchronized x(acceptMutex);
                acceptBusy=false;
                acceptCondition->notifyAll(x);
            }
            if (socket >= 0){
                SocketAddress peer=SocketHelper::GetRemoteAddress(socket);
                if (! interfaceLister->IsLocalNet(&peer)){
                    LOG_DEBUG(wxT("discard request from %s, no local net"),
                            SocketHelper::GetAddress(peer));
                    socket=-1;
                }
            }
            return socket;
        }
        if (! started){
            return -1;
        }
        acceptCondition->wait(1000);
    }
    return -1;
}
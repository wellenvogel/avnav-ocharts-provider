/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Settings Request Handler
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
#ifndef SETTINGSREQUESTHANDLER_
#define SETTINGSREQUESTHANDLER_
#include "RequestHandler.h"
#include "Logger.h"
#include "ChartManager.h"
#include "MainQueue.h"
#include <vector>
#include <wx/wx.h>
#include "StringHelper.h"

class FPRFileProvider{
public:
    class Result{
    public:
        bool        status=false;
        wxString    fileName=wxEmptyString;
        wxString    error=wxEmptyString;
        bool        hasError=false;
    };
    virtual Result createFile(bool forDongle=false)=0;
};

class SettingsMessage : public MainMessage{
public:
    ChartManager                *manager;
    NameValueMap                changes;
    SettingsManager::SetReturn  status=SettingsManager::SetReturn(wxT("timeout"));
    SettingsMessage(ChartManager *manager,NameValueMap changes): MainMessage(){
        this->manager=manager;
        this->changes=changes;
    }
    virtual ~SettingsMessage(){};
    virtual void Process(bool discard=false){
        if (discard){
            SetDone();
            return;
        }
        LOG_INFO(wxT("SettingsMessage::Process"));
        status=manager->GetSettings()->ChangeSettings(&changes);
        if (status.state == SettingsManager::SET_CHANGE){
            LOG_INFO(wxT("SettingsMessage update charts"));
            manager->UpdateSettings();
        }
        LOG_INFO(wxT("SettingsMessage done"));
        SetDone();
    }
        
};

class FPRMessage : public MainMessage{
public:
    ChartManager                *manager;
    bool                        forDongle;
    FPRFileProvider             *provider=NULL;
    FPRFileProvider::Result     result;
    FPRMessage(ChartManager *manager,FPRFileProvider *provider,bool forDongle): MainMessage(){
        this->manager=manager;
        this->provider=provider;
        this->forDongle=forDongle;
    }
    virtual ~FPRMessage(){};
    virtual void Process(bool discard=false){
        if (discard){
            SetDone();
            return;
        }
        LOG_INFO(wxT("FPRMessage::Process"));
        result=provider->createFile(forDongle);
        LOG_INFO(wxT("FPRMessage done"));
        SetDone();
    }
        
};

class EnableMessage : public MainMessage{
public:
    ChartManager                *manager;
    bool                        enable;
    wxString                    key;
    bool                        result;
    bool                        ok;
    EnableMessage(ChartManager *manager,wxString key,bool enable): MainMessage(){
        this->manager=manager;
        this->key=key;
        this->enable=enable;
        this->result=false;
        this->ok=false;
    }
    virtual ~EnableMessage(){};
    virtual void Process(bool discard=false){
        if (discard){
            SetDone();
            return;
        }
        LOG_INFO(wxT("EnableMessage::Process"));
        result=manager->EnableChartSet(key,enable);
        ok=true;
        LOG_INFO(wxT("EnableMessage done"));
        SetDone();
    }
        
};


class SettingsRequestHandler : public RequestHandler {
public:
    const wxString URL_PREFIX=wxT("/settings");
    const long     MAX_FPR=10000; //far too big...
private:
    const wxString  JSON=wxT("application/json");  
    ChartManager    *manager;
    MainQueue       *queue;
    FPRFileProvider *fprProvider;
    
public:
    /**
     * create a request handler
     * @param chartList
     * @param name url compatible name
     */
    SettingsRequestHandler(ChartManager *manager,MainQueue *queue,FPRFileProvider *provider){
        this->manager=manager;
        this->queue=queue;
        this->fprProvider=provider;
    }  
    virtual HTTPResponse *HandleRequest(HTTPRequest* request) {
        wxString url = request->url.Mid(URL_PREFIX.Length());
        url.Replace("//","/");
        if (url.StartsWith("/")){
            url=url.AfterFirst('/');
        }
        if (url.StartsWith(wxT("get"))){
            return new HTTPStringResponse(JSON,manager->GetSettings()->GetCurrentAsJson());
        }
        if (url.StartsWith(wxT("ready"))){
             return new HTTPStringResponse(JSON,
                        wxString::Format(wxT("{"
                            JSON_SV(status,OK) ","
                            JSON_IV(ready,%s) "}"),
                            PF_BOOL(manager->GetState()==ChartManager::STATE_READY)));
        }
        //TODO: make this a PUT
        if (url.StartsWith(wxT("set"))){
            if (manager->GetState() != ChartManager::STATE_READY){
                return new HTTPJsonErrorResponse("still initializing");
            }
            SettingsMessage *msg=new SettingsMessage(manager,request->query);
            HTTPResponse *r=EnqueueAndWait(queue,msg,wxT("Set"));
            if (r != NULL) return r;
            if (msg->status.state == SettingsManager::SET_ERROR){
                wxString info=msg->status.info;
                msg->Unref();
                return new HTTPJsonErrorResponse(
                       wxString::Format(wxT("unable to apply changes: %s"),
                        info));
            }
            bool hasChanged=msg->status.state== SettingsManager::SET_CHANGE;
            msg->Unref();
            return new HTTPStringResponse(JSON,
                       wxString::Format(wxT("{"
                            JSON_SV(status,OK) ","
                            JSON_SV(hasChanged,%s)
                            "}"),
                        PF_BOOL(hasChanged)));
        }
        if (url.StartsWith(wxT("createfingerprint"))){
            if (manager->GetState() != ChartManager::STATE_READY){
                return new HTTPJsonErrorResponse("still initializing");
            }
            if (fprProvider == NULL){
                return new HTTPJsonErrorResponse("no plugin to create fingerprint");
            }            
            bool forDongle=GetQueryValue(request,"forDongle") == wxT("1");
            FPRMessage *msg=new FPRMessage(manager,fprProvider,forDongle);
            HTTPResponse *r=EnqueueAndWait(queue,msg,wxT("FPR"));
            if (r != NULL) return r;
            if (! msg->result.status){
                msg->Unref();
                return new HTTPJsonErrorResponse("no fingerprint created");
            }
            if (msg->result.hasError){
                wxString error=msg->result.error;
                msg->Unref();
                return new HTTPJsonErrorResponse(error);                        
            }
            wxString fileName=msg->result.fileName;
            msg->Unref();
            return new HTTPStringResponse(JSON,
                        wxString::Format(wxT("{"
                            JSON_SV(status,OK) ","
                            JSON_SV(fileName,%s) "}"),
                        StringHelper::safeJsonString(fileName)));
        }
        if (url.StartsWith(wxT("loadfingerprint"))){
            wxString fileName;
            GET_QUERY(fileName,"fileName");            
            fileName=StringHelper::SanitizeString(fileName);
            wxFileName fpFile(manager->GetSettings()->GetConfigDir(),fileName);
            if (! fpFile.Exists()){
                return new HTTPJsonErrorResponse(
                        wxString::Format(wxT("file %s not found"),fileName));
            }
            wxFile fpr(fpFile.GetFullPath(),wxFile::read);
            if (! fpr.IsOpened()){
                return new HTTPJsonErrorResponse(
                        wxString::Format(wxT("unable to open %s"),fileName));
            }
            wxFileOffset len=fpr.Length();
            if (len > MAX_FPR){
                return new HTTPJsonErrorResponse(
                        wxString::Format(wxT("file %s too long"),fileName));
            }
            wxMemoryBuffer buffer(len);
            long rt=fpr.Read(buffer.GetData(),len);
            buffer.SetDataLen(len);
            if (rt != len){
                return new HTTPJsonErrorResponse(
                        wxString::Format(wxT("incomplete read for  %s"),fileName));
            }
            wxString data=wxBase64Encode(buffer);
            return new HTTPStringResponse(JSON,
                        wxString::Format(wxT("{"
                            JSON_SV(status,OK) ","
                            JSON_SV(data,%s) "}"),
                        data));
        }
        if (url.StartsWith("restart")){
            if (manager->GetState() != ChartManager::STATE_READY){
                return new HTTPJsonErrorResponse("still initializing");
            }
            queue->Stop();
            return new HTTPStringResponse(JSON,
                        "{"
                        JSON_SV(status,OK) ","
                        JSON_SV(data,process stopped)
                        "}");
        }
        if (url.StartsWith("enable")){
            wxString key;
            GET_QUERY(key,"chartSet");
            wxString enableV;
            GET_QUERY(enableV,"enable");           
            bool enable= enableV == "1";
            EnableMessage *msg=new EnableMessage(manager,key,enable);
            HTTPResponse *r=EnqueueAndWait(queue,msg,wxT("Enable"));
            if (r != NULL) return r;            
            if (! msg->ok){
                msg->Unref();
                return new HTTPJsonErrorResponse("change not applied");
            }
            bool changed=msg->result;
            msg->Unref();
            return new HTTPStringResponse(JSON,
                        wxString::Format(wxT("{"
                            JSON_SV(status,OK) ","
                            JSON_SV(changed,%s) "}"),
                            PF_BOOL(changed)));
        }
        return new HTTPResponse();  
    }
    virtual wxString GetUrlPattern() {
        return URL_PREFIX+wxT("*");
    }

};

#endif /* SETTINGSREQUESTHANDLER_ */


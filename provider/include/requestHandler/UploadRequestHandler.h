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
#ifndef UPLOADREQUESTHANDLER_
#define UPLOADREQUESTHANDLER_
#include "RequestHandler.h"
#include "Logger.h"
#include "ChartManager.h"
#include "MainQueue.h"
#include <vector>
#include <wx/wx.h>
#include <wx/zipstrm.h>
#include "StringHelper.h"


class ScanMessage : public MainMessage{
public:
    ChartManager    *manager;
    int             scanned=0;
    bool            handled=false;
    wxString        directory;
    ScanMessage(ChartManager *manager,wxString directory): MainMessage(){
        this->manager=manager;
        this->directory=directory;
    }
    virtual ~ScanMessage(){};
    virtual void Process(bool discard=false){
        if (discard){
            SetDone();
            return;
        }
        LOG_INFO(wxT("ScanMessage::Process"));
        wxArrayString dirList;
        dirList.Add(directory);
        manager->PrepareChartSets(dirList,false,true);
        wxString setKey=ChartSetInfo::KeyFromChartDir(directory);
        StringVector setKeys={setKey};       
        manager->ComputeActiveSets(&setKeys);
        handled=true;
        LOG_INFO(wxT("ScanMessage done"));
        SetDone();
    }
        
};

class TryMessage : public MainMessage{
public:
    ChartManager    *manager;
    bool            ok=false;
    bool            handled=false;
    wxFileName      chartFile;
    TryMessage(ChartManager *manager,wxFileName chartFile): MainMessage(){
        this->manager=manager;
        this->chartFile=chartFile;
    }
    virtual ~TryMessage(){};
    virtual void Process(bool discard=false){
        if (discard){
            SetDone();
            return;
        }
        LOG_INFO(wxT("TryMessage::Process"));
        ok=manager->TryOpenChart(chartFile);
        handled=true;
        LOG_INFO(wxT("TryMessage done"));
        SetDone();
    }
        
};

class DeleteSetMessage: public MainMessage{
    ChartManager    *manager;
    wxString        set;
public:
    bool            handled=false;
    DeleteSetMessage(ChartManager *manager,wxString set): MainMessage(){
        this->manager=manager;
        this->set=set;
    };
    virtual ~DeleteSetMessage(){};
    virtual void Process(bool discard=false){
        if (discard){
            SetDone();
            return;
        }
        LOG_INFO(wxT("DisableMessage::Process"));
        handled=true;
        manager->DeleteChartSet(set);        
        LOG_INFO(wxT("DisableMessage done"));
        SetDone();        
    }       
};



class UploadRequestHandler : public RequestHandler {
    const unsigned long MAXUPLOAD=1024*1024*1024; //1GB
public:
    const wxString  URL_PREFIX=wxT("/upload");
    const wxString  TMP_PREFIX=wxT("CSUPLOAD");
private:
    const wxString  JSON=wxT("application/json");  
    ChartManager    *manager;
    MainQueue       *queue;
    wxString        uploadDir;
    
    wxString        MkTempName(){
        struct timeval tv;
        gettimeofday(&tv,NULL);
        wxDateTime now(tv.tv_sec);
        return wxString::Format(_T("%s%s-%ld"),
            TMP_PREFIX,now.Format("%Y/%m/%d-%H:%M:%S"),(long)(tv.tv_usec));
    }
    
    class ZipChartInfo{
    public:
        wxFileName  chartInfo;
        wxString    error=wxEmptyString;
        bool        found=false;
    };
    
    ZipChartInfo ReadChartInfo(wxString archive){
        ZipChartInfo rt;
        wxFileInputStream in(archive);
        if (! in.IsOk()){
            rt.error=wxString::Format(wxT("unable to open archive %s"),archive);
            LOG_ERROR(rt.error);
            return rt;
        }
        wxZipInputStream zip(in);
        if (! zip.IsOk()){
            rt.error=wxString::Format(wxT("unable to unzip archive %s"),archive);
            LOG_ERROR(rt.error);
            return rt;
        }
        wxZipEntry *entry;
        while ((entry=zip.GetNextEntry()) != NULL){
            wxFileName entryFile=wxFileName::FileName(entry->GetName());
            if (entryFile.GetFullName() == "Chartinfo.txt"){
                rt.chartInfo=entryFile;
                rt.found=true;
                delete entry;
                return rt;
            }
            delete entry;
        }
        return rt;
    }
    
    wxString    Unpack(wxString archive,wxString base){
        wxFileInputStream in(archive);
        if (! in.IsOk()){
            return wxString::Format(wxT("unable to open archive %s"),archive);           
        }
        wxZipInputStream zip(in);
        if (! zip.IsOk()){
            return wxString::Format(wxT("unable to unzip archive %s"),archive);         
        }
        wxZipEntry *entry;
        int numUnpacked=0;
        while ((entry=zip.GetNextEntry()) != NULL){
            if (entry->IsDir()){
                delete entry;
                continue;
            }
            wxFileName entryFile=wxFileName::FileName(entry->GetName());
            if (entryFile.GetDirCount() != 1 || entryFile.GetPath() != base){
                LOG_DEBUG(wxT("skip zip entry %s, does notmatch base %s"),entry->GetName(),base);
                delete entry;
                continue;
            }
            wxFileName chartDir=wxFileName::DirName(uploadDir+wxFileName::GetPathSeparator()+base);
            if (!chartDir.Exists()){
                LOG_DEBUG(wxT("creating chartDir %s"),chartDir.GetFullPath());
                if (! chartDir.Mkdir(wxS_DIR_DEFAULT,wxPATH_MKDIR_FULL)){
                    delete entry;
                    return wxString::Format(wxT("unable to create chart dir %s"),chartDir.GetFullPath());
                }
            }
            wxFileName outFile(chartDir.GetLongPath(),entryFile.GetFullName());
            wxFileOutputStream os(outFile.GetFullPath());
            if (! os.IsOk()){
                delete entry;
                return wxString::Format(wxT("unable to create chart file %s"),outFile.GetFullPath());
            }
            numUnpacked++;
            LOG_INFO(wxT("creating chart File %s"),outFile.GetFullPath());
            zip.Read(os);
            os.Close();
            delete entry;
        }
        if (numUnpacked == 0){
            return wxT("no charts unpacked");
        }
        return wxEmptyString;
    }
    
public:
    /**
     * create a request handler
     * @param chartList
     * @param name url compatible name
     */
    UploadRequestHandler(ChartManager *manager,MainQueue *queue,wxString uploadDir){
        this->manager=manager;
        this->queue=queue;
        this->uploadDir=uploadDir;
    }
    virtual HTTPResponse *HandleRequest(HTTPRequest* request) {
        wxString url = request->url.Mid(URL_PREFIX.Length());
        url.Replace("//","/");
        if (url.StartsWith("/")){
            url=url.AfterFirst('/');
        }
        if (manager->GetState() != ChartManager::STATE_READY){
            return new HTTPJsonErrorResponse(wxT("not ready"));
        }
        if (url.StartsWith(wxT("uploadzip"))){
            wxString lenPar;
            GET_HEADER(lenPar,"content-length");            
            unsigned long uploadSize = std::atol(lenPar.ToAscii().data());
            if (uploadSize > MAXUPLOAD){
                return new HTTPJsonErrorResponse(wxString::Format(
                        wxT("upload to big, allowed: %ld"),MAXUPLOAD));                
            }
            wxFileName outName(uploadDir,MkTempName());
            if (outName.Exists()){
                return new HTTPJsonErrorResponse(
                       wxString::Format(wxT("tmp file %s already exists"),outName.GetFullPath()));                                
            }
            wxFile outFile(outName.GetFullPath(),wxFile::write);
            if (! outFile.IsOpened()){
                return new HTTPJsonErrorResponse(
                       wxString::Format(wxT("unable to open tmp file %s"),outName.GetFullPath()));                                
            }
            unsigned long receivedBytes=WriteFromInput(request,&outFile,uploadSize);
            if (receivedBytes != uploadSize){
                outFile.Close();
                wxRemoveFile(outName.GetFullPath());
                return new HTTPJsonErrorResponse("end of stream"); 
            }
            outFile.Close();
            ZipChartInfo info=ReadChartInfo(outName.GetFullPath());
            if (info.error != wxEmptyString){
                wxRemoveFile(outName.GetFullPath());
                return new HTTPJsonErrorResponse(
                       wxString::Format(wxT("%s: %s"),
                            outName.GetFullPath(),
                            info.error                        
                        ));                                
            }
            if (!info.found){
                wxRemoveFile(outName.GetFullPath());
                return new HTTPJsonErrorResponse("no Chartinfo.txt in archive");                                
            }           
            if (info.chartInfo.GetDirCount() != 1){
                wxRemoveFile(outName.GetFullPath());
                return new HTTPJsonErrorResponse("Chartinfo.txt must be inside one subdirectory");                                
            }
            wxString chartDir=info.chartInfo.GetPath();
            wxFileName outDir(uploadDir,chartDir);
            if (outDir.Exists()){
                wxRemoveFile(outName.GetFullPath());
                return new HTTPJsonErrorResponse(
                       wxString::Format(wxT("chart directory %s already exists"),
                        outDir.GetFullPath()));                                
            }
            wxString setkey=ChartSetInfo::KeyFromChartDir(outDir.GetFullPath());
            if (manager->GetChartSet(setkey)){
                wxRemoveFile(outName.GetFullPath());
                return new HTTPJsonErrorResponse(
                       wxString::Format(wxT("a chart directory with the same name %s already exists"),
                        setkey));   
            }
            //now unpack
            wxString errUnpack=Unpack(outName.GetFullPath(),chartDir);
            wxRemoveFile(outName.GetFullPath());
            if (errUnpack != wxEmptyString){
                wxFileName::Rmdir(outDir.GetFullPath(),wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
                return new HTTPJsonErrorResponse(errUnpack);    
            }
            //find a first chart file
            wxDir chartDirAsDir(outDir.GetFullPath());
            if (! chartDirAsDir.IsOpened()){
                wxFileName::Rmdir(outDir.GetFullPath(),wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
                return new HTTPJsonErrorResponse(wxString::Format(wxT("unable to read chart dir %s after unpacking"),outDir.GetFullPath()));    
            }
            wxString chartFileName;
            bool foundChart=false;
            bool hasNext=chartDirAsDir.GetFirst(&chartFileName,wxEmptyString);
            while (hasNext && ! foundChart){
                if (manager->HasKnownExtension(chartFileName)){
                    foundChart=true;
                    break;
                }
                hasNext=chartDirAsDir.GetNext(&chartFileName);
            }
            if (! foundChart){
                wxFileName::Rmdir(outDir.GetFullPath(),wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
                return new HTTPJsonErrorResponse(wxString::Format(wxT("did not find any known chart file in %s"),outDir.GetFullPath()));    
            }
            LOG_INFO(wxT("found chart %s to try"),chartFileName);
            TryMessage *trymsg=new TryMessage(manager,wxFileName(outDir.GetFullPath(),chartFileName));
            HTTPResponse *rsp=EnqueueAndWait(queue,trymsg,"Try open chart request",30000);
            if (rsp != NULL) {
                wxFileName::Rmdir(outDir.GetFullPath(),wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
                return rsp;
            }
            if (! trymsg->handled){
                trymsg->Unref();
                wxFileName::Rmdir(outDir.GetFullPath(),wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
                return new HTTPJsonErrorResponse("unable to trigger chart open"); 
            }
            bool chartOk=trymsg->ok;
            trymsg->Unref();
            if (! chartOk){
                wxFileName::Rmdir(outDir.GetFullPath(),wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
                return new HTTPJsonErrorResponse(wxT("The system cannot open charts from this chart set. Maybe wrong key. ChartSet deleted"));
            }
            ScanMessage *msg=new ScanMessage(manager,outDir.GetFullPath());
            rsp=EnqueueAndWait(queue,msg,"Scan request");
            if (rsp != NULL) return rsp;
            if (! msg->handled){
                msg->Unref();
                return new HTTPJsonErrorResponse("unable to trigger rescan"); 
            }
            msg->Unref();
            return new HTTPStringResponse(JSON,
                wxString::Format(wxT("{" JSON_SV(status,OK) "," JSON_SV(chartSet,%s) "}"),
                    ChartSetInfo::KeyFromChartDir(outDir.GetFullPath())));  
        }
        if (url.StartsWith("deleteset")){
            wxString setKey;
            GET_QUERY(setKey,"chartSet");
            ChartSet *set=manager->GetChartSet(setKey);
            if (set == NULL){
                return new HTTPJsonErrorResponse(
                        wxString::Format("chart set %s not found",
                        setKey));    
            }
            if (! set->CanDelete()){
                return new HTTPJsonErrorResponse("this chartSet cannot be deleted");
            }
            wxFileName setDir=wxFileName::DirName(set->info.dirname);                      
            DeleteSetMessage *msg=new DeleteSetMessage(manager,setKey);
            HTTPResponse *rt=EnqueueAndWait(queue,msg,"Disable Set");
            if (rt != NULL) return rt;
            if (! msg->handled){
                msg->Unref();
                return new HTTPJsonErrorResponse("unable to disable chartSet"); 
            }
            msg->Unref();
            setDir=wxFileName::DirName(set->info.dirname);
            if (setDir.Exists()){                
                LOG_INFO(wxT("UploadRequestHandler: Removing chart dir %s"),set->info.dirname);
                bool success=setDir.Rmdir(wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
                if (! success){
                    return new HTTPJsonErrorResponse(
                       wxString::Format(wxT("unable to remove dir %s"),
                        set->info.dirname));   
                }
            }
            return new HTTPStringResponse(JSON,
                       wxString::Format(wxT("{" JSON_SV(status,OK) "," JSON_SV(chartSet,%s) "}"),
                        setKey));  
            
        }
        return new HTTPResponse();  
    }
    virtual wxString GetUrlPattern() {
        return URL_PREFIX+wxT("*");
    }

};

#endif /* UPLOADREQUESTHANDLER_ */


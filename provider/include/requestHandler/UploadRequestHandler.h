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


#define UPLOAD_TEMP_DIR wxT("__tmp")
#define CHARTINFO_TXT "Chartinfo.txt"

class UploadRequestHandler : public RequestHandler {
    const unsigned long long MAXUPLOAD=3LL*1024LL*1024LL*1024LL; //3GB
public:
    const wxString  URL_PREFIX=wxT("/upload");
    const wxString  TMP_PREFIX=wxT("CSUPLOAD");
private:
    const wxString  JSON=wxT("application/json");  
    ChartManager    *manager;
    MainQueue       *queue;
    wxString        uploadDir;
    
    wxString        MkTempName(wxString prefix=wxEmptyString){
        struct timeval tv;
        gettimeofday(&tv,NULL);
        wxDateTime now(tv.tv_sec);
        if (prefix == wxEmptyString) prefix=TMP_PREFIX;
        return wxString::Format(_T("%s%s-%ld"),
            prefix,now.Format("%Y-%m-%d-%H-%M-%S"),(long)(tv.tv_usec));
    }
    
    class ZipChartInfo{
    public:
        typedef enum {
            NONE,
            TXT,
            XML        
        } infoType;
        wxFileName  chartInfo;
        wxString    error=wxEmptyString;
        infoType    found=NONE;
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
            if (entryFile.GetFullName() == CHARTINFO_TXT){
                rt.chartInfo=entryFile;
                rt.found=ZipChartInfo::TXT;
                delete entry;
                return rt;
            }
            if (entry->GetName().EndsWith(".XML") || entry->GetName().EndsWith(".xml") ){
                rt.chartInfo=entryFile;
                rt.found=ZipChartInfo::XML;
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
    
    wxString CopyFile(wxString src,wxString dest){
        wxFile inFile(src);
        wxFile outFile(dest,wxFile::write);
        if (!inFile.IsOpened()){
            return wxString::Format(wxT("unable to open src file for copy %s"),src);
        }
        if (!outFile.IsOpened()){
            return wxString::Format(wxT("unable to open dest file for copy %s"),src);
        }
        char buf[4096];
        for (;;){
            ssize_t count = inFile.Read(buf, WXSIZEOF(buf));
            if ( count == wxInvalidOffset )
                return wxString::Format(wxT("error reading file %s"),src);

            // end of file?
            if ( !count )
                break;

            if ( outFile.Write(buf, count) < (size_t)count )
                return wxString::Format(wxT("unable to write %d bytes to %s"),(int)count,dest);
            
        }        
        if (! inFile.Close()){
            return wxString::Format(wxT("unable to close %s after reading"),src);
        }
        if (! outFile.Close()){
            return wxString::Format(wxT("unable to close %s after writing"),dest);
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
            unsigned long long uploadSize = std::atoll(lenPar.ToAscii().data());
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
            LOG_INFO(wxT("uploading chart zip %s"),outName.GetFullPath());
            unsigned long long receivedBytes=WriteFromInput(request,&outFile,uploadSize);
            if (receivedBytes != uploadSize){
                outFile.Close();
                wxRemoveFile(outName.GetFullPath());
                return new HTTPJsonErrorResponse("end of stream"); 
            }
            outFile.Close();
            manager->PauseFiller(true);
            usleep(500000);
            ZipChartInfo info=ReadChartInfo(outName.GetFullPath());
            if (info.error != wxEmptyString){
                wxRemoveFile(outName.GetFullPath());
                manager->PauseFiller(false);
                return new HTTPJsonErrorResponse(
                       wxString::Format(wxT("%s: %s"),
                            outName.GetFullPath(),
                            info.error                        
                        ));                                
            }
            if (info.found == ZipChartInfo::NONE){
                wxRemoveFile(outName.GetFullPath());
                manager->PauseFiller(false);
                return new HTTPJsonErrorResponse("no Chartinfo.txt or XXX.XML in archive");                                
            }
            LOG_INFO(wxT("found chart info %s"),info.chartInfo.GetFullPath());
            if (info.chartInfo.GetDirCount() != 1){
                wxRemoveFile(outName.GetFullPath());
                manager->PauseFiller(false);
                return new HTTPJsonErrorResponse("Chartinfo must be inside one subdirectory");                                
            }
            wxString chartDir=info.chartInfo.GetPath();
            wxFileName outDir(uploadDir,chartDir);
            if (outDir.Exists()){
                wxRemoveFile(outName.GetFullPath());
                manager->PauseFiller(false);
                return new HTTPJsonErrorResponse(
                       wxString::Format(wxT("chart directory %s already exists"),
                        outDir.GetFullPath()));                                
            }
            wxString setkey=ChartSetInfo::KeyFromChartDir(outDir.GetFullPath());
            if (manager->GetChartSet(setkey)){
                wxRemoveFile(outName.GetFullPath());
                manager->PauseFiller(false);
                return new HTTPJsonErrorResponse(
                       wxString::Format(wxT("a chart directory with the same name %s already exists"),
                        setkey));   
            }
            LOG_INFO(wxT("unpacking charts into %s"),outDir.GetFullPath());
            //now unpack
            wxString errUnpack=Unpack(outName.GetFullPath(),chartDir);
            wxRemoveFile(outName.GetFullPath());
            if (errUnpack != wxEmptyString){
                wxFileName::Rmdir(outDir.GetFullPath(),wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
                manager->PauseFiller(false);
                return new HTTPJsonErrorResponse(errUnpack);    
            }
            //find a first chart file
            wxDir chartDirAsDir(outDir.GetFullPath());
            if (! chartDirAsDir.IsOpened()){
                wxFileName::Rmdir(outDir.GetFullPath(),wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
                manager->PauseFiller(false);
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
                manager->PauseFiller(false);
                return new HTTPJsonErrorResponse(wxString::Format(wxT("did not find any known chart file in %s"),outDir.GetFullPath()));    
            }
            LOG_INFO(wxT("found chart %s to try, create temp dir with it"),chartFileName);
            //copy the chart file to a temp dir and add an emptied chartinfo.txt
            wxFileName tempDir=wxFileName::DirName(uploadDir+wxFileName::GetPathSeparator()+MkTempName(UPLOAD_TEMP_DIR));
            if (tempDir.Exists()){
                wxFileName::Rmdir(tempDir.GetFullPath(),wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
            }
            tempDir.Mkdir(wxS_DIR_DEFAULT,wxPATH_MKDIR_FULL);
            if (! tempDir.Exists()){
                wxFileName::Rmdir(outDir.GetFullPath(),wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
                manager->PauseFiller(false);
                return new HTTPJsonErrorResponse(wxString::Format(wxT("unable to create temp dir %s"),tempDir.GetFullPath()));
            }
            ChartSetInfo setInfo;
            if (info.found == ZipChartInfo::TXT) {
                //create a temp chart info without eulas
                setInfo = ChartSetInfo::ParseChartInfo(outDir.GetFullPath());
                if (!setInfo.infoParsed) {
                    wxFileName::Rmdir(tempDir.GetFullPath(), wxPATH_RMDIR_FULL | wxPATH_RMDIR_RECURSIVE);
                    wxFileName::Rmdir(outDir.GetFullPath(), wxPATH_RMDIR_FULL | wxPATH_RMDIR_RECURSIVE);
                    manager->PauseFiller(false);
                    return new HTTPJsonErrorResponse(wxT("unable to parse chartinfo"));
                }
            }    
            wxFileName chartInfoName(tempDir.GetFullPath(), CHARTINFO_TXT);
            wxFile newChartInfo(chartInfoName.GetFullPath(), wxFile::write);
            if (!newChartInfo.IsOpened()) {
                wxFileName::Rmdir(tempDir.GetFullPath(), wxPATH_RMDIR_FULL | wxPATH_RMDIR_RECURSIVE);
                wxFileName::Rmdir(outDir.GetFullPath(), wxPATH_RMDIR_FULL | wxPATH_RMDIR_RECURSIVE);
                manager->PauseFiller(false);
                return new HTTPJsonErrorResponse(wxString::Format(wxT("unable to create temp chartInfo %s"), chartInfoName.GetFullPath()));
            }
            if (info.found == ZipChartInfo::TXT){
                newChartInfo.Write(wxString::Format(wxT("UserKey:%s\n"), setInfo.userKey));
            }
            newChartInfo.Close();
            if (info.found == ZipChartInfo::XML){
                //copy the chartinfo
                wxFileName tempFile(tempDir.GetFullPath(),info.chartInfo.GetFullName());
                wxString copyError=CopyFile(outDir.GetFullPath()+wxFileName::GetPathSeparator()+info.chartInfo.GetFullName(),tempFile.GetFullPath());
                if (copyError != wxEmptyString){
                    wxFileName::Rmdir(tempDir.GetFullPath(),wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
                    wxFileName::Rmdir(outDir.GetFullPath(),wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
                    manager->PauseFiller(false);
                    return new HTTPJsonErrorResponse(wxString::Format(wxT("unable to copy %s to temp dir %s: %s"),info.chartInfo.GetName(),copyError));                
                }
            }
            //copy the chart to the temp dir
            wxFileName tempFile(tempDir.GetFullPath(),chartFileName);
            wxString copyError=CopyFile(outDir.GetFullPath()+wxFileName::GetPathSeparator()+chartFileName,tempFile.GetFullPath());
            if (copyError != wxEmptyString){
                wxFileName::Rmdir(tempDir.GetFullPath(),wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
                wxFileName::Rmdir(outDir.GetFullPath(),wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
                manager->PauseFiller(false);
                return new HTTPJsonErrorResponse(wxString::Format(wxT("unable to copy chart to temp dir %s: %s"),chartFileName,copyError));                
            }
                        
            TryMessage *trymsg=new TryMessage(manager,tempFile);
            HTTPResponse *rsp=EnqueueAndWait(queue,trymsg,"Try open chart request",30000);
            if (rsp != NULL) {
                wxFileName::Rmdir(tempDir.GetFullPath(),wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
                wxFileName::Rmdir(outDir.GetFullPath(),wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
                manager->PauseFiller(false);
                return rsp;
            }
            if (! trymsg->handled){
                trymsg->Unref();
                wxFileName::Rmdir(tempDir.GetFullPath(),wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
                wxFileName::Rmdir(outDir.GetFullPath(),wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
                manager->PauseFiller(false);
                return new HTTPJsonErrorResponse("unable to trigger chart open"); 
            }
            bool chartOk=trymsg->ok;
            trymsg->Unref();
            if (! chartOk){
                wxFileName::Rmdir(tempDir.GetFullPath(),wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
                wxFileName::Rmdir(outDir.GetFullPath(),wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
                manager->PauseFiller(false);
                return new HTTPJsonErrorResponse(wxT("The system cannot open charts from this chart set. Maybe wrong key. ChartSet deleted"));
            }
            if (info.found == ZipChartInfo::XML){
                //after a chart has been opened, the new plugin should have created a Chartinfo.txt
                //copy this to our chart dir
                wxFileName target(outDir.GetFullPath(),CHARTINFO_TXT);
                wxString copyError=CopyFile(tempDir.GetFullPath()+wxFileName::GetPathSeparator()+CHARTINFO_TXT,target.GetFullPath());
                //for now we ignore errors...
            }
            wxFileName::Rmdir(tempDir.GetFullPath(),wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
            ScanMessage *msg=new ScanMessage(manager,outDir.GetFullPath());
            rsp=EnqueueAndWait(queue,msg,"Scan request");
            if (rsp != NULL) {
                manager->PauseFiller(false);
                return rsp;
            }
            if (! msg->handled){
                msg->Unref();
                manager->PauseFiller(false);
                return new HTTPJsonErrorResponse("unable to trigger rescan"); 
            }
            msg->Unref();
            manager->PauseFiller(false);
            LOG_INFO(wxT("ChartSet %s successfully prepared"),outDir.GetFullPath());
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


/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Main
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
#include <stdio.h>
#include <sys/resource.h>
#ifndef __WXMSW__
#include <signal.h>
#include <setjmp.h>
#endif

#include <wx/wx.h>
#include <wx/wfstream.h>
#include <wx/filename.h>
#include <wx/cmdline.h>
#include <wx/mstream.h>
#include <wx/string.h>
#include <wx/dir.h>
#include <wx/fileconf.h>
#include <wx/stdpaths.h>
#include <sys/types.h>
#include <signal.h>
//bytes per pixel
#define BPI 3
#include "pluginmanager.h"
#include "ChartInfo.h"
#include "ChartList.h"
#include "Renderer.h"

#include "RequestHandler.h"
#include "HTTPd/HTTPServer.h"
#include "Logger.h"
#include "SimpleThread.h"
#include "map"
#include <thread>
#include "CacheHandler.h"
#include "ChartRequestHandler.h"
#include "ListRequestHandler.h"
#include "ChartManager.h"
#include "TokenRequestHandler.h"
#include "StatusRequestHandler.h"
#include "CacheFiller.h"
#include "MD5.h"
#include "SystemHelper.h"
#include "StatusCollector.h"
#include "StaticRequestHandler.h"
#include "SettingsManager.h"
#include "SettingsRequestHandler.h"
#include "UploadRequestHandler.h"
#include "ColorTable.h"


extern "C" void * gluNewTess();
#ifndef __WXMSW__
struct sigaction sa_all;
struct sigaction sa_all_old;
sigjmp_buf env; // the context saved by sigsetjmp();

void catch_signals(int signo) {
}

#endif

void ignoreSig(int sig){}

/*
 * ( max_physical ) / (m_display_size_mm /1000.);
 */
const double max_pysical = 1000; //px
const double display_size = 200; //mm
double canvasScaleFactor = max_pysical / (display_size / 1000.0);

PlugInManager *manager=NULL;


static void shutdownPlugins(){
    ArrayOfPlugIns *pplugin_array = manager->GetPlugInArray();
    for (unsigned int i = 0; i < pplugin_array->GetCount(); i++) {
            PlugInContainer *pic = pplugin_array->Item(i);
            LOG_INFO(wxT("shutting down plugin %s"),pic->m_pplugin->GetCommonName());
            pic->m_pplugin->DeInit();
    }
}

static const wxCmdLineEntryDesc g_cmdLineDesc [] = {
    {wxCMD_LINE_OPTION,"d","debug", "set debug level", wxCMD_LINE_VAL_NUMBER, wxCMD_LINE_PARAM_OPTIONAL},
    {wxCMD_LINE_OPTION,"l", "logfile","logfile name", wxCMD_LINE_VAL_STRING, wxCMD_LINE_PARAM_OPTIONAL},
    {wxCMD_LINE_OPTION,"m", "maxlines","max lines in logile(20000)", wxCMD_LINE_VAL_NUMBER, wxCMD_LINE_PARAM_OPTIONAL},
    {wxCMD_LINE_OPTION,"t", "threads","number of threads", wxCMD_LINE_VAL_NUMBER, wxCMD_LINE_PARAM_OPTIONAL},
    {wxCMD_LINE_OPTION,"s", "scale","scale levels up/down 0.1..10", wxCMD_LINE_VAL_DOUBLE, wxCMD_LINE_PARAM_OPTIONAL},
    {wxCMD_LINE_OPTION,"c", "cache","cache size in memory(default: 20000)", wxCMD_LINE_VAL_NUMBER, wxCMD_LINE_PARAM_OPTIONAL},
    {wxCMD_LINE_OPTION,"f", "filecache","cache size on disk per chart set(default: 400000)", wxCMD_LINE_VAL_NUMBER, wxCMD_LINE_PARAM_OPTIONAL},
    {wxCMD_LINE_OPTION,"r", "maxprefill","max zoom for cache prefill(default: 17)", wxCMD_LINE_VAL_NUMBER, wxCMD_LINE_PARAM_OPTIONAL},
    {wxCMD_LINE_OPTION,"x", "memsize","max memory in % (default: 60)", wxCMD_LINE_VAL_NUMBER, wxCMD_LINE_PARAM_OPTIONAL},
    {wxCMD_LINE_OPTION,"p", "parent","parent pid, stop if not available", wxCMD_LINE_VAL_NUMBER, wxCMD_LINE_PARAM_OPTIONAL},
    {wxCMD_LINE_OPTION,"e", "exe","directory for oeserverd (default: /usr/bin)", wxCMD_LINE_VAL_STRING, wxCMD_LINE_PARAM_OPTIONAL},
    {wxCMD_LINE_OPTION,"u", "uploadDir","directory for chart upload (default: configDir/charts)", wxCMD_LINE_VAL_STRING, wxCMD_LINE_PARAM_OPTIONAL},
    
    {wxCMD_LINE_PARAM, NULL, NULL, "", wxCMD_LINE_VAL_STRING, wxCMD_LINE_PARAM_MULTIPLE},
    { wxCMD_LINE_NONE}
};

class SystemLogger : public wxLog{
public:
    SystemLogger():wxLog(){}
    virtual void DoLogTextAtLevel(wxLogLevel level, const wxString &msg){
        if (level <= wxLOG_Error){
            Logger::instance()->LogError(msg);
            return;
        }
        if (level <= wxLOG_Info){
            Logger::instance()->LogInfo(msg);
            return;
        }
        Logger::instance()->LogDebug(msg);
    }
};
class SystemLogFormatter : public wxLogFormatter
{
    virtual wxString Format(wxLogLevel level,
                            const wxString& msg,
                            const wxLogRecordInfo& info) const
    {
        return msg;
    }
    virtual wxString FormatTime(time_t time) const{
        return wxString("");
    }
};



class StopHandler : public Runnable{
private:
    HTTPServer *server;
    long parentPid;
    MainQueue *queue;
public:
    StopHandler(HTTPServer* server,long parentPid,MainQueue *queue){
        this->server=server;
        this->parentPid=parentPid;
        this->queue=queue;
    }
    virtual void run(){
        LOG_INFO(wxT("Waiter started"));
        if (parentPid > 0){
            LOG_INFO(wxT("monitoring parent %ld"),parentPid);
            while (true){
                int res=kill(parentPid,0);
                if (res != 0){
                    LOG_INFO(wxT("parent %ld not running any more, shutting down"),parentPid);
                    wxPrintf("parent %ld not running any more, shutting down\n",parentPid);
                    break;
                }
                wxMilliSleep(1000);
            }
        }
        else{
            wxPrintf(wxT("ENTER to stop"));
            getchar();
        }
        queue->Stop();
    }
};



class AvNavProvider : public wxApp {
private:
    wxArrayString myArgs;
    long debugLevel=LOG_LEVEL_INFO;
    double scaleLevel=1;
    wxString logFile;
    wxString uploadDir=wxEmptyString;
    long maxThreads=4;
    long cacheSize=10000;
    long fileCacheSize=400000;
    long memsizePercent=-1;
    long parentPid=-1;
    long maxLogLines=50000;
    long maxPrefillZoom=17;
    ExtensionList extensions={{"*.OESENC",{}}};
    ChartManager *chartManager;
    wxString privateDataDir=wxT("~/.opencpn/");
    wxString dataDir=privateDataDir;
    wxString exePath=wxT("/usr/bin");
public:
    virtual int MainLoop() {
        //ignore sigpipes
        signal(SIGPIPE, SIG_IGN);
        signal(SIGUSR1, ignoreSig);
        setpgid(0,0);
        wxInitAllImageHandlers();
        Logger::CreateInstance(logFile,maxLogLines);
        Logger::instance()->SetLevel((int)debugLevel);
        SystemLogger *logger=new SystemLogger();
        logger->SetFormatter(new SystemLogFormatter());
        delete wxLog::SetActiveTarget(logger);
        wxLog::SetLogLevel(wxLOG_Max); //we decide in our logger
        wxString msg=wxString::Format(wxT("%s starting with parameters "),argv[0]);
        for (int i=0;i<argc;i++){
            msg.Append(argv[i]);
            msg.Append(" ");
        }
        wxPrintf(_T("%s\n"),msg);
        LOG_INFO(msg);
        return run(myArgs);
    }

    virtual bool OnCmdLineParsed(wxCmdLineParser& parser) {
        logFile=_T("provider.log");
        parser.Found("d",&debugLevel);
        parser.Found("l",&logFile);
        parser.Found("t",&maxThreads);
        parser.Found("s",&scaleLevel);
        parser.Found("p",&parentPid);
        parser.Found("e",&exePath);
        parser.Found("m",&maxLogLines);
        parser.Found("f",&fileCacheSize);
        bool hasMemSize=parser.Found("x",&memsizePercent);
        parser.Found("r",&maxPrefillZoom);
        parser.Found("u",&uploadDir);
        if (scaleLevel < 0.1 || scaleLevel > 10){
            LOG_ERRORC(_T("invalid scale level %lf"),scaleLevel);
            exit(1);
        }
        parser.Found("c",&cacheSize);
        if (fileCacheSize < 1){
            LOG_INFO(wxT("file caching disabled by parameter f"));
        }
        if (cacheSize < 1){
            LOG_INFO(wxT("memory caching disabled by parameter c"));
        }
        if (hasMemSize){
            if (memsizePercent < 2 || memsizePercent > 95){
                LOG_ERRORC(wxT("invalid memory size (2...95): %ld"),memsizePercent);
                exit(1);
            }
        }
        if (maxPrefillZoom < 0 || maxPrefillZoom > MAX_ZOOM){
            LOG_ERRORC(wxT("invalid prefillZoom %ld, allowed are 0...&d"),maxPrefillZoom,MAX_ZOOM);
            exit(1);
        }
        int num = parser.GetParamCount();
        for (size_t i = 0; i < parser.GetParamCount(); i++) {
            myArgs.Add(parser.GetParam(i));
        }
        return true;
    }

    virtual void OnInitCmdLine(wxCmdLineParser& parser) {
        parser.SetDesc(g_cmdLineDesc);
        // must refuse '/' as parameter starter or cannot use "/path" style paths
        parser.SetSwitchChars(wxT("-"));
    }
    virtual void OnAssertFailure(const wxChar * file,int line,const wxChar * func,
        const wxChar *cond,const wxChar * msg )	{
        LOG_ERROR(_T("assertion file=%s,line=%d,func=%s,cond=%s,msg=%s"),
                file,line,func,cond,msg);
    }

private:
    
    
    wxString getAbsolutePath(wxString rel){
        wxFileName current(rel);
        current.MakeAbsolute();
        return current.GetFullPath();
    }
    void checkDirOrExit(wxString name,wxString info,bool create=false){
        if (wxDirExists(name)) return;
        if (! create){
            LOG_ERRORC(_T("ERROR: %s - %s does not exist"),info,name);
            exit(1);
        }
        wxFileName dirFileName=wxFileName::DirName(name);
        if (!dirFileName.Mkdir(wxS_DIR_DEFAULT,wxPATH_MKDIR_FULL)){
            LOG_ERRORC(_T("ERROR: %s - %s unable to create"),info,name);
            exit(1);
        }
    }
    class PluginInfo:public ItemStatus{
    public:
        ArrayOfPlugIns *plugins;
        PluginInfo(ArrayOfPlugIns *plugins){
            this->plugins=plugins;
        }
        virtual wxString ToJson() override{
            wxString rt("{\"loadedPlugins\":[\n");
            for (size_t i=0;i<plugins->Count();i++){
                if (i>0) rt.Append(",\n");
                PlugInContainer *pi=plugins->Item(i);
                rt.Append(wxString::Format("{"
                        "\"name\":\"%s\",\n"
                        "\"version\":\"%d.%d\",\n"
                        "\"state\":\"%s\"\n"
                        "}\n",
                        StringHelper::safeJsonString(pi->m_common_name),
                        pi->m_version_major,pi->m_version_minor,
                        (pi->m_bInitState?"ready":"fail")
                ));
            }
            rt.Append("]\n}\n");
            return rt;
        }

    };
    
    class FPRFileProviderImpl : public FPRFileProvider{
        const wxString server=wxT("oeserverd");
    private:
        wxString GetExePath(){
            wxFileName fn_exe=wxFileName::FileName(GetOCPN_ExePath());
            wxFileName daemon(fn_exe.GetPath(),server);
            return daemon.GetFullPath();
        }
    public:
        
        FPRFileProviderImpl(){            
        }        
        
        virtual Result createFile(bool forDongle) override{
            LOG_INFO(wxT("creating fingerprint, forDongle=%s"),(forDongle?"true":"false"));
            Result rt;
            rt.status=true;
            //code copied from the plugin
           
            wxString fpr_file;
            wxString fpr_dir = *GetpPrivateApplicationDataLocation(); //GetWritableDocumentsDir();
            wxString cmd=GetExePath();
            if (!wxFileExists(cmd)){
                rt.hasError=true;
                rt.error=wxString::Format(wxT("server %s not found"),cmd);
                return rt;
            }
            if( fpr_dir.Last() != wxFileName::GetPathSeparator() )
                fpr_dir += wxFileName::GetPathSeparator();
            
            if(forDongle)
                cmd.Append(_T(" -k "));                  // Make SGLock fingerprint
            else
                cmd.Append(_T(" -g "));                  // Make fingerprint
            
            cmd.Append(_T("\""));
            cmd.Append(fpr_dir);            
            cmd.Append(_T("\""));       
            LOG_INFO(_T("Create FPR command: ") + cmd);
            // Set environment variable to find the required sglock dongle library
            wxFileName libraryPath(GetOCPN_ExePath());
            libraryPath.RemoveLastDir();
            wxString libDir = libraryPath.GetPath( wxPATH_GET_VOLUME | wxPATH_GET_SEPARATOR) + _T("lib/opencpn");
            wxSetEnv(_T("LD_LIBRARY_PATH"), libDir ); //"/usr/local/lib/opencpn");
            wxArrayString ret_array;      
            wxExecute(cmd, ret_array, ret_array );
            
            bool berr = false;
            for(unsigned int i=0 ; i < ret_array.GetCount() ; i++){
                wxString line = ret_array[i];
                wxLogMessage(line);
                if(line.Upper().Find(_T("ERROR")) != wxNOT_FOUND){
                    LOG_ERROR(wxT("getFPRFile: %s"),line);
                    berr = true;
                    rt.hasError=true;
                    rt.error=line;
                    return rt;
                }
                if(line.Upper().Find(_T("FPR")) != wxNOT_FOUND){
                    fpr_file = line.AfterFirst(':');
                }
                
            }
            if(fpr_file.IsEmpty()){                 // Probably dongle not present
                rt.hasError=true;
                if (forDongle){
                    LOG_ERROR(wxT("getFPRFile: DONGLE not present"));
                    rt.error=_T("DONGLE_NOT_PRESENT");
                }
                else{
                    rt.error=wxT("no file created by daemon");
                }
                return rt;
            }
            wxFileName outFile=wxFileName::FileName(fpr_file);
            rt.fileName=outFile.GetFullName();
            return rt;
        }

    };
    int run(wxArrayString args) {
       
        int argc = args.GetCount();
        if ((argc) < 4) {
            LOG_ERRORC(_T("usage: XXX plugindir datadir configdir port [chart]..."));
            exit(1);
        }
        if (parentPid > 0){
            int res=kill(parentPid,0);
            if (res != 0){
                LOG_ERRORC(wxT("parent pid %ld not running, stop now"),parentPid);
                exit(1);
            }
        }
        StatusCollector statusCollector;
        LOG_INFO(_T("using plugindir %s"), args.Item(0));
        wxString pluginDir = getAbsolutePath(args.Item(0));
        checkDirOrExit(pluginDir,"plugin directory");
        dataDir = getAbsolutePath(args.Item(1)) + wxFileName::GetPathSeparator();
        checkDirOrExit(dataDir,_T("shared data directory"));
        wxString s57Dir=dataDir+"s57data";
        checkDirOrExit(s57Dir,_T("s57data directory"));
        privateDataDir = getAbsolutePath(args.Item(2)) + wxFileName::GetPathSeparator();
        checkDirOrExit(privateDataDir,"config directory");
        if (uploadDir == wxEmptyString){
            uploadDir=privateDataDir+"charts"+wxFileName::GetPathSeparator();
        }
        else{
            uploadDir=getAbsolutePath(uploadDir)+wxFileName::GetPathSeparator();
        }
        checkDirOrExit(uploadDir,"upload charts dir",true);
        SettingsManager settings(privateDataDir,dataDir,exePath);
        if (! settings.StoreBaseSettings()){
            LOG_ERRORC(wxT("no config file - cannot continue"));
            exit(1);
        }
        ColorTableReader colorReader(s57Dir);
        int rt=colorReader.ReadColors();
        if (rt <= 0){
            LOG_ERRORC(wxT("unable to read colors, trying to continue anayway"));
        }
        ColorTable currentTable=colorReader.GetTable("DAY_BRIGHT",true);
        setColorTable(&currentTable);
        int port = atoi(args.Item(3));
        //first try to create all chart set infos
        wxArrayString chartlist;
        for (size_t i=4;i<args.GetCount();i++){
            chartlist.Add(args.Item(i));
        }
        wxArrayString uploadChartList;
        //read one level below uploadDir
        wxDir dir(uploadDir);
        if (!dir.IsOpened()) {
            LOG_ERROR(_T("unable to read upload directory %s"), uploadDir);            
        }
        else{
            wxString fileName;
            bool hasNext = dir.GetFirst(&fileName);
            while (hasNext) {
                wxString localFile(dir.GetName()+wxFileName::GetPathSeparator()+ fileName);
                if (!fileName.StartsWith(UPLOAD_TEMP_DIR)){                    
                    if (wxDirExists(localFile)){
                        uploadChartList.Add(localFile);
                    } 
                }
                else{
                    LOG_INFO(wxT("Removing temp chart dir %s"),localFile);
                    wxFileName::Rmdir(localFile,wxPATH_RMDIR_FULL|wxPATH_RMDIR_RECURSIVE);
                }
                hasNext=dir.GetNext(&fileName);
            }
        }
        chartManager=new ChartManager(&settings,&extensions);
        statusCollector.AddItem("chartManager",chartManager);
        chartManager->PrepareChartSets(uploadChartList,true,true);
        int numCharts=chartManager->PrepareChartSets(chartlist);
        
        if (numCharts < 1){
            LOG_ERRORC(wxT("no known charts found to be handled"));
        }
        if (numCharts >= 1){
            unsigned int wantedFiles=5*numCharts+1;
            struct rlimit limit;
            int rt=getrlimit(RLIMIT_NOFILE,&limit);
            if (rt != 0){
                LOG_ERROR(_T("unable to get current number of files"));
            }
            else{
                if (wantedFiles > limit.rlim_max/2) wantedFiles=limit.rlim_max/2;
                if (limit.rlim_cur < wantedFiles){                    
                    limit.rlim_cur=wantedFiles;
                    rt=setrlimit(RLIMIT_NOFILE,&limit);
                    if (rt != 0){
                        LOG_ERROR(_T("unable to set number of open files to %d"),wantedFiles);
                    }
                    else{
                        LOG_INFO(_T("set number of open files to %d"),wantedFiles);
                    }
                }
            }
        }
        ChartSetInfoList infos;
        ChartSetMap::iterator setIter;
        ChartSetMap *chartSets=chartManager->GetChartSets();
        for (setIter=chartSets->begin();setIter != chartSets->end();setIter++){
            infos.push_back(setIter->second->info);
        }
        //write all EULAs to config before we start the plugin
        wxFileConfig *config=GetOCPNConfigObject();
        if (config == NULL){
            LOG_ERRORC(wxT("config file not found, unable to continue"));
            exit(1);
        }
        ChartSetInfo::WriteEulasToConfig(config,&infos);
        int debuglevel=0;
        if (Logger::instance()->HasLevel(LOG_LEVEL_DEBUG)) debuglevel=10;
        config->SetPath( _T("/PlugIns/oesenc") );
        LOG_INFO(wxT("setting plugin debug to %d"),debuglevel);
        config->Write( _T("DEBUG_LEVEL"),debuglevel);
        if (!config->Flush()){
            LOG_ERRORC(wxT("unable to write to config"));
            exit(1);
        }
        
        //start up web server
        TokenHandler *tokenHandler=new TokenHandler("all");
        MainQueue mainQueue;
        Renderer::CreateInstance(chartManager,&mainQueue);
        LOG_INFO(_T("starting HTTP server on port %d"), port);
        HTTPServer webServer(port,maxThreads);
        webServer.AddHandler(new ListRequestHandler(chartManager));
        wxFileName appFile=(wxStandardPaths::Get().GetExecutablePath());
        TokenRequestHandler *tokenRequestHandler=new TokenRequestHandler(appFile.GetPath(),tokenHandler);
        tokenHandler->start();
        webServer.AddHandler(tokenRequestHandler);
        webServer.AddHandler(new StaticRequestHandler(appFile.GetPath()+wxFileName::GetPathSeparators()+wxT("gui")));
        webServer.AddHandler(new StatusRequestHandler(&statusCollector));
        webServer.AddHandler(new UploadRequestHandler(chartManager,&mainQueue,uploadDir));
        manager = new PlugInManager();
        FPRFileProviderImpl fprProvider;
        manager->LoadAllPlugIns(pluginDir,wxT("*oesenc"));
        ArrayOfPlugIns *pplugin_array = manager->GetPlugInArray();
        statusCollector.AddItem("plugins",new PluginInfo(pplugin_array));
        const char* outdir = NULL;
        int numKnownExtension=0;
        for (unsigned int i = 0; i < pplugin_array->GetCount(); i++) {
            PlugInContainer *pic = pplugin_array->Item(i);
            if (pic->m_bInitState) {
                pic->m_bEnabled=true;
                opencpn_plugin *p = pic->m_pplugin;
                if (p) {
                    LOG_INFO(_T("(%02d):%s"), i, p->GetCommonName());
                    LOG_INFO(_T("     %s"), p->GetShortDescription());
                    wxArrayString clnames = p->GetDynamicChartClassNameArray();

                    for (size_t j = 0; j < clnames.GetCount(); j++) {
                        LOG_INFO(_T("     class: %s"), clnames.Item(j));
                        wxObject *chartObject = ::wxCreateDynamicObject(clnames.Item(j));
                        PlugInChartBase *wr=wxDynamicCast(chartObject, PlugInChartBase);
                        LOG_INFO(_T("     wrapper: SearchMask=%s"), wr->GetFileSearchMask());
                        wxString extMask=wr->GetFileSearchMask().Upper();
                        ExtensionList::iterator it=extensions.find(extMask);
                        if (it == extensions.end()){
                            LOG_INFO(wxT("ignoring file search mask %s from plugin %s as we don't know it"),
                                    extMask,p->GetCommonName());
                        }
                        else{
                            it->second.classname=clnames.Item(j);
                            numKnownExtension++;
                        }
                        delete wr;
                    }
                }                
            }
        }
        if (numKnownExtension < 1) {
            LOG_ERRORC("no chart handlers loaded, exiting");
        }
        webServer.AddHandler(new SettingsRequestHandler(chartManager,&mainQueue,&fprProvider));
        if (!webServer.Start()) {
            LOG_ERRORC(_T("unable to start server at port %d"), port);
            return 1;
        }
        LOG_INFOC(_T("started HTTP server on port %d"), port);
        //ensure to sync our config by sending a json message to the plugins
        settings.StoreBaseSettings(true);
        //compute active/disabled sets
        chartManager->ComputeActiveSets();
        chartManager->StartCaches(privateDataDir,cacheSize,fileCacheSize);
        int systemKb;
        int chartCacheKb=100000+chartManager->GetMaxCacheSizeKb();
        int minChartCacheDb=150000;
        SystemHelper::GetMemInfo(&systemKb,NULL);
        int memAvail=SystemHelper::GetAvailableMemoryKb()*90/100;
        int memoryLimit=0;
        if (memsizePercent > 0){
            memoryLimit=systemKb*memsizePercent/100;
        }
        else{
            if (memAvail >= 0){
                memoryLimit=memAvail;
            }
        }
        if (memoryLimit != 0){
            chartCacheKb=memoryLimit-chartManager->GetMaxCacheSizeKb();
            if (chartCacheKb < minChartCacheDb){
                memoryLimit+=(minChartCacheDb-chartCacheKb);
                wxString info=wxString::Format("Main: memory system=%dkb,avail=%dkb,limit=%dkb",
                    systemKb,memAvail,memoryLimit);
                LOG_ERRORC(wxT("not enough memory (%dkb) for chart cache, setting %dkb anyway: %s"),
                        chartCacheKb,minChartCacheDb,info);
            }
            else{
                wxString info=wxString::Format("Main: memory system=%dkb,avail=%dkb,limit=%dkb",
                    systemKb,memAvail,memoryLimit);
                LOG_INFOC(wxT("Memory settings: %s"),info);
            }
        }
        else{
            LOG_ERROR(wxT("unable to read memory info, starting with %dkb chart cache"),
                    chartCacheKb);
            memoryLimit=chartCacheKb;
        }
        //the second parsing needs to be done in one step as the states
        //are set when done - but this is ok as we do not need to distinguish
        //between uploaded and external charts any more
        //so we add all into chartlist
        for (size_t i=0;i<uploadChartList.Count();i++){
            chartlist.Add(uploadChartList.Item(i));
        }
        numCharts=chartManager->ReadCharts(chartlist,memoryLimit);
        if (numCharts < 1) {
            LOG_INFOC(_T("no charts loaded"));
        }
        LOG_INFO(wxT("loaded %d charts"),numCharts);
        int ourKb=0;
        SystemHelper::GetMemInfo(NULL,&ourKb);
        LOG_INFO(wxT("memory after reading charts: %dkb"),ourKb);
        
        ChartSetInfoList handledSets;
        chartSets=chartManager->GetChartSets();
        for (setIter=chartSets->begin();setIter!=chartSets->end();setIter++){
            LOG_INFO(wxT("creating handler for chart set %s"),setIter->second->info.dirname);
            webServer.AddHandler(new ChartRequestHandler(setIter->second,tokenHandler));          
        }
        
        chartManager->StartFiller(fileCacheSize*60/100,maxPrefillZoom);
        Thread waiter(new StopHandler(&webServer,parentPid,&mainQueue));
        waiter.start();
        waiter.detach();
        mainQueue.Loop(this);
        //waiter.stop();
        //waiter.join();
        wxMilliSleep(100);
        tokenHandler->stop();
        tokenHandler->join();
        webServer.Stop();
        chartManager->Stop();
        shutdownPlugins();
        LOG_INFOC(wxT("exiting"));
        Logger::instance()->Flush();
        return 0;
    }

    
};
wxIMPLEMENT_APP(AvNavProvider);

//trigger the linking of libGLU
extern "C" int dummy(void){
  gluNewTess();
  return 0;
}

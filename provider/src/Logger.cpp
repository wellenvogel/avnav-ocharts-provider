/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Chart Info
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
#include "Logger.h"
#include <wx/wfstream.h>
#include <wx/datetime.h>
#include <wx/thread.h>
#include <wx/filename.h>
#include <wx/dir.h>

Logger * Logger::_instance = NULL;

Logger::Logger(){ 
    initialized=false;
    level=LOG_LEVEL_INFO;
    currentLines=0;
    maxLines=10000;
}
void Logger::SetLevel(int l){
    level=l;
}
bool Logger::HasLevel(int level){
    return this->level >= level;
}

void Logger::Flush() {
    logFile->Flush();
}


void Logger::Write(const wxString &cat, const wxString &msg){
    if (!initialized) return;
    long id=(long)wxThread::GetCurrentId();
    mutex.Lock();
    struct timeval tv;
    gettimeofday(&tv,NULL);
    wxDateTime now(tv.tv_sec);
    logFile->WriteString(wxString::Format(_T("%s.%03d-0x%lx-%s-%s\n"),
            now.Format("%Y/%m/%d-%H:%M:%S"),(int)(tv.tv_usec/1000L),id,cat,msg));
    currentLines++;
    bool runHouseKeeping=false;
    if (currentLines > maxLines){
        runHouseKeeping=true;
        logFile->Flush();
        stream->Close();
        delete logFile;
        delete stream;
        RenameFile();
        stream=new wxFileOutputStream(filename);
        fcntl(stream->GetFile()->fd(),F_SETFD,FD_CLOEXEC);
        logFile= new wxTextOutputStream(*stream);
        currentLines=0;
    }
    mutex.Unlock();
    if (runHouseKeeping){
        HouseKeeping();
    }
}
void Logger::RenameFile(){
    if (wxFileExists(filename)){
        struct timeval tv;
        gettimeofday(&tv,NULL);
        wxDateTime now(tv.tv_sec);
        wxRenameFile(filename,filename+wxT(".")+now.Format("%Y-%m-%d-%H-%M-%S")); 
    }
}
#define MAX_KEEP 20
void Logger::HouseKeeping() {
    wxFileName logFileName=wxFileName::FileName(filename);
    logFileName.MakeAbsolute();
    wxArrayString logFiles;
    wxString directory=logFileName.GetPath();
    //if (directory == "") directory=wxFileName::GetCwd(); 
    size_t numFiles=wxDir::GetAllFiles(directory,&logFiles,logFileName.GetFullName()+wxT("*"),wxDIR_FILES);
    if (numFiles <= MAX_KEEP) return;
    logFiles.Sort(true);
    for (size_t i=MAX_KEEP;i<logFiles.Count();i++){
        wxString name=logFiles.Item(i);
        if (name == logFileName.GetFullPath()) continue;
        wxRemoveFile(name);
    }
}

void Logger::LogInfo(const wxString &msg){
    if (!HasLevel(LOG_LEVEL_INFO)) return;
    Write(_T("INFO"),msg);
}
void Logger::LogDebug(const wxString &msg){
    if (!HasLevel(LOG_LEVEL_DEBUG)) return;
    Write(_T("DEBUG"),msg);
}
void Logger::LogError(const wxString &msg){
    if (!HasLevel(LOG_LEVEL_ERROR)) return;
    Write(_T("ERROR"),msg);
}

Logger *Logger::instance(){
    return _instance!=NULL?_instance:new Logger();
}
void Logger::CreateInstance(wxString filename,long maxLines){
    _instance=new Logger();
    _instance->filename=filename;
    _instance->RenameFile();
    _instance->HouseKeeping();
    _instance->stream=new wxFileOutputStream(filename);
    fcntl(_instance->stream->GetFile()->fd(),F_SETFD,FD_CLOEXEC);
    _instance->logFile= new wxTextOutputStream(*(_instance->stream));
    _instance->initialized=true;
    _instance->maxLines=maxLines;
}
void Logger::SetMaxLines(long maxLines){
    this->maxLines=maxLines;
}

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
#ifndef _LOGGER_H
#define _LOGGER_H

#include <sys/time.h>
#include <wx/thread.h>
#include <wx/string.h>
#include <wx/txtstrm.h>
#include <wx/wfstream.h>

#define LOG_LEVEL_ERROR 0
#define LOG_LEVEL_INFO 1
#define LOG_LEVEL_DEBUG 2

#define LOG_INFO(...) if(Logger::instance()->HasLevel(LOG_LEVEL_INFO)) Logger::instance()->LogInfo(wxString::Format(__VA_ARGS__))
#define LOG_INFOC(...) {wxPrintf(__VA_ARGS__);wxPrintf("\n");if(Logger::instance()->HasLevel(LOG_LEVEL_INFO)) Logger::instance()->LogInfo(wxString::Format(__VA_ARGS__));}
#define LOG_DEBUG(...) if(Logger::instance()->HasLevel(LOG_LEVEL_DEBUG)) Logger::instance()->LogDebug(wxString::Format(__VA_ARGS__))
#define LOG_ERROR(...) if(Logger::instance()->HasLevel(LOG_LEVEL_ERROR)) Logger::instance()->LogError(wxString::Format(__VA_ARGS__))
#define LOG_ERRORC(...) {wxPrintf(__VA_ARGS__);wxPrintf("\n");if(Logger::instance()->HasLevel(LOG_LEVEL_ERROR)) Logger::instance()->LogError(wxString::Format(__VA_ARGS__));}
class Logger {
private:
    static Logger *_instance;
    wxTextOutputStream *logFile;
    wxFileOutputStream *stream;
    wxString filename;
    bool initialized;
    long maxLines;
    long currentLines;
    int level;
    wxMutex mutex;
    Logger();
    void Write(const wxString &cat, const wxString &msg );
    void HouseKeeping();
    void RenameFile();
    
public:
    void LogInfo(const wxString &msg);
    void LogDebug(const wxString &msg);
    void LogError(const wxString &msg);
    void SetLevel(int level);
    bool HasLevel(int level);
    void Flush();
    void SetMaxLines(long maxLines);
    //timestmap in 0.1ms
    static inline long MicroSeconds100()
    {
        timeval tv;
        gettimeofday(&tv,0);
        return ((long)tv.tv_sec) * 10000L +
            ((long)tv.tv_usec) / 100L;
    }
    static Logger *instance();
    static void CreateInstance(wxString filename,long maxLines=10000);

    
};

class Kaese{
    void mist(){};
};

#endif 

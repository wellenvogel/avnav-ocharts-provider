/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Cache Handler
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
#ifndef CACHEHANDLER_H
#define CACHEHANDLER_H
#include "SimpleThread.h"
#include "RefCount.h"
#include "ChartSet.h"
#include "MD5.h"
#include "ItemStatus.h"
#include <map>
#include <deque>
#include <wx/wx.h>
#include <wx/mstream.h>

//a define that has to be changed with a new version 
//if the rendering was adapted - whenever it is changed,
//old caches will be invalidated
#define CACHE_VERSION_IDENTIFIER 3

class CacheEntry : public RefCount{
public:
    typedef enum{
        MEMORY=0,
        DISK_AND_MEMORY        
    } CacheMode;
    wxMemoryOutputStream   *data;
    unsigned long           insertTime;
    wxFileOffset            offset;
    CacheMode               mode;
    MD5Name                 name;
    bool                    prefill;
    CacheEntry(MD5Name name,wxMemoryOutputStream *data):RefCount(){
        this->data=data;
        offset=0;
        mode=MEMORY;
        insertTime=0;
        this->name=name;
        prefill=false;
    }
    
    CacheEntry(MD5Name name,wxMemoryOutputStream *data,wxFileOffset offset):RefCount(){
        this->data=data;
        offset=offset;
        mode=DISK_AND_MEMORY;
        insertTime=0;
        this->name=name;
        prefill=false;
    }
    
    CacheEntry(MD5Name name):RefCount(){
        mode=MEMORY;
        data=NULL;
        offset=0;
        this->name=name;
        prefill=false;
    }
    /**
     * we assume that we can safely do this without any lock
     * from the writer/cleaner thread
     * worst case we would assume that there is no disk data yet
     * but as this is only considered during add (so it cannot interfere)
     * or during write out - what is done by the same thread that calls this method
     * we only have to be careful not to call it from other threads
     * @param offset
     */
    void SetOffset(wxFileOffset offset){
        this->offset=offset;
        mode=DISK_AND_MEMORY;
    }
    bool HasMemoryData(){
        return data != NULL;
    }
    bool HasDiskData(){
        return mode == DISK_AND_MEMORY;
    }
    size_t GetLength(){
        if (data == NULL) return 0;
        return data->GetLength();
    }
    unsigned char * GetData(){
        if (data == NULL) return NULL;
        return (unsigned char *)(data->GetOutputStreamBuffer()->GetBufferStart());
    }
    size_t GetCompleteSize(){
        //approximate... name: for entry name, for key and for entry vector
        //most probably some overhead - so we add some fixed overhead
        return GetLength()+sizeof(CacheEntry)+20;
    }
 private:    
    virtual ~CacheEntry(){
        if (data != NULL){
            delete data;
        }
    }
};

class CacheFileWrite{
public:
    /**
     * write out an entry to disk
     * do not modify the entry!
     * @param entry
     * @return 0 if error, offset otherwise
     */
    virtual wxFileOffset WriteToDisk(CacheEntry *entry)=0;
};


typedef std::pair<wxString,CacheEntry *> CacheValue;
class DiskCache;
class CacheHandler : public ItemStatus{
    typedef std::map<MD5Name,CacheEntry*> CacheMap;
private:
    size_t                          currentBytes;
    std::mutex                      lock;
    std::mutex                      fileLock;
    CacheMap                        inMemoryCache;
    std::deque<MD5Name>             writeOutQueue;
    std::deque<MD5Name>             cleanupQueue;
    unsigned long                   maxEntries;
    unsigned long                   maxFileEntries;
    wxString                        cacheFileName;
    wxString                        chartSetKey;
    wxFile                          *cacheFile;
    DiskCache                       *diskCache;
public:
    CacheHandler(wxString chartSetKey,unsigned long maxEntries,unsigned long maxFileEntries);
    virtual ~CacheHandler();
    void            Reset();
    /**
     * add (and consume) entry
     * @param entry
     * @return 
     */
    bool            AddEntry(CacheEntry *entry);
    CacheEntry      *FindEntry(MD5Name name,bool readData=true);
    bool            HasDiskEntry(MD5Name);
    bool            AddDiskEntry(MD5Name name,wxFileOffset offset);
    long            RunCleanup(CacheFileWrite *writer,bool canWriteToDisk,int percentLevel=90);
    bool            OpenCacheFile(wxString fileName,wxString hash);
    unsigned long   GetWriteQueueSize();
        
    unsigned long   MaxEntries(){return maxEntries;}
    unsigned long   CurrentEntries(){
                        Synchronized locker(lock);
                        return (unsigned long)inMemoryCache.size();
                    }
    size_t          CurrentBytes(){
                        return currentBytes;
                    }
    unsigned long   GetCompleteSizeKb();
    unsigned long   GetMaxSizeKb();
    unsigned long   CurrentDiskEntries();
    unsigned long   MaxDiskEntries();
    wxString        ToJson();
                     
private:

};

class CacheReaderWriter : public Thread{
public:
    typedef enum{
        STATE_NONE,
        STATE_READING,
        STATE_WRITING,
        STATE_ERROR        
    } RwState;
    CacheReaderWriter(wxString fileName,wxString hash,CacheHandler *handler,long maxFileEntries);
    virtual             ~CacheReaderWriter();
    virtual             void run();
    RwState             GetState();
    virtual wxString    ToJson();
    
private:
    bool            ReadFile();
    bool            DeleteFile();
    wxString        fileName;
    wxString        hash;
    CacheHandler    *handler;
    wxFile          *file;
    RwState         state;
    long            maxFileEntries;
    long            initiallyRead;
    long            numWritten;
    wxFileOffset    endPos;
};


#endif /* CACHEHANDLER_H */


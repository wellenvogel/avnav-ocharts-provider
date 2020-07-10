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

#include <wx/time.h>
#include "CacheHandler.h"
#include "Logger.h"
#include "Renderer.h"
#include "HTTPd/HTTPServer.h"
#include "MD5.h"
#include "SystemHelper.h"

#define MAX_DATALEN 100000
typedef struct{
    char            magic[8];
    char            headerLen; //len of complete header
    unsigned int    version;
    char            token[MD5_LEN*2];
} FileHeader;

typedef struct{
    char            magic[4];
    unsigned char   headerLen;
    unsigned int    version;
    unsigned int    dataLen;
    MD5Name         name;
} RecordHeader;

#define CURRENT_VERSION 2
#define FILE_MAGIC "AVOCACHE"
#define RECORDMAGIC "AVOR"


/**
 * open a cache file for reading
 * @param fileName
 * @param hash
 * @return NULL on any error
 */
static wxFile * openCacheFile(wxString fileName, wxString hash) {
    if (!wxFileExists(fileName)) return NULL;
    FileHeader fheader;
    wxFile *file = new wxFile(fileName, wxFile::read);

    LOG_INFO(wxT("start reading cache file %s"), fileName);
    if (!file->IsOpened()) {
        LOG_ERROR(wxT("unable to open cache file %s, deleting it"), fileName);
        delete file;
        return NULL;
    }
    unsigned long rd = file->Read(&fheader, sizeof (FileHeader));
    if (rd != sizeof (FileHeader)) {
        LOG_ERROR(wxT("unable to read cache file %f, not enough bytes for header"), fileName);
        file->Close();
        delete file;
        return NULL;
    }
    if (memcmp(fheader.magic, FILE_MAGIC, sizeof (fheader.magic)) != 0) {
        LOG_ERROR(wxT("invalid file magic in %s"), fileName);
        file->Close();
        delete file;
        return NULL;
    }
    if (fheader.version != CURRENT_VERSION) {
        LOG_INFO(wxT("unknown file version %d detected in %s"), fheader.version, fileName);
        file->Close();
        delete file;
        return NULL;
    }
    if (memcmp(fheader.token, hash.ToAscii().data(), sizeof (fheader.token)) != 0) {
        LOG_INFO(wxT("changed cache header token, delete file %s"), fileName);
        file->Close();
        delete file;
        return NULL;
    }
    if (fheader.headerLen != sizeof (FileHeader)) {
        //should not happen in version 1...
        LOG_INFO(wxT("invalid header len in %s, deleting"), fileName);
        file->Close();
        delete file;
        return NULL;
    }

    return file;
}

bool readAndCheckHeader(wxString fileName, wxFile *file, RecordHeader *rheader) {
    wxFileOffset pos=file->Tell();
    int rt = file->Read(rheader, sizeof (RecordHeader));
    if (rt != sizeof (RecordHeader)) {
        LOG_INFO(wxT("unable to read record header in %s at %lld"),
                fileName,(long long)pos);
        return false;
    }
    if (memcmp(rheader->magic, RECORDMAGIC, sizeof (RecordHeader::magic)) != 0) {
        LOG_INFO(wxT("invalid record magic in %s at %lld"),
                fileName,(long long)pos);
        return false;
    }
    if (rheader->version != CURRENT_VERSION) {
        LOG_INFO(wxT("invalid record version in %s at %lld"),
                rheader->version,
                fileName,(long long)pos);
        return false;
    }
    if (rheader->dataLen > MAX_DATALEN){
        LOG_INFO(wxT("invalid data len %d in %s at %lld"),
                rheader->dataLen,
                fileName,(long long)pos);
        return false;
    }
    return true;
}

class DiskCacheEntry{
public:
    wxFileOffset    offset; //offset 0 - empty
    MD5Name         name;
    DiskCacheEntry  *next;
    DiskCacheEntry(){
        offset=0;
        next=NULL;
       
    }
};
class DiskCacheChunk{
public:
    const static int CHUNKSIZE=1000;
    DiskCacheEntry  entries[CHUNKSIZE];
    int             lastUsed;
    DiskCacheChunk  *next;
    DiskCacheChunk(){
        lastUsed=0;
        next=NULL;
        memset(entries,0,sizeof(entries));
    }
    ~DiskCacheChunk(){
    }
    DiskCacheEntry *getNext(){
        if (lastUsed >= CHUNKSIZE) return NULL;
        DiskCacheEntry *rt=&entries[lastUsed];
        lastUsed++;
        return rt;
    }
};

class DiskCache{
    const int MAXBUCKETS=2<<16;
private:
    wxString        name;
    std::mutex      lock;
    DiskCacheChunk  *freeList;
    DiskCacheEntry  **buckets;
    int             bucketSize=1;
    int             bucketMask=0;
    int             numChunks;
    unsigned long   numentries=0;
    unsigned long   maxSize;
    /**
     * get the bucket
     * @param name - MD5_LEN
     * @return 
     */
    int             getBucket(MD5Name name){
        int *n=(int *)(name.GetValue()+name.len-sizeof(int));
        int rt= (*n) & bucketMask;
        rt = rt % bucketSize; //to be sure...
        return rt;
    }
    DiskCacheEntry  *getNextEntry(){
        DiskCacheEntry *rt=NULL;
        if (freeList != NULL) rt=freeList->getNext();
        if (! rt){
            DiskCacheChunk *newChunk=new DiskCacheChunk();
            numChunks++;
            newChunk->next=freeList;
            freeList=newChunk;
            rt=freeList->getNext();
        }
        return rt;
    }
public:
    DiskCache(wxString name,long maxSize){
        this->name=name;
        this->maxSize=maxSize;
        this->numentries=0;
        this->freeList=NULL;
        this->numChunks=0;
        while (bucketMask < maxSize/10 && bucketMask <= MAXBUCKETS){
            bucketMask = (bucketMask << 1) | 1;
        }
        bucketSize=bucketMask+1;
        buckets = new DiskCacheEntry*[bucketSize];
        for (int i=0;i<bucketSize;i++){
            buckets[i]=NULL;
        }
        LOG_DEBUG(wxT("created disk cache for %ld entries, bucket size %d, mask=%x"),
                maxSize,bucketSize,bucketMask);
        
    }
    void Clear(bool doLock=true){
        if (doLock) lock.lock();
        for (int i=0;i<bucketSize;i++){
            buckets[i]=NULL;
        }
        DiskCacheChunk *freeChunk=freeList;
        DiskCacheChunk *next=NULL;
        while (freeChunk != NULL){
            next=freeChunk->next;
            delete freeChunk;
            freeChunk=next;
        }
        freeList=NULL;
        numChunks=0;
        numentries=0;
        if (doLock) lock.unlock();
    }
    ~DiskCache(){
        Clear(false);
        delete buckets;
    }
    
    bool Find(MD5Name name,/*out*/DiskCacheEntry &out){
        Synchronized locker(lock);
        int bucket=getBucket(name);
        DiskCacheEntry *rt=NULL;
        if ((rt=buckets[bucket]) == NULL) return false;
        while (rt != NULL){
            if (rt->name == name){
                out=*rt;
                return true;
            }
            rt=rt->next;
        }
        return false;
        
    }
    bool Add(MD5Name ename, wxFileOffset offset){
        Synchronized locker(lock);
        if (numentries >= maxSize) return false;
        int bucket=getBucket(ename);
        DiskCacheEntry *entry=buckets[bucket];
        DiskCacheEntry *last=NULL;
        bool exists=false;
        while (entry != NULL){
            last=entry;
            if (entry->name == ename){
                exists=true;
                break;
            }
            entry=entry->next;
        }
        if (exists){
            entry->offset=offset;
            LOG_DEBUG(wxT("DiskCache %s: entry %s already exists, update"),name,ename.ToString());
            return true;
        }
        entry=getNextEntry();
        if (entry == NULL){
            return false;
        }
        entry->name=ename;
        entry->offset=offset;
        numentries++;
        if (last){
            last->next=entry;
        }
        else{
            buckets[bucket]=entry;
        }
        return true;
    }
    
    unsigned long GetSize(){
        Synchronized locker(lock);
        return numentries;
    }
    unsigned long GetByteSizeKb(){
        Synchronized locker(lock);
        return (numChunks * sizeof(DiskCacheChunk)+sizeof(DiskCache)+bucketSize*sizeof(DiskCacheEntry *))/1000;
    }
    wxString ToString(){
        return wxString::Format(wxT("DiskCache %s:%ld entries, %ldkb"),name,GetSize(),GetByteSizeKb());
    }
    unsigned long GetMaxSizeKb(){
        unsigned long rt=sizeof(buckets)/1024;
        rt+=(maxSize/DiskCacheChunk::CHUNKSIZE+1)*sizeof(DiskCacheChunk)/1024;
        return rt;
    }
    
    
};

CacheHandler::CacheHandler(wxString chartSetKey,unsigned long numEntries,unsigned long maxFileEntries) {
    currentBytes=0;
    maxEntries=numEntries;
    cacheFileName=wxEmptyString;
    cacheFile=NULL;
    this->chartSetKey=chartSetKey;
    this->maxFileEntries=maxFileEntries;
    this->diskCache= new DiskCache(chartSetKey,maxFileEntries);
}

void CacheHandler::Reset() {
    {
        Synchronized locker(lock);
        CacheMap::iterator it;
        for (it = inMemoryCache.begin(); it != inMemoryCache.end(); it++) {
            it->second->Unref();
        }
        if (cacheFile != NULL) {
            cacheFile->Close();
            delete cacheFile;
            cacheFile=NULL;
        }
        inMemoryCache.clear();
    }
    diskCache->Clear(true);
}


CacheHandler::~CacheHandler() {
    CacheMap::iterator it;
    for (it=inMemoryCache.begin();it != inMemoryCache.end();it++){
        it->second->Unref();
    }
    if (cacheFile != NULL){
        cacheFile->Close();
        delete cacheFile;
    }
}

wxString CacheHandler::ToJson(){
    wxString rt;
    {
        Synchronized locker(lock);
        rt=wxString::Format("{"
                JSON_IV(memoryEntries,%ld) ",\n"
                JSON_IV(maxMemoryEntries,%ld) ",\n"
                JSON_IV(memoryBytes,%ld) ",\n",
                inMemoryCache.size(),
                maxEntries,
                currentBytes);
    }
    rt.Append(wxString::Format(
        JSON_IV(diskEntries,%ld) ",\n"
        JSON_IV(maxDiskEntries,%ld) ",\n"
        JSON_IV(diskMemorySizeKb,%ld) "\n"
        "}\n",
        diskCache->GetSize(),
        MaxDiskEntries(),
        diskCache->GetByteSizeKb()));
    return rt;
}

unsigned long CacheHandler::CurrentDiskEntries(){
    return diskCache->GetSize();
}
unsigned long CacheHandler::MaxDiskEntries(){
    return maxFileEntries;
}

unsigned long CacheHandler::GetCompleteSizeKb(){
    unsigned long rt=0;
    rt+=diskCache->GetByteSizeKb();
    {
        Synchronized locker(lock);
        rt+=currentBytes/1024;
    }
    return rt;
}
unsigned long CacheHandler::GetMaxSizeKb(){
    unsigned long rt=maxEntries*3; //average size of png
    rt+=diskCache->GetMaxSizeKb();
    return rt;
}



bool CacheHandler::AddEntry(CacheEntry* entry){
    if (maxEntries < 1) {
        return false;
    }
    CacheMap::iterator it;
    Synchronized locker(lock);
    it=inMemoryCache.find(entry->name);
    if (it != inMemoryCache.end()) {
        currentBytes-=it->second->GetCompleteSize();
        it->second->Unref();
    }
    entry->Ref();
    entry->insertTime=wxGetLocalTime();
    if (! entry->HasDiskData()){
        writeOutQueue.push_back(entry->name);
    }
    else{
        if (entry-> HasMemoryData()){
            cleanupQueue.push_back(entry->name);
        }
    }
    inMemoryCache[entry->name]=entry;
    size_t entrySize=entry->GetCompleteSize();
    currentBytes+=entrySize;
    return true;
}


bool CacheHandler::HasDiskEntry(MD5Name ename) {
    DiskCacheEntry de;
    return diskCache->Find(ename,de);
}


bool CacheHandler::AddDiskEntry(MD5Name name, wxFileOffset offset) {
    return diskCache->Add(name,offset);
}


CacheEntry * CacheHandler::FindEntry(MD5Name name, bool readData) {
    CacheMap::iterator it;
    CacheEntry *e = NULL;
    {
        Synchronized locker(lock);
        it = inMemoryCache.find(name);
        if (it != inMemoryCache.end()) {
            e = it->second;
            e->Ref();
        }
    }
    if (e != NULL) {
        return e;
    }
    if (!readData) {
        return NULL;
    }
    DiskCacheEntry diskEntry;
    if (!diskCache->Find(name, diskEntry)) {
        return NULL;
    }
    LOG_DEBUG(wxT("read cache entry from disk %s"), name.ToString());
    if (cacheFile == NULL) {
        LOG_ERROR(wxT("cannot load cache entry from disk as there is no file open %s"), name.ToString());
        return NULL;
    }
    RecordHeader rheader;
    wxMemoryOutputStream *os = NULL;
    {
        Synchronized locker(fileLock);
        wxFileOffset s = cacheFile->Seek(diskEntry.offset);
        if (s != diskEntry.offset) {
            LOG_ERROR(wxT("cannot load cache entry from disk , invalid seek %s"), name.ToString());
            return NULL;
        }
        if (!readAndCheckHeader(cacheFileName, cacheFile, &rheader)) {
            LOG_ERROR(wxT("cannot load cache entry from disk , invalid header %s"), name.ToString());
            return NULL;
        }
        if (name != rheader.name) {
            LOG_ERROR(wxT("cannot load cache entry from disk , invalid name in header %s"), name.ToString());
            return NULL;
        }
        os = new wxMemoryOutputStream();
        os->GetOutputStreamBuffer()->SetBufferIO(rheader.dataLen);
        int rd = cacheFile->Read(os->GetOutputStreamBuffer()->GetBufferStart(), rheader.dataLen);
        if (rd != (int) rheader.dataLen) {
            LOG_ERROR(wxT("cannot load cache entry from disk , unable to read %d bytes: %s"), rheader.dataLen, name.ToString());
            delete os;
            return NULL;
        }
    }
    e = new CacheEntry(name, os, diskEntry.offset);
    AddEntry(e);
    return e;
}

//max number of writes before we run memory cleanup
#define MAX_WRITES 1000

long CacheHandler::RunCleanup(CacheFileWrite *writer,bool canWriteToDisk,int percentLevel){
    unsigned long highWater=percentLevel * maxEntries / 100;
    CacheMap::iterator it;
    //step 1 get all entries we have to write out
    //as the entries are not protected  we never modify an entry
    //but create new ones
    std::vector<CacheEntry *> writeOutList;
    bool finished=false;
    long overallRemoved=0;
    while (!finished) {
        long removeCount=0;
        long writeOutCount=0;
        long inMemory=0;
        int numWrites=0;
        while (!finished && numWrites < MAX_WRITES) {
            {
                Synchronized locker(lock);
                if (writeOutQueue.size() < 1){
                    finished=true;
                    break;
                }
                numWrites++;
                MD5Name key = writeOutQueue.front();
                writeOutQueue.pop_front();
                it = inMemoryCache.find(key);
                if (it != inMemoryCache.end()) {
                    if (canWriteToDisk) {
                        writeOutList.push_back(it->second);
                        it->second->Ref();
                    } else {
                        cleanupQueue.push_back(it->second->name);
                    }
                } else {
                    LOG_DEBUG(wxT("unable to find cache entry for %s"), key.ToString());
                }
            }
        }
        //step 2 now write out entries to disk
        std::vector<CacheEntry *>::iterator rit;
        for (rit = writeOutList.begin(); rit != writeOutList.end(); rit++) {
            CacheEntry *e = *rit;
            //the next check should never fail
            //as entries are only enqueued here if they do not have 
            //disk data
            if (!e->HasDiskData()) {
                wxFileOffset offset = writer->WriteToDisk(e);
                if (offset == 0) {
                    LOG_DEBUG(wxT("Cache cleanup %s unable to write cache entry %s to disk"), chartSetKey, (*rit)->name.ToString());
                } else {
                    writeOutCount++;
                    LOG_DEBUG(wxT("Cache cleanup %s writing entry %s to disk"), chartSetKey, (*rit)->name.ToString());
                    e->SetOffset(offset);
                    if (!diskCache->Add(e->name,offset)){
                        LOG_DEBUG(wxT("Cache cleanup %s: disk cache is full"),chartSetKey);
                    }
                }
            }
            if (e->prefill){
                //do not go through the cleanup queue but remove directly
                Synchronized locker(lock);
                if (inMemoryCache.erase(e->name)){
                    currentBytes -= e->GetCompleteSize();
                    e->Unref();
                }
            }
            else{
                Synchronized locker(lock);
                cleanupQueue.push_back(e->name);
            }
            e->Unref();
        }
        writeOutList.clear();
        //step 3
        //cleanup entries from the cleanup queue
        unsigned long cleanupSize=0;
        {
            Synchronized locker(lock);
            cleanupSize=cleanupQueue.size();
        }
        inMemory+=cleanupSize;
        bool cleanupDone=false;
        if (cleanupSize > highWater) {
            LOG_INFO(wxT("Cache cleanup %s starting from %ld to %ld"), chartSetKey, cleanupQueue.size(), highWater);
            while (!cleanupDone) {
                MD5Name name;
                {
                    Synchronized locker(lock);
                    if (cleanupQueue.size() < highWater){
                        cleanupDone=true;
                        break;
                    }
                    name = cleanupQueue.front();
                    cleanupQueue.pop_front();
                }
                CacheEntry *e = FindEntry(name, false);
                if (e == NULL) {
                    continue;
                }
                if (canWriteToDisk && ! e->HasDiskData()){
                    LOG_ERROR(wxT("Cache cleanup %s unable to clean cache entry %s (not on disk), removing"),
                            chartSetKey, name.ToString());
                }
                {
                    Synchronized locker(lock);
                    if (inMemoryCache.erase(name)) {
                        e->Unref(); //map
                        currentBytes -= e->GetCompleteSize();
                    }
                }
                removeCount++;
                e->Unref();
            }
        }
        int ourKb;
        SystemHelper::GetMemInfo(NULL, &ourKb);
        LOG_DEBUG(wxT("Cache cleanup %s: wrote %ld entries, removed %ld from %ld in memory entries, current size =%lld bytes, %ld entries, %s,memory=%dkb"),
                chartSetKey, writeOutCount, removeCount, inMemory, (long long) currentBytes, (long) inMemoryCache.size(), diskCache->ToString(),ourKb);
        overallRemoved+=removeCount;
    }
    return overallRemoved;
}

bool CacheHandler::OpenCacheFile(wxString fileName,wxString hash){
    Synchronized locker(lock);
    if (this->cacheFile != NULL){
        this->cacheFile->Close();
        delete this->cacheFile;
        this->cacheFile=NULL;
    }
    this->cacheFileName=fileName;
    LOG_INFO(wxT("CacheHandler %s open cache file %s"),chartSetKey,fileName);
    cacheFile=openCacheFile(fileName,hash);
    if (cacheFile == NULL){
        LOG_ERROR(wxT("CacheHandler %s: unable to open cache file %s"),chartSetKey,cacheFileName);
        return false;
    }
    return true;
}
unsigned long CacheHandler::GetWriteQueueSize(){
    Synchronized locker(lock);
    return writeOutQueue.size();
}

CacheReaderWriter::CacheReaderWriter(wxString fileName, wxString hash, CacheHandler* handler,long maxFileEntries): Thread() {
    this->fileName=fileName;
    this->hash=hash;
    this->handler=handler;
    this->file=NULL;
    this->state=STATE_NONE;
    this->maxFileEntries=maxFileEntries;
    this->initiallyRead=0;
    this->numWritten=0;
    this->endPos=0;
}
CacheReaderWriter::~CacheReaderWriter(){
    if (file != NULL){
        file->Close();
        delete file;
        file=NULL;
    }
}

CacheReaderWriter::RwState CacheReaderWriter::GetState(){
    return state;
}
wxString CacheReaderWriter::ToJson(){
    wxString status="UNKNOWN";
    switch(GetState()){
        case STATE_NONE:
            status="NONE";
            break;
        case STATE_ERROR:
            status="ERROR";
            break;
        case STATE_READING:
            status="READING";
            break;
        case STATE_WRITING:
            status="WRITING";
            break;
    }
    wxString rt=wxString::Format("{"
            JSON_SV(status,%s) ",\n"
            JSON_SV(fileName,%s) ",\n"
            JSON_IV(written,%ld) ",\n"
            JSON_IV(maxAllowed,%ld) ",\n"
            JSON_IV(initiallyRead,%ld) ",\n"
            JSON_IV(fileSize,%lld) "\n"
            "}",
            status,
            fileName,
            numWritten,
            maxFileEntries,
            initiallyRead,
            (long long)endPos);
    return rt;
}

bool CacheReaderWriter::DeleteFile(){
    LOG_INFO(wxT("CacheReaderWriter removing cache file %s"),fileName);
    return wxRemoveFile(fileName);
}

class CacheWriterImpl: public CacheFileWrite{
private:
    wxFile *file;
    wxString fileName;
public:
    long numWritten;
    long maxRecords;
    wxFileOffset currentPos;
    CacheWriterImpl(wxString fileName,wxFile *file,long maxRecords){
        this->file=file;
        this->fileName=fileName;
        this->maxRecords=maxRecords;
        numWritten=0;
        currentPos=file->Tell();
    }
    virtual wxFileOffset WriteToDisk(CacheEntry *entry){
        if (this->file == NULL) {
            LOG_ERROR(wxT("CacheReaderWriter::WriteToDisk: %s cache file %s not open(1)"),entry->name.ToString(),fileName);
            return 0;
        }
        if (!this->file->IsOpened()) {
            LOG_ERROR(wxT("CacheReaderWriter::WriteToDisk: %s cache file %s not open(2)"),entry->name.ToString(),fileName);
            return 0;
        }
        if (entry->mode != CacheEntry::MEMORY){
            LOG_ERROR(wxT("CacheReaderWriter::WriteToDisk: %s invalid mode %d"),entry->name.ToString(),entry->mode);
            return 0;
        }
        if (numWritten >= maxRecords){
            LOG_ERROR(wxT("CacheReaderWriter::WriteToDisk: %s limit of %ld records reached"),entry->name.ToString(),maxRecords);
            return 0;
        }
        wxFileOffset pos=file->Tell();
        RecordHeader rheader;
        memcpy(rheader.magic,RECORDMAGIC,sizeof(rheader.magic));
        rheader.version=CURRENT_VERSION;
        rheader.name=entry->name;
        rheader.dataLen=entry->GetLength();
        rheader.headerLen=sizeof(rheader);
        unsigned int wr=file->Write(&rheader,sizeof(rheader));
        if (wr != sizeof(rheader)){
            LOG_ERROR(wxT("CacheReaderWriter: unable to write header to cache file %s"),fileName);
            return 0;
        }
        if (entry->GetLength() != 0) {
            wr=file->Write(entry->GetData(),entry->GetLength());
            if (wr != entry->GetLength()){
                LOG_ERROR(wxT("CacheReaderWriter: unable to write data to cache file %s"),fileName);
                return 0;
            }
        }
        numWritten++;
        file->Flush(); //need to write to disk as the cache could try to read afterwards
        currentPos=pos;
        return pos;
        
    }
};

bool CacheReaderWriter::ReadFile() {
    FileHeader fheader;
    bool append = false;
    initiallyRead=0;
    if (!wxFileExists(fileName)) {
        return false;
    }
    wxULongLong fileSize=wxFileName::GetSize(fileName);
    state = STATE_READING;
    file = openCacheFile(fileName, hash);
    if (file == NULL) {
        DeleteFile();
        return false;
    }
    bool needsTruncate = false;
    append = true;
    wxFileOffset lastPos = file->Tell();
    endPos=lastPos;
    char nameBuffer[2 * MD5_LEN + 1];
    LOG_INFO(wxT("start reading cache entries from %s"), fileName);
    while (!file->Eof() && !shouldStop()) {
        if (initiallyRead >= maxFileEntries){
            LOG_INFO(wxT("CacheReaderWriter: current cache file is bigger then allowed %ld records, truncate"),maxFileEntries);
            needsTruncate=true;
            break;
        }
        RecordHeader rheader;
        if (!readAndCheckHeader(fileName, file, &rheader)) {
            needsTruncate = true;
            break;
        }
        LOG_DEBUG(wxT("CacheReaderWriter: adding cache entry %s from %s"), rheader.name.ToString(), fileName);
        if (handler->AddDiskEntry(rheader.name,lastPos)){
            initiallyRead++;
        }
        else{
            LOG_DEBUG(wxT("CacheReaderWriter: disk cache is full in read from %s"),fileName);
        }
        wxFileOffset next = file->Seek(rheader.dataLen, wxFromCurrent);
        if (next == wxInvalidOffset || (next != (lastPos+(int)sizeof(RecordHeader)+rheader.dataLen)) || next > fileSize) {
            LOG_ERROR(wxT("CacheReaderWriter: unable to seek after %ld records in %s"), initiallyRead, fileName);
            needsTruncate = true;
            break;
        }
        lastPos = next;
        if (lastPos == fileSize) break;
        endPos=lastPos;
    }

    file->Close();
    file = NULL;
    if (shouldStop()) return false;
    if (needsTruncate) {
        LOG_INFO(wxT("CacheReaderWriter: truncating file %s to %lld"), fileName, (long long) lastPos);
        truncate(fileName.ToUTF8().data(), lastPos);
        endPos=lastPos;
    }
    LOG_INFO(wxT("CacheReaderWriter: cache reading finished after %ld entries for %s"), initiallyRead, fileName);
    return append;
}

void CacheReaderWriter::run() {
    if (hash.ToAscii().length() != (2 * MD5_LEN)) {
        LOG_ERROR(wxT("CacheReaderWriter: invalid len of cache hash %d for %s"), (int) hash.ToAscii().length(),fileName);
        state = STATE_ERROR;
        DeleteFile();
    }
    if (maxFileEntries < 1){
        LOG_INFO(wxT("CacheReaderWriter: file caching disabled by parameter for %s"),fileName);
    }
    bool append = false;
    if (state != STATE_ERROR && maxFileEntries > 0) {
        append = ReadFile();
    }
    if (shouldStop()) return;
    FileHeader fheader;
    if (state != STATE_ERROR) {
        bool canWrite = (maxFileEntries >= 1);
        while (true && !shouldStop()) {
            file = new wxFile(fileName, append ? wxFile::write_append : wxFile::write);
            if (!file->IsOpened()) {
                LOG_ERROR(wxT("CacheReaderWriter: cannot open file %s for writing"), fileName);
                file = NULL;
                canWrite = false;
                break;
            }
            if (!append) {
                memcpy(fheader.magic, FILE_MAGIC, sizeof (fheader.magic));
                fheader.version = CURRENT_VERSION;
                fheader.headerLen = sizeof (fheader);
                memcpy(fheader.token, hash.ToAscii().data(), sizeof (fheader.token));
                int wr = file->Write(&fheader, sizeof (fheader));
                if (wr != sizeof (fheader)) {
                    LOG_ERROR(wxT("CacheReaderWriter: unable to write file header to %s"), fileName);
                    canWrite = false;
                    break;
                }
            }
            break;
        }
        if (!canWrite) {
            if (file != NULL) {
                file->Close();
            }
            file = NULL;
            LOG_ERROR(wxT("CacheReaderWriter: cache file writing for %s disabled"), fileName);
        }
        if (file != NULL) {
            file->Flush();
        }
        if (file) handler->OpenCacheFile(fileName, hash);
        state = STATE_WRITING;
    }
    if (shouldStop()) return;
    LOG_INFO(wxT("CacheReaderWriter for %s: starting write phase, current: %ld still allowing %ld entries"),
        fileName,initiallyRead,(maxFileEntries-initiallyRead));
    if (file) endPos=file->Seek(0,wxSeekMode::wxFromEnd); //trigger ftell to report correctly
    CacheWriterImpl writer(fileName, file,maxFileEntries-initiallyRead);
    while (!shouldStop()) {
        waitMillis(1000);
        if (shouldStop()) break;
        handler->RunCleanup(&writer,maxFileEntries >=1);
        numWritten=writer.numWritten;
        endPos=writer.currentPos;
        if (file) file->Flush();
    }
    LOG_INFO(wxT("CacheReaderWriter for %s: stopping cache file writer"), fileName);
    if (file) file->Close();
}


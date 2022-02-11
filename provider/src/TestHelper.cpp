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

#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <string.h>
#include <vector>
#include <dlfcn.h>
#include "SimpleThread.h"
#include "Logger.h"
#include "TestHelper.h"
typedef int (*OpenFunction)(const char *pathname, int flags,...);
typedef int (*CloseFunction)(int fd);


#define TESTKEY_ENV "AVNAV_TEST_KEY"
#define OCPN_PIPE "/tmp/OCPN_PIPEX"
#define TEST_PIPE_ENV "AVNAV_TEST_PIPE"


#define BUFSIZE 4096
#define PRFX "forward"

class Writer : public Thread{
    char buffer[BUFSIZE];
    int inHandle;
    int outHandle;
    public:
        bool done=false;
        Writer(int inHandle, int outHandle){
            this->inHandle=inHandle;
            this->outHandle=outHandle;
        }
        virtual void run(){
            LOG_DEBUG("%s-writer(%d): start",PRFX,inHandle);
            size_t rd=0;
            size_t nBytes=0;
            while((rd=read(inHandle,buffer,BUFSIZE)) > 0){
                nBytes+=rd;
                write(outHandle,buffer,rd);
            }
            LOG_DEBUG("%s-writer(%d): finished after %lld bytes",PRFX,inHandle,(long long)nBytes);
            close(inHandle);
            close(outHandle);
            done=true;
        }
};

class Forwarder : public Thread{
    const char * outName=NULL;
    std::vector<Writer*> writers;
    OpenFunction openFunction;
    int inPipe=-1;
    int outPipe=-1;
    public:
        Forwarder(OpenFunction open,int readFd, const char *outName){
            this->openFunction=open;
            this->inPipe=readFd;
            this->outName=outName;
        }
        virtual void run(){
            LOG_INFO("forward started");
            const char *testKey=getenv(TESTKEY_ENV);
            if (testKey == NULL){
                LOG_ERROR("%s:no environment %s found",PRFX,TESTKEY_ENV);
            }
            char buffer[BUFSIZE];
            char fname[257];
            char fifo[257];
            while (! shouldStop()){
                auto it=writers.begin();
                while (it != writers.end()){
                    if ((*it)->done){
                        (*it)->join();
                        delete (*it);
                        writers.erase(it);
                    }
                    else{
                        it++;
                    }
                }
                ssize_t rb=read(inPipe,buffer,1025);
                if (rb <= 0){
                    LOG_DEBUG("%s: read error",PRFX);
                    continue;
                }
                if (rb == 1025 && testKey != NULL){
                    buffer[1025]=0;
                    unsigned char cmd=buffer[0];
                    if (cmd == 0 || cmd == 3 || cmd == 5 || cmd == 4 )
                    {
                        if (strcmp(&buffer[513], testKey) == 0 )
                        {
                            strncpy(fname, &buffer[257], 256);
                            fname[256] = 0;
                            strncpy(fifo, &buffer[1], 256);
                            fifo[256] = 0;
                            int fifoHandle=openFunction(fifo,O_WRONLY|O_CLOEXEC);
                            if (fifoHandle < 0){
                                LOG_ERROR("%s: unable to open private fifo %s",PRFX,fifo);
                                continue;
                            }
                            int fileHandle=open(fname,O_RDONLY|O_CLOEXEC);
                            if (fileHandle < 0){
                                LOG_ERROR("%s: unable to open %s",PRFX,fname);
                                close(fifoHandle);
                                continue;   
                            }
                            LOG_INFO("%s: passthrough for %s->%d",PRFX,fname,fileHandle);
                            Writer *writer=new Writer(fileHandle,fifoHandle);
                            writers.push_back(writer);
                            writer->start();
                            writer->detach();
                            continue;
                        }
                    }
                }
                if (outPipe >= 0){
                    struct stat state;
                    if (fstat(outPipe,&state) == 0){
                        if (state.st_nlink < 1){
                            LOG_ERROR("%s: outPipe %s is gone",PRFX,outName);
                            close(outPipe);
                            outPipe=-1;
                        }    
                    }
                }
                if (outPipe < 0){
                    LOG_INFO("%s: trying to open outpipe %s",PRFX,outName);
                    outPipe=openFunction(outName,O_WRONLY| O_CLOEXEC);
                    if (outPipe < 0){
                        LOG_ERROR("%s: unable to open outpipe",PRFX);
                        usleep(500000);
                        continue;
                    }
                    LOG_INFO("%s: outpipe %s opened",PRFX,outName);
                }
                ssize_t wr=write(outPipe,buffer,rb);
                if (wr != rb){
                    LOG_ERROR("%s: unable to write to out fifo",PRFX);
                    close(outPipe);
                    outPipe=-1;
                    close(inPipe);
                    inPipe=-1;
                }
            }
        }
};

OpenFunction o_open=NULL;
CloseFunction o_close=NULL;
int pipeFd=-1;

void setOpenFunction()
{
    if (o_open == NULL)
    {
        o_open = (OpenFunction)dlsym(RTLD_NEXT, "open");
    }
    if (o_close == NULL){
        o_close = (CloseFunction)dlsym(RTLD_NEXT,"close");
    }
}

void initTest()
{
    const char *tp = getenv(TEST_PIPE_ENV);
    const char *testKey = getenv(TESTKEY_ENV);
    if (tp != NULL || testKey != NULL)
    {
        Forwarder *fw =NULL;
        setOpenFunction();
        if (testKey != NULL)
        {
            //internal forward
            int fds[2];
            if (pipe2(fds,O_CLOEXEC) < 0){
                LOG_ERROR("%s: cannot create forwarder pipe",PRFX);
                return;
            }
            LOG_INFO("%s: created forward pipe for %s",PRFX,testKey);
            fw= new Forwarder(o_open,fds[0],OCPN_PIPE);
            pipeFd=fds[1];
        }
        if (fw == NULL){
            return;
        }
        fw->start();
        fw->detach();
        LOG_INFO("open forwarder for %s", testKey);
    }
}

extern "C" {

    int open(const char *pathname, int flags, ...)
    {
        setOpenFunction();
        va_list argp;
        va_start(argp, flags);
        if (strcmp(pathname, OCPN_PIPE) == 0)
        {
            if (pipeFd >= 0){
                return pipeFd;
            }
            const char *mp = getenv(TEST_PIPE_ENV);
            if (mp != NULL)
            {
                printf("open translate %s to %s\n", pathname, mp);
                pathname = mp;
            }
        }
        return o_open(pathname, flags, va_arg(argp, int));
    }

    int close(int fd){
        setOpenFunction();
        if (fd == pipeFd){
            return 0;
        }
        return o_close(fd);
    }  
}
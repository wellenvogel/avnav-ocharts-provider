
#define LINUX

#ifdef LINUX
#include <execinfo.h>
#include <dlfcn.h>
#endif

#include <new>
#include <stdlib.h>
#include <alloca.h>
#include <stdio.h>
#include <unistd.h>
#include <string.h>
#ifndef DONT_USE_THREADS
#include <pthread.h>
#endif
#include <iostream>
#include <link.h>

#include "memdiag.h"
#include <signal.h>

//set to 1 to enable unbalanced delete tracking (default 1)
#define MEMDIAG_OPT_UNBALANCEDDELETE "MEMDIAG_UNBALANCED_DELETE"
//SEt to listsize (default 20000)
#define MEMDIAG_OPT_LISTSIZE         "MEMDIAG_LISTSIZE"
//handle malloc (0 default)
#define MEMDIAG_OPT_HANDLEMALLOC     "MEMDIAG_HANDLE_MALLOC"
//debug level
#define MEMDIAG_OPT_DEBUG            "MEMDIAG_DEBUG"
//if defined (set to an int value) delete/free fills the memory arae with pattern
#define MEMDIAG_OPT_PATTERN          "MEMDIAG_PATTERN"
//if enabled, trace all news and deletes (0:off - default, 1: addresses, 2: names)
#define MEMDIAG_OPT_TRACE            "MEMDIAG_TRACE"
//if set to any value not 0, UBD are immediately written to stderr
//if set to 2 - print out a UBD but do not really execute
#define MEMDIAG_OPT_FORCEUBD         "MEMDIAG_FORCEUBD"
//if set delay the tracking until the first call to reset
//set to -1 to disable memdiag at all
#define MEMDIAG_OPT_DELAYED_START    "MEMDIAG_DELAYED_START"
//if set delay the tracking until the first call to reset
#define MEMDIAG_OPT_TRACEEXIT         "MEMDIAG_TRACE_EXIT"
//set memdiag to use USR1 for statistics, USR2 for reset
#define MEMDIAG_OPT_SIGNALS           "MEMDIAG_SIGNALS"

//on linux libc.so is a text file containing an info about the real libc.so
//we leave the complicated stuff to the shell script and provide the name via environment
#define MEMDIAG_OPT_LIBC_NAME            "MEMDIAG_LIBC_NAME"


int debug=0;




/* from http://access1.sun.com/cgi-bin/rinfo2html?313899.faq
   =========================================================
   Stacktrace for solaris8
   */

#include <setjmp.h>
#ifdef SOLARIS
#include <ucontext.h>
#include <sys/frame.h>
#include <dlfcn.h>
#include <sys/procfs_isa.h>
#include <stdio.h>

#if defined(sparc) || defined(__sparc)
#define FRAME_PTR_REGISTER REG_SP
#endif

#if defined(i386) || defined(__i386)
#define FRAME_PTR_REGISTER EBP
#endif

#endif

#ifndef LINUX
#ifndef  SOLARIS_INTEL
static struct frame *
csgetframeptr()
{
        ucontext_t u;
        (void) getcontext(&u);
    return (((struct frame *)
         u.uc_mcontext.gregs[FRAME_PTR_REGISTER])->fr_savfp);
}
#endif


#ifndef SOLARIS_INTEL
#ifndef ADVANTAGE_64
static void
cswalkstack(int (*operate_func)(void *, void *),
            void * usrarg)
{
        struct frame *  fp=csgetframeptr();
        void *          savpc;
        struct frame *  savfp;

        while (fp &&
           (savpc = (void*)fp->fr_savpc) &&
           (*operate_func)(savpc, usrarg) == 0) {
                fp = fp->fr_savfp;
                if (debug > 2) fprintf(stderr,"walkstack newFp=0x%p\n",fp);
        }
}
#else
static void
cswalkstack(int (*operate_func)(void *, void *),
            void * usrarg)
{}
#endif
#else
static void
cswalkstack(int (*operate_func)(uintptr_t,int, void *),
    void * usrarg)
{
        ucontext_t u;
        getcontext(&u);
        walkcontext(&u,operate_func,usrarg);
  }
#endif
/*
   ============================================================
   */

/* there seems to be an solaris bug, that will hang a process when
   executing a dladdr to /usr/lib/ld.so.1 and afterwards executing a dlsym in another
   thread.
   It seems that ld.so.1 will always be outside the range of the loaded shared objects, so
   wee try to avoid the bug by inspecting the list of loaded objects and determing the
   min and max address - and only calling dladdr for such addresses
   */
static void linkmap(FILE *fp, unsigned long &minaddr, unsigned long &maxaddr, int doPrint=1) {
  Link_map *map,*prev,*start;
  char * minname,*maxname;
  minaddr=0;
  maxaddr=0;
  int err=dlinfo(RTLD_SELF,RTLD_DI_LINKMAP,&map);
  int number=1;
  start=map;
  //up
  while (map != NULL) {
    if (doPrint) fprintf(fp,"LMP: %d: name=%s, base=0x%x\n",number,map->l_name,map->l_addr);
    if (minaddr == 0) {
      minaddr=map->l_addr;
      minname=map->l_name;
      }
    if (map->l_addr < minaddr) {
      minaddr=map->l_addr;
      minname=map->l_name;
      }
    if (map->l_addr > maxaddr) {
      maxaddr=map->l_addr;
      maxname=map->l_name;
      }

    map=map->l_next;
    number++;
    }
  if (start != NULL) {
    map=start->l_prev;
    }
  while (map != NULL) {
    if (doPrint)fprintf(fp,"LMP: -%d: name=%s, base=0x%x\n",number,map->l_name,map->l_addr);
    if (map->l_addr < minaddr) {
      minaddr=map->l_addr;
      minname=map->l_name;
      }
    if (map->l_addr > maxaddr) {
      maxaddr=map->l_addr;
      maxname=map->l_name;
      }
    map=map->l_prev;
    number++;
    }
  if (doPrint) fprintf(fp,"LMP: minaddr=0x%lx (%s), maxaddr=0x%lx (%s)\n",minaddr,minname,maxaddr,maxname);
  }
#else
//Linux

static void linkmap(FILE *fp, unsigned long &minaddr, unsigned long &maxaddr, int doPrint=1) {
  //TODO: any handling for linkmap?
}

#endif
static void printstackentry(void *addr,FILE *fp) {
    fprintf(fp,"0x%p\n",addr);
}
  
static void
csprintaddress(void *pc,FILE *fp,void * minaddr, void *maxaddr)
{
    Dl_info info;
    char * func;
    char * lib;
    char buf[512];

#ifndef LINUX
    if((pc < minaddr) || (pc>maxaddr) || (dladdr(pc, & info) == 0)) {
#else
    if(dladdr(pc, & info) == 0) {
#endif
        func = "??";
        lib  = "??";
    } else {
        lib  = (char *) info.dli_fname;
        func = (char *) info.dli_sname;
#ifndef LINUX
        cplus_demangle(func,buf,512);
        func = buf;
#endif
    }

    fprintf(fp,
        "%s:0x%p=%s+0x%lx\n",
        lib,
        pc,
        func,
        ((unsigned long)pc -  (unsigned long)(info.dli_saddr)));

}



/*====================================================================================
 Memdiag
====================================================================================*/


//switch between malloc/free and new handling
int handleMalloc=0;
//disable tracking of malloc/free/new/delete until initializiation has finished
//if delayed start is set - disable until first reset
int init_finished=0;
//do not execute delete/free if unbalanced
int noubd=0;
/**
  * max stack depth
  */
#define MAXADDR 40
/**
  * max number of entries in list
  */
#define LISTSIZE 20000

#define ALIGN_BITS 4 //malloc alignment to make good bucket addresses

class stackinfo {
  public:
  void *_address;
  int _numentries;
  int _lastprint;
  long _info;
  unsigned long _thread;
  void *_stack[MAXADDR];
  stackinfo *next;
  int   _accu;
  stackinfo() {
    next=NULL;
    init();
    }
  void fromOther(const stackinfo *other){
      _address=other->_address;
      _accu=other->_accu;
      _numentries=other->_numentries;
      _lastprint=other->_lastprint;
      _info=other->_info;
      _thread=other->_thread;
      memcpy(_stack,other->_stack,sizeof(void *)*MAXADDR);
  }
  bool sameStack(stackinfo *other){
      if (_lastprint != other->_lastprint) return false;
      return (memcmp(_stack,other->_stack,sizeof(void *)*MAXADDR) == 0);
  }
  int addStackEntry(void * entry) {
    if (_numentries  <  MAXADDR) {
      _stack[_numentries]=entry;
      _numentries++;
      if (debug>2) fprintf(stderr,"stackinfo0x%p: adding stack entry %d for address 0x%p->0x%p\n",this,_numentries,_address,entry);
      return 0;
      }
    else {
      if (debug) fprintf(stderr,"stackinfo0x%p: cutting stack for address 0x%p->0x%p\n",this,_address,entry);
      return 1;
      }
    }
  void print(FILE *fp,const char * hdr,void * minaddr,void *maxaddr,int lastOnly,int hexonly=0) {
      if (! lastOnly || _lastprint == 0) {
        fprintf(fp,"%s number=%d,Address=%p,Stackdepth=%d,Size=%ld,Thread=%ld\n",hdr,_accu,_address,_numentries,(long)_info,_thread);
        }
      else return;
      for (int j=0;j<_numentries;j++) {
        if (_stack[j] != NULL) {
          if (lastOnly) {
            if (_lastprint == 0) {
              if ( hexonly) printstackentry(_stack[j],fp);
              else csprintaddress(_stack[j],fp,minaddr,maxaddr);
              //testfkt(10);
              }
            }
          else {
            if ( hexonly) printstackentry(_stack[j],fp);
            else csprintaddress(_stack[j],fp,minaddr,maxaddr);
             //testfkt(10);
            }
          }
        }
      _lastprint=1;
      }

  void init() {
    if (debug>3) fprintf(stderr,"init for stackinfo 0x%p\n",this);
    _address=NULL;
    _numentries=0;
    _lastprint=0;
    _info=0;
    _thread=0;
    _accu=1;
    memset(_stack,0,sizeof(void *)*MAXADDR);
    }
  void * getAddr() {return _address;}

  
  } ;

/**
  * helper for inserting stack entry
  */
#ifndef LINUX
#ifndef SOLARIS_INTEL
static int storeStack(void *entry, void *number) {
#else
static int storeStack(uintptr_t entry, int dummy, void *number) {
#endif
  stackinfo * ip=(stackinfo *)number;
  return ip->addStackEntry((void *)entry);
}
#endif


/**
  * simple implementation of a list of stack info - should be a map
  */

#define FREELIST 500
class stacklist : public memdiag{
  private:
    stackinfo ** _theList;
    stackinfo *_store; //list of free stackinfo objects
    stackinfo *_delstore; //list of infos for delete
    stackinfo *_accustore; //object for accumulation
    stackinfo * _deleteList;
#ifndef DONT_USE_THREADS
    //lock for the whole list
    pthread_mutex_t  _lock;
    //lock used in lock/unlock
    pthread_mutex_t  _recLock;
    //the thread that currently helds the lock (0 if none)
    pthread_t _lockThread;
#endif
    static stacklist * _instance;
    int _numentries;
    int _numnew;
    int _errcnt;
    int _numdel;
    int _sumsize;
    int _sumfree;
    int _deletenumber;
    int _deleteerr;
    int _isLocked;
    int _stackTraceRunning;
    int _baseSize=0;
    int _baseMask=1;
  public:
    stacklist();
    static stacklist * instance();

/**
      * print out the content of the list

      */

    virtual void printList(FILE *fp, int lastOnly) {
      handleStart();  
      linkmap(fp,_minaddr,_maxaddr);
      //runTest(100,20);
      long openBytes=0;
      int numOpen=0;
      int lastOpen=0;
      long lastOpenBytes=0;
      if (lastOnly)
        fprintf(fp,"LON: ==== list of LAST open news ====\n");
      else
        fprintf(fp,"AON: ==== list of open news ====\n");
      int isLocked=lock();
      fprintf(fp,"STA: entriesInList=%d,news=%d,deletes=%d,allocatedBytes=%d,deletedBytes=%d,droppedNews=%d\n",
          _numentries,_numnew,_numdel,_sumsize,_sumfree,_errcnt);
      resetStatistics();
      stackinfo *acculist=NULL;
      for (int i=0;i<_baseSize;i++) {
        stackinfo *current=_theList[i];
        if (debug>9) fprintf(stderr,"list for bucket %x: %p\n",i,current);
        while (current != NULL){
            //1st check if we have it in acculist
            stackinfo *accuentry=acculist;
            stackinfo *foundAcc=NULL;
            while(accuentry != NULL && foundAcc == NULL){
                if (accuentry->sameStack(current)){
                    foundAcc=accuentry;
                    break;
                }
                accuentry=accuentry->next;
            }
            if (! foundAcc){
                if (debug > 2) fprintf(stderr,"creating new accuentry for %p\n",current->_address);
                foundAcc=getFromStore(_accustore);
                if (foundAcc) foundAcc->fromOther(current);
                foundAcc->next=acculist;
                acculist=foundAcc;
            }
            else{                
                foundAcc->_accu++;
                foundAcc->_info+=current->_info;
                if (debug > 2) fprintf(stderr,"merge entries for %p and %p, num=%d,size=%ld\n",
                        current->_address,foundAcc->_address,
                        foundAcc->_accu,foundAcc->_info);
            }
            if (current->_lastprint == 0 ) {
                lastOpen++;
                lastOpenBytes+=(long)(current->_info);
            }
            if (! foundAcc){
                current->print(fp,"UBN: (noacc) ",(void *)_minaddr,(void *)_maxaddr,lastOnly);
            }
            current->_lastprint=1;
            openBytes+=current->_info;
            numOpen++;
            current=current->next;
            if (debug > 9) fprintf(stderr,"next record %p\n",current);
        }
        
      }
      stackinfo *accuentry=acculist;
      if (debug > 2) fprintf(stderr,"print for acculist %p\n",acculist);
      while (accuentry != NULL){
          accuentry->print(fp,"UBN: ",(void *)_minaddr,(void *)_maxaddr,lastOnly);
          accuentry=accuentry->next;
      }
      emptyList(acculist,_accustore);
      fprintf(fp,"SUM: openNews=%d,openBytes=%ld,lastOpen=%d,lastOpenBytes=%ld\n",numOpen,openBytes,lastOpen,lastOpenBytes);
      if (_options.trackDelete) {
        fprintf(fp,"AUD: ==== list of unbalanced deletes ====\n");
        fprintf(fp,"STA: unbalanced deletes=%d,droppedDeletes=%d\n",_deletenumber,_deleteerr);
        stackinfo *delentry=_deleteList;
        while (delentry != NULL) {
          delentry->print(fp,"UBD:",(void *)_minaddr,(void *)_maxaddr,0);
          delentry=delentry->next;
        }
        emptyList(_deleteList,_delstore);
        _deleteList=NULL;
        _deletenumber=0;
        _deleteerr=0;
        }
      fflush(fp);
      if (isLocked) unlock();

      }
    
    void emptyList(stackinfo *list,stackinfo *store){
        if (debug > 1) fprintf(stderr,"empty list %p to store %p\n",list,store);
        stackinfo* current=list;
        stackinfo* last=NULL;
        while(current != NULL){
            last=current;
            current=current->next;
            addToStore(last,store);
        }
    }
    virtual void reset() {
      if (debug > 1) fprintf(stderr,"reset\n");
      int isLocked=lock();
      for (int i=0;i<_baseSize;i++) { 
          emptyList(_theList[i],_store);
          _theList[i]=NULL;
      }
      emptyList(_deleteList,_delstore);
      _numentries=0;
      resetStatistics();
      _deletenumber=0;
      _deleteerr=0;
      if (isLocked) unlock();
      handleStart();
      }


    /**
      * add an entry to the list
      */
    void addEntry(void * addr, long addrinfo=0) {
      if (debug > 2) fprintf(stderr,"addEntry 0x%p->%ld\n",addr,addrinfo);
      if (! lock()) return;
      
      stackinfo *info=getFromStore(_store);
      if (info) {
        _numentries++;  
        int base=getBase(addr);
        info->next=_theList[base];
        _theList[base]=info;
        info->_address=addr;
        info->_info=addrinfo;
        _numnew++;
        _sumsize+=(long)addrinfo;
#ifndef DONT_USE_THREADS
        info->_thread=(unsigned int)pthread_self();
#endif
#ifndef LINUX
        cswalkstack(storeStack,(void*)(info));
#else
        info->_numentries= backtrace( info->_stack, MAXADDR );
#endif
        if (_options.trace) {
          if (_minaddr == 0 || _maxaddr == 0) linkmap(stderr,_minaddr,_maxaddr);
          info->print(stderr,"NEW:",(void *)_minaddr,(void *)_maxaddr,0,_options.trace==1);
          info->_lastprint=0;
          }

        }
      else {
        _errcnt++;
        if (debug) fprintf(stderr,"no more free entries for addr 0x%p\n",addr);
        }
      if (debug > 2) fprintf(stderr,"addEntry finished 0x%p->%ld\n",addr,addrinfo);
      unlock();
      }

    /**
      * delete an entry
      */
    bool delEntry(void * addr) {
      if (debug > 2) fprintf(stderr,"delEntry 0x%p\n",addr);
      if (addr == NULL){
          return false;
      }
      if (! lock()) return false;
      long size=0;
      int base=getBase(addr);
      int found=0;
      stackinfo *current=_theList[base];
      stackinfo *last=NULL;      
      int iter=0;
      while (current != NULL){
          if (current->getAddr() == addr){
            _numentries--;  
            found=1;
            if (debug>2) fprintf(stderr,"deleting entry (%p)\n",current);
            size=(long)(current->_info);
            _sumfree+=size;
            if (current == _theList[base]){
                if (debug>5) fprintf(stderr,"deleting first entry in bucket (%p), next %p\n",current,current->next);
                _theList[base]=current->next;
            }
            else {
                if (last) last->next=current->next;
            }
            addToStore(current,_store); //bring back to free list
            _numdel++; 
            break;
          }
          last=current;
          current=current->next;
          iter++;
      }
      if (found == 0 && _options.trackDelete) {
        if (debug > 2) fprintf(stderr,"unbalanced Delete 0x%p\n",addr);
        stackinfo *delentry=getFromStore(_delstore);
        if (delentry) {
          delentry->_address=addr;
#ifndef DONT_USE_THREADS
          delentry->_thread=(unsigned int)pthread_self();
#endif
#ifndef LINUX
          cswalkstack(storeStack,(void *)(delentry);
#else
          delentry->_numentries= backtrace(delentry->_stack, MAXADDR );
#endif
          delentry->next=_deleteList;
          _deleteList=delentry;
          _deletenumber++;
          }
        else {
          _deleteerr++;
          }
        }
      if (_options.pattern >= 0 && size) {
        if (debug > 2) fprintf(stderr,"setting %ld bytes from 0x%p (... 0x%lx) to %d\n",size,addr,((long)addr)+size,_options.pattern);
        memset(addr,_options.pattern,size);
        }
      if (_options.trace  || (_options.forceubd && ! found )) {
        stackinfo ifo;
        ifo._address=addr;
#ifndef DONT_USE_THREADS
        ifo._thread=(unsigned int)pthread_self();
#endif
#ifndef LINUX
        cswalkstack(storeStack,(void *)(&ifo));
#else
        ifo._numentries= backtrace(ifo._stack, MAXADDR );
#endif
        if (_minaddr == 0 || _maxaddr == 0) linkmap(stderr,_minaddr,_maxaddr);
        ifo.print(stderr,found?"DEL:":"UBD",(void *)_minaddr,(void *)_maxaddr,0,_options.trace==1);
        }

      unlock();
      if (debug > 2) fprintf(stderr,"delEntry finished with %d iterations %p\n",iter,addr);
      return found;
      }


    /**
      * trace an stack for abort, exit,...
      */
    void traceStack(char * hdr) {
        if (debug > 1) fprintf(stderr,"traceStack %s \n",hdr);
        if (! _options.traceExit ) return;
        if (_stackTraceRunning) return;
        _stackTraceRunning=true;
        stackinfo ifo;
#ifndef LINUX
#ifndef SOLARIS_INTEL
        ifo._address=csgetframeptr();
#else
        //TODO: Solaris Intel
        ifo._address=0;
#endif
#else
        ifo._address=0;
#endif
#ifndef DONT_USE_THREADS
        ifo._thread=(unsigned int)pthread_self();
#endif
#ifndef LINUX
        cswalkstack(storeStack,(void *)(&ifo));
#else
        ifo._numentries= backtrace(ifo._stack, MAXADDR );
#endif
        if (_minaddr == 0 || _maxaddr == 0) linkmap(stderr,_minaddr,_maxaddr);
        ifo.print(stderr,hdr,(void *)_minaddr,(void *)_maxaddr,0,_options.trace==1);
        _stackTraceRunning=false;
        }

    /**
      * return 1 if start has to be delayed to first reset
      */
    int getDelayedStart() {
      return _options.delayedStart;
      }
    /**
      * handle delayed start
      */
    void handleStart() {
      if (_options.delayedStart == 1) {
        if (debug > 0) fprintf(stderr,"MEMDIAG: start tracking\n");
        }
      if (_options.delayedStart > 0) {
        _options.delayedStart--;
        }
      if (_options.delayedStart == 0 && ! init_finished) {
            initLists();
            if (debug>0) fprintf(stderr,"start tracking delayed\n");
            init_finished=1;
        }
      }
  private:
      
    int getBase(void *addr){
       long long base=(long long )addr & (long long)_baseMask; 
       base=base >> ALIGN_BITS;
       base = base % _baseSize;
       if (debug > 9) fprintf(stderr,"base for 0x%p : 0x%x\n",addr,(int)base);
       return (int)base;
    }
    
    stackinfo *getFromStore(stackinfo *store){
        stackinfo *rt=store->next; //1st entry
        if (rt == NULL) return NULL; //no free entries
        store->next=rt->next;
        rt->next=NULL;
        rt->init();
        return rt;
    }
    
    void addToStore(stackinfo *item,stackinfo *store){
        item->next=store->next;
        store->next=item;
    }
    
    
    /**
      * unlock (only called when lock returned != 0)
      */
    void unlock() {
#ifndef DONT_USE_THREADS
     // pthread_mutex_lock(&_recLock);
      pthread_mutex_unlock(&_lock);
      _isLocked=0;
      _lockThread=0;
      //pthread_mutex_unlock(&_recLock);
      if (debug > 1) fprintf(stderr,"unlock in thread %d\n",(int)pthread_self());
#else
      _isLocked=0;
      if (debug > 1) fprintf(stderr,"unlock singlethreaded");
#endif
      }
    /**
      * lock
      * will return 0 if already locked in the same thread (then no unlock should be called!)
      */
    int lock() {
#ifndef DONT_USE_THREADS
      //the following test can be done outside the recLock
      //it is only important to detect the "1" here if my own thread has set it - so at the end no sync
      //necessary
      if (_isLocked != 0) {
        pthread_mutex_lock(&_recLock);
        if (pthread_equal(_lockThread,pthread_self())) {
          pthread_mutex_unlock(&_recLock);
          if (debug > 1) fprintf(stderr,"locked (again) in thread %d\n",(int)pthread_self());
          return 0;
          }
        pthread_mutex_unlock(&_recLock);
        }
      pthread_mutex_lock(&_lock);
      pthread_mutex_lock(&_recLock);
      _isLocked=1;
      _lockThread=pthread_self();
      pthread_mutex_unlock(&_recLock);
      if (debug > 1) fprintf(stderr,"locked (changed/new) in thread %d\n",(int)pthread_self());
      return 1;
#else
      if (_isLocked != 0) {
        if (debug > 1) fprintf(stderr,"locked (again) singlethreaded\n");
        return 0;
        }
      if (debug > 1) fprintf(stderr,"locked (new) singlethreaded\n");
      _isLocked=1;
      return 1;
#endif

      }
    /**
      * reset statistics
      */
    void resetStatistics() {
      _numnew=0;
      _errcnt=0;
      _numdel=0;
      _sumsize=0;
      _sumfree=0;
      }

    
    /**
      * get the options
      */
    typedef struct {
      int trackDelete;
      int listsize;
      int pattern;
      int trace;
      int forceubd;
      int delayedStart;
      int traceExit;
      } TMemdiagOptions;


    TMemdiagOptions _options;

    void getOptions() {
      _options.trackDelete=1;
      _options.listsize=LISTSIZE;
      _options.pattern=-1;
      _options.trace=0;
      _options.forceubd=0;
      _options.delayedStart=0;
      _options.traceExit=0;
      handleMalloc=0;
      char * evt=getenv(MEMDIAG_OPT_DEBUG);
      if (evt) {
        debug=atoi(evt);
        if (debug>0) fprintf(stderr,"MEMDIAG option debug=%d\n",debug);
        }
      evt=getenv(MEMDIAG_OPT_UNBALANCEDDELETE);
      if (evt) {
        _options.trackDelete=(atoi(evt) != 0)?1:0;
        if (debug>0) fprintf(stderr,"MEMDIAG option trackdelete=%d\n",_options.trackDelete);
        }
      evt=getenv(MEMDIAG_OPT_FORCEUBD);
      if (evt) {
        _options.forceubd=atoi(evt);
        if (_options.forceubd == 2) noubd=1;
        if (debug>0) fprintf(stderr,"MEMDIAG option forceubd=%d\n",_options.forceubd);
        }
      evt=getenv(MEMDIAG_OPT_DELAYED_START);
      if (evt) {
        _options.delayedStart=atoi(evt);
        if (debug>0) fprintf(stderr,"MEMDIAG option delayedStart=%d\n",_options.delayedStart);
        }
      evt=getenv(MEMDIAG_OPT_LISTSIZE) ;
      if (evt) {
        int listsize=atoi(evt);
        if (listsize <= 0) {
          if (debug > 0) fprintf(stderr,"MEMDIAG option %s invalid value (%d), setting %d\n",
              MEMDIAG_OPT_LISTSIZE,listsize,LISTSIZE);
        } else {
          _options.listsize=listsize;
          }
        }
      evt=getenv(MEMDIAG_OPT_PATTERN) ;
      if (evt) {
        int pattern=atoi(evt);
        if (pattern < 0 || pattern > 255) {
          if (debug > 0) fprintf(stderr,"MEMDIAG option %s invalid value (%d), dsiabling pattern\n",
              MEMDIAG_OPT_PATTERN,pattern);
        } else {
          _options.pattern=pattern;
          }
        }
      evt=getenv(MEMDIAG_OPT_HANDLEMALLOC);
      if (evt) {
        handleMalloc=(atoi(evt) != 0)?1:0;
        if (debug>0) fprintf(stderr,"MEMDIAG option %s=%d\n",MEMDIAG_OPT_HANDLEMALLOC,handleMalloc);
        }
      evt=getenv(MEMDIAG_OPT_TRACEEXIT);
      if (evt) {
        _options.traceExit=(atoi(evt) != 0)?1:0;
        if (debug>0) fprintf(stderr,"MEMDIAG option %s=%d\n",MEMDIAG_OPT_TRACEEXIT,_options.traceExit);
        }
      evt=getenv(MEMDIAG_OPT_TRACE) ;
      if (evt) {
        int pattern=atoi(evt);
        if (pattern < 0 || pattern > 2) {
          if (debug > 0) fprintf(stderr,"MEMDIAG option %s invalid value (%d), disabling trace\n",
              MEMDIAG_OPT_TRACE,pattern);
        } else {
          _options.trace=pattern;
          }
        }
      if (debug > 0) fprintf(stderr,"MEMDIAG settings: listsize=%d,trackDelete=%d, handleMalloc=%d,trace=%d\n",
          _options.listsize,_options.trackDelete,handleMalloc,_options.trace);
      }


      unsigned long  _minaddr;
      unsigned long  _maxaddr;
      
      void fillList(stackinfo **list,int number){
          if (debug > 1) fprintf(stderr,"fill list %p with %d entries\n",list,number);
          *list=new stackinfo();
          stackinfo *current=*list;
          for (int i=0;i<number;i++){
              stackinfo *next=new stackinfo();
              current->next=next;
              current=next;
          }
      }
public:
      void initLists(){
          //allocate the free objects
        fillList(&_store,_options.listsize);
        if (_options.trackDelete){
            fillList(&_delstore,_options.listsize/4);
        }
        fillList(&_accustore,_options.listsize/4);
        if (debug > 0) fprintf(stderr,"MEMDIAG list2: size=%d, baseSize=%d, baseMask=%x\n",_options.listsize,_baseSize,_baseMask);
        _theList=new stackinfo*[_baseSize];
        //fill the bucket list 
        for(int i=0;i<_baseSize;i++) {
            _theList[i]=NULL;
        }
      }

  };

stacklist * stacklist::_instance=NULL;


stacklist::stacklist() {
      _stackTraceRunning=0;
      getOptions();
      _baseSize=1;
      _baseMask=1;
      for (int i=0;i<10 && (i*1000 < _options.listsize);i++){
          _baseMask=(_baseMask<<1) | 1;
          _baseSize*=2;
      }
      //next 2^^n
      _baseMask=(_baseMask << 1 )|1;
      _baseMask = _baseMask << ALIGN_BITS;
      _baseSize *=2;      
      
      _numentries=0;
      resetStatistics();
      _deleteList=NULL;      
      _isLocked=0;
#ifndef DONT_USE_THREADS
      pthread_mutex_init(&_lock,NULL);
      pthread_mutex_init(&_recLock,NULL);
      _lockThread=0;
#endif
      _minaddr=0;
      _maxaddr=0;
      }
stacklist * stacklist::instance() {
      if (_instance == NULL) {
        _instance=new stacklist();
        }
      return _instance;
}
/**
  *-------------------------------------------------------
  * some hacks to enable news during init of stacklist
  */

class dummy {
  int x;
  public:
  dummy() {
    stacklist * i=stacklist::instance();
    if (i->getDelayedStart() == 0){
        i->initLists();
        if (debug>0) fprintf(stderr,"start tracking\n");
        init_finished=1;
        }   
    }
  };

dummy static_dummy;

/**
  *-------------------------------------------------------
  */

/**
  * external interface
  */


extern "C" {
  memdiag * memdiagInstance() {
    return stacklist::instance();
    }
  }


void* operator new(size_t n) throw(std::bad_alloc){
  void *rt= malloc(n);
  if (! handleMalloc && init_finished) stacklist::instance()->addEntry(rt,n);
  return rt;
}

void* operator new(size_t n, const std::nothrow_t&) throw()
{
  void *rt= malloc(n);
  if (! handleMalloc && init_finished) stacklist::instance()->addEntry(rt,n);
  return rt;
}

void  operator delete(void* p) throw()
{
  if (!p) return;
  bool found=true;
  if (! handleMalloc && init_finished) found=stacklist::instance()->delEntry(p);
  if(found || (!noubd)) free(p);
}

void  operator delete(void*p, const std::nothrow_t&) throw()
{
  if (!p) return;
  bool found=true;
  if (! handleMalloc && init_finished) found=stacklist::instance()->delEntry(p);
  if(found|| (! noubd)) free(p);
}

void* operator new[](size_t n) throw(std::bad_alloc)
{
  return operator new(n);
}

void* operator new[](size_t n, const std::nothrow_t& t) throw()
{
  return operator new(n,t);
}

void  operator delete[](void*p) throw()
{
  operator delete(p);
}

void  operator delete[](void* p, const std::nothrow_t& t) throw()
{
  operator delete(p, t);
}

//=============================================================================
//malloc/free handling

// a small initial buffer for serving allo requests during dlopen
#define INITBUFFER 81920
static char buffer[INITBUFFER];
static int bufferFill=0;
static int inInit=0;

static void *(*mallocp)(size_t) = NULL;
static void *(*callocp)(size_t,size_t) = NULL;
static void (*freep)(void *) = NULL;
static void *(*memalignp)(size_t,size_t) = NULL;
static void *(*reallocp)(void *,size_t) = NULL;
static void *(*vallocp)(size_t) = NULL;
static void (*exitp)(int) = NULL;
static void (*abortp)(void) = NULL;

void print_map(int sig){
	
    fprintf(stderr,"open map:\n");
    stacklist::instance()->printList(stderr,1);
}
void reset(int sig){
    if (!init_finished){
        fprintf(stderr,"=== RESET not started yes ===\n");
        stacklist::instance()->handleStart();
        return;
    }
    fprintf(stderr,"=== RESET ===\n");
    stacklist::instance()->reset();
}
static void initMalloc() {
  if (inInit) return;
  inInit=1;
  char *libname=getenv(MEMDIAG_OPT_LIBC_NAME);
  if (libname == NULL) libname="libc.so";
  fprintf(stderr,"using libc %s\n",libname);
  void * libc=dlopen(libname,RTLD_LAZY);
  if (! libc) {
    fprintf(stderr,"unable to open %s\n",libname);
    exit(1);
    }
  exitp=(void (*)(int))dlsym(libc,"exit");
  abortp=(void (*)(void))dlsym(libc,"exit");
  if (! abortp) {
    fprintf(stderr,"unable to get ptr for abort\n");
    exit(1);
    }
  mallocp=(void *(*)(size_t))dlsym(libc,"malloc");
  if (! mallocp) {
    fprintf(stderr,"unable to get ptr for malloc\n");
    exit(1);
    }
  callocp=(void *(*)(size_t,size_t))dlsym(libc,"calloc");
  if (! callocp) {
    fprintf(stderr,"unable to get ptr for calloc\n");
    exit(1);
    }
  freep=(void (*)(void *))dlsym(libc,"free");
  if (! freep) {
    fprintf(stderr,"unable to get ptr for free\n");
    exit(1);
    }
  memalignp=(void * (*)(size_t,size_t))dlsym(libc,"memalign");
  if (! memalignp) {
    fprintf(stderr,"unable to get ptr for memalign\n");
    exit(1);
    }
  reallocp=(void * (*)(void *,size_t))dlsym(libc,"realloc");
  if (! reallocp) {
    fprintf(stderr,"unable to get ptr for realloc\n");
    exit(1);
    }
  vallocp=(void * (*)(size_t))dlsym(libc,"valloc");
  if (! vallocp) {
    fprintf(stderr,"unable to get ptr for valloc\n");
    exit(1);
    }
  inInit=0;
  if (getenv(MEMDIAG_OPT_SIGNALS) != NULL){
    signal(SIGUSR1,print_map);
    signal(SIGUSR2,reset);
    }
  }

void * initialMalloc(size_t size,const char * info) {
  if ((buffer+bufferFill+size) >= (buffer+INITBUFFER)) {
    fprintf(stderr,"initial malloc (%s) failes for %lld bytes\n",info,(long long)size);
    (*exitp)(1);
  }
  char *rt=buffer+bufferFill;
  for (int i=bufferFill;i<(bufferFill+size);i++) buffer[i]=0;
  bufferFill+=size;
  fprintf(stderr,"initial malloc (%s) %lld returns %p\n", info,(long long)size,rt);
  return rt;
}

void *malloc(size_t size) {
  if (inInit) return initialMalloc(size,"malloc");
  if (! mallocp) initMalloc();
  void * rt=(*mallocp)(size);
  if (handleMalloc && init_finished) stacklist::instance()->addEntry(rt,size);
  return rt;
  }
void *calloc(size_t nelem, size_t elsize) {
  if (inInit) return initialMalloc(nelem * elsize,"calloc");
  if (! callocp) initMalloc();
  void *rt=(*callocp)(nelem,elsize);
  if (handleMalloc && init_finished) stacklist::instance()->addEntry(rt,(nelem*elsize));
  return rt;
  }
void free(void *ptr) {
  if (ptr >= buffer && ptr < (buffer+INITBUFFER)) return; //don't free entries from initial buffer...
  if (inInit) {
    return;
  }
  if (! freep) initMalloc();
  bool found=true;
  if (handleMalloc && init_finished) found=stacklist::instance()->delEntry(ptr);
  if (found|| (! noubd)) (*freep)(ptr);
  }
void *memalign(size_t alignment, size_t size){
  if (inInit) return initialMalloc(size,"memalign");
  if (! memalignp) initMalloc();
  void *rt=(*memalignp)(alignment,size);
  if (handleMalloc && init_finished) stacklist::instance()->addEntry(rt,size);
  return rt;
  }
void *realloc(void *ptr, size_t size){
  if (inInit) return initialMalloc(size,"realloc");
  if (!reallocp) initMalloc();
  void *rt=(*reallocp)(ptr,size);
  if (handleMalloc && init_finished && (ptr != rt)) stacklist::instance()->delEntry(ptr);
  if (handleMalloc && init_finished && (ptr != rt)) stacklist::instance()->addEntry(rt,size);
  return rt;
  }
void * reallocarray (void *ptr, size_t nmemb, size_t size){
    return realloc(ptr,nmemb*size);
}
void *valloc(size_t size){
  if (inInit) return initialMalloc(size,"valloc");
  if (!vallocp) initMalloc();
  void *rt=(*vallocp)(size);
  if (handleMalloc && init_finished) stacklist::instance()->addEntry(rt,size);
  return rt;
  }

static int exitRunning=0;
void exit(int status) {
  if (!exitp) initMalloc();
  if (exitRunning == 0 && ! inInit) {
    exitRunning=1;
    stacklist::instance()->traceStack("exit");
    }
  (*exitp)(status);
  }
void abort(void) {
  if (!abortp) initMalloc();
  if (exitRunning == 0) {
    exitRunning=1;
    stacklist::instance()->traceStack("abort");
    }
  (*abortp)();
  }




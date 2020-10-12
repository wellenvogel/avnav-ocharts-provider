import datetime
import json
import os
import signal
import re
import sys
import time
import traceback
import urllib2
import subprocess
import platform
import shutil
import threading
import psutil


class Plugin:
  EXENAME="AvnavOchartsProvider"
  STARTSCRIPT="provider.sh"
  ENV_NAME="AVNAV_PROVIDER"
  CONFIG_FILE="avnav.conf"
  CONFIG=[
        {
          'name':'enabled',
          'description':'set to true to enable plugin',
          'default':'true'
        },
        {
          'name':'port',
          'description':'the listener port for the chart provider executable',
          'default':'8082'
        },
        {
          'name': 'internalPlugin',
          'description': 'use the plugin installed below our own root dir',
          'default':'true'
        },
        {
          'name':'configdir',
          'description':'directory for cfg files',
          'default': '$DATADIR/ocharts'
        },
        {
          'name':'ocpnPluginDir',
          'description':'directory for OpenCPN plugins',
          'default':''
        },
        {
          'name': 'exeDir',
          'description': 'directory oeserverd',
          'default': ''
        },
        {
          'name':'s57DataDir',
          'description': 'parent directory for s57data',
          'default':''
        },
        {
          'name':'threads',
          'description':'number of provider threads',
          'default':"5"
        },
        {
          'name':'debug',
          'description':'debuglevel for provider',
          'default':'1'
        },
        {
          'name':'chartdir',
          'description':'location for additional charts',
          'default': ''
        },
        {
          'name': 'uploadDir',
          'description': 'location for chart upload',
          'default': ''
        },
        {
          'name':'scale',
          'description':'scale for provider',
          'default':"2"
        },
        {
          'name':'cacheSize',
          'description':'number of tiles in cache',
          'default': '10000'
        },
        {
          'name': 'diskCacheSize',
          'description': 'number of tiles in cache on disk per set',
          'default': '400000'
        },
        {
          'name': 'prefillZoom',
          'description': 'max zoom level for cache prefill',
          'default': '17'
        },
        {
          'name': 'memPercent',
          'description':'percent of existing mem to be used',
          'default':''

        },
        {
          'name': 'supervision',
          'description': 'a , separated list of namePattern:memMb to be supervised',
          'default': 'xvfb:150'
        }
      ]

  @classmethod
  def pluginInfo(cls):
    """
    the description for the module
    @return: a dict with the content described below
            parts:
               * description (mandatory)
               * data: list of keys to be stored (optional)
                 * path - the key - see AVNApi.addData, all pathes starting with "gps." will be sent to the GUI
                 * description
    """
    return {
      'description': 'ocharts provider for AvNav',
      'version': '1.0',
      'config':cls.CONFIG,
      'data': [

      ]
    }

  def __init__(self,api):
    """
        initialize a plugins
        do any checks here and throw an exception on error
        do not yet start any threads!
        @param api: the api to communicate with avnav
        @type  api: AVNApi
    """
    self.api = api
    self.config={}
    self.baseUrl=None #will be set in run
    self.connected=False
    self.chartList=[]


  def findProcessByPattern(self,exe, checkuser=False,wildcard=False):
    """
    return a list with pid,uid,name for running chartproviders
    :@param exe the name of the executable
    :return:
    """
    processList=psutil.process_iter(['name','uids','ppid','pid'])
    rtlist=[]
    for process in processList:
      try:
        if process.info is None:
          continue
        info=process.info
        uid=info.get('uids')
        if uid is None:
          continue
        if checkuser and uid.effective != os.getuid():
          continue
        nameMatch=False
        name=None
        if exe is None:
          nameMatch=True
        elif type(exe) is list:
          for n in exe:
            if wildcard:
              nameMatch=re.match(n,info['name'],re.IGNORECASE)
              if nameMatch:
                name=n
            else:
              if n == info['name']:
                name=n
                nameMatch=True
        else:
          name = exe
          if wildcard:
            nameMatch = re.match(exe, info['name'], re.IGNORECASE)
          else:
            nameMatch= info['name']  == exe
        if not nameMatch:
          continue
        rtlist.append([info.get('pid'),uid.effective,name])
      except:
        self.api.error("error fetching process list: %s",traceback.format_exc())
    return rtlist

  def isPidRunning(self,pid):
    ev=self.getEnvValueFromPid(pid)
    if ev is None:
      return False
    return ev == self.getEnvValue()

  def getEnvValueFromPid(self,pid):
    try:
      process=psutil.Process(pid)
      if process is None:
        return None
      environ=process.environ()
      return environ.get(self.ENV_NAME)
    except Exception as e:
      self.api.debug("unable to read env for pid %d: %s" % (pid, e))
    return None
  
  def filterProcessList(self,list,checkForEnv=False):
    """
    filter a list returned by findProcessByPattern for own user
    :param list:
    :param checkForParent: also filter out processes with other parent
    :return:
    """
    rt=[]
    for entry in list:
      if entry[1] != os.getuid():
        continue
      if checkForEnv:
        envValue=self.getEnvValueFromPid(entry[0])
        if envValue is None or envValue != self.getEnvValue():
          continue
      rt.append(entry)
    return rt

  #we only allow one provider per config dir
  def getEnvValue(self):
    configdir = self.config['configdir']
    return platform.node()+":"+configdir

  def getCmdLine(self):
    exe=os.path.join(os.path.dirname(__file__),self.STARTSCRIPT)
    if not os.path.exists(exe):
      raise Exception("executable %s not found"%exe)
    ocpndir=self.config['ocpnPluginDir']
    if not os.path.isdir(ocpndir):
      raise Exception("OpenCPN plugin directory %s not found"%ocpndir)
    s57dir=self.config['s57DataDir']
    if not os.path.isdir(s57dir) or not os.path.isdir(os.path.join(s57dir,"s57data")):
      pdir=os.path.dirname(__file__)
      fallbackBase=os.path.join(pdir,"share","opencpn")
      fallbackS57Dir=os.path.join(fallbackBase,"s57data")
      if os.path.isdir(fallbackS57Dir):
        self.api.log("configured s57data dir %s not found, using internal fallback %s"%(s57dir,fallbackBase))
        s57dir=fallbackBase
      else:
        raise Exception("S57 data directory(parent) %s not found (and no fallback dir)"%s57dir)
    configdir = self.config['configdir']
    if not os.path.exists(configdir):
      raise Exception("config dir %s not found" % configdir)
    logname = os.path.join(configdir, "provider.log")
    chartdir=self.config['chartdir']
    chartdirs=re.split(" *, *",chartdir.rstrip().lstrip())
    for chart in chartdirs:
      if chart == '':
        continue
      if not os.path.isdir(chart):
        raise Exception("chart dir %s not found"%chart)
    cmdline = ["/bin/sh",exe, '-t',self.config['threads'],'-d',self.config['debug'], '-s',self.config['scale'], '-l' , logname, '-p', str(os.getpid()),
               "-c",self.config['cacheSize'],
               "-f",self.config['diskCacheSize'],
               "-r",self.config['prefillZoom'],
               "-e", self.config['exeDir'],
               "-n"]
    if self.config['memPercent'] != '':
      cmdline= cmdline + ["-x",self.config['memPercent']]
    if self.config['uploadDir'] != '':
      cmdline= cmdline + ["-u",self.config['uploadDir']]
    cmdline=cmdline + [ocpndir,
               s57dir, configdir, str(self.config['port'])]+chartdirs
    return cmdline

  def handleProcessOutput(self,process):
    buffer=process.stdout.readline()
    while buffer is not None and buffer != "":
      self.api.log("PROVIDEROUT: %s",buffer)
      buffer=process.stdout.readline()

  def startProvider(self):
    cmdline=self.getCmdLine()
    envValue = self.getEnvValue()
    env = os.environ.copy()
    PATH= env.get('PATH')
    if PATH is None:
      PATH=self.config['exeDir']
    else:
      PATH=PATH+os.path.pathsep+self.config['exeDir']
    env.update({self.ENV_NAME: envValue,'PATH':PATH})
    self.api.log("starting provider with command %s"%" ".join(cmdline))
    process=subprocess.Popen(cmdline,env=env,close_fds=True,stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
    if process is None:
      raise Exception("unable to start provider with %s"," ".join(cmdline))
    reader=threading.Thread(target=self.handleProcessOutput,args=[process])
    reader.start()
    return process

  def listCharts(self,hostip):
    self.api.debug("listCharts %s"%hostip)
    if not self.connected:
      self.api.debug("not yet connected")
      return []
    try:
      items=self.chartList+[]
      for item in items:
        for k in item.keys():
          if type(item[k]) == str or type(item[k]) == unicode:
            item[k]=item[k].replace("localhost",hostip).replace("127.0.0.1",hostip)
      return items
    except:
      self.api.debug("unable to contact provider: %s"%traceback.format_exc())
      return []
  MANDATORY_DIRS={
    'ocpnPluginDir':os.path.join("lib","opencpn"),
    'exeDir':'bin',
    's57DataDir':os.path.join("share","opencpn")
  }

  def handleSupervision(self,checkOnly=False):
    supervisionConfig=self.config.get('supervision')
    if supervisionConfig is None or supervisionConfig == '':
      return True
    supervisions={}
    for se in supervisionConfig.split(","):
      values=se.split(":")
      if len(values) < 2:
        self.api.error("invalid supervision entry %s",se)
        return False
      try:
        supervisions[values[0]]=int(values[1])
      except:
        self.api.error("unable to parse supervision entry %s",se)
        return False
    if checkOnly:
      return True
    candidates=self.filterProcessList(self.findProcessByPattern(supervisions.keys(),checkuser=True,wildcard=True),True)
    if len(candidates) < 1:
      self.api.debug("no matching processes running to supervise")
      return True
    for candidate in candidates:
      try:
        process=psutil.Process(candidate[0])
        currentRss=process.memory_info().rss/(1024*1024)
        maxRss=supervisions.get(candidate[2])
        if maxRss is None:
          raise Exception("invalid config, no max for %s",candidates[2])
        self.api.debug("current rss %d for %s",currentRss,process.name())
        if currentRss > maxRss:
          self.api.error("process %d (%s) exceeds rss limit (current=%d, max=%d) and will be restarted",
                         process.pid,process.name(),currentRss,maxRss)
          process.kill()
          process.wait(1)
      except:
        self.api.debug("error handling supervision for process %d: %s",candidate[0],traceback.format_exc())
    return True



  def run(self):
    """
    the run method
    this will be called after successfully instantiating an instance
    this method will be called in a separate Thread
    The example simply counts the number of NMEA records that are flowing through avnav
    and writes them to the store every 10 records
    @return:
    """
    enabled = self.api.getConfigValue('enabled','true')
    if enabled.lower() != 'true':
      self.api.setStatus("INACTIVE","module not enabled in server config")
      self.api.error("module disabled")
      return

    for cfg in self.CONFIG:
      v=self.api.getConfigValue(cfg['name'],cfg['default'])
      if v is None:
        self.api.error("missing config value %s"%cfg['name'])
        self.api.setStatus("INACTIVE", "missing config value %s"%cfg['name'])
        return
      self.config[cfg['name']]=v

    for name in self.config.keys():
      if type(self.config[name]) == str or type(self.config[name]) == unicode:
        self.config[name]=self.config[name].replace("$DATADIR",self.api.getDataDir())
        self.config[name] = self.config[name].replace("$PLUGINDIR", os.path.dirname(__file__))
    useInternalPlugin=self.config['internalPlugin']
    if useInternalPlugin == '':
      useInternalPlugin='true'
    rootBase="/usr"
    baseDir=rootBase
    if useInternalPlugin.lower() == 'true':
      baseDir=os.path.dirname(__file__)
      if not os.path.exists(os.path.join(baseDir,"lib","opencpn")) and os.path.exists(os.path.join(rootBase,"lib","opencpn")):
        self.api.error("internal plugin is set but path does not exist, using external")
        baseDir=rootBase
    for mdir in self.MANDATORY_DIRS.keys():
      if self.config[mdir]  == '':
        self.config[mdir] = os.path.join(baseDir,self.MANDATORY_DIRS[mdir])
      dir=self.config[mdir]
      if not os.path.isdir(dir):
        self.api.error("mandatory directory %s (path: %s) not found"%(mdir,dir))
        self.api.setStatus("ERROR","mandatory directory %s (path: %s) not found"%(mdir,dir))
        return
    configdir=self.config['configdir']
    if not os.path.isdir(configdir):
      self.api.log("configdir %s does not (yet) exist"%configdir)
      os.makedirs(configdir)
    if not os.path.isdir(configdir):
      self.api.error("unable to create config dir %s"%configdir)
      self.api.setStatus("ERROR","unable to create config dir %s"%configdir)
      return
    cfgfile=os.path.join(configdir,self.CONFIG_FILE)
    if not os.path.exists(cfgfile):
      try:
        src=os.path.join(os.path.dirname(__file__),self.CONFIG_FILE)
        if os.path.exists(src):
          self.api.log("config file %s does not exist, creating initial from %s"%(cfgfile,src))
          shutil.copyfile(src,cfgfile)
        else:
          self.api.log("config file %s does not exist, creating empty",src)
          with open(cfgfile,"") as f:
            f.write("")
            f.close()
      except Exception as e:
        self.api.error("unable to create config file %s",cfgfile)
        self.api.setStatus("ERROR","unable to create config file %s"%cfgfile)
        return
    port=None
    try:
      port=int(self.config['port'])
    except:
      self.api.error("exception while reading port from config %s",traceback.format_exc())
      self.api.setStatus("ERROR","invalid value for port %s"%self.config['port'])
      return
    if not self.handleSupervision(True):
      self.api.error("invalid supervision config: %s", self.config.get('supervision'))
      self.api.setStatus("ERROR", "invalid supervision config: %s", self.config.get('supervision'))
      return
    processes=self.findProcessByPattern(self.EXENAME)
    own=self.filterProcessList(processes,True)
    alreadyRunning=False
    providerPid=-1
    if len(processes) > 0:
      if len(own) != len(processes):
        self.api.log("there are provider processes running from other users: %s",",".join(map(lambda x: str(x[0]),list(set(processes)-set(own)))))
      if len(own) > 0:
        #TODO: handle more then one process
        self.api.log("we already see a provider running with pid %d, trying this one"%filtered[0][0])
        alreadyRunning=True
        providerPid=own[0][0]
    if not alreadyRunning:
      self.api.log("starting provider process")
      self.api.setStatus("STARTING","starting provider process %s"%self.STARTSCRIPT)
      try:
        process=self.startProvider()
        providerPid=process.pid
        time.sleep(5)
      except Exception as e:
        self.api.error("unable to start provider: %s",traceback.format_exc())
        self.api.setStatus("ERROR","unable to start provider %s"%e)
        return
    self.api.log("started with port %d"%port)
    self.baseUrl="http://localhost:%d/list"%port
    self.api.registerChartProvider(self.listCharts)
    self.api.registerUserApp("http://$HOST:%d/static/index.html"%port,"gui/icon.png")
    reported=False
    errorReported=False
    self.api.setStatus("STARTED", "provider started with pid %d, connecting at %s" %(providerPid,self.baseUrl))
    ready=False
    while True:
      responseData=None
      try:
        response=urllib2.urlopen(self.baseUrl,timeout=10)
        if response is None:
          raise Exception("no response on %s"%self.baseUrl)
        responseData=json.loads(response.read())
        if responseData is None:
          raise Exception("no response on %s"%self.baseUrl)
        status=responseData.get('status')
        if status is None or status != 'OK':
          raise Exception("invalid status from provider query")
        self.chartList=responseData['items']
        self.handleSupervision()
      except:
        self.api.debug("exception reading from provider %s"%traceback.format_exc())
        self.connected=False
        filteredList=self.filterProcessList(self.findProcessByPattern(self.EXENAME),True)
        if len(filteredList) < 1:
          if self.isPidRunning(providerPid):
            self.api.debug("final executable not found, but started process is running, wait")
          else:
            self.api.setStatus("STARTED", "restarting provider")
            self.api.log("no running provider found, trying to start")
            #just see if we need to kill some old child...
            backgroundList=self.filterProcessList(self.findProcessByPattern(None),True)
            for bp in backgroundList:
              pid=bp[0]
              self.api.log("killing background process %d",pid)
              os.kill(pid,signal.SIGKILL)
            try:
              provider=psutil.Process(providerPid)
              provider.wait(0)
            except:
              self.api.debug("error waiting for dead children: %s", traceback.format_exc())
            try:
              process=self.startProvider()
              providerPid=process.pid
              self.api.setStatus("STARTED", "provider restarted with pid %d, trying to connect at %s"%(providerPid,self.baseUrl))
            except Exception as e:
              self.api.error("unable to start provider: %s"%traceback.format_exc())
              self.api.setStatus("ERROR", "unable to start provider %s"%e)
        else:
          providerPid=filteredList[0][0]
          self.api.setStatus("STARTED","provider started with pid %d, trying to connect at %s" % (providerPid, self.baseUrl))
        if reported:
          if not errorReported:
            self.api.error("lost connection at %s"%self.baseUrl)
            errorReported=True
          reported=False
          self.api.setStatus("ERROR","lost connection at %s"%self.baseUrl)
        time.sleep(1)
        continue
      errorReported=False
      self.connected=True
      if not reported:
        self.api.log("got first provider response")
        self.api.setStatus("NMEA","provider (%d) sucessfully connected at %s"%(providerPid,self.baseUrl))
        reported=True
      time.sleep(1)









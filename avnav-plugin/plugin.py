# -*- coding: utf-8 -*-
# vim: ts=2 sw=2 et ai
###############################################################################
# Copyright (c) 2020-2021 Andreas Vogel andreas@wellenvogel.net
#
#  Permission is hereby granted, free of charge, to any person obtaining a
#  copy of this software and associated documentation files (the "Software"),
#  to deal in the Software without restriction, including without limitation
#  the rights to use, copy, modify, merge, publish, distribute, sublicense,
#  and/or sell copies of the Software, and to permit persons to whom the
#  Software is furnished to do so, subject to the following conditions:
#
#  The above copyright notice and this permission notice shall be included
#  in all copies or substantial portions of the Software.
#
#  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
#  OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
#  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
#  THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
#  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
#  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
#  DEALINGS IN THE SOFTWARE.
#
###############################################################################

import datetime
import json
import os
import signal
import re
import sys
import time
import traceback
try:
  from urllib.request import urlopen
  unicode=str
except:
  from urllib2 import urlopen
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
  EDITABLE_CONFIG=[
    {
      'name':'port',
      'description':'the listener port for the chart provider executable',
      'default':'8082',
      'type': 'NUMBER'
    },
    {
      'name':'threads',
      'description':'number of provider threads',
      'default':5,
      'type':'NUMBER'
    },
    {
      'name':'debug',
      'description':'debuglevel for provider',
      'default':'1',
      'type':'SELECT',
      'rangeOrList': ['0','1','2']
    },
    {
      'name':'cacheSize',
      'description':'number of tiles in cache',
      'default': 10000,
      'type':'NUMBER'
    },
    {
      'name': 'diskCacheSize',
      'description': 'number of tiles in cache on disk per set',
      'default': 400000,
      'type':'NUMBER'
    },
    {
      'name': 'prefillZoom',
      'description': 'max zoom level for cache prefill',
      'default': 17,
      'type':'NUMBER',
    },
    {
      'name': 'memPercent',
      'description':'percent of existing mem to be used',
      'default':''
    }
  ]
  BASE_CONFIG=[
        {
          'name':'enabled',
          'description':'set to true to enable plugin',
          'default':'true'
        },
        {
          'name': 'internalPlugin',
          'description': 'use the plugin installed below our own root dir',
          'default':True,
          'type': 'BOOLEAN'
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
          'name': 'supervision',
          'description': 'a , separated list of namePattern:memMb to be supervised',
          'default': 'xvfb:150'
        }
        ,
        {
          'name': 'supervisionPeriod',
          'description': 'period for memory checks (in s)',
          'default': '30'
        }
      ]
  CONFIG=EDITABLE_CONFIG+BASE_CONFIG

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
    self.changeSequence=0
    self.stopSequence=0
    self.providerPid=-1
    self.remoteHost=None
    if hasattr(self.api,'registerEditableParameters'):
      self.api.registerEditableParameters(self.EDITABLE_CONFIG,self.updateConfig)
    if hasattr(self.api,'registerRestart'):
      self.api.registerRestart(self.stop)


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
    cmdline = ["/bin/sh",exe,
               '-t',str(self.config['threads']),
               '-d',str(self.config['debug']),
               '-s',str(self.config['scale']),
               '-l' , logname,
               '-p', str(os.getpid()),
               "-c",str(self.config['cacheSize']),
               "-f",str(self.config['diskCacheSize']),
               "-r",str(self.config['prefillZoom']),
               "-e", self.config['exeDir'],
               "-n"]
    if self.config['memPercent'] != '':
      cmdline= cmdline + ["-x",str(self.config['memPercent'])]
    if self.config['uploadDir'] != '':
      cmdline= cmdline + ["-u",self.config['uploadDir']]
    cmdline=cmdline + [ocpndir,
               s57dir, configdir, str(self.config['port'])]+chartdirs
    return cmdline

  def handleProcessOutput(self,process):
    buffer=process.stdout.readline()
    while buffer is not None and buffer != b"":
      try:
        self.api.log("PROVIDEROUT: %s",buffer.decode('utf-8'))
      except:
        pass
      buffer=process.stdout.readline()

  def startProvider(self):
    cmdline=self.getCmdLine()
    envValue = self.getEnvValue()
    env = os.environ.copy()
    PATH= env.get('PATH')
    if PATH is None:
      PATH=self.config['exeDir']
    else:
      PATH=self.config['exeDir']+os.path.pathsep+PATH
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
    iconUrl=None
    if self.remoteHost is not None:
      hostip=self.remoteHost
    try:
      iconUrl=self.api.getBaseUrl()+"/gui/icon.png"
    except:
      #seems to be an AvNav that still does not have getBaseUrl...
      pass
    if not self.connected:
      self.api.debug("not yet connected")
      return []
    try:
      items=self.chartList+[]
      for item in items:
        item['hasFeatureInfo']=True
        if iconUrl is not None:
          item['icon']=iconUrl
        for k in list(item.keys()):
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
    candidates=self.filterProcessList(self.findProcessByPattern(list(supervisions.keys()),checkuser=True,wildcard=True),True)
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

  def updateConfig(self,newConfig):
    self.api.saveConfigValues(newConfig)
    self.changeSequence+=1

  def stop(self):
    self.changeSequence+=1
    self.stopSequence+=1

  def run(self):
    sequence=self.stopSequence
    while self.stopSequence == sequence:
      try:
        self.runInternal()
        self.stopProvider()
      except Exception as e:
        self.api.setStatus('ERROR',str(e))
        self.stopProvider()
        raise

  def stopProvider(self):
    backgroundList=self.filterProcessList(self.findProcessByPattern(None),True)
    for bp in backgroundList:
      pid=bp[0]
      self.api.log("killing background process %d",pid)
      os.kill(pid,signal.SIGKILL)
    try:
      provider=psutil.Process(self.providerPid)
      provider.wait(0)
    except:
      self.api.debug("error waiting for dead children: %s", traceback.format_exc())

  def getBooleanCfg(self,name,default):
    v=self.api.getConfigValue(name,default)
    if type(v) is str:
      return v.lower() == 'true'
    return v
  def runInternal(self):
    """
    the run method
    this will be called after successfully instantiating an instance
    this method will be called in a separate Thread
    The example simply counts the number of NMEA records that are flowing through avnav
    and writes them to the store every 10 records
    @return:
    """
    sequence=self.changeSequence
    enabled = self.getBooleanCfg('enabled',True)
    if not enabled:
      self.api.setStatus("INACTIVE","module not enabled in server config")
      self.api.error("module disabled")
      return

    for cfg in self.CONFIG:
      v=self.api.getConfigValue(cfg['name'],cfg['default'])
      if v is None:
        raise Exception("missing config value %s"%cfg['name'])
      self.config[cfg['name']]=v
    remoteHost=self.api.getConfigValue('host','')
    remote= remoteHost is not None and remoteHost != ''
    if remote:
      self.remoteHost=remoteHost
    else:
      self.remoteHost=None
    port=None
    try:
      port=int(self.config['port'])
    except:
      raise Exception("invalid value for port %s"%self.config['port'])
    if not remote:
      for name in list(self.config.keys()):
        if type(self.config[name]) == str or type(self.config[name]) == unicode:
          self.config[name]=self.config[name].replace("$DATADIR",self.api.getDataDir())
          self.config[name] = self.config[name].replace("$PLUGINDIR", os.path.dirname(__file__))
      useInternalPlugin=self.getBooleanCfg('internalPlugin',True)
      rootBase="/usr"
      baseDir=rootBase
      if useInternalPlugin:
        baseDir=os.path.dirname(__file__)
        if not os.path.exists(os.path.join(baseDir,"lib","opencpn")) and os.path.exists(os.path.join(rootBase,"lib","opencpn")):
          self.api.error("internal plugin is set but path does not exist, using external")
          baseDir=rootBase
      for mdir in list(self.MANDATORY_DIRS.keys()):
        if self.config[mdir]  == '':
          self.config[mdir] = os.path.join(baseDir,self.MANDATORY_DIRS[mdir])
        dir=self.config[mdir]
        if not os.path.isdir(dir):
          raise Exception("mandatory directory %s (path: %s) not found"%(mdir,dir))
      configdir=self.config['configdir']
      if not os.path.isdir(configdir):
        self.api.log("configdir %s does not (yet) exist"%configdir)
        os.makedirs(configdir)
      if not os.path.isdir(configdir):
        raise Exception("unable to create config dir %s"%configdir)
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
          raise Exception("unable to create config file %s"%cfgfile)
      if not self.handleSupervision(True):
        raise Exception("invalid supervision config: %s", self.config.get('supervision'))
      supervisionPeriod=30
      try:
        supervisionPeriod=int(self.config['supervisionPeriod'])
      except:
        pass
      processes=self.findProcessByPattern(self.EXENAME)
      own=self.filterProcessList(processes,True)
      alreadyRunning=False
      self.providerPid=-1
      if len(processes) > 0:
        if len(own) != len(processes):
          diff=filter(lambda e: not e in own,processes)
          diffstr=map(lambda e: unicode(e),diff)
          self.api.log("there are provider processes running from other users: %s",",".join(diffstr))
        if len(own) > 0:
          #TODO: handle more then one process
          self.api.log("we already see a provider running with pid %d, trying this one"%filtered[0][0])
          alreadyRunning=True
          self.providerPid=own[0][0]
      if not alreadyRunning:
        self.api.log("starting provider process")
        self.api.setStatus("STARTING","starting provider process %s"%self.STARTSCRIPT)
        try:
          process=self.startProvider()
          self.providerPid=process.pid
          time.sleep(5)
        except Exception as e:
          raise Exception("unable to start provider %s"%e)
      self.api.log("started with port %d"%port)
      host='localhost'
    else:
      host=remoteHost
    self.baseUrl="http://%s:%d/list"%(host,port)
    self.api.registerChartProvider(self.listCharts)
    if remote:
      self.api.registerUserApp("http://%s:%d/static/index.html"%(remoteHost,port),"gui/icon.png")
    else:
      self.api.registerUserApp("http://$HOST:%d/static/index.html"%port,"gui/icon.png")
    reported=False
    errorReported=False
    self.api.setStatus("STARTED", "provider started with pid %d, connecting at %s" %(self.providerPid,self.baseUrl))
    ready=False
    lastSupervision=0
    while sequence == self.changeSequence:
      responseData=None
      try:
        response=urlopen(self.baseUrl,timeout=10)
        if response is None:
          raise Exception("no response on %s"%self.baseUrl)
        responseData=json.loads(response.read())
        if responseData is None:
          raise Exception("no response on %s"%self.baseUrl)
        status=responseData.get('status')
        if status is None or status != 'OK':
          raise Exception("invalid status from provider query")
        self.chartList=responseData['items']
        if not remote:
          now=time.time()
          if lastSupervision > now or (lastSupervision+supervisionPeriod) < now:
            self.handleSupervision()
            lastSupervision=now
      except:
        self.api.debug("exception reading from provider %s"%traceback.format_exc())
        self.connected=False
        if not remote:
          filteredList=self.filterProcessList(self.findProcessByPattern(self.EXENAME),True)
          if len(filteredList) < 1:
            if self.isPidRunning(self.providerPid):
              self.api.debug("final executable not found, but started process is running, wait")
            else:
              self.api.setStatus("STARTED", "restarting provider")
              self.api.log("no running provider found, trying to start")
              #just see if we need to kill some old child...
              self.stopProvider()
              try:
                process=self.startProvider()
                self.providerPid=process.pid
                self.api.setStatus("STARTED", "provider restarted with pid %d, trying to connect at %s"%(self.providerPid,self.baseUrl))
              except Exception as e:
                self.api.error("unable to start provider: %s"%traceback.format_exc())
                self.api.setStatus("ERROR", "unable to start provider %s"%e)
          else:
            self.providerPid=filteredList[0][0]
            self.api.setStatus("STARTED","provider started with pid %d, trying to connect at %s" % (self.providerPid, self.baseUrl))
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
        self.api.setStatus("NMEA","provider (%d) sucessfully connected at %s"%(self.providerPid,self.baseUrl))
        reported=True
      time.sleep(1)









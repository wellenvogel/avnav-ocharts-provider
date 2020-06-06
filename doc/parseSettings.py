#! /usr/bin/env python
'''
******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Settings parser
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
'''

import csv
import datetime
import json
import sys
import os

CATCOL=0
PATHCOL=1
NAMECOL=2
METHODCOL=3
TITLECOL=5
DEFAULTCOL=6
MINCOL=7 #also enum values
MAXCOL=8 #also enum names
GROUPCOL=9
MINLEN= GROUPCOL + 1

def entryFromRow(row):
  rt={}
  rt['path']=row[PATHCOL]
  rt['category']=row[CATCOL]
  rt['name']=row[NAMECOL]
  type=row[METHODCOL]
  rt['type']=type
  rt['title']=row[TITLECOL]
  rt['group']=row[GROUPCOL]
  if type == 'enum':
    rt['values']=row[MINCOL]
    rt['choices']=row[MAXCOL]
  else:
    if type != 'bool':
      rt['min']=row[MINCOL]
      rt['max']=row[MAXCOL]
  default=row[DEFAULTCOL]
  if default == "":
    default="1"
  rt['default']=default
  return rt

def parseSettings(infile):
  outData = {'important': [], 'detail': []}
  with open(infile, "r") as csvin:
    rd = csv.reader(csvin)
    lastrow = None
    for row in rd:
      if len(row) < MINLEN:
        print("row to short, ignore %s\n" % ",".join(row))
        continue
      for col in [CATCOL, PATHCOL]:
        if lastrow is not None and row[col] == '' and lastrow[col] != '':
          row[col] = lastrow[col]
      lastrow = row
      if row[METHODCOL] == '':
        continue
      if outData.get(row[CATCOL]) is not None:
        outData[row[CATCOL]].append(entryFromRow(row))
  return outData


def generateJson(infile,outfile):
  outData=parseSettings(infile)
  with open(outfile,"w") as of:
    json.dump(outData,of)
    of.close()

def generateHeader(infile,outfile):
  outData = parseSettings(infile)
  (base,ext)=os.path.splitext(os.path.basename(outfile))
  with open(outfile, "w") as of:
    of.write("//generated from %s at %s\n"%(infile,datetime.datetime.now().isoformat()))
    of.write("#ifndef %s_H\n"%base.upper())
    of.write("#define %s_H\n"%base.upper())
    of.write("#include \"UserSettingsBase.h\"\n")
    of.write("UserSettingsList userSettings={\n")
    firstEntry=True
    for cat in outData.keys():
      catData=outData[cat]
      for entry in catData:
        if firstEntry:
          firstEntry=False
        else:
          of.write(",\n")
        type=entry['type']
        if type == 'enum':
          of.write("new UserSettingsEntryEnum(wxT(\"%s\"),wxT(\"%s\"),wxT(\"%s\"),UserSettingsEntry::TYPE_%s,%s,wxT(\"%s\"),{%s},wxT(\"%s\"))"%
                 (cat,
                 entry['path'],
                 entry['name'],
                 entry['type'].upper(),
                 entry['default'],
                 entry['title'],
                 entry['values'],
                 entry['choices']
                 ))
        if type == 'int':
          of.write(
            "new UserSettingsEntryInt(wxT(\"%s\"),wxT(\"%s\"),wxT(\"%s\"),UserSettingsEntry::TYPE_%s,%s,wxT(\"%s\"),%s,%s)" %
            (cat,
             entry['path'],
             entry['name'],
             entry['type'].upper(),
             entry['default'],
             entry['title'],
             entry['min'],
             entry['max']
             ))
        if type == 'bool':
          of.write(
            "new UserSettingsEntryBool(wxT(\"%s\"),wxT(\"%s\"),wxT(\"%s\"),UserSettingsEntry::TYPE_%s,%s,wxT(\"%s\"))" %
            (cat,
             entry['path'],
             entry['name'],
             entry['type'].upper(),
             entry['default'],
             entry['title']
             ))
        if type == 'float' or type == 'depth':
          of.write(
            "new UserSettingsEntryDouble(wxT(\"%s\"),wxT(\"%s\"),wxT(\"%s\"),UserSettingsEntry::TYPE_%s,%s,wxT(\"%s\"),%s,%s)" %
            (cat,
             entry['path'],
             entry['name'],
             entry['type'].upper(),
             entry['default'],
             entry['title'],
             entry['min'],
             entry['max']
             ))
    of.write("\n};\n")
    of.write("#endif\n")
    of.close()

if __name__ == '__main__':
  pdir=os.path.dirname(__file__)
  infile=os.path.join(pdir,"Settings.csv")
  if not os.path.exists(infile):
    print("ERROR: settings file %s does not exist\n"%infile)
    sys.exit(1)
  jsonfile=os.path.join(pdir,"..","gui","public","settings.json")
  print("generating %s from %s\n"%(jsonfile,infile))
  generateJson(infile,jsonfile)
  header=os.path.join(pdir,"..","provider","include","UserSettings.h")
  print("generating %s from %s\n"%(header,infile))
  generateHeader(infile,header)

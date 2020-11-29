/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* 
 * File:   S57AttributeDecoder.cpp
 * Author: andreas
 * 
 * Created on November 29, 2020, 6:14 PM
 */


#include <map>

#include "S57AttributeDecoder.h"
#include "Logger.h"
#include "wx/filename.h"

#define PRFX "S57AttributeDecoder:"

class LineHandler{
public:
    virtual void handleLine(wxArrayString line,int num)=0;
    virtual ~LineHandler(){};
};
bool readCsv(wxString s57Dir,wxString name,LineHandler *handler ){
    wxString fileName = s57Dir + wxFileName::GetPathSeparators() + name;
    if (!wxFileExists(fileName)) {
        LOG_ERRORC(wxT(PRFX "init: file %s not found"), fileName);
        return false;
    }
    wxFileInputStream input(fileName);
    if (! input.IsOk()){
       LOG_ERRORC(wxT(PRFX "init: unable to open %s"), fileName);
       return false; 
    }
    wxTextInputStream stream(input,wxT("\n"),wxConvUTF8);
    bool isFirst=true;
    int num=0;
    while (input.IsOk() && ! input.Eof()){
        num++;
        wxString line=stream.ReadLine();
        if (isFirst){
            isFirst=false;
            continue;
        }
        line.Replace("\r","");
        wxArrayString parts=wxSplit(line,',');
        handler->handleLine(parts,num);
    }
    return true;
}

class AttributesLineHandler: public LineHandler{
    S57AttributeDecoder *dec;
public:
    AttributesLineHandler(S57AttributeDecoder *dec){
        this->dec=dec;
    }
    virtual void handleLine(wxArrayString line,int num){
        dec->HandleAttLine(line,num);
    }
};
class ExpectedLineHandler: public LineHandler{
    S57AttributeDecoder *dec;
public:
    ExpectedLineHandler(S57AttributeDecoder *dec){
        this->dec=dec;
    }
    virtual void handleLine(wxArrayString line,int num){
        dec->HandleExpectedLine(line,num);
    }
};

S57AttributeDecoder::S57AttributeDecoder(wxString s57Dir) {
    this->s57Dir=s57Dir;
    hasData=false;
    AttributesLineHandler att(this);
    ExpectedLineHandler   exp(this);
    bool ok=readCsv(s57Dir,"s57attributes.csv",&att);
    if (!ok) return;
    ok=readCsv(s57Dir,"s57expectedinput.csv",&exp);
    if (! ok) return;
    if (expecteds.size() == 0 || attributes.size() ==0){
        LOG_ERROR(wxT(PRFX "init: maps empty"));
        return;
    }
    hasData=true;
}

void S57AttributeDecoder::HandleAttLine(wxArrayString line,int num){
    Attribute attr(line);
    if (attr.IsValid()) attributes[attr.GetKey()]=attr;
    else{
        LOG_DEBUG(wxT(PRFX "invalid attribute line %d"),num);
    }
}
void S57AttributeDecoder::HandleExpectedLine(wxArrayString line, int num){
    Expected exp(line);
    if (exp.IsValid()) expecteds[exp.GetKey()]=exp;
    else{
        LOG_DEBUG(wxT(PRFX "invalid expected line %d"),num);
    }
}

S57AttributeDecoder::~S57AttributeDecoder() {
}

bool S57AttributeDecoder::CanDecode(){
    return hasData;
}
wxString S57AttributeDecoder::DecodeAttribute(wxString name, wxString value){
    AttributeMap::iterator it=attributes.find(name);
    if (it == attributes.end()) return wxEmptyString;
    wxString valueKey=Expected::GetKeyFunction(it->second.code,value);
    ExpectedMap::iterator ite=expecteds.find(valueKey);
    if (ite == expecteds.end()) return wxEmptyString;
    return ite->second.meaning;
}
wxString S57AttributeDecoder::GetAttributeText(wxString name){
    AttributeMap::iterator it=attributes.find(name);
    if (it == attributes.end()) return wxEmptyString;
    return it->second.attribute;
}

S57AttributeDecoder *S57AttributeDecoder::GetInstance(){
    return instance;
}
bool S57AttributeDecoder::CreateInstance(wxString s57DataDir){
    if (instance) return instance->CanDecode();
    instance=new S57AttributeDecoder(s57DataDir);
    return instance->CanDecode();
}
S57AttributeDecoder* S57AttributeDecoder::instance=NULL;

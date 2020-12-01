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
    virtual bool handleLine(wxArrayString line,int num)=0;
    virtual ~LineHandler(){};
};

#define QOUTE '"'
#define SEP ',' 
wxArrayString splitCsvLine(wxString line){
    typedef enum {
        normal,
        qoute
    } CsvState;
    CsvState state=normal;
    wxArrayString rt;
    wxString element;
    for (size_t i=0;i<line.Length();i++){
        wxUniChar c=line.GetChar(i);
        switch(state){
            case qoute:
                if (c != QOUTE){
                    element.Append(c);
                }
                else{
                    state=normal;
                    continue;
                }
                break;
            case normal:
                if (c == QOUTE){
                    state=qoute;
                    continue;
                }
                if (c == SEP){
                    rt.Add(element);
                    element.Clear();
                    continue;
                }
                element.Append(c);
                break;
        }
    }
    if (element.Length() >0 ) rt.Add(element);
    return rt;
}
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
    int numOk=0;
    while (input.IsOk() && ! input.Eof()){
        num++;
        wxString line=stream.ReadLine();
        if (isFirst){
            isFirst=false;
            continue;
        }
        line.Replace("\r","");
        wxArrayString parts=splitCsvLine(line);
        if (handler->handleLine(parts,num)){
            numOk++;
        }
    }
    LOG_INFO(wxT(PRFX "read %d correct lines from %d for %s"),numOk,num,fileName);
    
    return true;
}

class AttributesLineHandler: public LineHandler{
    S57AttributeDecoder *dec;
public:
    AttributesLineHandler(S57AttributeDecoder *dec){
        this->dec=dec;
    }
    virtual bool handleLine(wxArrayString line,int num){
        return dec->HandleAttLine(line,num);
    }
};
class ExpectedLineHandler: public LineHandler{
    S57AttributeDecoder *dec;
public:
    ExpectedLineHandler(S57AttributeDecoder *dec){
        this->dec=dec;
    }
    virtual bool handleLine(wxArrayString line,int num){
        return dec->HandleExpectedLine(line,num);
    }
};

class ObjectClassLineHandler: public LineHandler{
    S57AttributeDecoder *dec;
public:
    ObjectClassLineHandler(S57AttributeDecoder *dec){
        this->dec=dec;
    }
    virtual bool handleLine(wxArrayString line,int num){
        return dec->HandleObjectClassLine(line,num);
    }
};

S57AttributeDecoder::S57AttributeDecoder(wxString s57Dir) {
    this->s57Dir=s57Dir;
    hasData=false;
    AttributesLineHandler att(this);
    ExpectedLineHandler   exp(this);
    ObjectClassLineHandler obj(this);
    bool ok=readCsv(s57Dir,"s57attributes.csv",&att);
    if (!ok) return;
    ok=readCsv(s57Dir,"s57expectedinput.csv",&exp);
    if (! ok) return;
    ok=readCsv(s57Dir,"s57objectclasses.csv",&obj);
    if (! ok) return;
    if (expecteds.size() == 0 || attributes.size() ==0 || objectclasses.size() == 0){
        LOG_ERROR(wxT(PRFX "init: maps empty"));
        return;
    }
    hasData=true;
}

bool S57AttributeDecoder::HandleAttLine(wxArrayString line,int num){
    Attribute attr(line);
    if (attr.IsValid()) {
        attributes[attr.GetKey()]=attr;
        return true;
    }
    LOG_DEBUG(wxT(PRFX "invalid attribute line %d"),num);
    return false;
    
}
bool S57AttributeDecoder::HandleObjectClassLine(wxArrayString line,int num){
    ObjectClass ocl(line);
    if (ocl.IsValid()){
        objectclasses[ocl.GetKey()]=ocl;
        return true;
    }
    else{
        LOG_DEBUG(wxT(PRFX "invalid objectclass line %d"),num);
        return false;
    }
}
bool S57AttributeDecoder::HandleExpectedLine(wxArrayString line, int num){
    Expected exp(line);
    if (exp.IsValid()){
        expecteds[exp.GetKey()]=exp;
        return true;
    }
    else{
        LOG_DEBUG(wxT(PRFX "invalid expected line %d"),num);
        return false;
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

wxString S57AttributeDecoder::GetFeatureText(wxString featureName, bool retDefault){
    ObjectClassMap::iterator it=objectclasses.find(featureName);
    if (it == objectclasses.end()) return retDefault?featureName:wxT("");
    return it->second.text;
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

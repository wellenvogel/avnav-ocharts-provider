/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* 
 * File:   S57AttributeDecoder.h
 * Author: andreas
 *
 * Created on November 29, 2020, 6:14 PM
 */

#ifndef S57ATTRIBUTEDECODER_H
#define S57ATTRIBUTEDECODER_H
#include <wx/wx.h>

class Attribute{
public:
    wxString    code;
    wxString    attribute;
    wxString    acronym;
    Attribute(){};
    Attribute(wxArrayString line){
        if (line.GetCount() < 3) return;
        code=line.Item(0);
        attribute=line.Item(1);
        acronym=line.Item(2);
    }
    wxString    GetKey(){return acronym;}
    bool        IsValid(){return acronym != wxEmptyString;}
};

class Expected{
public:
    wxString    code;
    wxString    id;
    wxString    meaning;
    Expected(){};
    Expected(wxArrayString line){
        if (line.GetCount() < 3) return;
        code=line.Item(0);
        id=line.Item(1);
        meaning=line.Item(2);
    }
    static wxString     GetKeyFunction(wxString code,wxString id){return code+":"+id;}
    wxString            GetKey(){return GetKeyFunction(code,id);}
    bool                IsValid(){return code != wxEmptyString && id != wxEmptyString;}
};
class ObjectClass{
public:
    wxString    code;
    wxString    text;
    wxString    name;
    ObjectClass(){};
    ObjectClass(wxArrayString line){
        if (line.GetCount() < 3) return;
        code=line.Item(0);
        text=line.Item(1);
        name=line.Item(2);
    }
    wxString    GetKey(){return name;}
    bool        IsValid(){return name != wxEmptyString;}
};

typedef std::map<wxString,Attribute> AttributeMap;
typedef std::map<wxString,Expected> ExpectedMap;
typedef std::map<wxString,ObjectClass> ObjectClassMap;

class ObjectClassLineHandler;
class ExpectedLineHandler;
class AttributesLineHandler;

class S57AttributeDecoder {
public:
    S57AttributeDecoder(wxString s57Dir);
    virtual         ~S57AttributeDecoder();
    bool            CanDecode();
    wxString        DecodeAttribute(wxString name,wxString value);
    wxString        GetAttributeText(wxString name);
    wxString        GetFeatureText(wxString featureName,bool retDefault=false);
    static S57AttributeDecoder* 
                    GetInstance();
    static  bool    CreateInstance(wxString s57DataDir);
private:
    bool            HandleAttLine(wxArrayString,int num);
    bool            HandleExpectedLine(wxArrayString,int num);
    bool            HandleObjectClassLine(wxArrayString line, int num);
    static          S57AttributeDecoder* instance;
    wxString        s57Dir;
    bool            hasData;   
    AttributeMap    attributes;
    ExpectedMap     expecteds;
    ObjectClassMap  objectclasses;
    
    friend          ObjectClassLineHandler;
    friend          ExpectedLineHandler;
    friend          AttributesLineHandler;

};

#endif /* S57ATTRIBUTEDECODER_H */


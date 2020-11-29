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

typedef std::map<wxString,Attribute> AttributeMap;
typedef std::map<wxString,Expected> ExpectedMap;
class S57AttributeDecoder {
public:
    S57AttributeDecoder(wxString s57Dir);
    virtual         ~S57AttributeDecoder();
    bool            CanDecode();
    void            HandleAttLine(wxArrayString,int num);
    void            HandleExpectedLine(wxArrayString,int num);
    wxString        DecodeAttribute(wxString name,wxString value);
    wxString        GetAttributeText(wxString name);
    static S57AttributeDecoder* 
                    GetInstance();
    static  bool    CreateInstance(wxString s57DataDir);
private:
    static          S57AttributeDecoder* instance;
    wxString        s57Dir;
    bool            hasData;   
    AttributeMap    attributes;
    ExpectedMap     expecteds;

};

#endif /* S57ATTRIBUTEDECODER_H */


/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  MD5
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

#ifndef MD5_H
#define MD5_H
#include <wx/wx.h>
#include <openssl/evp.h>

#define MD5_ADD_VALUE(md5,value) md5.AddBuffer((const unsigned char*)(&value),sizeof(value))
#define MD5_ADD_VALUEP(md5,value) md5->AddBuffer((const unsigned char*)(&value),sizeof(value))
#define MD5_LEN 16

class MD5Name{
private:
    unsigned char name[MD5_LEN];
public:
    const int len=MD5_LEN;
    MD5Name(const unsigned char *src =NULL){
        if (src){
            memcpy(name,src,MD5_LEN);
        }
        else{
            memset(name,0,MD5_LEN);
        }
    }
    MD5Name(const MD5Name &other){
        memcpy(name,other.name,MD5_LEN);
    }
    MD5Name& operator=(const MD5Name &other){
        if (this != &other){
            memcpy(name,other.name,MD5_LEN);
        }
        return *this;
    }
    bool operator==(const MD5Name &other) const{
        return memcmp(name,other.name,MD5_LEN) == 0;
    }
    bool operator!=(const MD5Name &other) const{
        return memcmp(name,other.name,MD5_LEN) != 0;
    }
    bool operator<(const MD5Name &other) const{
        return memcmp(name,other.name,MD5_LEN) < 0;
    }    
    bool operator>(const MD5Name &other) const{
        return memcmp(name,other.name,MD5_LEN) > 0;
    }
    const unsigned char *GetValue(){
        return name;
    }
    wxString ToString();
    
};

class MD5 {
public:
    MD5();
    MD5(const MD5&);
    MD5& operator=(const MD5&);
    virtual ~MD5();
    bool AddBuffer(const unsigned char *buffer, long len);
    bool AddBuffer(const char *buffer,long len){
        return AddBuffer((const unsigned char *)buffer,len);
    }
    bool AddValue(wxDateTime v);
    bool AddValue(wxString s);
    bool AddFileInfo(wxString path,wxString base=wxEmptyString);
    bool IsOk() const;
    const unsigned char * GetValue();
    MD5Name GetValueCopy();
    wxString GetHex();
    static MD5Name Compute(wxString v);
private:
    EVP_MD_CTX *mdctx;
    unsigned char *resultBuffer;
    bool finalized;

};

#endif /* MD5_H */


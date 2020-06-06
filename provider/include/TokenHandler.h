/******************************************************************************
 *
 * Project:  AvNav ocharts-provider
 * Purpose:  Token Handler
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

#ifndef TOKENHANDLER_H
#define TOKENHANDLER_H
#include "SimpleThread.h"
#include <wx/wx.h>
#include <map>

#define MAX_CLIENTS 5

class TokenResult{
public:
    typedef enum{
        RES_OK,         //session id and key are set  
        RES_TOO_MANY,   //too many clients  
        RES_EMPTY        
    } ResultState;
    ResultState     state;
    wxString        sessionId;
    wxString        key;
    int             sequence;
    TokenResult(){
        state=RES_EMPTY;
        sequence=-1;
    }
    wxString ToString(){
        wxString mode="EMPTY";
        switch(state){
            case RES_OK:
                mode="OK";
                break;
            case RES_TOO_MANY:
                mode="TOO_MANY";
                break;
            default:
                mode="EMPTY";
                break;
        }
        return wxString::Format(wxT("TokenResult: state=%s,session=%s,key=%s,sequence=%d"),
                mode,sessionId,key,sequence);
    }
    
};
class DecryptResult{
public:
    wxString url;
    wxString sessionId;
    DecryptResult(){
        url=wxEmptyString;
        sessionId=wxEmptyString;
    }
    DecryptResult(wxString url,wxString sessionId){
        this->url=url;
        this->sessionId=sessionId;
    }
    
};
class TokenList;
typedef std::map<wxString,TokenList*> TokenMap;
class TokenHandler : public Thread{
public:
    TokenHandler(wxString name);
    DecryptResult       DecryptUrl(wxString url);
    TokenResult         NewToken(wxString sessionId);
    TokenResult         NewToken();
    bool                TimerAction();
    virtual             ~TokenHandler();
    virtual void        run();
    static wxString     ComputeMD5(wxString data);
private:
    wxString    GetNextSessionId();
    wxString    name;
    TokenMap    map;
    std::mutex  lock;
};

#endif /* TOKENHANDLER_H */


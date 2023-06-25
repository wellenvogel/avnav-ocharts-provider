/*
 Project:   AvnavOchartsProvider GUI
 Function:  Utilities

 The MIT License (MIT)

 Copyright (c) 2020 Andreas Vogel (andreas@wellenvogel.net)

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

import assign from 'object-assign';

const Util={
    fetchJson:(url,opt_options)=>{
        return new Promise((resolve,reject)=> {
            let checkStatus=true;
            if (opt_options && opt_options.checkStatus !== undefined){
                checkStatus=opt_options.checkStatus;
                delete opt_options.checkStatus;
            }
            let ro = assign({}, {credentials: 'same-origin'}, opt_options);
            fetch(url, ro)
                .then((response)=> {
                    if (!response.ok) {
                        throw new Error(response.statusText)
                    }
                    return response.json()
                })
                .then((jsonData)=> {
                    if (jsonData.status !== 'OK' && checkStatus) {
                        throw new Error("" + jsonData.info || jsonData.status);
                    }
                    resolve(jsonData);
                })
                .catch((error)=> {
                    reject(error);
                });
        });
    },

    postFormData:(url,formData,opt_options)=>{
        let body=[];
        for (let i in formData){
            if (formData[i] === undefined) continue;
            let k=encodeURIComponent(i);
            let v=encodeURIComponent(formData[i]);
            body.push(k+'='+v);
        }
        let fo=assign({},opt_options,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
            },
            body: body.join('&')
        });
        return Util.fetchJson(url,fo);
    },
    /**
     * @param url {string}
     * @param file {File}
     * @param param parameter object
     *        all handlers get the param object as first parameter
     *        starthandler: will get the xhdr as second parameter - so it can be used for interrupts
     *        progresshandler: progressfunction
     *        okhandler: called when done
     *        errorhandler: called on error
     *        see https://mobiarch.wordpress.com/2012/08/21/html5-file-upload-with-progress-bar-using-jquery/
     */
    uploadFile: (url, file, param)=> {
        let type = "application/octet-stream";
        try {
            let xhr=new XMLHttpRequest();
            xhr.open('POST',url,true);
            xhr.setRequestHeader('Content-Type', type);
            xhr.addEventListener('load',(event)=>{
                if (xhr.status != 200){
                    if (param.errorhandler) param.errorhandler(xhr.statusText);
                    return;
                }
                let json=undefined;
                try {
                    json = JSON.parse(xhr.responseText);
                    if (! json.status || json.status != 'OK'){
                        if (param.errorhandler) param.errorhandler(json.info);
                        return;
                    }
                }catch (e){
                    if (param.errorhandler) param.errorhandler(e);
                    return;
                }
                if (param.okhandler) param.okhandler(json);
            });
            xhr.upload.addEventListener('progress',(event)=>{
                if (param.progresshandler) param.progresshandler(event);
            });
            xhr.addEventListener('error',(event)=>{
                if (param.errorhandler) param.errorhandler("upload error");
            });
            if (param.starthandler) param.starthandler(xhr);
            xhr.send(file);
        } catch (e) {
            if (param.errorhandler) param.errorhandler(e);
        }
    }
};

export default Util;
/*
 Project:   AvnavOchartsProvider GUI
 Function:  Settings display

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
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Util from './Util.js';
import ErrorDisplay from './components/ErrorDisplay.js';
import CheckBox from './components/CheckBox.js';
import OverlayDialog from './components/OverlayDialog.js';
import ChartSetStatus from './components/ChartSetStatus.js';
import assign from 'object-assign';
import StatusLine from './components/StatusLine.js';
import Promise from 'promise';

const SETTINGSURL="/settings/";
const UPLOADURL="/upload/";
const STATUSURL="/status/";


const SpinnerDialog=(props)=>{
    return(
        <div className={"dialog "+props.className}>
            <div className="spinner"></div>
        </div>
    )
};



const DisabledByDialog=(props)=>{
    return (
        <div className="dialog disabledBy">
            <h3>{props.item.title}</h3>
            <div>Version: {props.item.version}</div>
            <p>This chart set has been disabled as there was another chart set with the same name that
                has a newer version or was explicitely enabled by the user</p>
            <p>Consider disabling chart set<br/> {props.other.title} (Version: {props.other.version})<br/> before</p>
            <div className="dialogRow dialogButtons">
                <button className="button cancel" onClick={props.closeCallback}>Cancel</button>
                <button
                    className="button"
                    onClick={()=>{props.enableCallback();props.closeCallback();}}
                    >
                    Enable Anyway</button>
            </div>
        </div>
    );
};


const FPRDialog=(props)=>{
    return (
        <div className="dialog FPRDialog">
            <h3>Fingerprint Created</h3>
            <div className="dialogRow">
                <span className="label">FileName</span>
                <span className="value">{props.fileName}</span>
            </div>
            <div className="dialogRow dialogButtons">
                <button className="button cancel" onClick={props.closeCallback}>Cancel</button>
                <a
                    className="button download"
                    download={props.fileName}
                    href={"data:application/octet-stream;base64,"+props.data}
                    onClick={props.closeCallback}
                    >
                    Download</a>
            </div>
        </div>
    );
};

const readyState=(ready)=>{
    return ready?"READY":"INITIALIZING";
};

class UploadForm extends React.Component{
    constructor(props){
        super(props);
        this.handledFileInputKey=-1;
    }
    shouldComponentUpdate(nextProps,nextState){
        //ensure that we only trigger again if at least the keys has changed
        if (nextProps.fileInputKey != this.props.fileInputKey) return true;
        return false;
    }
    componentDidMount(){
        if (this.refs.form) this.refs.form.reset();
        if (this.refs.fileInput && this.props.fileInputKey != this.handledFileInputKey) {
            this.refs.fileInput.click();
            this.handledFileInputKey=this.props.fileInputKey;
        }
    }
    componentDidUpdate(){
        if (this.refs.form) this.refs.form.reset();
        if (this.refs.fileInput && this.props.fileInputKey != this.handledFileInputKey) {
            this.refs.fileInput.click();
            this.handledFileInputKey=this.props.fileInputKey;
        }
    }
    render(){
        return(
            <form className="hidden" method="post" ref="form">
                <input type="file" ref="fileInput" name="file" key={this.props.fileInputKey} onChange={this.props.startUpload}/>
            </form>
        );
    }
}

class UploadProgress extends React.Component{
    constructor(props){
        super(props);
        let self=this;
        this.state={loaded:0,total:0};
        let oldHandler=props.handler.progresshandler;
        props.handler.progresshandler=(ev)=>{
            if (ev.lengthComputable){
                self.setState({
                    loaded:ev.loaded,total:ev.total
                });
            }
            if (oldHandler) oldHandler(ev);
        }
    }
    render(){
        let percentComplete = this.state.total ? 100 * this.state.loaded/ this.state.total : 0;
        let doneStyle = {
            width: percentComplete + "%"
        };
        return (<div className="progressContainer">
            <div className="progressInfo">{(this.state.loaded||0) + "/" + (this.state.total||0)}</div>
            <div className="progressDisplay">
                <div className="progressDone" style={doneStyle}></div>
            </div>
        </div>);
    }
}

const UploadIndicator = (iprops)=>{
    let props=iprops.uploadIndicator;
    if ( !props || !props.xhdr) return null;
    return (
        <div className="uploadProgress">
            <UploadProgress
                handler={props.handler}/>
            <button className="uploadCancel button" onClick={()=>{
                iprops.closeCallback();
                }}
                />
        </div>
    );
};

const RESTART_WINDOW=60000; //ms to ignore errors during restart
const MIN_RESTART_WINDOW=5000; //ms before we reset the restart flag
class ChartsView extends Component {

    constructor(props){
        super(props);
        this.state={ready:readyState(false),
            fileUploadKey:1,
            showUpload:false,
            uploadIndicator:undefined};
        this.error=new ErrorDisplay(this);
        this.dialog=new OverlayDialog(this);
        this.timer=undefined;
        this.cstimer=undefined;
        this.restartTime=undefined;
        this.getCurrent=this.getCurrent.bind(this);
        this.showDialog=this.showDialog.bind(this);
        this.fetchState=this.fetchState.bind(this);
        this.triggerRestart=this.triggerRestart.bind(this);
        this.isReady=this.isReady.bind(this);
        this.startUpload=this.startUpload.bind(this);
        this.listRef=React.createRef();
    }
    omitErrors(curRestart){
        if (curRestart === undefined && this.restartTime === undefined) return false;
        let now=(new Date()).getTime();
        if (now > (this.restartTime + RESTART_WINDOW)){
            this.restartTime=undefined;
        }
        if (curRestart === undefined) return true;
        if (now > (curRestart + RESTART_WINDOW)){
            return false;
        }
        return true;
    }
    getCurrent(){
        let self=this;
        let curRestart=this.restartTime;
        Util.fetchJson(STATUSURL)
            .then((jsonData)=>{
                self.setState({current:jsonData.data});
            })
            .catch((error)=>{
                if (this.omitErrors(curRestart)) return;
                this.error.setError("Error fetching current status: "+error)
            });
    }
    fetchState(){
        let self=this;
        let curRestart=self.restartTime;
        Util.fetchJson(SETTINGSURL + "ready")
            .then((jsonData)=>{
                let now=(new Date()).getTime();
                if (curRestart == self.restartTime && curRestart !== undefined && now >= (curRestart+MIN_RESTART_WINDOW)){
                    //restart restart timer on successfull receive
                    self.restartTime=undefined;
                    self.dialog.hideDialog();
                }
                if (self.state.ready == readyState(jsonData.ready)) return;
                self.error.resetError();
                self.setState({ready:readyState(jsonData.ready)});
                self.getCurrent();

            })
            .catch((error)=>{
                if (self.omitErrors(curRestart)) return;
                if (self.state.ready != "ERROR") {
                    self.setState({ready: "ERROR"});
                }
                self.error.setError("unable to fetch ready state: "+error);
            })
    }
    componentDidMount(){
        let self=this;
        this.getCurrent();
        this.fetchState();
        this.timer=window.setInterval(()=> {
            self.fetchState();
        },2000);
    }
    componentWillUnmount(){
        window.clearInterval(this.timer);
        window.clearInterval(this.cstimer);
    }
    showDialog(dialog){
        this.dialog.setDialog(dialog);
    }
    getSnapshotBeforeUpdate(pp,np){
        const list=this.listRef.current;
        if (list === null) return null;
        return list.scrollTop;
    }
    componentDidUpdate(pp,ps,snapshot){
        if (snapshot != null && (pp.currentView == this.props.currentView)){
            const list = this.listRef.current;
            if (list === null) return;
            list.scrollTop = snapshot;
        }
    }
    getFPR(forDongle){
        this.dialog.setDialog(SpinnerDialog);
        let self=this;
        let url=SETTINGSURL+"createfingerprint";
        if (forDongle) url+="?forDongle=1";
        Util.fetchJson(url)
            .then((jsonData)=>{
                if (! jsonData.fileName) throw new Error("no fileName returned");
                Util.fetchJson(SETTINGSURL+"loadfingerprint?fileName="+encodeURIComponent(jsonData.fileName))
                    .then((dlData)=>{
                        if (! dlData.data) throw new Error("fingerprint has no data");
                        let dialog=(props)=>{
                            return <FPRDialog
                                {...props}
                                data={dlData.data}
                                fileName={jsonData.fileName}
                                />
                        };
                        self.dialog.setDialog(dialog);
                    })
                    .catch((error)=>{
                        self.dialog.hideDialog();
                        self.error.setError(error);
                    })
            })
            .catch((error)=>{
                self.dialog.hideDialog();
                self.error.setError(error);
            })

    }
    uploadSet(){
        this.setState({
            fileUploadKey:this.state.fileUploadKey+1,
            showUpload:true
        });
    }
    startUpload(ev){
        let self=this;
        let fileObject=ev.target;
        if (! fileObject.files || fileObject.files.length < 1) {
            self.setState({showUpload: false});
            return;
        }
        let file=fileObject.files[0];
        if (! file.name.match(/\.zip$/i)){
            self.error.setError("only files .zip are allowed");
            self.setState({showUpload: false});
            return;
        }
        let handler={};
        handler.errorhandler=(error)=>{
                self.finishUpload(true);
                self.error.setError(error);
            };
        handler.starthandler=(xhdr)=>{
                self.setState({
                    uploadIndicator: {xhdr:xhdr,handler:handler}
                });
            };
        handler.progresshandler=(ev)=>{
            };
        handler.okhandler=(jsonData)=>{
                self.finishUpload();
                let Dialog=(dprops)=>{
                    return <div className="dialog">
                        <div className="dialogInnnerFlex">
                            <h3>Upload complete</h3>
                            <p>A restart is required to load the charts</p>
                            <div className="actions">
                                <button className="button" onClick={dprops.closeCallback}>Cancel</button>
                                <button className="button" onClick={()=>{dprops.closeCallback();self.triggerRestart();}}>Restart</button>
                            </div>
                        </div>
                    </div>
                };
                self.dialog.setDialog(Dialog);
            };
        self.setState({showUpload: false});
        Util.uploadFile(UPLOADURL+"uploadzip",file,handler);
        return;
    }
    finishUpload(opt_cancel){
        if (opt_cancel){
            if (this.state.uploadIndicator && this.state.uploadIndicator.xhdr){
                this.state.uploadIndicator.xhdr.abort();
            }
        }
        this.setState({
            showUpload:undefined,
            uploadIndicator:undefined
        });
        this.getCurrent();
    }
    triggerRestart(){
        let self=this;
        let now=(new Date()).getTime();
        self.restartTime=now;
        Util.fetchJson(SETTINGSURL+"restart")
            .then((jsonData)=>{
                self.dialog.alert("restart triggered");
            })
            .catch((error)=>{
                self.restartTime=undefined;
                self.error.setError(error);
            })
    }
    isReady(){
        return this.state.ready=="READY";
    }
    findSetByKey(key){
        if (!this.state.current) return;
        if (!this.state.current.chartManager) return;
        let chartSets=this.state.current.chartManager.chartSets||[];
        for (let k in chartSets){
            if (!chartSets[k].info) continue;
            if (chartSets[k].info.name === key) return chartSets[k];
        }
    }
    render() {
        let self=this;
        let chartManager=(this.state.current?this.state.current.chartManager:{})||{};
        let chartSets=chartManager.chartSets||[];
        let disabled=this.isReady()?"":" disabled ";
        let EnableButton=(props)=>{
            if (! props.info || ! props.info.name) return null;
            let changeUrl=SETTINGSURL+"enable+?chartSet="+encodeURI(props.info.name)+"&enable="+(props.active?"0":"1");
            let buttonText=props.active?"Disable":"Enable";
            let addClass=self.isReady()?"":" disabled ";
            let onClickDo=()=>{
                Util.fetchJson(changeUrl)
                    .then((jsonData)=>{
                        if (jsonData.changed){
                            self.getCurrent();
                            if (props.active) return;
                            if (props.status == 'READY') return;
                            //give the user a hint, that activating requires a restart
                            let Dialog=(dprops)=>{
                                return <div className="dialog">
                                        <div className="dialogInnnerFlex">
                                            <h3>Set {props.title}activated</h3>
                                            <p>As this set was not active before a restart is required to load the charts</p>
                                            <div className="actions">
                                                <button className="button" onClick={dprops.closeCallback}>Cancel</button>
                                                <button className="button" onClick={()=>{dprops.closeCallback();self.triggerRestart();}}>Restart</button>
                                            </div>
                                        </div>
                                    </div>
                            };
                            self.dialog.setDialog(Dialog);
                        }
                    })
                    .catch((error)=>{self.error.setError(error)})
            };
            let onClick=()=>{
                if (props.disabledBy && ! props.active){
                    let other=self.findSetByKey(props.disabledBy);
                    if (other && other.active) {
                        let dialogFunction = (dbprops)=> {
                            return <DisabledByDialog
                                {...dbprops}
                                item={props.info}
                                enableCallback={onClickDo}
                                other={other.info||{}}/>
                        };
                        self.dialog.setDialog(dialogFunction);
                        return;
                    }
                }
                onClickDo();
            };
            return  <button className={"button"+addClass} onClick={onClick}>{buttonText}</button>;

        };
        let DeleteButton=(props)=>{
            if (! props.canDelete || ! props.info) return null;
            let addClass=self.isReady()?"":" disabled ";
            let onClickDel=()=>{
                self.dialog.confirm("Really delete version "+props.info.version+"?",
                    props.info.title)
                    .then(()=>{
                        this.dialog.setDialog(SpinnerDialog);
                        Util.postFormData(UPLOADURL+"deleteset",{chartSet:props.info.name})
                            .then(()=>{
                                self.getCurrent();
                                self.dialog.hideDialog();
                            })
                            .catch((error)=>{
                                self.dialog.hideDialog();
                                self.error.setError(error);
                            });
                    })
                    .catch(()=>{});
            };
            return <button className={"button"+addClass} onClick={onClickDel}>Delete</button>
        };
        let Content=(props)=>{
            if ( ! self.state.current){
                return <div className="loading">Loading...</div>;
            }
            return (
                <React.Fragment>
                <div className="chartsBody" ref={self.listRef}>
                    <StatusLine label="Status" className="Status" value={this.state.ready} icon={true}/>
                    <div className="actions globalActions">
                        <button
                            className={"button fpr" + disabled}
                            onClick={()=>self.getFPR(false)}>Get Fingerprint</button>
                        <button className={"button fprDongle" + disabled}
                                onClick={()=>self.getFPR(true)}>
                            Get Fingerprint(Dongle)</button>
                    </div>
                    <div className="actions globalActions">
                        <button
                            className={"button restart" + disabled}
                            onClick={self.triggerRestart}
                            >ReloadCharts (Restart)</button>
                        <button className={"button upload" + disabled}
                                onClick={()=>self.uploadSet()}>
                            Upload Zip</button>
                    </div>
                    {
                        chartSets.map((chartSet)=>{
                            let status="INACTIVE";
                            if (chartSet.active && chartSet.status == 'INIT') {
                                status = "PENDING";
                            }
                            else status=chartSet.status;
                            return <ChartSetStatus
                                        key={chartSet.info?chartSet.info.name:""}
                                        {...chartSet}
                                        status={status}
                                >
                                <div className="chartSetButtons">
                                    <EnableButton {...chartSet}/>
                                    <DeleteButton {...chartSet}/>
                                </div>
                                </ChartSetStatus>

                        })
                    }
                </div>
                    {self.state.showUpload && <UploadForm
                        fileInputKey={self.state.fileUploadKey}
                        startUpload={self.startUpload}
                        />}
                    {self.state.uploadIndicator && <UploadIndicator
                            uploadIndicator={self.state.uploadIndicator}
                            closeCallback={()=>self.finishUpload(true)}/>
                    }
                </React.Fragment>
            )
        };
        return (
            <div className="view chartsView">
                <this.error.render/>
                <this.dialog.render/>
                <Content/>
            </div>
        );
    }

}
ChartsView.propTypes={
    currentView: PropTypes.string
};



export default ChartsView;

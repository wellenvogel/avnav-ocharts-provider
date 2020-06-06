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
import StatusLine from './components/StatusLine.js';
import assign from 'object-assign';


const descriptions="settings.json";
const url="/settings/";

const GROUPS=['Main','Display','Depth'];

const SpinnerDialog=(props)=>{
    return(
        <div className={"dialog "+props.className}>
            <div className="spinner"></div>
        </div>
    )
};

const SelectDialog=(props)=>{
    return(
        <div className={"dialog "+props.className}>
            <div className="label">{props.item.title}</div>
            <div className="flexInner">
                {
                    props.list.map((item)=>{
                        let addClass=(item.value == props.selected)?" selected ":"";
                        return(
                            <div
                                onClick={()=>{
                                    props.closeCallback();
                                    props.onChange(props.item,item.value);
                                }}
                                className={"selectItem"+addClass}
                                >
                                {item.label}
                            </div>
                        );
                    })
                }
            </div>
            <div className="dialogRow dialogButtons">
                <button className="button cancel" onClick={props.closeCallback}>Cancel</button>
                <button className="button reset"
                        onClick={()=>{
                            props.closeCallback();
                            props.onChange(props.item,parseInt(props.item.default));
                        }}>
                    Reset
                </button>
            </div>
        </div>
    );
};

const parseValue=(item,value)=>{
    if (item.type == 'float' || item.type == 'depth'){
        return parseFloat(value);
    }
    return parseInt(value);
};

class RangeDialog extends React.Component{
    constructor(props){
        super(props);
        this.state={count:1,value: props.value};
        this.getValueChecked=this.getValueChecked.bind(this);
    }
    getValueChecked(){
        let nv=parseValue(this.props.item,this.state.value);
        if (isNaN(nv)) return;
        if (nv < parseValue(this.props.item,this.props.item.min) || nv > parseValue(this.props.item,this.props.item.max)) return;
        return nv;
    }
    render() {
        let props=this.props;
        let self=this;
        let addClass=(this.getValueChecked()!==undefined)?"":" invalidValue ";
        return (
            <div className={"dialog "+props.className}>
                <div className="flexInner">
                    <div className="label">{props.item.title+(props.title?props.title:'')}</div>
                    <div className="settingsRange">Range: {props.item.min}...{props.item.max}</div>
                    <input
                        className={addClass}
                        type="number"
                        min={props.item.min}
                        max={props.item.max}
                        value={this.state.value}
                        onChange={(ev)=>self.setState({value:ev.target.value})}
                        />
                </div>
                <div className="dialogRow dialogButtons">
                    <button className="button cancel" onClick={props.closeCallback}>Cancel</button>
                    <button className="button reset"
                            onClick={()=>{
                            props.closeCallback();
                            let defaultv=parseValue(props.item,props.item.default);
                            props.onChange(props.item,defaultv,true);
                        }}>
                        Reset
                    </button>
                    <button className="button ok"
                            onClick={()=>{
                            let nv=self.getValueChecked();
                            if (nv === undefined){
                                return;
                            }
                            props.onChange(props.item,nv);
                            props.closeCallback();
                        }}
                        >OK
                    </button>
                </div>
            </div>
        );
    }
}

const CheckBoxItem=(props)=>{
    return (
        <div className={"settingsItem" + props.className}
             key={props.item.name}
             onClick={(ev)=>{
                ev.stopPropagation();
                props.onChange(!(parseInt(props.value) != 0))
             }}
            >
            <span className="label">{props.item.title}</span>
            <CheckBox
                className="value"
                value={parseInt(props.value) != 0}
                onChange={props.onChange}
                ></CheckBox>
        </div>
    );
};

const SelectItem=(props)=>{
    let values=props.item.values.split(/ *, */).map((x)=>parseInt(x));
    let choices=props.item.choices.split(/ *, */);
    let selectList=[];
    for (let i=0;i< Math.min(values.length,choices.length);i++){
        selectList.push({label:choices[i],value:values[i]})
    }
    let dialog=(dp)=>{
        return <SelectDialog
            {...dp}
            item={props.item}
            selected={props.value}
            onChange={props.onChange}
            list={selectList}
            />
    };
    let cv="unknown";
    for (let i in selectList) {
        if (selectList[i].value == props.value) {
            cv = selectList[i].label;
            break;
        }
    }
    return (
        <div className={"settingsItem" + props.className}
             key={props.item.name}
             onClick={(ev)=>{
                ev.stopPropagation();
                props.showDialog(dialog)}}
            >
            <span className="label">{props.item.title}</span>
            <span className="value"
                  onClick={()=>{props.showDialog(dialog)}}>
                {cv}</span>
        </div>
    );
};

const RangeItem=(props)=>{
    let dialog=(dp)=>{
        return <RangeDialog
            {...dp}
            item={props.item}
            value={props.value}
            onChange={props.onChange}
            />
    };
    return (
        <div className={"settingsItem" + props.className}
             key={props.item.name}
             onClick={(ev)=>{
                ev.stopPropagation();
                props.showDialog(dialog)
                }}
            >
            <span className="label">{props.item.title}</span>
            <span className="value"
                  onClick={()=>{props.showDialog(dialog)}}>
                {props.value}</span>
        </div>
    );
};


const FEET2M=0.3048;
const DEPTHUNITNAME='S52_DEPTH_UNIT_SHOW';
//the factor is from the unit to meters
const depths={
    1:{label:'meters',short:'m',factor: 1.0},
    0:{label:'feet',short: 'ft',factor: FEET2M},
    2:{label: 'fathoms',short: 'fat',factor: 6*FEET2M}
};

const DepthItem=(props)=>{
    let unit=depths[props.depthUnit];
    let value=props.value/unit.factor;
    let dialog=(dp)=>{
        return <RangeDialog
            {...dp}
            title={" ("+unit.label+")"}
            item={props.item}
            value={value}
            onChange={(item,nv,isDefault)=>{
                if (!isDefault){
                    nv=unit.factor*nv;
                }
                props.onChange(item,nv);
            }}
            />
    };
    return (
        <div className={"settingsItem" + props.className}
             key={props.item.name}
             onClick={(ev)=>{
                ev.stopPropagation();
                props.showDialog(dialog)
                }}
            >
            <span className="label">{props.item.title+"("+unit.short+")"}</span>
            <span className="value"
                  onClick={()=>{props.showDialog(dialog)}}>
                {value}</span>
        </div>
    );
};



const SettingsList= (props)=>{
    let depthUnit=1; //meters
    let v=props.values[DEPTHUNITNAME];
    if (props.changes && props.changes[DEPTHUNITNAME] !== undefined){
        v=props.changes[DEPTHUNITNAME];
    }
    if (v !== undefined){
        v=parseInt(v);
        if (depths[v] !== undefined) depthUnit=v;
    }
    return (
        <div className="settingsList" >
            {props.list.map((item)=>{
                let addClass="";
                let cv=props.values[item.name];
                let original=cv;
                if (cv === undefined) cv="";
                if (props.changes && props.changes[item.name] !== undefined){
                    addClass=" changed ";
                    cv=props.changes[item.name]
                }
                if (item.type == 'bool'){
                    return (
                        <CheckBoxItem
                            className={addClass}
                            item={item}
                            value={cv}
                            onChange={(nv)=>props.onChange(item,nv?1:0)}/>
                    )
                }
                if (item.type == 'enum'){
                    return (
                        <SelectItem
                            className={addClass}
                            item={item}
                            value={cv}
                            onChange={props.onChange}
                            showDialog={props.showDialog}
                            original={original}/>
                    )
                }
                if (item.type == 'int'|| item.type == 'float'){
                    return (
                        <RangeItem
                            className={addClass}
                            item={item}
                            value={cv}
                            onChange={props.onChange}
                            showDialog={props.showDialog}
                            original={original}/>
                    );
                }
                if (item.type == 'depth'){
                    return (
                        <DepthItem
                            className={addClass}
                            item={item}
                            value={cv}
                            onChange={props.onChange}
                            showDialog={props.showDialog}
                            original={original}
                            depthUnit={depthUnit}
                            />
                    );
                }
                return (
                    <div className="settingsItem" key={item.name}>
                        <span className="label">{item.title}</span>
                        <span className="value">{cv}</span>
                    </div>
                );
            })
            }
        </div>
    )
};

const Hint=(props)=>{
    return(
        <div className="hint">
            <span className="preamble">Hint:</span>
            <span className="text">Whenever you change settings here this will reset all caches. So chart display
            will be slower afterwards until the caches are filled up again.
            </span>
        </div>
    )
};


const readyState=(ready)=>{
    return ready?"READY":"INITIALIZING";
};

class SettingsView extends Component {

    constructor(props){
        super(props);
        this.state={changes:{},ready:readyState(false)};
        this.error=new ErrorDisplay(this);
        this.dialog=new OverlayDialog(this);
        this.timer=undefined;
        this.onChange=this.onChange.bind(this);
        this.sendChanges=this.sendChanges.bind(this);
        this.setDefaults=this.setDefaults.bind(this);
        this.getCurrent=this.getCurrent.bind(this);
        this.showDialog=this.showDialog.bind(this);
        this.fetchState=this.fetchState.bind(this);
        this.listRef=React.createRef();
    }
    getCurrent(){
        let self=this;
        Util.fetchJson(url+"get")
            .then((jsonData)=>{
                self.setState({current:jsonData.data});
            })
            .catch((error)=>{
                this.error.setError("Error fetching current settings: "+error)
            });
    }
    fetchState(){
        let self=this;
        Util.fetchJson(url + "ready")
            .then((jsonData)=>{
                if (readyState(jsonData.ready) != self.state.ready){
                    self.setState({ready:readyState(jsonData.ready)});
                }
            })
            .catch((error)=>{
                if (self.state.ready != "ERROR") {
                    self.setState({ready: "ERROR"});
                }
                self.error.setError("unable to fetch ready state: "+error);
            })
    }
    componentDidMount(){
        let settingsSort=(a,b)=>{
            if (a.type == b.type) return 0;
            if (a.type == 'bool') return -1;
            if (b.type == 'bool') return 1;
            if (a.type == 'enum') return -1;
            if (b.type == 'enum') return 1;
            if (a.type == 'depth') return -1;
            if (b.type == 'depth') return 1;
            return 0;
        };
        let self=this;
        Util.fetchJson(descriptions,{checkStatus:false})
            .then((jsonData)=>{
                jsonData.important.sort(settingsSort);
                self.setState({descriptions:jsonData});
            })
            .catch((error)=>{
                this.error.setError("Error fetching descriptions: "+error);
            });
        this.getCurrent();
        this.fetchState();
        this.timer=window.setInterval(()=> {
            self.fetchState();
        },2000);

    }
    componentWillUnmount(){
        window.clearInterval(this.timer);
    }
    sendChanges(){
        let self=this;
        this.dialog.setDialog(SpinnerDialog);
        Util.postFormData(url+"set",this.state.changes)
            .then((jsonData)=>{
                self.dialog.hideDialog();
                self.setState({changes:{}});
                if (!jsonData.hasChanged){
                    //somehow this should not happen - so consider this an error
                    self.error.setError("no changes applied");
                }
                else{
                    //TODO: success message
                }
                self.getCurrent();
            })
            .catch((error)=>{
                this.dialog.hideDialog();
                this.error.setError(error);
            })
    }
    showDialog(dialog){
        this.dialog.setDialog(dialog);
    }
    onChange(item,nv){
        let nchanges=assign({},this.state.changes);
        if (nv != this.state.current[item.name]) {
            nchanges[item.name] = nv;
        }
        else{
            nchanges[item.name] = undefined;
        }
        this.setState({changes:nchanges});
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
    setDefaults(){
        if (! this.state.descriptions || ! this.state.current) return;
        let baseKeys=['important','detail'];
        let changes={};
        for (let bk in baseKeys){
            let itemList=this.state.descriptions[baseKeys[bk]];
            if (!itemList) continue;
            for (let k in itemList){
                let item=itemList[k];
                let defaultv=parseValue(item,item.default);
                let cv=this.state.current[item.name];
                if (cv == defaultv || Math.abs(cv-defaultv) < 0.00001){
                    continue;
                }
                changes[item.name]=defaultv;
            }
        }
        this.setState({changes:changes});

    }
    filterByGroup(list,group){
        let rt=[];
        list.forEach((el)=>{
            if (el.group == group) rt.push(el);
        });
        return rt;
    }
    render() {
        let self=this;
        let hasChanges=false;
        for (let k in this.state.changes){
            if (this.state.changes[k] !== undefined){
                hasChanges=true;
                break;
            }
        }
        let Content=(props)=>{
            let ready=this.state.ready==readyState(true);
            let btClass=(hasChanges && ready)?"":" disabled";
            let btDefaultsClass=(ready)?"":" disabled";
            if ( ! self.state.current || ! self.state.descriptions){
                return <div className="loading">Loading...</div>;
            }
            return (
                <div className="settingsBody" ref={this.listRef}>
                    <StatusLine className="Status" value={this.state.ready} label="Status" icon={true} />
                    <Hint/>
                    {this.props.currentView == 'mainSettings'?
                        <div className="mainSettings">
                            {GROUPS.map((group)=>{
                                return (
                                    <SettingsList
                                        list={self.filterByGroup(this.state.descriptions.important,group)}
                                        values={this.state.current}
                                        changes={this.state.changes}
                                        onChange={this.onChange}
                                        showDialog={this.showDialog}
                                    />);
                                })}

                        </div>
                        :
                        <div className="detailSettings">
                            <SettingsList
                                list={this.state.descriptions.detail}
                                values={this.state.current}
                                changes={this.state.changes}
                                onChange={this.onChange}
                                showDialog={this.showDialog}
                                />

                        </div>

                    }
                    <div className="actions">
                        <button className={"button cancel"} onClick={()=>{this.setState({changes:{}})}}>Cancel</button>
                        <button className={"button update"+btClass} onClick={this.sendChanges}>Update Settings</button>
                        <button className={"button defaults"+btDefaultsClass} onClick={this.setDefaults}>Defaults</button>
                    </div>
                </div>
            )
        };
        return (
            <div className="view settingsView">
                <this.error.render/>
                <this.dialog.render/>
                <Content/>
            </div>
        );
    }

}
SettingsView.propTypes={
    currentView: PropTypes.string
};



export default SettingsView;

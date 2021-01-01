/*
 Project:   AvnavOchartsProvider GUI
 Function:  Status display

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
import ErrorDisplay from './components/ErrorDisplay.js';
import Util from './Util.js';
import StatusLine from './components/StatusLine.js';
import StatusItem from './components/StatusItem.js';
import ChartSetStatus from './components/ChartSetStatus.js';



const GeneralStatus=(props)=>{
    return (
            <StatusItem title="ChartManager">
                <StatusLine label="Status" value={props.state} icon={true}/>
                <StatusLine label="ReadCharts" value={props.numRead+"/"+props.numCandidates}/>
                <StatusLine label="OpenCharts" value={props.openCharts}/>
                <StatusLine label="Memory" value={props.memoryKb+"kb"}/>
            </StatusItem>
    )
};
const FillerStatus=(props)=>{
    let prefillCounts=props.prefillCounts||[];
    let firstItem=true;
    return(
        <StatusItem title="CachePrefill">
            {props.prefilling?
                <React.Fragment>
                    <StatusLine label="Status" value={props.paused?"PAUSING":"FILLING"} icon={true}/>
                    <StatusLine label="currentSet" value={props.currentSet+" ("+(props.currentSetIndex+1)+"/"+(props.numSets)+")"}/>
                    <StatusLine label="currentZoom" value={props.currentZoom+" from "+props.maxZoom}/>
                </React.Fragment>
                :
                <StatusLine label="Status" value={props.paused?"PAUSING":(props.started?"READY":"WAITING")} icon={true}/>
            }
            {prefillCounts.map((item)=>{
                let info="";
                let levels=item.levels||{};
                for (let k in levels){
                    if (info != "") info+=", ";
                    info+=k+":"+levels[k];
                }
                let rt=(
                    <React.Fragment key={item.title} >
                    {firstItem?
                        <StatusLine key={item.title} className="nobreak" label="Prefills" value={item.title}/>
                        :
                        <StatusLine key={item.title} className="nobreak nosep" label="" value={item.title}/>
                    }
                    <StatusLine key={item.title+"-l"} className="nobreak nosep" label="" value={info}/>
                    </React.Fragment>
                );
                firstItem=false;
                return rt;
            })
            }
        </StatusItem>
    );
};

const PluginStatus=(props)=>{
    let pluginList=props.loadedPlugins||[];
    return(
        <StatusItem title="Plugins">
            {
                (pluginList.length >=1)?
                    <React.Fragment>
                        {pluginList.map((pi)=>{
                            return(
                                <StatusLine key={pi.name} label={pi.name} value={"Version="+pi.version+", Status="+pi.state}/>
                            );
                    })}
                    </React.Fragment>
                    :
                    <div className="noPlugins">No plugins loaded</div>
            }
        </StatusItem>
    );
};


const url="/status/";
class StatusView extends Component {

    constructor(props){
        super(props);
        this.state={};
        this.timer=undefined;
        this.error=new ErrorDisplay(this);
        this.fetchStatus=this.fetchStatus.bind(this);
    }
    fetchStatus(){
        let self=this;
        Util.fetchJson(url)
        .then(function(jsonData){
            self.error.resetError();
            self.setState({
                    data:jsonData.data
                });
        }).catch((error)=>{
            self.error.setError(error);
        })
    }
    componentDidMount(){
        this.fetchStatus();
        this.timer=window.setInterval(this.fetchStatus,2000);
    }
    componentWillUnmount(){
        window.clearInterval(this.timer);
    }
    render() {
        let managerStatus=this.state.data?this.state.data.chartManager||{}:{};
        let fillerStatus=managerStatus.cacheFiller||{};
        let chartSets=managerStatus.chartSets||[];
        let plugins=this.state.data?this.state.data.plugins||{}:{};
        return (
            <div className="view statusView">
                <this.error.render/>
                {this.state.data?
                    <div className="statusList scrollList">
                        <PluginStatus {...plugins}/>
                        <GeneralStatus {...managerStatus}/>
                        <FillerStatus {...fillerStatus}/>
                        {chartSets.map((set)=>{
                            let k=set.info?set.info.name:"";
                            return(
                                <ChartSetStatus {...set} showDetails={true} key={k}/>
                            );
                        })}
                    </div>
                    :
                    <p>Loading...</p>
                }
            </div>
        );
    }

}

StatusView.propTypes={
    currentView: PropTypes.string
};


export default StatusView;

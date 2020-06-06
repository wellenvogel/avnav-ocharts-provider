/*
 Project:   AvnavOchartsProvider GUI
 Function:  App

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

import TabBar from './components/TabBar.js';
import TitleBar from './components/TitleBar.js';
import StatusView from './StatusView';
import SettingsView from './SettingsView';
import ChartsView from './ChartsView.js';
const TABLIST=[
    {name:'status',value:'Status'},
    {name:'charts',value:'Charts'},
    {name:'mainSettings',value:'Main Settings'},
    {name:'detailSettings',value:'Detail Settings'}
];
class App extends Component {
    constructor(props){
        super(props);
        this.state={
            view:'status'
        };
        this.changeView=this.changeView.bind(this);

    }
    changeView(newView){
        this.setState({view:newView});
    }
    render() {
        let View=StatusView;
        if (this.state.view == "mainSettings") View=SettingsView;
        if (this.state.view == "detailSettings") View=SettingsView;
        if (this.state.view == "charts") View=ChartsView;
        return (
            <div className="main">
                <TitleBar/>
                <TabBar tabList={TABLIST}
                        tabChanged={this.changeView}
                        activeTab={this.state.view}
                    />
                <View currentView={this.state.view}/>
            </div>
    );
  }
}

export default App;

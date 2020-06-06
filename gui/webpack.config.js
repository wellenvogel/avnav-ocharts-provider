/*
 Project:   AvnavOchartsProvider GUI
 Function:  webpack config

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
const path=require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
var isProduction=(process.env.NODE_ENV === 'production') || (process.argv.indexOf('-p') !== -1);

let outdir="debug";
if (isProduction) {
    outdir="release";
}
let devtool="inline-source-map";
let resolveAlias={};
if (isProduction) {
    devtool="";
    resolveAlias['react$']=__dirname+"/node_modules/react/cjs/react.production.min.js";
    resolveAlias['react-dom$']=__dirname+"/node_modules/react-dom/cjs/react-dom.production.min.js";
}
var formatDate = function (date) {
    var yyyy = date.getFullYear();
    var mm = date.getMonth() < 9 ? "0" + (date.getMonth() + 1) : (date.getMonth() + 1); // getMonth() is zero-based
    var dd = date.getDate() < 10 ? "0" + date.getDate() : date.getDate();
    var yyyymmdd= "".concat(yyyy).concat(mm).concat(dd);
    var hh = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
    var min = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    return "".concat(yyyymmdd).concat("-").concat(hh).concat(min);

};
var TESTSERVER=process.env.TESTSERVER||"172.17.0.2";
module.exports = function(env) {
    return {
        context: path.join(__dirname, 'src'),
        entry: [
            './index.js',
        ],
        output: {
            path: ((env && env.outpath) ? path.join(env.outpath,outdir) : path.join(__dirname, 'build',outdir)),
            filename: 'bundle.js',
        },
        module: {
            rules: [
                {
                    test: /version\.js$/,
                    loader: 'val-loader',
                    options:{
                        version: (process.env.AVNAV_VERSION?process.env.AVNAV_VERSION:"dev-"+formatDate(new Date()))
                    }
                },
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: [
                        'babel-loader',
                    ],
                },

                {
                    test: /\.css$/,
                    use: [{
                        loader: MiniCssExtractPlugin.loader
                        },
                        'css-loader']
                },

                {
                    test: /\.less$/,
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader
                        },
                        "css-loader",
                        {
                            loader:"less-loader",
                            options:{
                                javascriptEnabled:true
                            }
                        }]
                },

                {
                    test: /images[\\\/].*\.png$|images[\\\/].*\.svg$/,
                    loader: 'file-loader',
                    options:{
                        name: "[name].[ext]",
                        esModule: false
                    }
                }

            ]
        },
        resolve: {
            alias: resolveAlias,
            modules: [
                path.join(__dirname, 'node_modules'),
            ],
        },
        plugins: [
            new CopyWebpackPlugin([
                // {output}/file.txt
                {from: '../public'}

            ]),
            new MiniCssExtractPlugin( {filename:"index.css"}),
        ],
        devtool: devtool,
        mode: isProduction?'production':'development',
        devServer:{
            proxy:{
                '/status':'http://'+TESTSERVER+':8082',
                '/settings': 'http://'+TESTSERVER+':8082',
                '/upload': 'http://'+TESTSERVER+':8082'
            }
        }
    }
};

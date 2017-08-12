"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/*
 Copyright 2017 KiKe. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
var multicastdns = require("multicast-dns");
var net = require("net");
var ipAddress = require("network-address");
var _ = require("underscore");
var mdns = multicastdns();
var Local = (function () {
    function Local(options) {
        this.connections = {};
        this.name = options.name;
        this.createServer();
        this.startServer();
        this.server.peers = [];
    }
    Local.prototype.createServer = function () {
        var _this = this;
        this.server = net.createServer(function (socket) {
            socket.on('error', function (err) {
                socket.destroy(err);
            });
            _this.trackSocket(socket);
        });
    };
    Local.prototype.startServer = function () {
        var _this = this;
        this.server.on('listening', function () {
            _this.host = ipAddress();
            _this.port = _this.server.address().port;
            _this.id = _this.host + ':' + _this.port;
            mdns.on('query', function (query) {
                _.each(query.questions, function (questions) {
                    if (questions['name'] === _this.name && questions['type'] === 'SRV') {
                        _this.respond();
                    }
                });
            });
            mdns.on('response', function (response) {
                _.each(response.answers, function (answer) {
                    if (answer['name'] === _this.name && answer['type'] === 'SRV') {
                        _this.connect(answer['data'].target, answer['data'].port);
                    }
                });
            });
            _this.update();
            var interval = setInterval(_this.update(), 3000);
            _this.server.on('close', function () {
                clearInterval(interval);
            });
        });
    };
    Local.prototype.trackSocket = function (socket) {
        var _this = this;
        this.server.peers.push(socket);
        socket.on('close', function () {
            var peerIndex = _this.server.peers.indexOf(socket);
            if (peerIndex !== -1) {
                _this.server.peers.splice(peerIndex, 1);
            }
        });
        this.server.emit('peer', socket);
    };
    Local.prototype.respond = function () {
        mdns.response([{
                name: this.name,
                type: 'SRV',
                data: {
                    port: this.port,
                    weight: 0,
                    priority: 10,
                    target: this.host
                }
            }]);
    };
    Local.prototype.connect = function (host, port) {
        var _this = this;
        var remoteId = host + ':' + port;
        if (remoteId === this.id) {
            return;
        }
        if (this.connections[remoteId]) {
            return;
        }
        var socket = this.connections[remoteId] = net.connect(port, host);
        socket.on('error', function () {
            socket.destroy();
        });
        socket.on('close', function () {
            delete _this.connections[remoteId];
        });
        this.trackSocket(socket);
    };
    Local.prototype.update = function () {
        mdns.query([{ name: this.name, type: 'SRV' }]);
    };
    return Local;
}());
exports.default = Local;

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
import * as multicastdns from 'multicast-dns';
import * as net from 'net';
import * as ipAddress from 'network-address';
import * as _ from 'underscore';

const mdns = multicastdns();

export interface LocalOptions {
    name: string;
}

export default class Local {
    public server: any;
    private host: string;
    private port: number;
    private id: string;
    private connections: object = {};
    private name: string;

    constructor(options: LocalOptions) {

        this.name = options.name;
        this.createServer();
        this.startServer();
        this.server.peers = [];

    }

    private createServer(): void {
        this.server = net.createServer((socket) => {
            socket.on('error', (err) => {
                socket.destroy(err);
            });
            this.trackSocket(socket);
        });
    }

    private startServer(): void {
        this.server.on('listening', () => {
            this.host = ipAddress();
            this.port = this.server.address().port;
            this.id = this.host + ':' + this.port;

            mdns.on('query', (query) => {
                _.each(query.questions, (questions) => {
                    if (questions['name'] === this.name && questions['type'] === 'SRV') {
                        this.respond();
                    }
                });
            });

            mdns.on('response', (response) => {
                _.each(response.answers, (answer) => {
                    if (answer['name'] === this.name && answer['type'] === 'SRV') {
                        this.connect(answer['data'].target, answer['data'].port);
                    }
                });
            });

            this.update();
            const interval = setInterval(this.update(), 3000);

            this.server.on('close', () => {
                clearInterval(interval);
            });

        });
    }

    private trackSocket(socket): void {
        this.server.peers.push(socket);
        socket.on('close', () => {
            const peerIndex = this.server.peers.indexOf(socket);
            if (peerIndex !== -1) {
                this.server.peers.splice(peerIndex, 1);
            }
        });
        this.server.emit('peer', socket);
    }

    private respond(): void {
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
    }

    private connect(host: string, port: number): void {
        const remoteId = host + ':' + port;
        if (remoteId === this.id) {
            return;
        }
        if (this.connections[remoteId]) {
            return;
        }

        const socket = this.connections[remoteId] = net.connect(port, host);

        socket.on('error', () => {
            socket.destroy();
        });

        socket.on('close', () => {
            delete this.connections[remoteId];
        });

        this.trackSocket(socket);
    }

    private update() {
        mdns.query([{name: this.name, type: 'SRV'}]);
    }

}

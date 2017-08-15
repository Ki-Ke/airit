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
import * as path from 'path';
import * as electron from 'electron';
import * as fs from 'fs';
import { isMac, isWin } from './utils/misc';
import * as childProcess from 'child_process';

const {app} = electron;

export class Config {

    private configPath: string;
    private configFileName: string = 'airit.json';

    constructor(config?: string) {

        if (!config) {
            config = path.join(app.getPath('userData'), this.configFileName);
        }

        /**
         * Check if user config exists. Otherwise init a
         * method to create default config
         */
        if (!fs.existsSync(config)) {
            this.createUserConfig();
        }

        this.configPath = config;
    }

    public readConfig(): Promise<any> {
        return new Promise((resolve, reject) => {

            if (!fs.existsSync(this.configPath)) {
                reject(`user config file doesn't exists`);
            }

            fs.readFile(this.configPath, 'utf8', (err, data) => {
                if (err) {
                    reject(`cannot open user config file: ${this.configPath}, error: ${err}`);
                } else {
                    let userConfig;
                    try {
                        userConfig = JSON.parse(data);
                    } catch (e) {
                        reject(`can not parse user config file data: ${data}, error: ${err}`);
                        return;
                    }
                    resolve(userConfig);
                }
            });
        });
    }

    /**
     * Method to update user config
     * @param {string} key
     * @param value
     * @returns {Promise}
     */
    private updateConfig(key: string, value: any): Promise<any> {
        return new Promise((resolve, reject) => {
            return this.readConfig().then((data) => {

                const newConfig = Object.assign({}, data);
                newConfig[key] = value;

                const newConfigJson = JSON.stringify(newConfig, null, ' ');

                fs.writeFile(this.configPath, newConfigJson, 'utf8', (err) => {
                    if (err) {
                        reject(`cannot update user config error: ${err}`);
                    }
                    resolve(newConfigJson);
                });
            }).catch((err) => {
                reject(err);
            });
        });
    }

    /**
     * Method to copy application default config
     * to user data directory
     */
    private createUserConfig() {

        if (isMac) {
            const userConfigPath = app.getPath('userData') + '/';
            const globalConfigPath = path.join(__dirname, '..', `config/${this.configFileName}`);
            const userName = process.env.USER;

            console.log(`${globalConfigPath}   "${userConfigPath}"`);

            childProcess.exec(`rsync -r "${globalConfigPath}" "${userConfigPath}"
            && chown -R "${userName}" "${userConfigPath}"`, {timeout: 60000},
                (err) => {
                    if (err) {
                        throw(err);
                    }
                    return;
                });
        }

        if (isWin) {
            const userConfigPath = app.getPath('userData');
            const globalConfigPath = path.join(__dirname, '..', `config/${this.configFileName}`);

            childProcess.exec(`echo D|xcopy /y /e /s /c "${globalConfigPath}" "${userConfigPath}"`,
                {timeout: 60000}, (err) => {
                    if (err) {
                        throw(err);
                    }
                    return;
                });
        }

    }
}

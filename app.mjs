#!/usr/bin/env node

import {program} from './node_modules/commander/index.js';
import fs from 'fs';

program.version('1.0.0');

program.command('generate <name>').alias('g').option('--store').action((name, cmd) => {
    const reExp = new RegExp(/[\/ \? \. \, \; \: \' \\ \" \+ \= \* \& \^ \% \$ \# \№ \@ \! ]/g);
    if (reExp.exec(name)) {
        console.log(`\x1b[31m geRx-CLI ERROR: invalid name "${name}". It is allowed to use names in the kebab-case or snake_case format \x1b[0m`);
        return;
    }
    if (name.indexOf('-') > -1 && name.indexOf('_') > -1) {
        console.log(`\x1b[31m geRx-CLI ERROR: invalid name "${name}". It is allowed to use names in the kebab-case or snake_case format \x1b[0m`);
        return;
    }

    const directories = cmd?.store ? ['./store'] : ['./states', './services', './facades'];
    const checkFiles = cmd?.store ?
        [`./store/${name}.state.ts`, `./store/${name}.service.ts`, `./store/${name}.facade.ts`] :
        [`./states/${name}.state.ts`, `./services/${name}.service.ts`, `./facades/${name}.facade.ts`];

    const existExceptions = [];
    for (const file of checkFiles) {
        if (!!fs.statSync(file, {throwIfNoEntry: false})) {
            existExceptions.push(file);
        }
    }
    if (existExceptions.length) {
        for (const file of existExceptions) {
            console.log(`\x1b[31m geRx-CLI ERROR: The file ${file} already exists\x1b[0m`);
        }
        return;
    }
    for (const dir of directories) {
        if (!fs.statSync(dir, {throwIfNoEntry: false})) {
            fs.mkdirSync(dir);
        }
    }
    for (const file of checkFiles) {
        const type = file.split('.')[file.split('.').length - 2];

        fs.appendFile(file, codeGenerate(name, type, cmd), () => {
            console.log(`\x1b[32m geRx-CLI SUCCESS: file "${file}" created \x1b[0m`);
        });

    }
});

function codeGenerate(name, type, cmd) {
    let preparedName;
    switch (true) {
        case (name.indexOf('-') > 1): {
            preparedName = name.split('-').map((word) => {
                return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
            }).join('');
        }
            break;
        case (name.indexOf('_') > 1): {
            preparedName = name.split('_').map((word) => {
                return word.charAt(0).toUpperCase() + word.toLowerCase().slice(1);
            }).join('');
        }
            break;
        default:
            preparedName = name.charAt(0).toUpperCase() + name.toLowerCase().slice(1);
            break;
    }

    const importStateDir = cmd?.store ? './' : '../states/';
    const importServiceDir = cmd?.store ? './' : '../services/';

    const stateCode =
`import { Injectable } from '@angular/core';
import { GeRxMethods } from 'geRx.interface';
import { ${preparedName}Service } from '${importServiceDir}${name}.service';

@Injectable({
    providedIn: 'root',
})
export class ${preparedName}State {
    public entityName = '${name}';
    public geRxMethods: GeRxMethods = {}

    constructor(
        private service: ${preparedName}Service
    ) {}
}
    `;

    const serviceCode =
`import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
    providedIn: 'root',
})
export class ${preparedName}Service {
    constructor(
        private http: HttpClient
    ) {}
}
    `;

    const facadeCode =
`import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GeRx } from 'geRx';
import { ${preparedName}State } from '${importStateDir}${name}.state';

@Injectable({
    providedIn: 'root',
})
export class ${preparedName}Facade {
    constructor(
        public geRx: GeRx, 
        private state: ${preparedName}State
    ) {}
    
    initStore(): void {
        this.geRx.addEntity(
            this.state.entityName,
            this.state.geRxMethods,
            this.state,
            { memorySize: 1 }
        );      
    }
    
    getData$$(): Observable<any> {
        return this.geRx.getData$$(this.state.entityName);
    }
    
    getData$(): Observable<any> {
        return this.geRx.getData$(this.state.entityName);
    }
    
    getData(): any {
        return this.geRx.getData(this.state.entityName);
    }
    
    loading$(): Observable<boolean> {
        return this.geRx.loading$(this.state.entityName);
    }
    
    loading(): boolean {
        return this.geRx.loading(this.state.entityName);
    }
        
    removeStore(): void {
        this.geRx.deleteEntity(this.state.entityName);
    }    
}
    `;

    switch (type) {
        case 'state':
            return stateCode;
        case 'service':
            return serviceCode;
        case 'facade':
            return facadeCode;
    }
}
program.parse(process.argv);
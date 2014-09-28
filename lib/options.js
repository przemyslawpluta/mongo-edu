/*
 * mongo-edu
 *
 * Copyright (c) 2014 Przemyslaw Pluta
 * Licensed under the MIT license.
 * https://github.com/przemyslawpluta/mongo-edu/blob/master/LICENSE
 */

var fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    inquirer = require('inquirer'),
    prompts = require('./prompts'),
    yargs = require('yargs')
    .usage('Usage: $0 [options]')
    .describe('d', 'download path').describe('u', 'email address')
    .describe('h', 'switch from videos (default) to handouts').boolean('h')
    .describe('py', 'py switch').describe('py', 'switch to point to Python')
    .describe('proxy', 'pass proxy').describe('proxy', 'pass proxy switch for video download')
    .describe('test', 'proxy test').describe('test', 'use with --proxy to test if usable')
    .describe('save', 'save presets').describe('save', 'save presets')
    .describe('load', 'load presets').describe('load', 'load presets')
    .describe('cw', 'switch from wiki\'s video lists (default) to courseware').boolean('cw')
    .describe('cwd', 'same as --cw and dumps list of videos to file in -d').boolean('cwd')
    .describe('cc', 'get closed captions').boolean('cc')
    .describe('hq', 'get high quality videos').boolean('hq')
    .describe('ncc', 'no check certificate').boolean('ncc')
    .describe('uz', 'unzip handout files').boolean('uz')
    .describe('co', 'sequence video files in order of the courseware').boolean('co')
    .describe('verbose', 'print debug information').boolean('verbose')
    .example('$0 -d your_download_path', 'download videos from wiki')
    .example('$0 -d your_download_path -u your_user_name --cw --hq --cc', 'download high quality videos from courseware with closed captions')
    .example('$0 -d your_download_path -u your_user_name --cw --hq --cc --save myvideo', 'save all options under `myvideo` preset and run')
    .example('$0 -d your_download_path --load', 'select and run from available presets')
    .example('$0 -d your_download_path -h --uz', 'download and unzip handouts')
    .example('$0 -d your_download_path --cw --verbose', 'download videos from courseware and print debug info')
    .example('$0 -d your_download_path --cw --proxy http://proxy_ip_address:proxy_port_number', 'download videos from courseware via proxy tunnel')
    .example('$0 -d your_download_path --proxy http://proxy_ip_address:proxy_port_number --test', 'test proxy and download video via proxy tunnel')
    .demand('d');

var base = {},
    optionsPath = path.join(__dirname, '..', '/bin/args.json');

function readFromPath(callback) {

    'use strict';

    fs.readFile(optionsPath, function readFile(err, data) {
        if (err !== null) { return callback(err); }
        callback(null, JSON.parse(data));
    });
}

function saveToPath() {

    'use strict';

    fs.writeFile(optionsPath, JSON.stringify(base), 'utf-8', function writeFile(err) {
        if (err !== null) { return console.log('i'.red + ' Save Error: ' + err.stack); }
    });
}

function saveOptions(name) {

    'use strict';

    var handleRead = function handleRead(err, data) {
        if (err !== null) { return console.log('i'.red + ' Unable To Read File: ' + err.stack); }
        base = data;
        base[name] = _.omit(yargs.argv, 'save', 'load', 'd', '_', '$0');
        saveToPath();
    };

    fs.exists(optionsPath, function isFound(exists) {
        if (!exists) {
            base[name] = _.omit(yargs.argv, 'save', 'load', 'd', '_', '$0');
            return saveToPath();
        }
        readFromPath(handleRead);
    });
}

function loadOptions(name, callback) {

    'use strict';

    if (typeof name === 'function') { callback = name; }

    fs.exists(optionsPath, function isFound(exists) {
        if (!exists) { return callback(null, []); }
        readFromPath(function read(err, data) {
            if (typeof name !== 'function') {
                var status = !!data[name];
                return callback(err, _.omit(_.defaults(data[name], yargs.argv), 'save', 'load'), status);
            }
            callback(null, Object.keys(data));
        });
    });
}

function promptAsk(data, argv, initRun) {

    'use strict';

    inquirer.prompt(prompts.loadPreset(data), function prompt(answers) {
        loadOptions(answers.preset, function load(err, data, status) {
            if (err !== null || !status) { return console.log('i'.red + ' Unable To Load Preset: ' + argv.load); }
            initRun(data);
        });
    });
}

module.exports = (function init() {

    'use strict';

    return {
        build: function build() { return yargs; },
        checkIfLoad: function checkIfLoad(argv, initRun) {
            if (!argv.load) { return initRun(argv); }
            if (typeof argv.load === 'string') {
                loadOptions(argv.load, function load(err, data, status) {
                    if (err !== null || !status) { return console.log('i'.red + ' Preset: ' + argv.load.green + ' not found.'); }
                    initRun(data);
                });
            } else {
                loadOptions(function get(err, data) {
                    if (err !== null || !data.length) { return console.log('i'.magenta + ' No Presets Found.'); }
                    promptAsk(data, argv, initRun);
                });
            }
        },
        checkIfSave: function checkIfSave(argv, initAndConfigure, profile) {
            if (argv.save) {
                if (typeof argv.save === 'string') {
                    saveOptions(argv.save);
                } else {
                    return inquirer.prompt(prompts.savePreset, function savePreset(answers) {
                        argv.save = answers.save;
                        saveOptions(answers.save);
                        initAndConfigure(profile, argv);
                    });
                }
            }
            initAndConfigure(profile, argv);
        }
    };

}());

/*
 * mongo-edu
 *
 * Copyright (c) 2014-2015 Przemyslaw Pluta
 * Licensed under the MIT license.
 * https://github.com/przemyslawpluta/mongo-edu/blob/master/LICENSE
 */

var fs = require('fs'),
    _ = require('lodash'),
    inquirer = require('inquirer'),
    Table = require('easy-table'),
    mkdirp = require('mkdirp'),
    pathEx = require('path-extra'),
    prompts = require('./prompts'),
    pkg = require('../package'),
    yargs = require('yargs')
    .usage('Usage: mongo-edu [options]')
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
    .example('mongo-edu -d your_download_path', 'download videos from wiki')
    .example('mongo-edu -d your_download_path -u your_user_name --cw --hq --cc', 'download high quality videos from courseware with closed captions')
    .example('mongo-edu -d your_download_path -u your_user_name --cw --hq --cc --save myvideo', 'save all options under `myvideo` preset and run')
    .example('mongo-edu -d your_download_path --load', 'select and run from available presets')
    .example('mongo-edu -d your_download_path -h --uz', 'download and unzip handouts')
    .example('mongo-edu -d your_download_path --cw --verbose', 'download videos from courseware and print debug info')
    .example('mongo-edu -d your_download_path --cw --proxy http://proxy_ip_address:proxy_port_number', 'download videos from courseware via proxy tunnel')
    .example('mongo-edu -d your_download_path --proxy http://proxy_ip_address:proxy_port_number --test', 'test proxy and download video via proxy tunnel')
    .demand('d');

var base = {},
    dataPath = pathEx.datadir(pkg.name),
    optionsPath = dataPath + '/args.json';

mkdirp(dataPath, function mkdirp(err) {

    'use strict';

    if (err !== null) { return console.log('i'.red + ' Unable to Create Data Directory: ' + err.stack); }
});

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

function showSign(item) {

    'use strict';
    if (!item) { return ''; }
    if (typeof item !== 'boolean') { return item; }
    return (item) ? '    x' : '';
}

function checkIfFilled(item, name, target, clear) {

    'use strict';

    var i;
    for (i = 0; i < item.length; i++) {
        if (item[i][name] !== '') { clear.push(target); break; }
    }
}

function showPresets(argv, initRun, checkIfLoad) {

    'use strict';

    readFromPath(function read(err, data) {
        if (err !== null) { return console.log('i'.red + ' No Presets Found.'); }

        var items = _.values(data), presets = _.keys(data), t = new Table,
            count = 0, names = [], users = [], clear = [], info = false, i;

        items.forEach(function each(item) {
            t.cell('Preset', presets[count]);
            t.cell('User', item.u);
            t.cell('Wiki List', ((!item.cw && item.h) ? showSign(item.cw) : showSign(!item.cw)));
            t.cell('Courseware', showSign(item.cw));
            t.cell('HQ Video', showSign(item.hq));
            t.cell('CC', showSign(item.cc));
            t.cell('Seq Order', showSign(item.co));
            t.cell('Dump List', showSign(item.cwd));
            t.cell('Handouts', showSign(item.h));
            t.cell('UnZip', showSign(item.uz));
            t.cell('Debug', showSign(item.verbose));
            t.cell('PY NCC', showSign(item.ncc));
            t.cell('PY', showSign(item.py));
            t.cell('Proxy', showSign(item.proxy));
            t.cell('Proxy Test', showSign(item.test));
            if (count === 0) { names = _.keys(t._row); }
            users.push(item.u);
            count = count + 1;
            t.newRow();
        });

        for (i = 0; i < names.length; i++) {
            checkIfFilled(t.rows, names[i], i, clear);
        }

        clear = clear.map(function map(item) { return names[item]; });

        users = _.intersection(users);

        if ((items.length > 1) && users.length === 1) {
            clear = _.pull(clear, 'User');
            info = true;
        }

        for (i = 0; i < t.rows.length; i++) {
            t.rows[i] = _.pick(t.rows[i], clear);
        }

        t.columns = _.pick(t.columns, clear);

        if (info) { console.log('User: '.bold + users[0].underline + '\n'); }

        console.log(t.toString());

        argv.load = true;

        checkIfLoad(_.omit(argv, 'save'), initRun);

    });
}

module.exports = (function init() {

    'use strict';

    return {
        build: function build() { return yargs; },
        checkIfLoad: function checkIfLoad(argv, initRun) {
            if (!argv.load) { return initRun(argv); }
            if (typeof argv.load === 'string') {
                if (argv.load === '..') { return showPresets(argv, initRun, checkIfLoad); }
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
                    if (argv.save !== '..') { saveOptions(argv.save); }
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

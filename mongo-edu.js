/*
 * mongo-edu
 *
 * Copyright (c) 2014 Przemyslaw Pluta
 * Licensed under the MIT license.
 * https://github.com/przemyslawpluta/mongo-edu/blob/master/LICENSE
 */

var pkg = require('./package'),
    mdbvideos = require('./lib/login'),
    configure = require('./lib/configure'),
    optArgs = require('./lib/options'),
    validate = require('./lib/validate'),
    videoHandler = require('./lib/videos'),
    initialize = require('./lib/initialize'),
    yargs = optArgs.build(),
    url = require('url'),
    path = require('path'),
    colors = require('colors'),
    inquirer = require('inquirer');

process.title = pkg.name;

exports.create = function start() {

    'use strict';

    console.log('\n[ ' + pkg.name.toUpperCase() + ' ' + pkg.version + ' ]\n');

    var argv = yargs.argv, proxyDetails = {},
        isWin = /^win/.test(process.platform), slash = (isWin) ? '\\' : '/';

    if (argv.help) { return yargs.showHelp(); }

    argv.d = path.normalize(argv.d);

    if (argv.d.substr(-1) !== slash) { argv.d += slash; }

    if (argv.load) {
        if (typeof argv.load === 'string') {
            optArgs.load(argv.load, function load(err, data, status) {
                if (err !== null || !status) { return console.log('i'.red + ' Preset: ' + argv.load.green + ' not found.'); }
                argv = data;
                initRun();
            });
        } else {
            optArgs.get(function get(err, data) {
                if (err !== null || !data.length) { return console.log('i'.magenta + ' No Presets Found.'); }
                inquirer.prompt([{ type: 'list', name: 'preset', message: 'Select Preset To Load:', choices: data}], function prompt(answers) {
                    optArgs.load(answers.preset, function load(err, data, status) {
                        if (err !== null || !status) { return console.log('i'.red + ' Unable To Load Preset: ' + argv.load); }
                        argv = data;
                        initRun();
                    });
                });
            });
        }
    }

    function initRun() {
        validate.init(argv, function init(err, profile) {
            if (err !== null) { throw err; }

            var savePrompt = [{ type: 'input', name: 'save', message: 'Missing [ --save ] Preset Name', default: '', validate: function(value) {
                if (value !== '') { return true; }
                return 'Please enter [ --save ] preset name';
            }}];

            if (argv.save) {
                if (typeof argv.save === 'string') {
                    optArgs.save(argv.save);
                } else {
                    return inquirer.prompt(savePrompt, function savePrompt(answers) {
                        argv.save = answers.save;
                        optArgs.save(answers.save);
                        initAndConfigure(profile);
                    });
                }
            }

            initAndConfigure(profile);

        });
    }

    if (!argv.load) { return initRun(); }

    function initAndConfigure(profile) {
        configure(argv, function conf(err) {
            if (err !== null) { throw err; }

            if (!argv.proxy || argv.h) { return initialize(profile, argv); }

            proxyDetails = url.parse(argv.proxy);

            console.log('i'.magenta + ' Proxy Host: '.bold + proxyDetails.hostname.cyan + ' Port: '.bold + proxyDetails.port.cyan + ' Protocol: '.bold + proxyDetails.protocol.replace(':', '').toUpperCase().cyan);

            mdbvideos.checkProxy(argv.proxy, function get(err, data) {
                if (err !== null) {
                    if (argv.verbose) {
                        console.log('i'.red + ' Proxy Error: '.red + err.stack);
                    } else {
                        console.log('i'.red + ' Proxy Might By Unusable.'.red);
                    }
                }

                if (data) { console.log('i'.magenta + ' ' + data); }
                if (argv.test) { return videoHandler.checkProxyDownload(argv); }

                initialize(profile, argv);
            });

        });
    }

};

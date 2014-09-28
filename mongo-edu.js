/*
 * mongo-edu
 *
 * Copyright (c) 2014 Przemyslaw Pluta
 * Licensed under the MIT license.
 * https://github.com/przemyslawpluta/mongo-edu/blob/master/LICENSE
 */

var pkg = require('./package'),
    mdbvideos = require('./lib/login'),
    videoHandler = require('./lib/videos'),
    validate = require('./lib/validate'),
    configure = require('./lib/configure'),
    optArgs = require('./lib/options'),
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
        lookFor = ((!argv.h)? 'Videos' : 'Handouts'), isWin = /^win/.test(process.platform), slash = (isWin) ? '\\' : '/';

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

            if (!argv.proxy || argv.h) { return run(profile); }

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

                run(profile);
            });

        });
    }

    function run(profile) {

        inquirer.prompt(profile, function prompt(answers) {

            var list = [{ type: 'list', name: 'url', message: '', choices: [] }], classes = list,

                check = [{ type: 'checkbox', message: '', name: 'videos', choices: [],
                    validate: function validate(answer) {
                        if ( answer.length < 1 ) { return 'You must choose at least one option.'; }
                        return true;
                    }
                }];

            mdbvideos.init(answers, argv, function get(err, data) {
                if (err !== null) { throw err; }

                if (data.length) {

                    classes[0].message = 'Found ' + data.length + ' Course'+ ((data.length > 1)? 's' : '') + '. Select:';
                    classes[0].choices = data;
                    return currentList();

                }

            });

            function currentList() {
                inquirer.prompt(classes, function prompt(answers) {

                    mdbvideos.getList(answers, argv, function get(err, data, pass) {
                        if (err !== null) { throw err; }

                        if (data.length) {

                            if (pass) { return showDetails(err, data); }

                            list[0].message = 'Found ' + data.length + ' List' + ((data.length > 1)? 's' : '') + '. Select:';
                            list[0].choices = data;

                            return currentVideos();

                        } else {
                            if (pass) { return console.log('i'.red + ' Looks like the course is not yet available or has already ended. ' +
                                lookFor + ' list is not available.\n\nCheck the start/end date for selected course.\n'); }
                        }

                        return console.log('i'.red + ' Unable to locate any ' + lookFor.toLowerCase() + ' lists in the wiki. Are ' +
                            lookFor.toLowerCase() + ' list present in the wiki?' +
                            ((lookFor === 'Videos') ? ' Try to add ' + '--cw'.green + ' to switch and search on courseware instead.' : ''));
                    });

                });
            }

            function currentVideos() {

                inquirer.prompt(list, function prompt(answers) {

                    mdbvideos.listVideos(answers, argv, function get(err, data, pass) {
                        if (err !== null) { throw err; }
                        if (!pass) { return videoHandler.details(data, argv, showDetails); }
                        showDetails(err, data);
                    });

                });
            }

            function showDetails(err, data) {
                if (err !== null) { throw err; }

                if (data.length) {
                    check[0].message = 'Select From ' + (data.length - 2) + ' ' + lookFor + '. Download:';
                    check[0].choices = data;

                    return inquirer.prompt(check, function prompt(answers) {
                        videoHandler.download(answers, data, argv);
                    });

                }

                console.log('i'.red + ' Could not locate any ' + lookFor.toLowerCase() + '.'); process.exit(0);
            }

        });

    }

};

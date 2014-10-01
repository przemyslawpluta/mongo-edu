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
    argsOptions = require('./lib/options'),
    validate = require('./lib/validate'),
    videoHandler = require('./lib/videos'),
    initialize = require('./lib/initialize'),
    yargs = argsOptions.build(),
    url = require('url'),
    path = require('path'),
    colors = require('colors');

var appTitle = '[ ' + pkg.name.toUpperCase() + ' ' + pkg.version + ' ]';

process.title = pkg.name;

exports.create = function start() {

    'use strict';

    console.log('\n');
    console.log(' ' + appTitle.black.bold.bgWhite);
    console.log('\n');

    var argv = yargs.argv, slash = (/^win/.test(process.platform)) ? '\\' : '/';

    if (argv.help) { return yargs.showHelp(); }

    argv.d = path.normalize(argv.d);

    if (argv.d.substr(-1) !== slash) { argv.d += slash; }

    function initRun(data) {
        argv = data;
        validate.init(argv, function init(err, profile) {
            if (err !== null) { throw err; }
            argsOptions.checkIfSave(argv, initAndConfigure, profile);
        });
    }

    function checkProxy(profile) {
        var proxyDetails = url.parse(argv.proxy);

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
    }

    function initAndConfigure(profile, data) {
        argv = data;
        configure(argv, function conf(err) {
            if (err !== null) { throw err; }
            if (!argv.proxy || argv.h) { return initialize(profile, argv); }
            checkProxy(profile);
        });
    }

    argsOptions.checkIfLoad(argv, initRun);
};

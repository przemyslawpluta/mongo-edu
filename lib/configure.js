/*
 * mongo-edu
 *
 * Copyright (c) 2014 Przemyslaw Pluta
 * Licensed under the MIT license.
 * https://github.com/przemyslawpluta/mongo-edu/blob/master/LICENSE
 */

var which = require('which'),
    colors = require('colors'),
    glob = require('glob');

module.exports = function configure(argv, callback) {

    'use strict';

    var python = argv.py || process.env.PYTHON || 'python',
        isWin = /^win/.test(process.platform);

    function checkPython() {

        which(python, function whichTest(err) {
            if (err !== null) {
                if (isWin) { guessPython(); } else { failNoPython(); }
            } else {
                process.env.PYTHON = python;
                callback(null);
            }
        });
    }

    function guessPython() {

        glob('\\Python**\\python.exe', function find(err, files) {

            if (err !== null) { return callback(err); }

            if (!files.length) { return failNoPython(); }

            python = files.shift();
            process.env.PYTHON = python;
            callback(null);

        });
    }

    function failNoPython() {
        console.log('[' + 'i'.red + '] Can\'t find Python executable ' + python.red + '. Check if Python installed ... if so you set the PYTHON env variable.');
        process.exit(0);
    }

    checkPython();
};

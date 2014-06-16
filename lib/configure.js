/*
 * mongo-edu
 *
 * Copyright (c) 2014 Przemyslaw Pluta
 * Licensed under the MIT license.
 * https://github.com/przemyslawpluta/mongo-edu/blob/master/LICENSE
 */

var fs = require('fs'),
    path = require('path'),
    which = require('which');

module.exports = function configure(argv, callback) {

    'use strict';

    var python = argv.py || process.env.PYTHON || 'python',
        isWin = /^win/.test(process.platform);

    function checkPython() {

        which(python, function whichTest(err) {
            if (err !== null) {
                //console.log('`which` failed', python, err);
                if (isWin) { guessPython(); } else { failNoPython(); }
            } else {
                //console.log('`which` succeeded', python, execPath);
                process.env.PYTHON = python;
                callback(null);
            }
        });
    }

    function guessPython() {

        console.log('Could not find "' + python + '". guessing location');

        var rootDir = process.env.SystemDrive || 'C:\\', pythonPath;

        if (rootDir[rootDir.length - 1] !== '\\') { rootDir += '\\'; }

        pythonPath = path.resolve(rootDir, 'Python27', 'python.exe');
        console.log('ensuring that file exists:', pythonPath);

        fs.stat(pythonPath, function stat(err) {
            if (err !== null) {
                if (err.code === 'ENOENT') { failNoPython(); } else { callback(err); }
                return;
            }
            python = pythonPath;
            process.env.PYTHON = pythonPath;
            callback(null);
        });
    }

    function failNoPython() {
        callback(new Error('Can\'t find Python executable "' + python + '", you can set the PYTHON env variable.'));
    }

    checkPython();
};

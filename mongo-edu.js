/*
 * mongo-edu
 *
 * Copyright (c) 2014 Przemyslaw Pluta
 * Licensed under the MIT license.
 * https://github.com/przemyslawpluta/mongo-edu/blob/master/LICENSE
 */

var mdbvideos = require('./lib/login'),
    videoHandler = require('./lib/videos'),
    validate = require('./lib/validate'),
    colors = require('colors'),
    inquirer = require('inquirer'),
    optimist = require('optimist')
        .usage('Usage: $0 [options]')
        .describe('d', 'download path').describe('u', 'email address')
        .describe('h', 'switch from videos (default) to handouts').boolean('h')
        .describe('cw', 'switch from wiki\'s video lists (default) to courseware').boolean('cw')
        .describe('cwd', 'same as --cw and dumps list of videos to file in -d').boolean('cwd')
        .describe('cc', 'get closed captions').boolean('cc')
        .describe('hq', 'get high quality videos').boolean('hq')
        .describe('ncc', 'no check certificate').boolean('ncc')
        .describe('uz', 'unzip file').boolean('uz')
        .demand('d');

exports.create = function start() {

    'use strict';

    var argv = optimist.argv, lookFor = ((!argv.h)? 'Videos' : 'Handouts');

    if (argv.help) { return optimist.showHelp(); }

    validate.init(argv, function (err, profile) {
        if (err !== null) { throw err; }
        run(profile);
    });

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

                            list[0].message = 'Found ' + data.length + ' List'+ ((data.length > 1)? 's' : '') + '. Select:';
                            list[0].choices = data;

                            return currentVideos();

                        } else {
                            if (pass) { return console.log('[' + 'i'.red + '] Looks like the course is not yet available or has already ended. ' +
                                lookFor + ' list is not available.\n\nCheck the start/end date for selected course.\n'); }
                        }

                        return console.log('[' + 'i'.red + '] Unable to locate any ' + lookFor.toLowerCase() + ' lists in the wiki. Is ' +
                            lookFor.toLowerCase() + ' list present in the wiki?' +
                            (lookFor === 'Videos') ? ' Try to add ' + '--cw'.green + ' to switch and search on courseware instead.' : '');
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

                console.log('[' + 'i'.red + '] Could not locate any ' + lookFor.toLowerCase() + '.'); process.exit(0);
            }

        });

    }

};

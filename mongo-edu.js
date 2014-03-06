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
    argv = require('optimist')
        .usage('Usage: $0 -u [user name] -d [download path] --ncc [no check certificate]')
        .describe('d', 'download path').describe('u', 'email address')
        .describe('h', 'switch from videos (default) to handouts').boolean('h')
        .describe('ncc', 'no check certificate with py3.x').boolean('ncc')
        .demand('d').argv;

exports.create = function start() {

    var lookFor = ((!argv.h)? 'Videos' : 'Handouts');

    validate.init(argv, function (err, profile) {
        if (err !== null) { throw err; }
        run(profile);
    });

    function run(profile) {

        inquirer.prompt(profile, function promt(answers) {

            var list = [{ type: 'list', name: 'url', message: '', choices: [] }], classes = list,

                check = [{ type: 'checkbox', message: '', name: 'videos', choices: [],
                    validate: function validate(answer) {
                        if ( answer.length < 1 ) { return 'You must choose at least one option.'; }
                        return true;
                    }
                }];

            mdbvideos.init(answers, function get(err, data) {
                if (err !== null) { throw err; }
                if (data.length) {

                    classes[0].message = 'Found ' + data.length + ' Course'+ ((data.length > 1)? 's' : '') + '. Select:';
                    classes[0].choices = data;
                    return currentList();

                }

            });

            function currentList() {
                inquirer.prompt(classes, function prompt(answers) {

                    mdbvideos.getList(answers, argv, function get(err, data) {
                        if (err !== null) { throw err; }

                        if (data.length) {

                            list[0].message = 'Found ' + data.length + ' List'+ ((data.length > 1)? 's' : '') + '. Select:';
                            list[0].choices = data;

                            return currentVideos();

                        }

                        return console.log('[' + 'i'.red + '] Unable to locate any ' + lookFor.toLowerCase() + ' lists in the wiki. Is course available / ' +
                            lookFor.toLowerCase() + ' list present in the wiki?');
                    });

                });
            }

            function currentVideos() {
                inquirer.prompt(list, function prompt(answers) {

                    mdbvideos.listVideos(answers, function get(err, data, pass) {
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
                        videoHandler.download(answers, data);
                    });

                }

                console.log('[' + 'i'.red + '] Could not locate any ' + lookFor.toLowerCase() + '.'); process.exit(0);
            }

        });

    }

};
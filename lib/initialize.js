/*
 * mongo-edu
 *
 * Copyright (c) 2014 Przemyslaw Pluta
 * Licensed under the MIT license.
 * https://github.com/przemyslawpluta/mongo-edu/blob/master/LICENSE
 */

var mdbvideos = require('./login'),
    videoHandler = require('./videos'),
    colors = require('colors'),
    inquirer = require('inquirer');

module.exports = function run(profile, argv) {

    'use strict';

    var lookFor = ((!argv.h)? 'Videos' : 'Handouts');

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

};

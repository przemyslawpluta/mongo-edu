/*
 * mongo-edu
 *
 * Copyright (c) 2014-2015 Przemyslaw Pluta
 * Licensed under the MIT license.
 * https://github.com/przemyslawpluta/mongo-edu/blob/master/LICENSE
 */

var mdbvideos = require('./login'),
    videoHandler = require('./videos'),
    prompts = require('./prompts'),
    pkg = require('../package'),
    emoji = require('./emoji'),
    colors = require('colors'),
    inquirer = require('inquirer');

function checkName(profile) {

    'use strict';

    var greetings = 'Hi ';
    return ((profile.firstName !== '') ? greetings + profile.firstName : greetings + profile.userName) + ' ' + emoji.smile;
}

module.exports = function run(profile, argv) {

    'use strict';

    var lookFor = ((!argv.h)? 'Videos' : 'Handouts'), videoPreference = 'youtube';

    inquirer.prompt(profile, function prompt(answers) {

        var list = prompts.list, classes = list, check = prompts.check, confirm = prompts.confirm;

        mdbvideos.init(answers, argv, function get(err, data, profile) {

            if (err !== null) { throw err; }

            if (profile.preset.video[1] === videoPreference || argv.h) { return processList(data, profile); }

            confirm[0].message = 'Your current video preference is set to ' + profile.preset.video[1].underline + '. Switch to: ' + videoPreference.green;

            return inquirer.prompt(confirm, function prompt(answers) {
                if (!answers.confirm) { return console.log('i'.red + ' ' + pkg.name + ' requires video preferences set to ' + videoPreference + '.\n'); }

                mdbvideos.updateProfile({
                    provider: videoPreference,
                    language: profile.preset.language[1]
                }, function status(err, resp) {
                    if (err !== null) { throw err; }
                    if (resp.success) { processList(data, profile); }
                });

            });

        });

        function processList(data, profile) {

            if (data.length) {

                classes[0].message = checkName(profile) + ' . Found ' + data.length + ' Course'+ ((data.length > 1)? 's' : '') + '. Select:';
                classes[0].choices = data;
                return currentList();

            }
        }

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
                        lookFor.toLowerCase() + ' list present?' +
                        ((lookFor === 'Videos') ? '\n\n' + ((!argv.cw) ? 'Try to add ' + '--cw'.green + ' to switch and search on courseware instead.\n' : '') : ''));
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

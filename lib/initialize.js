/*
 * mongo-edu
 *
 * Copyright (c) 2014-2016 Przemyslaw Pluta
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

var isWin = (/^win/.test(process.platform));

function checkName(profile) {

    'use strict';

    var greetings = 'Hi ';
    return ((profile.firstName !== '') ? greetings + profile.firstName : greetings + profile.userName) + ((!isWin) ? ' ' + emoji.smile + ' ' : '.');
}

module.exports = function run(profile, argv) {

    'use strict';

    var lookFor = ((!argv.h)? 'Videos' : 'Handouts'), videoPreference = 'youtube';

    inquirer.prompt(profile, function prompt(answers) {

        var list = prompts.list, classes = list, check = prompts.check, confirm = prompts.confirm;

        function init(answers) {

            mdbvideos.init(answers, argv, function get(err, data, profile) {

                if (err !== null) { throw err; }

                if (profile.preset.video[1] === videoPreference || argv.h) { return processList(data, profile); }

                confirm[0].message = 'Your current video preference is set to ' + profile.preset.video[1].underline + '. Switch to: ' + videoPreference.green;

                profileAssesment(confirm, data, profile);

            });
        }

        function profileAssesment(confirm, data, profile) {
            inquirer.prompt(confirm, function prompt(answers) {
                if (!answers.confirm) { return console.log('i'.red + ' ' + pkg.name + ' requires video preferences set to ' + videoPreference + '.\n'); }

                mdbvideos.updateProfile({
                    provider: videoPreference,
                    language: profile.preset.language[1]
                }, function status(err, resp) {
                    if (err !== null) { throw err; }
                    if (resp.success) { processList(data, profile); }
                });

            });
        }

        function getClassContent(content) {
            mdbvideos.getList(content, argv, function get(err, data, pass) {
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

                console.log('i'.red + ' Unable to locate any ' + lookFor.toLowerCase() + ' lists in the wiki. Are ' + lookFor.toLowerCase() + ' list present?');

                if (lookFor === 'Videos' && !argv.cw) {

                    confirm[0].message = 'Default wiki search returned no resuts. Perform courseware search with ' + '--cw'.green + ' ?';

                    inquirer.prompt(confirm, function prompt(answers) {
                        if (!answers.confirm) { return; }
                        argv.cw = true;
                        content.url = content.url.replace(/course_wiki/g, '') + 'courseware';
                        getClassContent(content);
                    });

                }

            });
        }

        function currentList() {
            inquirer.prompt(classes, function prompt(answers) {
                getClassContent(answers);
            });
        }

        function processList(data, profile) {

            if (!data.length) {
                if (profile.noCourses) { return console.log('i'.red + ' ' + checkName(profile) + ' ' + profile.noCourses); }
                return console.log('i'.red + ' ' + checkName(profile) + ' ' + 'Could not locate any courses in your profile. Have you registered already?\n');
            }

            classes[0].message = checkName(profile) + ' Found ' + data.length + ' Course'+ ((data.length > 1)? 's' : '') + '. Select:';
            classes[0].choices = data;
            currentList();

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

        init(answers);

    });

};

/*
 * mongo-edu
 *
 * Copyright (c) 2014 Przemyslaw Pluta
 * Licensed under the MIT license.
 * https://github.com/przemyslawpluta/mongo-edu/blob/master/LICENSE
 */

var yargs = require('yargs')
    .usage('Usage: $0 [options]')
    .describe('d', 'download path').describe('u', 'email address')
    .describe('h', 'switch from videos (default) to handouts').boolean('h')
    .describe('py', 'py switch').describe('py', 'switch to point to Python')
    .describe('proxy', 'pass proxy').describe('proxy', 'pass proxy switch for video download')
    .describe('test', 'proxy test').describe('test', 'use with --proxy to test if usable')
    .describe('cw', 'switch from wiki\'s video lists (default) to courseware').boolean('cw')
    .describe('cwd', 'same as --cw and dumps list of videos to file in -d').boolean('cwd')
    .describe('cc', 'get closed captions').boolean('cc')
    .describe('hq', 'get high quality videos').boolean('hq')
    .describe('ncc', 'no check certificate').boolean('ncc')
    .describe('uz', 'unzip handout files').boolean('uz')
    .describe('co', 'sequence video files in order of the courseware').boolean('co')
    .describe('verbose', 'print debug information').boolean('verbose')
    .example('$0 -d your_download_path', 'download videos from wiki')
    .example('$0 -d your_download_path -u your_user_name --cw --hq --cc', 'download high quality videos from courseware with closed captions')
    .example('$0 -d your_download_path -h --uz', 'download and unzip handouts')
    .example('$0 -d your_download_path --cw --verbose', 'download videos from courseware and print debug info')
    .example('$0 -d your_download_path --cw --proxy http://proxy_ip_address:proxy_port_number', 'download videos from courseware via proxy tunnel')
    .example('$0 -d your_download_path --proxy http://proxy_ip_address:proxy_port_number --test', 'test proxy and download video via proxy tunnel')
    .demand('d');

module.exports = (function init() {

    'use strict';

    return {
        build: function build() { return yargs; },
    };

}());

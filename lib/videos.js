/*
 * mongo-edu
 *
 * Copyright (c) 2014-2016 Przemyslaw Pluta
 * Licensed under the MIT license.
 * https://github.com/przemyslawpluta/mongo-edu/blob/master/LICENSE
 */

var path = require('path'),
    fs = require('fs'),
    youtubedl = require('youtube-dl'),
    filesize = require('filesize'),
    ProgressBar = require('progress'),
    request = require('request'),
    progress = require('request-progress'),
    colors = require('colors'),
    extract = require('extract-zip'),
    rimraf = require('rimraf'),
    mv = require('mv'),
    _ = require('lodash'),
    moment = require('moment'),
    getYouTubeID = require('get-youtube-id');

var isDebug = /[debug]/, downloadPath = '', proxy = '', downloadList = [], hash = {},
    co = false, ncc = false, handout = false, cc = false, uz = false, hq = false, verbose = false, retry = 10, cco = false, maxRetry;

function setOptions(argv) {

    'use strict';

    downloadPath = argv.d;
    proxy = argv.proxy;
    if (argv.ncc) { ncc = true; }
    if (argv.h) { handout = true; }
    if (argv.cc) { cc = true; }
    if (argv.uz) { uz = true; }
    if (argv.hq) { hq = true; }
    if (argv.co) { co = true; }
    if (argv.retry) { retry = argv.retry; }
    if (argv.verbose) { verbose = true; }
    if (argv.cco) {
        cc = true;
        cco = true;
    }
}

function rename(downloadPath, item, id, count, pass) {

    'use strict';

    var tag = (id + 1);

    if (tag < 10) { tag = '00' + tag; }
    if (tag >= 10 && tag < 100) { tag = '0' + tag; }

    mv(downloadPath + item, downloadPath + tag + '_' + item, function move() {
        if (cc && !pass) {
            var subtitle = path.basename(item, path.extname(item)) + '.en.srt';
            return rename(downloadPath, subtitle, id, count, true);
        }
        if (count === 0) { console.log('[ Finished ]'.green); }
    });
}

var handleList = function handleList(list, tags) {

    'use strict';

    var currentList = list,
        quality = (!hq) ? '18' : '22',
        opt = (!ncc) ? ['--format=' + quality] : ['--format=' + quality, '--no-check-certificate'], i, count;

    if (verbose) { opt = opt.concat(['--verbose']); }

    if (proxy) { opt = opt.concat(['--proxy', proxy]); }

    if (cco) { opt = opt.concat(['--skip-download']); }

    var getHandouts = function getHandouts(item) {

        var name = path.basename(item), bar, dounloadFile, dlh, left, extname, unzipFile, progressSoFar = -1, hold = 0,

        downloadItem = function downloadItem() {

            dlh = progress(request(item), { throttle: 0 });

            console.log('i'.magenta + ' Downloading: ' + name.cyan);

            dlh.on('progress', function(state) {
                if (!bar) { bar = new ProgressBar('>'.green + ' ' + filesize(state.size.total) + ' [:bar] :percent :etas', { complete: '=', incomplete: ' ', width: 20, total: 100 }); }
                if (!bar.complete && progressSoFar !== state.percent) {
                    var i;
                    for (i = 0; i < (state.percent - hold); i++) { bar.tick(); }
                    hold = state.percent;
                }
                progressSoFar = state.percent;
            });

            dlh.on('error', function error(err) {
                return console.log(err.stack);
            });

            dounloadFile = dlh.pipe(fs.createWriteStream(downloadPath + name));

            dounloadFile.on('close', function close() {

                extname = path.extname(name);

                if (!uz || (extname !== '.zip')) {
                    console.log('i'.green + ' Done.' + left);
                    return nextItem(currentList);
                }

                unzipFile = extract(downloadPath + name, {dir: downloadPath + path.basename(name, extname)}, function out(err) {
                    if (err) {
                        console.log('i'.red + ' Unable to unzip ' + name.red + ' try manually.');
                        return rimraf(downloadPath + name.replace('.zip', ''), function rf() { nextItem(currentList); });
                    }
                    console.log('i'.green + ' Done.' + left);
                    cleanup(downloadPath + name, currentList);
                });

            });

            dounloadFile.on('error', function error(err) {
                return console.log(err.stack);
            });
        },

        cleanup = function cleanup(target, next) {
            fs.unlink(target, function (err) {
                if (err !== null) { console.log(err.stack); }
                nextItem(next);
            });
        },

        nextItem = function nextItem(next) {
            handleList(next);
        };

        fs.exists(downloadPath + name, function (exists) {
            left = (currentList.length)? ' ' + currentList.length + ' left ...' : '';

            if (exists) {
                console.log('>'.magenta + ' ' + name + ' has already been downloaded.' + left);
                return handleList(currentList);
            }

            downloadItem();

        });

    },

    getSubtitles = function getSubtitles(item, left, currentList, tags) {
        if (!cc) {
            if (left) { console.log('i'.magenta + ' ' + left); }
            return handleList(currentList, tags);
        }

        youtubedl.getSubs(item, { auto: true, all: false, lang: 'en', cwd: downloadPath }, function getSubs(err) {
            if (err !== null) {
                console.log('i'.red + ' Unable to download subtitles.');
            } else {
                console.log('i'.magenta + ' Subtitles downloaded.');
            }
            if (left) { console.log('i'.magenta + ' ' + left); }
            handleList(currentList, tags);
        });
    },

    getVideos = function getVideos(item, notAvailable) {

        if (handout) { return getHandouts(item); }

        if (cco) { return getSubtitlesOnly(item); }

        var downloaded = 0, size = 0, stash = {}, bar;

        if (fs.existsSync(downloadPath + hash[item])) {
            downloaded = fs.statSync(downloadPath + hash[item]).size;
        }

        var dl = youtubedl(item, opt, {start: downloaded, cwd: downloadPath});

        dl.on('info', function(info) {
            size = info.size + downloaded;
            stash = info;
            if (co) { downloadList.push({id: item, name: path.basename(info._filename)}); }
            if (notAvailable) { console.log('i'.magenta + ' No HQ video available for ' + info.fulltitle.white.bold + ' trying default quality ...'); }
            console.log('i'.magenta + ((downloaded > 0) ? ' ' + 'Resuming download'.underline + ': ': ' Downloading: ') + info._filename.cyan + ' > ' + item);
            bar = new ProgressBar('>'.green + ' ' + ((downloaded > 0) ? '[' + filesize(downloaded) + '] ' + filesize(info.size) : filesize(info.size)) + ' [:bar] :percent :etas', { complete: '=', incomplete: ' ', width: 20, total: parseInt(info.size, 10) });
            console.time('i'.magenta + ' ' + info._filename + '. Done in');
            dl.pipe(fs.createWriteStream(downloadPath + info._filename, {flags: 'a'}));
        });

        dl.on('complete', function(info) {
            size = info.size + downloaded;
            stash = info;
            console.log('i'.magenta + ' File ' + stash._filename.green + ' already downloaded.');
            console.time('i'.magenta + ' ' + info._filename + '. Done in');
        });

        dl.on('data', function(data) {
            if (!bar.complete) { bar.tick(data.length); }
        });

        dl.on('error', function error(err) {

            if (err.message.indexOf('requested format not available') !== -1) {
                _.pull(opt, '--format=22');
                opt.push('--format=18');
                return getVideos(item, true);
            }

            if (err.message.match(/Command failed: python|ENETDOWN|ENOTFOUND|EAI_AGAIN/) && retry > 0) {
                if (!maxRetry) { maxRetry = moment().add(retry, 'seconds'); }
                if (maxRetry && maxRetry.diff(moment()) > 0) { return delay(item); }
            }

            console.log('i'.red + ' Download Failed: '.red + err.stack);

        });

        dl.on('close', function close() {
            dl.emit('end');
        });

        dl.on('end', function end() {
            maxRetry = null;
            var left = (currentList.length) ? currentList.length + ' left ...' : '';
            console.timeEnd('i'.magenta + ' ' + stash._filename + '. Done in');
            getSubtitles(item, left, currentList, tags);
        });
    },

    getSubtitlesOnly = function getSubtitlesOnly(item) {

        youtubedl.getInfo(item, [], function getInfo(err, info) {
            if (err) { console.log('i'.red + ' Get Info Failed: '.red + err.stack); }
            if (info) { console.log('i'.magenta + ' Downloading Subtitles: ' + info._filename.cyan + ' > ' + item); }
            var left = (currentList.length) ? currentList.length + ' left ...' : '';
            getSubtitles(item, left, currentList, tags);
        });

    },

    delay = function delay(target) {
        setTimeout(function timeout() { getVideos(target); }, 5000);
    };

    if (currentList.length) {
        return getVideos(currentList.shift());
    }

    if (co) {

        count = downloadList.length;

        for (i = 0; i < downloadList.length; i++) {
            count = count -1;
            rename(downloadPath, downloadList[i].name, tags[downloadList[i].id], count);
        }

    } else {
        console.log('[ Finished ]'.green);
        process.exit(0);
    }

};

module.exports = {

    details: function details(opt, argv, callback) {

        'use strict';

        setOptions(argv);

        var bar = new ProgressBar('>'.magenta + ' Collecting [:bar] :percent', { complete: '=', incomplete: ' ', width: 20, total: opt.length }),
            options = (!ncc) ? [] : ['--no-check-certificate'];

        if (verbose) { options = options.concat(['--verbose']); }

        if (proxy) { options = options.concat(['--proxy', proxy]); }

        var isFinished = function isFinished(count, items) {
            if (count === 0) {

                var sortedList = _.map(_.sortBy(items, 'id'));

                sortedList.unshift({name: 'All', value: 'all', checked: true}, {name: 'Cancel', value: 'cancel'});
                callback(null, sortedList);
            }
        },

        getDetails = function getDetails(item, i) {

            function getInfo() {

                if (handout) {
                    items.push({name: path.basename(item), value: item, id: i});
                    count = count - 1;
                    bar.tick();
                    return isFinished(count, items);
                }

                youtubedl.getInfo(item, options, function(err, info) {

                    if (verbose && isDebug.test(err)) { console.log('i'.red + ' Get Info Failed: '.red + err.stack); }

                    hash[item] = (!err && info) ? info._filename : getYouTubeID(item);

                    items.push((!err && info)?{name: info.fulltitle + ' - ' + info.width + 'x' + info.height, value: item, id: i}:{name: 'No info: ' + item, value: item, id: i});

                    count = count - 1;

                    bar.tick();

                    isFinished(count, items);

                });
            }

            setTimeout(function timeout(){ getInfo(); }, 200 * i);

        }, items = [], list = [], i, count;

        list = _.filter(opt, function filter(item) { return (item.indexOf('http://') !== -1) || (item.indexOf('https://') !== -1); });

        if (!list.length) { return callback(null, list); }

        count = list.length;

        for (i = 0; i < list.length; i++) {
            getDetails(list[i], i);
        }
    },

    download: function download(opt, list, argv) {

        'use strict';

        setOptions(argv);

        var i, options = opt.videos, fullList = [], selected = [], tags = {};

        for (i = 0; i < list.length; i++) {
            tags[list[i].value] = list[i].id;
        }

        if (options.length === 1 && options[0] === 'cancel') { return console.log('Cancel'); }

        if (options.length === 1 && options[0] === 'all') {
            fullList = _.pull(_.map(list, function map(item) { return item.value; }), 'all', 'cancel');

            return handleList(fullList, tags);
        }

        if (options.length >= 1) {
            selected = _.pull(options, 'all', 'cancel');

            if (selected.length) { return handleList(selected, tags); }
        }

    },

    listVideosFromPlaylist: function getIdsFromPlaylist(opt, argv, callback) {

        'use strict';

        setOptions(argv);

        var options = (!ncc) ? [] : ['--no-check-certificate'], items = [], i, item;

        if (verbose) { options = options.concat(['--verbose']); }

        if (proxy) { options = options.concat(['--proxy', proxy]); }

        youtubedl.getInfo(opt.url, options, function(err, info) {

            if (verbose && isDebug.test(err)) { console.log(err); }

            if (info.length) {
                for (i = 0; i < info.length; i++) {
                    item = 'https://www.youtube.com/watch?v=' + info[i].id;
                    items.push((!err)?{name: info.fulltitle + ' - ' + info.width + 'x' + info.height, value: item, id: i}:{name: 'No info: ' + item, value: item, id: i});
                }

                items.unshift({name: 'All', value: 'all', checked: true}, {name: 'Cancel', value: 'cancel'});
            }

            callback(null, items, true);

        });

    },

    checkProxyDownload: function checkProxyDownload(argv) {

        'use strict';

        setOptions(argv);
        var video = 'https://youtu.be/nm20j_x9Ol8', opt = { all: undefined, cancel: undefined };
        if (typeof argv.test === 'string') { video = argv.test; }
        opt[video] = 0;
        handleList([video], opt);
    }
};

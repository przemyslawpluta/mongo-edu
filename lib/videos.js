/*
 * mongo-edu
 *
 * Copyright (c) 2014 Przemyslaw Pluta
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
    unzip = require('unzip'),
    rimraf = require('rimraf'),
    mv = require('mv'),
    _ = require('lodash');

var isDebug = /[debug]/, downloadPath = '', proxy = '', downloadList = [],
    co = false, ncc = false, handout = false, cc = false, uz = false, hq = false, verbose = false;

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
    if (argv.verbose) { verbose = true; }
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
        opt = (!ncc) ? ['--max-quality=' + quality] : ['--max-quality=' + quality, '--no-check-certificate'], i, count;

    if (cc) { opt = opt.concat(['--write-sub', '--srt-lang=en']); }

    if (verbose) { opt = opt.concat(['--verbose']); }

    if (proxy) { opt = opt.concat(['--proxy', proxy]); }

    var getHandouts = function getHandouts(item) {

        var name = path.basename(item), bar, dounloadFile, dlh, left, extname, unzipFile, progressSoFar = -1, hold = 0,

        downloadItem = function downloadItem() {

            dlh = progress(request(item), { throttle: 0 });

            console.log('i'.magenta + ' Downloading: ' + name.cyan);

            dlh.on('progress', function(state) {
                if (!bar) { bar = new ProgressBar('>'.green + ' ' + filesize(state.total) + ' [:bar] :percent :etas', { complete: '=', incomplete: ' ', width: 20, total: 100 }); }
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

                unzipFile = fs.createReadStream(downloadPath + name).pipe(unzip.Extract({ path: downloadPath + path.basename(name, extname) }));

                unzipFile.on('error', function error() {
                    console.log('i'.red + ' Unable to unzip ' + name.red + ' try manually.');
                    rimraf(downloadPath + name.replace('.zip', ''), function rf() { nextItem(currentList); });
                });

                unzipFile.on('close', function close() {
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

    getVideos = function getVideos(item, nocc) {

        if (handout) { return getHandouts(item); }

        var dl = youtubedl(item, nocc || opt, { cwd: downloadPath }), size = 0, stash = {}, bar;

        dl.on('info', function(info) {
            size = info.size;
            stash = info;
            if (co) { downloadList.push({id: item, name: path.basename(info.filename)}); }
            console.log('i'.magenta + ' Downloading: ' + info.filename.cyan + ' > ' + item);
            bar = new ProgressBar('>'.green + ' ' + filesize(size) + ' [:bar] :percent :etas', { complete: '=', incomplete: ' ', width: 20, total: parseInt(size, 10) });
            console.time('i'.magenta + ' ' + info.filename + '. Done in');
            dl.pipe(fs.createWriteStream(downloadPath + info.filename));
        });

        dl.on('data', function(data) {
            if (!bar.complete) { bar.tick(data.length); }
        });

        dl.on('error', function error(err) {
            if (err.message.indexOf('video doesn\'t have subtitles') !== -1) {
                console.log('i'.magenta + ' No Closed Captions Available For: ' + stash.filename.cyan + ' > ' + item);
                return getVideos(item, _.without(opt, '--write-sub', '--srt-lang=en'));
            }
            console.log(err.stack);
        });

        dl.on('end', function end() {
            var left = (currentList.length)? currentList.length + ' left ...' : '';
            console.timeEnd('i'.magenta + ' ' + stash.filename + '. Done in');
            if (left) { console.log('i'.magenta + ' ' + left); }
            handleList(currentList, tags);
        });
    };

    if (currentList.length) { return getVideos(currentList.shift()); }

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

                    if (verbose && isDebug.test(err)) { console.log(err); }

                    items.push((!err)?{name: info.title + ' - ' + info.resolution, value: item, id: i}:{name: 'No info: ' + item, value: item, id: i});

                    count = count - 1;

                    bar.tick();

                    isFinished(count, items);

                });
            }

            setTimeout(function timeout(){ getInfo(); }, 100 * i);

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
                    items.push((!err)?{name: info[i].title + ' - ' + info[i].resolution, value: item, id: i}:{name: 'No info: ' + item, value: item, id: i});
                }

                items.unshift({name: 'All', value: 'all', checked: true}, {name: 'Cancel', value: 'cancel'});
            }

            callback(null, items, true);

        });

    }
};

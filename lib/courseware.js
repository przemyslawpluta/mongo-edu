/*
 * mongo-edu
 *
 * Copyright (c) 2014 Przemyslaw Pluta
 * Licensed under the MIT license.
 * https://github.com/przemyslawpluta/mongo-edu/blob/master/LICENSE
 */

var fs = require('fs'),
    request = require('request'),
    cheerio = require('cheerio'),
    ProgressBar = require('progress'),
    colors = require('colors'),
    _ = require('lodash');

var camo = { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/34.0.1847.116 Safari/537.36' };

function saveData(argv, details, data) {

    'use strict';

    details = details.map(function items(item) { return item.replace(/[^a-z0-9]/gi, '_').replace(/(_){2,}/g, '_'); });

    fs.writeFile(argv.d + details[0] + '-' + details[1] + '.txt', data.join('\n'), function (err) {
        if (err !== null) { return console.log(err.stack); }
    });
}

function listVideos(url, jar, id, callback) {

    'use strict';

    request({ url: url, jar: jar, headers: camo }, function get(err, res, body) {
        if (err !== null) { return callback(null, []); }
        if (res.statusCode === 200) {

            var $ = cheerio.load(body),
                pageView = $('section.course-content').html(),
                getVideoIds = (pageView) ? pageView.match(/(.0:)(.*?)(&)/g) : pageView;

            getVideoIds = (!getVideoIds) ? [] : getVideoIds.map(function map(item) { return { id: id, video: 'https://youtu.be/' + item.replace('.0:','').replace('&','')}; });

            callback(null, getVideoIds);

        }
    });

}

function getDetails(jar, count, bar, head, argv, callback) {

    'use strict';

    var list = [], out = [];

    return function filterDetail(url, i) {

        function getInfo() {
            listVideos(url, jar, i, function details(err, items) {
                count = count - 1;
                list.push(items);
                bar.tick();
                if (count === 0) {
                    out = _.map(_.sortBy(_.flatten(list), 'id'), function map(item) { return item.video; });
                    if (argv.cwd) { saveData(argv, head, out); }
                    return callback(null, out);
                }
            });
        }

        setTimeout(function timeout() { getInfo(); }, 50 * i);

    };
}

module.exports = {

    findDetails: function findDetails($, callback) {

        'use strict';

        var chapter = $('.chapter'), master = $('div.inner-wrapper h1').text(), courses = [];

        $(chapter).each(function each(i, item) {
            var current = $(item),
            title = current.find('h3 a').text(),
            list = current.find('ul'),
            stack = [];

            $(list).children().each(function each(i, item) {
                var link = $(item).find('a').attr('href');
                stack[i] = link;
            });

            courses.push({ name: title, value: { master: [ master, title ], stack: stack } });

        });

        callback(null, courses);

    },

    filterVideos: function filterVideos(opt, url, jar, argv, callback) {

        'use strict';

        if (!opt.url.stack) { return callback(null, []); }

        var bar = new ProgressBar('[' + '>'.magenta + '] Searching Courseware [:bar] :percent', { complete: '=', incomplete: ' ', width: 20, total: opt.url.stack.length }),
            getPage = getDetails(jar, opt.url.stack.length, bar, opt.url.master, argv, callback), i;

        for (i = 0; i < opt.url.stack.length; i++) {
            getPage(url + opt.url.stack[i], i);
        }
    }

};

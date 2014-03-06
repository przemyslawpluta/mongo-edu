/*
 * mongo-edu
 *
 * Copyright (c) 2014 Przemyslaw Pluta
 * Licensed under the MIT license.
 * https://github.com/przemyslawpluta/mongo-edu/blob/master/LICENSE
 */

var request = require('request'),
    cheerio = require('cheerio'),
    ProgressBar = require('progress'),
    _ = require('lodash');

var jar = request.jar();

function addCookies(cookies, url) {
    _.each(cookies, function cookies(cookie) { jar.setCookie(cookie, url + '/login'); });
}

module.exports = {

    init: function init(opt, callback) {

        var url = 'https://education.mongodb.com',
            bar = new ProgressBar('[' + '>'.magenta + '] Searching [:bar] :percent', { complete: '=', incomplete: ' ', width: 20, total: 5 }),
            CSRFTokenCookie = '',

        login = function login(token) {

            request({
                uri: url + '/login',
                method: 'POST',
                jar: jar,
                headers: { 'X-CSRFToken': token[0].split('=')[1] },
                form: { 'email': opt.user, 'password': opt.password }
            }, function post(err, res, body) {

                if (err !== null) { return callback(err, null); }

                if (res.statusCode === 200) {
                    var status = JSON.parse(body);
                    if (status.success !== true) { return callback(new Error(status.value)); }

                    bar.tick();

                    return checkCourses(bar);

                }

                callback(new Error(res.statusCode));

            });
        },

        checkCourses = function checkCourses(bar) {

            bar.tick();

            request({ url: url + '/dashboard', jar: jar }, function get(err, res, body) {
                if (err !== null) { return callback(err, null); }
                bar.tick();
                if (res.statusCode === 200) {

                    var list = [], getCourses = [], $ = cheerio.load(body),

                        current = $('article.my-course.panel').children(),

                        link = $(current).children().filter('.span-7.offset-1').children().find('h3').children();

                    bar.tick();

                    $(link).each(function each(i, item) {
                        list.push({ name: $(item).text(), value: url + $(item).attr('href').replace(/about|info|syllabus/g, '') + 'course_wiki' });
                    });

                    bar.tick();

                    callback(null, list);
                }

            });
        };

        request(url, function (err, res, body) {

            if (err !== null) { return callback(err, null); }

            if (res.statusCode === 200) {

                addCookies(res.headers['set-cookie'], url);

                CSRFTokenCookie = res.headers['set-cookie'][0].split(';');

                return login(CSRFTokenCookie);

            }

            callback(new Error(res.statusCode));

        });
    },

    getList: function getList(opt, callback) {

        request({ url: opt.url, jar: jar }, function get(err, res, body) {
            if (err !== null) { return callback(err, null); }
            if (res.statusCode === 200) {

                var list = [], getCourses = [], $ = cheerio.load(body), tag = opt.url.replace('course_', '');

                $('div.wiki-article p').children().filter('a').map(function map(i, item) {
                    var current = $(item);
                    if (current.text().indexOf('Video') !== -1) { list.push(current.attr('href')); }
                });

                getCourses = _.filter(list, function map(item) { return item.match(/(wiki\/M101|wiki\/M102|wiki\/C100|wiki\/M202)/); });

                callback(null, _.map(getCourses, function map(item) { return { name: item.replace(tag, '').slice(0, -1).slice(1).replace(/-/g, ' ').replace(/\//g, ': '), value: item }; }));
            }

        });

    },

    listVideos: function listVideos(opt, callback) {

        var videos = [], state = false, list, $, current;

        request({ url: opt.url, jar: jar }, function get(err, res, body) {
            if (err !== null) { return callback(err, null); }
            if (res.statusCode === 200) {
                $ = cheerio.load(body);
                list = $('div.wiki-article');

                current = list.find('code').text();

                if ((current.indexOf('http://') !== -1) || (current.indexOf('https://') !== -1)) {
                    videos = _.compact(current.split('\n'));
                }

                if (!videos.length) {

                    list.children('p').children().each(function each(i, item) {
                        var current = $(item);
                        if (current.attr('href')) {
                            videos.push({ name: current.text().split('-')[0], value: current.attr('href') });
                        }
                    });

                    if (videos.length) { videos.unshift({name: 'All', value: 'all', checked: true}, {name: 'Cancel', value: 'cancel'}); }
                    state = true;
                }

                return callback(null, videos, state);
            }

            callback(new Error(res.statusCode));
        });
    }
};
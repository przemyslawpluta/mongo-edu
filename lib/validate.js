/*
 * mongo-edu
 *
 * Copyright (c) 2014 Przemyslaw Pluta
 * Licensed under the MIT license.
 * https://github.com/przemyslawpluta/mongo-edu/blob/master/LICENSE
 */

var mkdirp = require('mkdirp'),
    prompts = require('./prompts');

module.exports.init = function init(opt, callback) {

    'use strict';

    var profile = prompts.profile;

    if (opt.u !== '') { profile[0].default = opt.u; }

    mkdirp(opt.d, function mkdirp(err) {
        if (err !== null) { return callback(err); }
        callback(null, profile);
    });

};

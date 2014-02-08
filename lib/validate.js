/*
 * mongo-edu
 *
 * Copyright (c) 2014 Przemyslaw Pluta
 * Licensed under the MIT license.
 * https://github.com/przemyslawpluta/mongo-edu/blob/master/LICENSE
 */

var mkdirp = require('mkdirp');

module.exports.init = function init(opt, callback) {

    var profile = [
        { type: 'input', name: 'user', message: 'MongoDB Uni User Name', default: '', validate: function(value) {
            if (value !== '') { return true; }
            return "Please enter your MongoDB Uni user name - email address";
        }},
        { type: 'password', message: 'MongoDB Uni Password', name: 'password', validate: function(value) {
            if (value !== '') { return true; }
            return "Please enter your MongoDB Uni password";
        }}
    ];

    if (opt.u !== '') { profile[0].default = opt.u; }

    mkdirp(opt.d, function mkdirp(err) {
        if (err !== null) { return callback(err); }
        callback(null, profile);
    });

};

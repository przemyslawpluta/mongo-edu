/*
 * mongo-edu
 *
 * Copyright (c) 2014-2016 Przemyslaw Pluta
 * Licensed under the MIT license.
 * https://github.com/przemyslawpluta/mongo-edu/blob/master/LICENSE
 */

var path = require('path'),
    colors = require('colors'),
    fs = require('fs');

var rs = fs.createReadStream(__dirname + '/resume.js'),
    ws = fs.createWriteStream(path.resolve(__dirname, '../node_modules/youtube-dl/lib/youtube-dl.js'));

function failed() {
    'use strict';
    console.log('Unable to deploy youtube-dl resume option\n');
}

function success() {
    'use strict';
    console.log('Resume option for youtube-dl deployed\n');
}

rs.pipe(ws);

rs.on('error', function error(err) {
    'use strict';
    if (err) { return failed(); }
});

rs.on('end', function end() {
    'use strict';
    success();
});

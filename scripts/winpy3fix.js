var mv = require('mv'),
    path = require('path');

mv(path.resolve(__dirname + '../' + '../.temp/youtube-dl.js'), path.resolve(__dirname + '../' + '../node_modules/youtube-dl/lib/youtube-dl.js'), function error(err) {
    'use strict';
    if (err !== null) { console.log(err.stack); }
});

mongo-edu
=========

[![NPM](https://nodei.co/npm/mongo-edu.png?compact=true)](https://nodei.co/npm/mongo-edu/)

[![NPM version](https://badge.fury.io/js/mongo-edu.png)](http://badge.fury.io/js/mongo-edu)
[![Dependency Status](https://gemnasium.com/przemyslawpluta/mongo-edu.png)](https://gemnasium.com/przemyslawpluta/mongo-edu)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/przemyslawpluta/mongo-edu?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

Select and download videos and handouts from [university.mongodb.com](https://university.mongodb.com) courses

## Apps

Depending on your needs you can download MongoDB University [ios](https://itunes.apple.com/us/app/mongodb-university/id1009365760?mt=8) or [android](https://play.google.com/store/apps/details?id=com.mongodb.university.mongou) app.

## Prerequisite

```
py 2.7 or 3.x
```

## Installation

```
npm install mongo-edu -g
```

or see [detailed installation guide](https://github.com/przemyslawpluta/mongo-edu/wiki/Installation) in the wiki pages

## Usage

```
$ mongo-edu --help

Options:
  -d          download path                             [required]
  -u          email address
  --py        pass switch to point to Python
  --ncc       no check certificate for py3.x < py3.4.x
  --verbose   print debug info
  --retry     retry time in seconds if connection / download fails

Videos:
  --cw        switch from wiki video lists (default) to courseware
  --cwd       same as --cw and dumps list of videos to file in -d
  --co        arrange video files in correct order of the courseware
  --cc        get closed captions
  --cco       get only closed captions without downloading videos
  --hq        get high quality videos

Handouts:
  -h          switch from videos (default) to handouts
  --uz        unzip handout files

Proxy:
  --proxy     pass proxy switch for video download
  --test      use with --proxy to test if usable

Presets:
  --save      save presets
  --load      load presets

```

## Select and download

### Videos and closed captions

Download all available videos from lists present in the `wiki` pages for any given week. If no lists are present in `wiki` add `--cw` to search through the main courseware pages.

Add `--cc` to download closed captions with the videos and `--hq` to get high quality videos. Use with `--co` to sequence the video files in order of the wiki ( based on the order of the files present in the wiki lists ) or courseware ( when used with `--cw` preserves the courseware order ).

![screenshot](https://raw.github.com/przemyslawpluta/mongo-edu/gh-pages/images/edu-videos.gif)

### Videos via proxy

You can download videos via proxy tunnel. To test if proxy is usable just pass `--proxy http://proxy_ip_address:proxy_port_number --test` to download a test video via specified proxy. If succesfull just remove `--test` and pass the rest of the required flags.

### Handouts

Add `-h` to download all available handouts present in the `syllabus` pages for any given week and `--uz` to unzip files after the download.

![screenshot](https://raw.github.com/przemyslawpluta/mongo-edu/gh-pages/images/edu-handouts.gif)

## Save / Load presets

You can save presets for use for later. To do so just add `--save my_preset_name` at the end of your call sequence. To recall saved presets just specify `--load ..`.

![screenshot](https://raw.github.com/przemyslawpluta/mongo-edu/gh-pages/images/me-presets.gif)

## License
MIT

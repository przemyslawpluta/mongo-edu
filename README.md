mongo-edu
=========

[![NPM](https://nodei.co/npm/mongo-edu.png?compact=true)](https://nodei.co/npm/mongo-edu/)

[![NPM version](https://badge.fury.io/js/mongo-edu.png)](http://badge.fury.io/js/mongo-edu)
[![Dependency Status](https://gemnasium.com/przemyslawpluta/mongo-edu.png)](https://gemnasium.com/przemyslawpluta/mongo-edu)

Select and download videos and handouts from [university.mongodb.com](https://university.mongodb.com) courses

##Prerequisite

```
py 2.7 or 3.x
```

##Installation

```
npm install mongo-edu -g
```

##Usage

```
$ mongo-edu --help

Options:
  -d     download path                             [required]
  -u     email address
  -h     switch from videos (default) to handouts
  --cc   get closed captions
  --hq   get high quality videos
  --ncc  no check certificate for < py3.4.x
  --uz   unzip file
```

## Select and download

### Videos and closed captions

Download all available videos from lists present in the `wiki` pages for any given week. Add `--cc` to download closed captions with the videos.

![screenshot](https://raw.github.com/przemyslawpluta/mongo-edu/gh-pages/images/me-videos-update.gif)

### Handouts

`-h` Download all available handouts present in the `syllabus` pages for any given week.

![screenshot](https://raw.github.com/przemyslawpluta/mongo-edu/gh-pages/images/me-handouts-update.gif)


##License
MIT
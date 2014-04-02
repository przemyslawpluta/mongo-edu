mongo-edu
=========

[![NPM](https://nodei.co/npm/mongo-edu.png?compact=true)](https://nodei.co/npm/mongo-edu/)

[![NPM version](https://badge.fury.io/js/mongo-edu.png)](http://badge.fury.io/js/mongo-edu)
[![Dependency Status](https://gemnasium.com/przemyslawpluta/mongo-edu.png)](https://gemnasium.com/przemyslawpluta/mongo-edu)

Select and download videos and handouts from [education.mongodb.com](https://education.mongodb.com) courses

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
mongo-edu -d [download path] -u [user name] -h [get handouts] --cc [get closed captions] --ncc [no check certificate]

Options:
  -d     download path                             [required]
  -u     email address
  -h     switch from videos (default) to handouts
  --cc   get closed captions
  --ncc  no check certificate with py3.x
```

## Select and download

### Videos

Download all available videos from lists present in the `wiki` pages for any given week. Add `--cc` to download closed captions with the videos.

![screenshot](https://raw.github.com/przemyslawpluta/mongo-edu/gh-pages/images/me-videos-update.gif)

### Handouts

`-h` Download all available handouts present in the `syllabus` pages for any given week.

![screenshot](https://raw.github.com/przemyslawpluta/mongo-edu/gh-pages/images/me-handouts-update.gif)


##License
MIT
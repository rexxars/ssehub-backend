'use strict';

var pkg = require('../package.json');
var bunyan = require('bunyan');
var log = bunyan.createLogger({ name: pkg.name });

module.exports = log;

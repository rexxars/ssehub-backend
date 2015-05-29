'use strict';

var merge = require('lodash.merge');
var args = require('./args');

var config = merge({ channels: [] }, args);

try {
    config = merge(config, require('../config'));
} catch (e) {
    // Use default settings
}

if (!config.logger) {
    config.logger = require('./default-logger');
}

if (!config.storage) {
    var RedisStorage = require('./redis-storage');
    config.storage = new RedisStorage(config);
}

module.exports = config;

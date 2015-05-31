'use strict';

var RedisStorage = require('ssehub-storage-redis');
var merge = require('lodash.merge');
var args = require('./args');

var defaults = {
    channels: [],
    global: { historyLength: 500 }
};

var config = merge(defaults, args);

try {
    config = merge(config, require('../config'));
} catch (e) {
    // Use default settings
}

if (!config.logger) {
    config.logger = require('./default-logger');
}

if (!config.storage) {
    config.storage = new RedisStorage({
        port: config.redisPort,
        host: config.redisHost,
        dbNumber: config.redisDbNumber
    });
}

module.exports = config;

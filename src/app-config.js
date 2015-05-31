'use strict';

var LevelStorage = require('ssehub-storage-leveldb');
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
    config.storage = new LevelStorage({
        dataPath: config.dataPath
    });
}

module.exports = config;

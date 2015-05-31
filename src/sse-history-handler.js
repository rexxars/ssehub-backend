'use strict';

var find = require('lodash.find');
var appConfig = require('./app-config');
var logger = appConfig.logger;
var storage = appConfig.storage;

function historyHandler(req, reply) {
    var path = '/' + req.params.path;
    var options = find(appConfig.channels, { path: path }) || {};
    var limit = options.historyLength || appConfig.global.historyLength || 500;

    storage.getMessages(path, limit, function(err, items) {
        if (err) {
            logger.error(err);
            return reply('An error occured').code(500);
        }

        reply(items);
    });
}

module.exports = historyHandler;

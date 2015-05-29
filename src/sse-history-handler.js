'use strict';

var appConfig = require('./app-config');
var logger = appConfig.logger;
var storage = appConfig.storage;

function historyHandler(req, reply) {
    var path = '/' + req.params.path;

    storage.getMessages(path, req.query.since, function(err, items) {
        if (err) {
            logger.error(err);
            return reply('An error occured').code(500);
        }

        reply(items);
    });
}

module.exports = historyHandler;

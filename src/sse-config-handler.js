'use strict';

var merge = require('lodash.merge');
var appConfig = require('./app-config');
var config = merge({
    global: appConfig.global || {},
    channels: appConfig.channels || []
});

function configHandler(req, reply) {
    config.channels = config.channels.map(function(channel) {
        if (channel.historyUrl && channel.historyUrl[0] === '/') {
            channel.historyUrl = req.server.info.uri + channel.historyUrl;
        }

        return channel;
    });

    reply(config);
}

module.exports = configHandler;

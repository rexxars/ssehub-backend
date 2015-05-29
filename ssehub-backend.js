#!/usr/bin/env node
'use strict';

var AmqpConsumer = require('./src/amqp-consumer');
var args = require('./src/args');
var appConfig = require('./src/app-config');
var httpServer = require('./src/http-server');

var log = appConfig.logger;
var storage = appConfig.storage;
var consumer = new AmqpConsumer({ connectUrl: args.amqpHost });

storage.on('error', throwErr);
storage.connect(function(err) {
    if (err) {
        throw err;
    }

    httpServer.start(function() {
        log.info('Server running at:', httpServer.info.uri);
    });

    consumer
        .on('consumer-init-failed', throwErr)
        .on('message', persistMessage)
        .connect();
});

function throwErr(err) {
    if (err) {
        throw err;
    }
}

function persistMessage(path, msg) {
    log.trace('Message received on "%s"', path);
    storage.storeMessage(path, msg, throwErr);
}

'use strict';

var Hapi = require('hapi');
var appConfig = require('./app-config');

var server = new Hapi.Server();
server.connection({ port: appConfig.httpPort });

server.route({
    method: 'GET',
    path: '/config',
    handler: require('./sse-config-handler')
});

server.route({
    method: 'GET',
    path: '/history/{path*}',
    handler: require('./sse-history-handler')
});

module.exports = server;

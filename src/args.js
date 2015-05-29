'use strict';

var argparse = require('argparse');
var pkg = require('../package.json');

var parser = new argparse.ArgumentParser({
    version: pkg.version,
    description: pkg.description,
    addHelp: true
});

parser.addArgument(['--port'], {
    help: 'HTTP port to listen on',
    defaultValue: 5538,
    dest: 'httpPort',
    required: false
});

parser.addArgument(['--amqp-url'], {
    help: 'AMQP-url to the host (amqp://user:pass@host:port)',
    defaultValue: false,
    dest: 'amqpUrl',
    required: false
});

parser.addArgument(['--redis-host'], {
    help: 'Hostname of the redis server',
    defaultValue: 'localhost',
    dest: 'redisHost',
    required: false
});

parser.addArgument(['--redis-port'], {
    help: 'Port number of the redis server',
    defaultValue: 6379,
    dest: 'redisPort',
    required: false
});

parser.addArgument(['--redis-db'], {
    help: 'Redis database number',
    defaultValue: 0,
    dest: 'redisDbNumber',
    required: false
});

module.exports = parser.parseArgs();

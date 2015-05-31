'use strict';

var path = require('path');
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

parser.addArgument(['--data-path'], {
    help: 'Path to store LevelDB data (if used)',
    defaultValue: path.resolve(path.join(__dirname, '..', 'data')),
    dest: 'dataPath',
    required: false
});

module.exports = parser.parseArgs();

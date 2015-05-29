'use strict';

var amqp = require('amqplib/callback_api');
var util = require('util');
var events = require('events');
var log = require('./app-config').logger;

var AmqpConsumer = function(options) {
    var opts = options || {};
    this.connectUrl = opts.connectUrl || 'amqp://guest:guest@localhost:5672';
    this.exchangeName = opts.exchangeName || 'sse-hub';
    this.exchangeType = opts.exchangeType || 'fanout';
    this.exchangeOptions = opts.exchangeOptions || {durable: false};
    this.socketOptions = opts.socketOptions;
    this.reconnectLimit = opts.reconnectLimit || 10;

    this.resetConnectionStats();
};

util.inherits(AmqpConsumer, events.EventEmitter);

AmqpConsumer.prototype.onMessageReceived = function(msg) {
    var json = msg.content.toString(), data;
    try {
        data = JSON.parse(json);
    } catch (e) {
        return log.warn('Failed to parse incoming message as JSON (%s)', e.message);
    }

    var path = data.path;
    delete data.path;

    this.emit('message', path, data);
};

AmqpConsumer.prototype.isConnected = function() {
    return this.connected;
};

AmqpConsumer.prototype.connect = function() {
    log.debug('Attempting to connect to AMQP (%s)', this.connectUrl);
    amqp.connect(this.connectUrl, this.socketOptions, this.onConnect.bind(this));
};

AmqpConsumer.prototype.onConnect = function(err, connection) {
    if (err) {
        return this.onConnectFailure(err);
    }

    log.debug('Connection to AMQP established successfully');
    this.emit('connect', connection);
    this.connection = connection;
    this.resetConnectionStats();
    this.connected = true;

    this.setupExchange();
};

AmqpConsumer.prototype.onConnectFailure = function(err) {
    if (this.reconnectAttempts < this.reconnectLimit) {
        this.reconnectAttempts++;
        this.reconnectTimeout = this.reconnectTimeout * 2;

        log.warn(
            'Failed to connect to %s (%s), retrying after %d ms (attempt #%d)',
            this.connectUrl,
            err.message,
            this.reconnectTimeout,
            this.reconnectAttempts
        );

        setTimeout(this.connect.bind(this), this.reconnectTimeout);
    } else {
        log.error(
            'Failed to connect to %s after %d attempts - giving up',
            this.connectUrl,
            this.reconnectAttempts
        );

        this.emit('connection-failed', err);
        this.emit('consumer-init-failed', err);
        this.close();
    }
};

AmqpConsumer.prototype.resetConnectionStats = function() {
    this.connected = false;
    this.consuming = false;
    this.reconnectAttempts = 0;
    this.reconnectTimeout = 50;
};

AmqpConsumer.prototype.setupExchange = function() {
    log.debug('Setting up AMQP channel');
    this.connection.createChannel(this.onChannelCreated.bind(this));
};

AmqpConsumer.prototype.onChannelCreated = function(err, channel) {
    if (err) {
        return this.onChannelCreationFailed();
    }

    log.debug('AMQP channel created, asserting exchange');

    this.channel = channel;
    channel.assertExchange(
        this.exchangeName,
        this.exchangeType,
        this.exchangeOptions,
        this.onExchangeAsserted.bind(this)
    );
};

AmqpConsumer.prototype.onChannelCreationFailed = function(err) {
    log.error('Failed to create channel (%s)', err.message);

    this.emit('channel-failed', err);
    this.emit('consumer-init-failed', err);
    this.close();
};

AmqpConsumer.prototype.onExchangeAsserted = function(err) {
    if (err) {
        return this.onExchangeAssertionFailed(err);
    }

    log.debug('AMQP exchange asseted, now asserting queue');

    this.channel.assertQueue(
        // Nameless queue, will create one on-the-fly
        '',
        // One queue per consumer
        { exclusive: true },
        this.onQueueAsserted.bind(this)
    );
};

AmqpConsumer.prototype.onExchangeAssertionFailed = function(err) {
    log.error('Failed to assert exchange (%s)', err.message);

    this.emit('exchange-assertion-failed', err);
    this.emit('consumer-init-failed', err);
    this.close();
};

AmqpConsumer.prototype.onQueueAsserted = function(err, res) {
    if (err) {
        return this.onQueueAssertionFailed(err);
    }

    log.debug('AMQP queue asserted, binding to exchange');

    this.queueName = res.queue;
    this.channel.bindQueue(
        res.queue,
        this.exchangeName,
        '',
        {},
        this.onQueueBound.bind(this)
    );
};

AmqpConsumer.prototype.onQueueAssertionFailed = function(err) {
    log.error('Failed to assert queue(%s)', err.message);

    this.emit('queue-assertion-failed', err);
    this.emit('consumer-init-failed', err);
    this.close();
};

AmqpConsumer.prototype.onQueueBound = function(err) {
    if (err) {
        return this.onQueueBindingFailed(err);
    }

    log.debug('AMQP queue bound to exchange, will now consume!');
    this.consuming = true;

    this.channel.consume(
        this.queueName,
        this.onMessageReceived.bind(this),
        { noAck: true }
    );
};

AmqpConsumer.prototype.onQueueBindingFailed = function(err) {
    log.error('Failed to bind queue to exchange (%s)', err.message);

    this.emit('queue-binding-failed', err);
    this.emit('consumer-init-failed', err);
    this.close();
};

AmqpConsumer.prototype.isConsuming = function() {
    return this.consuming;
};

AmqpConsumer.prototype.close = function() {
    if (this.connection) {
        this.connection.close();
    }
};

module.exports = AmqpConsumer;

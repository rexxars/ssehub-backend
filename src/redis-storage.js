'use strict';

var redis = require('redis');
var util = require('util');
var events = require('events');

function RedisStorage(config) {
    this.config = config;
}

util.inherits(RedisStorage, events.EventEmitter);

RedisStorage.prototype.connect = function(callback) {
    if (!this.client) {
        this.client = redis.createClient(
            this.config.redisPort,
            this.config.redisHost
        );

        this.client.on('error', function(e) {
            this.emit('error', e);
        }.bind(this));

        if (this.config.redisDbNum !== 0) {
            this.client.select(this.config.redisDbNum, callback);
            return;
        }
    }

    process.nextTick(callback);
};

RedisStorage.prototype.storeMessage = function(path, msg, callback) {
    var maxItems = this.config.maxHistoryItems;

    // Push the message onto the list
    this.client.lpush(path, JSON.stringify(msg), function(err, length) {
        if (err) {
            return callback(err);
        }

        // If we have more items than allowed, pop the oldest one of the list
        if (length > maxItems) {
            this.client.rpop(path, callback);
        } else {
            callback();
        }
    });
};

RedisStorage.prototype.getMessages = function(path, since, callback) {
    this.client.lrange(path, 0, -1, function(err, items) {
        if (err) {
            return callback(err);
        }

        var filtered = since ? items.map(JSON.parse).filter(function(item) {
            return item.id > since;
        }) : items;

        callback(null, filtered);
    });
};

module.exports = RedisStorage;

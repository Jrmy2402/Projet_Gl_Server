/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var turnkey = require('./turnkey.model');
var client = require('../../config/redis.js').client;

exports.register = function (socket) {
  turnkey.hooks.post('save', function (doc) {
    onSave(socket, doc);
  });
  turnkey.hooks.post('remove', function (doc) {
    console.log('remove');
    onRemove(socket, doc);
  });
  turnkey.hooks.post('findOneAndUpdate', function (doc) {
    onUpdate(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('turnkey:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('turnkey:remove', doc);
}

function onUpdate(socket, doc, cb) {
  if(doc) {
    socket.emit('turnkey:update', doc);
  }
}
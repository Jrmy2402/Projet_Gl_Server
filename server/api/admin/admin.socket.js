/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var admin = require('./admin.model');
var client = require('../../config/redis.js').client;

exports.register = function (socket) {
  admin.hooks.post('save', function (doc) {
    onSave(socket, doc);
  });
  admin.hooks.post('remove', function (doc) {
    onRemove(socket, doc);
  });
  admin.hooks.post('findOneAndUpdate', function (doc) {
    onUpdate(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('admin:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('admin:remove', doc);
}

function onUpdate(socket, doc, cb) {
  if(doc) {
    if(socket.decoded_token.role === "admin"){
      socket.emit('admin:update', doc);
    }
  }
}
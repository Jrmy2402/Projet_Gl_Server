/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var user = require('./user.model');
var client = require('../../config/redis.js').client;

exports.register = function (socket) {
  user.hooks.post('save', function (doc) {
    onSave(socket, doc);
  });
  user.hooks.post('remove', function (doc) {
    onRemove(socket, doc);
  });
  user.hooks.post('findOneAndUpdate', function (doc) {
    // console.log(doc);
    onUpdate(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('user:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('user:remove', doc);
}

function onUpdate(socket, doc, cb) {
  if(doc.Vms) {
    if(socket.decoded_token._id === doc._doc._id.toString()){
      console.log("ici vm:update");
      socket.emit('vm:update', doc.Vms);
    }
  }
}
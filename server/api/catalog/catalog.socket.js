/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var catalog = require('./catalog.model');

exports.register = function(socket) {
  catalog.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  catalog.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('catalog:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('catalog:remove', doc);
}
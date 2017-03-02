'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var turnkeySchema = new Schema({
  distribution: String,
  application: [String],
  info: String,
});

module.exports = mongoose.model('turnkey', turnkeySchema);
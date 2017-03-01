'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var appliSchema = new Schema({
  distribution: String,
  application: [String],
  info: String,
});

module.exports = mongoose.model('Appli', appliSchema);
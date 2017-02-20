'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var appliSchema = new Schema({
  name: String,
  info: String,
  RunCmd: String,
  EntryPointCmd: String,
  ExposeCmd: Number
});

module.exports = mongoose.model('Appli', appliSchema);
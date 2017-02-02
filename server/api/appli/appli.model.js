'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var appliSchema = new Schema({
  application: String,
  info: String,
  DockerCmd: String
});

module.exports = mongoose.model('appli', appliSchema);
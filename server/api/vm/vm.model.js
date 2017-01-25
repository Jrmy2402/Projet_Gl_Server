'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var VmSchema = new Schema({
  name: String,
  version: Number,
  ad_date: { type: Date, default: Date.now },
  exp_date: Date,
  port: Number,
  info: String,
  last_connexion: Date,
  active: Boolean
  
});

module.exports = mongoose.model('Vm', VmSchema);
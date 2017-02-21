'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var VmSchema = new Schema({
  OS: { type: String, default: "Linux" },
  name: String,
  version: String,
  ad_date: { type: Date, default: Date.now },
  exp_date: Date,
  port: Number,
  info: String,
  idContainer: String,
  last_connexion: Date,
  active: Boolean,
  feedback:{
    RAM: Number,
    UC: Number,
  },
  application: [String],
});

module.exports = mongoose.model('Vm', VmSchema);
'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var adminSchema = new Schema({
  nbuser: Number,
  nbvm: Number,
  prix: Number,
});

module.exports = mongoose.model('admin', adminSchema);
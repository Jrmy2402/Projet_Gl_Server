'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CatalogSchema = new Schema({
  name: String,
  update_date: { type: Date, default: Date.now },
  create_date: Date,
  info: String,
  active: Boolean
});

module.exports = mongoose.model('Catalog', CatalogSchema);
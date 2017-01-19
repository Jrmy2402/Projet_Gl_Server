/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /catalogs              ->  index
 * POST    /catalogs              ->  create
 * GET     /catalogs/:id          ->  show
 * PUT     /catalogs/:id          ->  update
 * DELETE  /catalogs/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Catalog = require('./catalog.model');

// Get list of catalogs
exports.index = function(req, res) {
  Catalog.find(function (err, catalogs) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(catalogs);
  });
};

// Get a single catalog
exports.show = function(req, res) {
  Catalog.findById(req.params.id, function (err, catalog) {
    if(err) { return handleError(res, err); }
    if(!catalog) { return res.status(404).send('Not Found'); }
    return res.json(catalog);
  });
};

// Creates a new catalog in the DB.
exports.create = function(req, res) {
  Catalog.create(req.body, function(err, catalog) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(catalog);
  });
};

// Updates an existing catalog in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Catalog.findById(req.params.id, function (err, catalog) {
    if (err) { return handleError(res, err); }
    if(!catalog) { return res.status(404).send('Not Found'); }
    var updated = _.merge(catalog, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(catalog);
    });
  });
};

// Deletes a catalog from the DB.
exports.destroy = function(req, res) {
  Catalog.findById(req.params.id, function (err, catalog) {
    if(err) { return handleError(res, err); }
    if(!catalog) { return res.status(404).send('Not Found'); }
    catalog.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
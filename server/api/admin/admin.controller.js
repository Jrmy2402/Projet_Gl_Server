/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /admin               ->  index
 * POST    /admin               ->  create
 * GET     /admin/:id           ->  show
 * PUT     /admin/:id           ->  update
 * DELETE  /admin/:id           ->  destroy
 */

'use strict';

var _ = require('lodash');
var admin = require('./admin.model');

// Get list of admin
exports.index = function(req, res) {
  admin.find(function (err, admin) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(admin);
  });
};

// Get a single admin
exports.show = function(req, res) {
  admin.findById(req.params.id, function (err, admin) {
    if(err) { return handleError(res, err); }
    if(!admin) { return res.status(404).send('Not Found'); }
    return res.json(admin);
  });
};

// Creates a new admin in the DB.
exports.create = function(req, res) {
  admin.create(req.body, function(err, admin) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(admin);
  });
};

// Updates an existing admin in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  admin.findById(req.params.id, function (err, admin) {
    if (err) { return handleError(res, err); }
    if(!admin) { return res.status(404).send('Not Found'); }
    var updated = _.merge(admin, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(admin);
    });
  });
};

// Deletes a admin from the DB.
exports.destroy = function(req, res) {
  admin.findById(req.params.id, function (err, admin) {
    if(err) { return handleError(res, err); }
    if(!admin) { return res.status(404).send('Not Found'); }
    admin.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
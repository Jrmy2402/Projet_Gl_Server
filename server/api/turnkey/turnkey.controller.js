/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /appli               ->  index
 * POST    /appli               ->  create
 * GET     /appli/:id           ->  show
 * PUT     /appli/:id           ->  update
 * DELETE  /appli/:id           ->  destroy
 */

'use strict';

var _ = require('lodash');
var appli = require('./appli.model');

// Get list of appli
exports.index = function(req, res) {
  appli.find(function (err, appli) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(appli);
  });
};

// Get a single appli
exports.show = function(req, res) {
  appli.findById(req.params.id, function (err, appli) {
    if(err) { return handleError(res, err); }
    if(!appli) { return res.status(404).send('Not Found'); }
    return res.json(appli);
  });
};

// Creates a new appli in the DB.
exports.create = function(req, res) {
  appli.create(req.body, function(err, appli) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(appli);
  });
};

// Updates an existing appli in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  appli.findById(req.params.id, function (err, appli) {
    if (err) { return handleError(res, err); }
    if(!appli) { return res.status(404).send('Not Found'); }
    var updated = _.merge(appli, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(appli);
    });
  });
};

// Deletes a appli from the DB.
exports.destroy = function(req, res) {
  appli.findById(req.params.id, function (err, appli) {
    if(err) { return handleError(res, err); }
    if(!appli) { return res.status(404).send('Not Found'); }
    appli.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
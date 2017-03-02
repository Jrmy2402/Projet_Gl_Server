/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /turnkey               ->  index
 * POST    /turnkey               ->  create
 * GET     /turnkey/:id           ->  show
 * PUT     /turnkey/:id           ->  update
 * DELETE  /turnkey/:id           ->  destroy
 */

'use strict';

var _ = require('lodash');
var turnkey = require('./turnkey.model');

// Get list of turnkey
exports.index = function(req, res) {
  turnkey.find(function (err, turnkey) {
    if(err) { return handleError(res, err); }
    return res.status(200).json(turnkey);
  });
};

// Get a single turnkey
exports.show = function(req, res) {
  turnkey.findById(req.params.id, function (err, turnkey) {
    if(err) { return handleError(res, err); }
    if(!turnkey) { return res.status(404).send('Not Found'); }
    return res.json(turnkey);
  });
};

// Creates a new turnkey in the DB.
exports.create = function(req, res) {
  turnkey.create(req.body, function(err, turnkey) {
    if(err) { return handleError(res, err); }
    return res.status(201).json(turnkey);
  });
};

// Updates an existing turnkey in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  turnkey.findById(req.params.id, function (err, turnkey) {
    if (err) { return handleError(res, err); }
    if(!turnkey) { return res.status(404).send('Not Found'); }
    var updated = _.merge(turnkey, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.status(200).json(turnkey);
    });
  });
};

// Deletes a turnkey from the DB.
exports.destroy = function(req, res) {
  turnkey.findById(req.params.id, function (err, turnkey) {
    if(err) { return handleError(res, err); }
    if(!turnkey) { return res.status(404).send('Not Found'); }
    turnkey.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.status(204).send('No Content');
    });
  });
};

function handleError(res, err) {
  return res.status(500).send(err);
}
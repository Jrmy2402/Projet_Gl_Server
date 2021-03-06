/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';
// Insert seed models below
var Catalog = require('../api/catalog/catalog.model');
var User = require('../api/user/user.model');
var Appli = require('../api/appli/appli.model');
var Turnkey = require('../api/turnkey/turnkey.model');
var Admin = require('../api/admin/admin.model');

// Insert seed data below
var catalogSeed = require('../api/catalog/catalog.seed.json');

// Insert seed inserts below
Catalog.find({}).remove(function() {
  Catalog.create(catalogSeed);
});

// Insert seed data below
var userSeed = require('../api/user/user.seed.json');

// Insert seed inserts below
User.find({}).remove(function() {
  User.create(userSeed);
});

// Insert seed data below
var appliSeed = require('../api/appli/appli.seed.json');

// Insert seed inserts below
Appli.find({}).remove(function() {
  Appli.create(appliSeed);
});


// Insert seed inserts below
var turnkeySeed = require('../api/turnkey/turnkey.seed.json');

Turnkey.find({}).remove(function() {
  Turnkey.create(turnkeySeed);
});

// Insert seed inserts below
var adminSeed = require('../api/admin/admin.seed.json');

Admin.find({}).remove(function() {
  Admin.create(adminSeed);
});
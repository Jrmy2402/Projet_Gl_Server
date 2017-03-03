'use strict';

var express = require('express');
var controller = require('./user.controller');
var config = require('../../config/environment');
var auth = require('../../auth/auth.service');

var router = express.Router();

router.get('/', auth.hasRole('admin'), controller.index);
router.delete('/:id', auth.hasRole('admin'), controller.destroy);
router.get('/me', auth.isAuthenticated(), controller.me);
router.get('/meVm', auth.isAuthenticated(), controller.meVm);
router.get('/meVm/:id', auth.isAuthenticated(), controller.meVmInfo);
router.get('/meVmStop/:id', auth.isAuthenticated(), controller.meVmStop);
router.get('/meVmStart/:id', auth.isAuthenticated(), controller.meVmStart);
router.get('/meVmRemove/:id', auth.isAuthenticated(), controller.meVmRemove);
router.put('/:id/password', auth.isAuthenticated(), controller.changePassword);
router.get('/:id', auth.isAuthenticated(), controller.show);
router.post('/', controller.create);
router.post('/addvm', auth.isAuthenticated(), controller.addvm);
router.delete('/:id/delvm/:idvm', controller.delvm);


module.exports = router;

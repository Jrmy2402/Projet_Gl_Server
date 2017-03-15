/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var mongoose = require('mongoose');
var config = require('./config/environment');
var dockerfile = require('./lib/dockerfile')
var User = require('./api/user/user.model');
var docker = require('./config/dockerode').docker;
var monitor = require('./lib/os-monitor');


// Connect to database
mongoose.connect(config.mongo.uri, config.mongo.options);
mongoose.connection.on('error', function (err) {
	console.error('MongoDB connection error: ' + err);
	process.exit(-1);
});
// Populate DB with sample data
if (config.seedDB) {
	require('./config/seed');
}

//Init les Vms dockers
dockerfile.init();

// Setup server
var app = express();
var server = require('http').Server(app);
var socketio = require('socket.io')(server);

dockerfile.statsVm(2000, socketio);
monitor.statsOs(2000, socketio);

require('./config/socketio')(socketio);
require('./config/express')(app);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function () {
	console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});
// Expose app
exports = module.exports = app;
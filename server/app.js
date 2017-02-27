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
var Docker = require('dockerode');
var docker = new Docker({
	socketPath: '//./pipe/docker_engine',
	version: 'v1.25'
}); //defaults to above if env variables are not used

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

User.aggregate([{
		$unwind: '$Vms'
	},
	{
		$match: {
			'Vms.info': 'On',
		}
	},
	{
		$project: {
			'Vm': '$Vms'
		}
	}
]).exec((err, data) => {
	for (const vm of data) {
		docker.getContainer(vm.Vm.idContainer).start(function (err, data) {
			console.log(data);
		});
	}
});

// Setup server
var app = express();
var server = require('http').Server(app);
var socketio = require('socket.io')(server);

dockerfile.statsVm(5000, socketio);

require('./config/socketio')(socketio);
require('./config/express')(app);
require('./routes')(app);

// Start server
server.listen(config.port, config.ip, function () {
	console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
});
// Expose app
exports = module.exports = app;
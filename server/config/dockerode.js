var Docker = require('dockerode');
var docker = new Docker({
	// socketPath: '/var/run/docker.sock',
    socketPath: '//./pipe/docker_engine',
	version: 'v1.25'
}); //defaults to above if env variables are not used

exports.docker = docker;

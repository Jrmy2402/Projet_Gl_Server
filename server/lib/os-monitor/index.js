var os  = require('os-utils');
var diskspace = require('diskspace');
var client = require('../../config/redis.js').client;

exports.statsOs = function statsOs(time, socketio) {
  setInterval(() => {
    client.smembers("SocketDemandeInfoOs", (err, idSockets) => {
      console.log(idSockets)
      if(idSockets.length>0){
        diskspace.check('C', function (err, total, free, status)
        {
           for (const id of idSockets) {
              console.log("Envoie idSocket for OS : ", id);
              // Envoie les infos de l'OS au socket
              console.log(total, free, status);
              socketio.to(id).emit('statsOSMemory', {free: free, total: total});
            }
            
        });
        os.cpuUsage(function(v){
            console.log( 'CPU Usage (%): ' + v );
            for (const id of idSockets) {
              console.log("Envoie idSocket for OS : ", id);
              // Envoie les infos de l'OS au socket
              console.log( 'CPU Usage (%): ' + v );
              socketio.to(id).emit('statsOSCPU', v);
            }
            socketio.emit('statsOS',  v);
        });
      }
    });
    
  }, time);
}
exports.register = function (socket) {
  socket.on('statsOs', (status) => {
    // Stocke les sockets qui demande les stats de l'os
    console.log("socket.id : ", socket.id, status)
    client.sadd("SocketDemandeInfoOs", socket.id);
    client.expire("SocketDemandeInfoOs", 86400);
  });
  socket.on('disconnect', function () {
    // Supprime le socket du tableau qui stocke les sockets qui demande les stats de l'os
    client.srem("SocketDemandeInfoOs", socket.id);
  });
}

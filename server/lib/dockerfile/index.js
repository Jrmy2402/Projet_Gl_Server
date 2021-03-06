var User = require('../../api/user/user.model');
var Catalog = require('../../api/catalog/catalog.model');
var Appli = require('../../api/appli/appli.model');
var client = require('../../config/redis.js').client;
var mongoose = require('mongoose');
const Builder = require('node-dockerfile').Builder;
var docker = require('../../config/dockerode').docker;
var Rx = require('rxjs/Rx');
var DockerStats = require('docker-stats-promise');
const dockerStats = new DockerStats();
// const socketio = require('../../app.js').socketio;

exports.dockerStats = dockerStats;

exports.generate = function (idVm) {
  User.aggregate([{
      $unwind: '$Vms'
    },
    {
      $match: {
        'Vms._id': mongoose.Types.ObjectId(idVm)
      }
    },
    {
      $project: {
        //_id: 0,
        'Vm': '$Vms'
      }
    }
  ]).exec((err, data) => {
    console.log(err, data[0].Vm._id, data[0]._id);
    var distribution = data[0].Vm.name;
    var application = data[0].Vm.application;
    var idVm = data[0].Vm._id;
    console.log("[Dockerfile] : distribution " + distribution);
    console.log("[Dockerfile] : application " + application);

    var promises = [];
    promises.push(Catalog.findOne({
      'name': distribution
    }));
    promises.push(Appli.find().where('name').in(application));

    Promise.all(promises).then(function (data) {
      console.log(data);
      let myFrom = data[0].FromCmd;
      let myAppli = data[1];
      var dockerFile = new Builder();
      // Let's just add in a bunch of funky commands for a bit of fun
      dockerFile
        .from(myFrom)
        .newLine()
        .maintainer("Spriet Jeremy <jeremy.spriet@gmail.com>")
        .comment("Clone and install dockerfile")
        .run([
          "apt-get update",
          "apt-get install -y openssh-server",
          "apt-get clean"
        ])
        .newLine()
        .run("echo 'root:root' |chpasswd")
        .newLine()
        .run("sed -ri 's/^PermitRootLogin\\s+.*/PermitRootLogin yes/' /etc/ssh/sshd_config && sed -ri 's/UsePAM yes/#UsePAM yes/g' /etc/ssh/sshd_config")
        .newLine()
        .run("mkdir -p /var/run/sshd")
        .newLine()
        .run("apt-get install -y sudo && apt-get install -y curl")
        .arg("DEBIAN_FRONTEND", "noninteractive")
        .newLine();

      if (myAppli) {
        for (let myA of myAppli) {
          dockerFile.run(myA.RunCmd);
        }
      }

      dockerFile.newLine()
        .expose("22 80 443")
        .newLine()
        .entryPoint("/usr/sbin/sshd -D")
        .cmd(["bash"]);
      
      client.incr("numDockerfile", function (err, res) {
        dockerFile.write("Dockerfiles/Dockerfile"+res, true, function (err, content) {
          if (err) console.log("Failed to write: %s", err);
          else {
            console.log("Successfully wrote the dockerfile!");
            builbImage(idVm, res);
          }
        });
      });


    }).catch(function (error) {
      console.log(error);
    });

  });

};

function builbImage(idVM, res) {
  var exec = require('child_process').exec;
  const spawn = require('child_process').spawn;
  const ls = spawn('docker', ['build', '-t', 'spriet/testssh'+res, '-f' ,'./Dockerfiles/Dockerfile'+res, '.']);

  ls.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  ls.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  ls.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    if (code === 0) {
      runDocker(idVM, res);
    }
  });
}

function runDocker(idVM, res) {
  var exec = require('child_process').exec;
  client.incr("Value_name", function (err, reply) {
    var valuePortSsh = reply;
    console.log(reply);
    client.incr("Value_name", function (err, reply2) {
      var valuePortHttp = reply2;
      client.incr("Value_name", function (err, reply3) {
        var valuePortHttps = reply3;

        // reply is null when the key is missing 
        var cmd = 'docker run -d -p ' + valuePortSsh + ':22 -p ' + valuePortHttps + ':443 -p ' + valuePortHttp + ':80 --memory="300m" --memory-swap="1g" spriet/testssh'+res;
        console.log(cmd);

        exec(cmd, function (error, stdout, stderr) {
          if (error) {
            if (error.code === 125) {
              console.error(error.stack)
            }
          } else {
            var idContainer = stdout.substring(0, stdout.length - 1);
            User.findOneAndUpdate({
              "Vms._id": mongoose.Types.ObjectId(idVM)
            }, {
              "$set": {
                "Vms.$.idContainer": idContainer,
                "Vms.$.port": valuePortSsh,
                "Vms.$.portHttp": valuePortHttp,
                "Vms.$.portHttps": valuePortHttps,
                "Vms.$.ip": "172.31.1.25",
                "Vms.$.info": "On"
              }
            }, {
              'new': true
            }).exec((err, data) => {
              console.log("Docker runDocker Fini!!");
            });
          }
        });
      });

    });
  });

}

exports.statsVm = function statsVm(time, socketio) {
  setInterval(() => {
    // Récupère les vms que l'on demande les stats
    client.smembers("Tab_stats_vm", (err, Table_Vm) => {
      if (Table_Vm.length > 0) {
        for (const idVm of Table_Vm) {
          // Récupère dans le cache les infos de la vm
          client.get("InfoVm:" + idVm, (err, data) => {
            var infoVm = JSON.parse(data);
            // Excute la recherche des stats de docker
            dockerStats.execute(infoVm.idContainer).then(data => {
              infoVm.feedback = data;
              // Récupère les sockets qui demande les stats de cette vm
              client.smembers("SocketDemandeInfo:" + infoVm._id, (err, idSockets) => {
                for (const id of idSockets) {
                  console.log("Envoie idSocket : ", id);
                  // Envoie les infos de la vm au socket
                  socketio.to(id).emit('infoVm', infoVm);
                }
              });
            })
          });
        }
      }
    });
  }, time);
}

exports.register = function (socket) {
  socket.on('statsVm', (vmId) => {
    console.log('idVM', vmId, socket.id, socket.decoded_token._id);
    var userId = socket.decoded_token._id;
    let matchObject;
    if(socket.decoded_token.role === 'admin'){
      matchObject = {
        $match: {
          'Vms._id': mongoose.Types.ObjectId(vmId),
        }
      }
    } else {
      matchObject = {
        $match: {
          'Vms._id': mongoose.Types.ObjectId(vmId),
          '_id': mongoose.Types.ObjectId(userId)
        }
      }
    }
    User.aggregate([{
        $unwind: '$Vms'
      },
      matchObject,
      {
        $project: {
          'Vm': '$Vms'
        }
      }
    ]).exec((err, data) => {
      if (data[0].Vm) {
        // Stocke les Infos de la vm dans le cache
        var infoVm = JSON.stringify(data[0].Vm);
        client.set("InfoVm:" + vmId, infoVm);
        client.expire("InfoVm:" + vmId, 86400);
        // Incrémente le nombre de socket qui demande les stats de cette vm
        client.incr("NombreVmDemander:" + vmId);
        client.expire("NombreVmDemander:" + vmId, 86400);
        // Stocke les sockets qui demande les stats d'une vm
        client.sadd("SocketDemandeInfo:" + vmId, socket.id);
        client.expire("SocketDemandeInfo:" + vmId, 86400);

        // Stocke la vm que le socket demande à avoir les stats
        client.set("Socket:" + socket.id, vmId);
        client.expire("Socket:" + socket.id, 86400);
        // Rajoute la vm au tableau des stats à lire
        client.sadd("Tab_stats_vm", vmId);
        client.expire("Tab_stats_vm", 86400);
      } else {
        socket.emit('infoVm', {
          message: "Erreur : Ce n'est pas votre vm!!"
        });
      }
    });
  });
  socket.on('disconnect', function () {
    // Récupère id de la vm que le Socket demander
    client.get("Socket:" + socket.id, (err, vmId) => {
      if (vmId) {
        // Supprime le socket
        client.del("Socket:" + socket.id);
        // Supprime le socket du tableau qui stocke les sockets qui demande les stats d'une vm
        client.srem("SocketDemandeInfo:" + vmId, socket.id);
        client.expire("SocketDemandeInfo:" + vmId, 86400);
        // Décrement le nombre de socket qui demande cette vm
        client.decr("NombreVmDemander:" + vmId, function (err, reply) {
          client.expire("NombreVmDemander:" + vmId, 86400);
          // Si le nombre est égale à 0 on supprime la vm dans le tableau des vm qui sont demandé à avoir les stats
          if (reply == 0) {
            client.srem("Tab_stats_vm", vmId);
          }
        });
      }
    });
  });
}

exports.init = function () {
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
        console.log(data, err);
      });
    }
  });

  User.aggregate([{
      $unwind: '$Vms'
    },
    {
      $match: {
        'Vms.info': 'Off',
      }
    },
    {
      $project: {
        'Vm': '$Vms'
      }
    }
  ]).exec((err, data) => {
    for (const vm of data) {
      docker.getContainer(vm.Vm.idContainer).stop(function (err, data) {
        console.log(data, err);
      });
    }
  });
}
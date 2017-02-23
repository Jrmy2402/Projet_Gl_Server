var User = require('../../api/user/user.model');
var Catalog = require('../../api/catalog/catalog.model');
var Appli = require('../../api/appli/appli.model');
var redis = require("redis");
var client = redis.createClient();
var mongoose = require('mongoose');
const Builder = require('node-dockerfile').Builder;
var Docker = require('dockerode');
var docker = new Docker({socketPath: '//./pipe/docker_engine', version: 'v1.25'}); //defaults to above if env variables are not used
var Rx = require('rxjs/Rx');

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
            // .newLine();
        }
      }

      dockerFile.newLine()
        .expose(22)
        .newLine()
        .entryPoint("/usr/sbin/sshd -D")
        .cmd(["bash"]);

      dockerFile.write("./Dockerfile", true, function (err, content) {
        if (err) console.log("Failed to write: %s", err);
        else {
          console.log("Successfully wrote the dockerfile!");
          builbImage(idVm);
        }
      });


    }).catch(function (error) {
      console.log(error);
    });

  });

};

exports.infoVm = function (idVm, res) {
  // return Rx.Observable.create((observer) => {
    var container = docker.getContainer(idVm);
    // container.stop(function (err, data) {
    //   console.log(data);
    // });
    // container.start(function (err, data) {
    //   console.log(data);
    // });
 


    // container.start(function (err, data) {
    //   console.log(data);
    // });
    // query API for container info
    container.stats({stream:false}, function(err, stream){
          // to close the stream you need to use a nested method from inside the stream itself
          var cpuDelta = stream.cpu_stats.cpu_usage.total_usage -  stream.precpu_stats.cpu_usage.total_usage;
          var systemDelta = stream.cpu_stats.system_cpu_usage - stream.precpu_stats.system_cpu_usage;
          var RESULT_CPU_USAGE = cpuDelta / systemDelta * 100;
          console.log(RESULT_CPU_USAGE, stream);
          res.json({cpu:RESULT_CPU_USAGE, cpuDelta : cpuDelta, memory_stats: stream.memory_stats});
          // stream.destroy()
    });
    // container.inspect(function (err, data) {
    //   console.log(data);
    //   // observer.next(data);
    //   // observer.complete();
    // });
  // });
}

function builbImage(idVM) {
  var exec = require('child_process').exec;
  const spawn = require('child_process').spawn;
  const ls = spawn('docker', ['build', '-t', 'spriet/testssh', '.']);

  ls.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  ls.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });

  ls.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
    if (code === 0) {
      runDocker(idVM);
    }
  });
}

function runDocker(idVM) {
  var exec = require('child_process').exec;
  client.get("Value_port", function (err, reply) {
    // reply is null when the key is missing 
    console.log(reply);
    var cmd = 'docker run -d -p ' + reply + ':22 spriet/testssh';
    console.log(cmd);

    exec(cmd, function (error, stdout, stderr) {
      if (error) {
        if (error.code === 125) {
          console.error("Name deja utilisé :", error.stack)
        }
      } else {
        console.log(stdout.substring(0,stdout.length-1));
        User.findOneAndUpdate({
            "Vms._id": mongoose.Types.ObjectId(idVM)
          }, {
            "$set": {
              "Vms.$.idContainer": stdout.substring(0,stdout.length-1),
              "Vms.$.port": reply,
              "Vms.$.ip": "127.0.0.1",
              "Vms.$.info": "On"
            }
          },
          function (err, doc) {
            client.set("Value_port", Number(reply) + 1);
            console.log(stdout);
            console.log("ici");
          }
        );
      }
    });

  });

}

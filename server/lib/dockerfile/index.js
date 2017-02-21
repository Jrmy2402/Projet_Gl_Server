var User = require('../../api/user/user.model');
var Catalog = require('../../api/catalog/catalog.model');
var Appli = require('../../api/appli/appli.model');
var redis = require("redis"),
  client = redis.createClient();
var mongoose = require('mongoose');
const Builder = require('node-dockerfile').Builder;
var Docker = require('dockerode');
var docker = new Docker({
  socketPath: '//./pipe/docker_engine',
  version: 'v1.25'
});

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
        .comment("Clone and install dockerfile")
        .arg("DEBIAN_FRONTEND", "noninteractive")
        .run([
          "apt-get update",
          "apt-get install -y openssh-server",
          "apt-get clean"
        ])
        .run("echo 'root:root' |chpasswd")
        .run("sed -ri 's/^PermitRootLogin\s+.*/PermitRootLogin yes/' /etc/ssh/sshd_config", "sed -ri 's/UsePAM yes/#UsePAM yes/g' /etc/ssh/sshd_config")
        .run("mkdir -p /var/run/sshd")
        .run("apt-get install -y sudo && apt-get install -y curl")
        .newLine();

      if (myAppli) {
        for (let myA of myAppli) {
          dockerFile.run(myA.RunCmd)
            .newLine();
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
        User.findOneAndUpdate({
            "Vms._id": mongoose.Types.ObjectId(idVM)
          }, {
            "$set": {
              "Vms.$.idContainer": stdout,
              "Vms.$.port":reply
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
var User = require('../../api/user/user.model');
var Catalog = require('../../api/catalog/catalog.model');
var Appli = require('../../api/appli/appli.model');

var mongoose = require('mongoose');
// var Builder = require("node-dockerfile");
const Builder = require('node-dockerfile').Builder;
var fs = require('fs');
// import { Builder } from 'node-dockerfile';



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
        _id: 0,
        'Vm': '$Vms'
      }
    }
  ]).exec((err, data) => {
    console.log(err, data[0].Vm);
    var distribution = data[0].Vm.name;
    var application = data[0].Vm.application;
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
        for (let myA of myAppli){
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
        else console.log("Successfully wrote the dockerfile!");
      });


    }).catch(function (error) {
      console.log(error);
    });

  });

};
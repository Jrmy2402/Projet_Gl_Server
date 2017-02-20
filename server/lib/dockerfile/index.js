var User = require('../../api/user/user.model');
var Catalog = require('../../api/catalog/catalog.model');
var Appli = require('../../api/appli/appli.model');

var mongoose = require('mongoose');
var Builder = require("node-dockerfile");



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
      let myFrom = data[0].DockerCmd;
      let myAppli = data[0].DockerCmd;
      var dockerFile = new Builder();
      // Let's just add in a bunch of funky commands for a bit of fun
      dockerFile
        .from("node:0.12.4")
        .newLine()
        .comment("Clone and install dockerfile")
        .run([
          "apt-get install -y git",
          "git clone https://github.com/seikho/node-dockerfile /code/node-dockerfile"
        ])
        .newLine()
        .run(["cd /code/node-dockerfile", "npm install"])
        .run("npm install -g http-server toto")
        .newLine()
        .workDir("/code/node-dockerfile")
        .cmd("http-server");

      // .write takes a callback which takes 'error' and 'content'.
      // Content being the content of the generated filed.
      var cb = function (err, content) {
        if (err) console.log("Failed to write: %s", err);
        else console.log("Successfully wrote the dockerfile!");
      }
      // .write takes 3 arguments: 'location', 'replaceExisting' and the callback above.

      dockerFile.write(".", true, cb);
    }).catch(function (error) {
      console.log(error);
    });

  });

};
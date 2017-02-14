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
    // req.body.offreverifie = false;
    promises.push(Catalog.findOne({
      'name': distribution
    }));
    // for (let appli of application) {

    // }
    promises.push(Appli.find().where('name').in(application));

    Promise.all(promises).then(function (data) {
      console.log(data);
    }).catch(function (error) {
      console.log(error);
    });

    //  Catalog.findOne({
    //   'name': distribution
    // }).exec(function (err, Catalog) {
    //   //if (err) return handleError(err);
    //   console.log(Catalog);
    // });

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

    // If all goes well...
    // Console: >> 'Successfully wrote to dockerfile!' 
  });

};

// db.getCollection('users').aggregate([
//   {$unwind: '$Vms'},
//   {$match: {'Vms._id': ObjectId("5898f74cc4ea33d837224d06")}},
//   {$project: {_id: 0, 'Vm': '$Vms'}}
// ])
var generator = require('dockerfile-generator');
var User = require('../../api/user/user.model');
var Catalog = require('../../api/catalog/catalog.model');
var mongoose = require('mongoose');


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
    var promises = [];
    // req.body.offreverifie = false;
    promises.push(Catalog.findOne({
      'name': distribution
    }));
    promises.push(Catalog.findOne({
      'name': 'Debian'
    }));

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

    let inputJSON = {
      "imagename": "node",
      "imageversion": "4.1.2",
      "copy": [{
          "src": "path/to/src",
          "dst": "/path/to/dst"
        },
        {
          "src": "path/to/src",
          "dst": "/path/to/dst"
        }
      ],
      "cmd": {
        "command": "cmd",
        "args": ["arg1", "arg2"]
      }
    }
    generator.generate(JSON.stringify(inputJSON), function (err, result) {
      console.log(result);
      //Result is a generated Dockerfile.

      //do something with the result..
    });
  });

};

// db.getCollection('users').aggregate([
//   {$unwind: '$Vms'},
//   {$match: {'Vms._id': ObjectId("5898f74cc4ea33d837224d06")}},
//   {$project: {_id: 0, 'Vm': '$Vms'}}
// ])
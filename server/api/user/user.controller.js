'use strict';

var User = require('./user.model');
var Vm = require('../vm/vm.model');
var Admin = require('../admin/admin.model');

var passport = require('passport');
var config = require('../../config/environment');
var dockerfile = require('../../lib/dockerfile');
var stripe = require('../../lib/stripe');
var mongoose = require('mongoose');
var dockerStats = dockerfile.dockerStats;
var docker = require('../../config/dockerode').docker;

var jwt = require('jsonwebtoken');


var validationError = function (res, err) {
  return res.status(422).json(err);
};

/**
 * Get list of users
 * restriction: 'admin'
 */
exports.index = function (req, res) {
  User.find({}, '-salt -hashedPassword', function (err, users) {
    if (err) return res.status(500).send(err);
    res.status(200).json(users);
  });
};

/**
 * Creates a new user
 */
exports.create = function (req, res, next) {
  // debugger
  var newUser = new User(req.body.user);
  newUser.provider = 'local';
  newUser.role = 'user';
  newUser.save(function (err, user) {
    if (err) return validationError(res, err);
    Admin.findByIdAndUpdate("58b7f5b6a616f40ee068cea4", {
      $inc: {
        nbuser: +1
      }
    }, {
      'new': true
    }, function (err, data) {});
    var token = jwt.sign({
      _id: user._id
    }, config.secrets.session, {
      expiresInMinutes: 60 * 5
    });
    res.json({
      token: token
    });
  });
};

/**
 * Add a new vm
 */
exports.addvm = function (req, res, next) {
  // var userId = req.params.id;
  var userId = req.user._id;
  User.findById(userId, function (err, user) {

    var vmSchema = new Vm({
      OS: "Linux",
      name: req.body.distribution,
      application: req.body.application,
      info: "Loading"
    });
    let idVm = vmSchema._id;
    user.Vms.push(vmSchema);
    console.log(idVm);
    user.save(function (err, user) {
      stripe.payment(req.body.tokenCard).subscribe(
        (data) => {
          console.log(data);
          Admin.findByIdAndUpdate("58b7f5b6a616f40ee068cea4", {
            $inc: {
              prix: +5
            }
          }, {
            'new': true
          }, function (err, data) {});
          Admin.findByIdAndUpdate("58b7f5b6a616f40ee068cea4", {
            $inc: {
              nbvm: 1
            }
          }, {
            'new': true
          }, function (err, data) {});
          dockerfile.generate(idVm);
          res.status(200).json({
            message: 'Vm en création'
          });
        },
        (err) => {
          console.error(err);
          res.status(402).json({message : "Erreur avec le paiement."});
        }
      );

    });
  });
};

/**
 * Delete vm
 */
// exports.delvm = function (req, res, next) {
//   var userId = req.params.id;
//   User.findById(userId, function (err, user) {
//     user.Vms.id(req.params.idvm).remove();
//     user.save(function (err, user) {
//       Admin.findByIdAndUpdate("58b7f5b6a616f40ee068cea4", {$inc: {nbvm:-1}}, function (err, data) {});
//       if (err) return res.status(500).send(err);
//       res.status(200).json(user);
//     });
//   });
// };



/**
 * Get a single user
 */
exports.show = function (req, res, next) {
  var userId = req.params.id;

  User.findById(userId, function (err, user) {
    if (err) return next(err);
    if (!user) return res.status(401).send('Unauthorized');
    res.json(user);
  });
};

/**
 * Deletes a user
 * restriction: 'admin'
 */
exports.destroy = function (req, res) {
  User.findByIdAndRemove(req.params.id, function (err, user) {
    if (err) return res.status(500).send(err);
    return res.status(204).send('No Content');
  });
};

/**
 * Change a users password
 */
exports.changePassword = function (req, res, next) {
  var userId = req.user._id;
  var oldPass = String(req.body.oldPassword);
  var newPass = String(req.body.newPassword);

  User.findById(userId, function (err, user) {
    if (user.authenticate(oldPass)) {
      user.password = newPass;
      user.save(function (err) {
        if (err) return validationError(res, err);
        res.status(200).send('OK');
      });
    } else {
      res.status(403).send('Forbidden');
    }
  });
};

/**
 * Get my info
 */
exports.me = function (req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword -role -provider', function (err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.status(401).send('Unauthorized');
    res.json(user);
  });
};

/**
 * Get my vm
 */
exports.meVm = function (req, res, next) {
  var userId = req.user._id;
  User.findOne({
    _id: userId
  }, '-salt -hashedPassword -role -provider', function (err, user) { // don't ever give out the password or salt
    if (err) return next(err);
    if (!user) return res.status(401).send('Unauthorized');
    console.log(user.Vms);
    res.json(user.Vms);
  });
};

/**
 * Get my vm
 */
exports.meVmInfo = function (req, res, next) {
  var vmId = req.params.id;
  console.log("vmId :", vmId);
  var userId = req.user._id;
  User.aggregate([{
      $unwind: '$Vms'
    },
    {
      $match: {
        'Vms._id': mongoose.Types.ObjectId(vmId),
        '_id': userId
      }
    },
    {
      $project: {
        'Vm': '$Vms'
      }
    }
  ]).exec((err, data) => {
    var infoVm = data[0].Vm;
    if (data[0].Vm) {
      dockerStats.execute(data[0].Vm.idContainer).then(data => {
        infoVm.feedback = data;
        res.json({
          stats: infoVm
        });
      });
    } else {
      res.status(401).json({
        message: "Erreur : Ce n'est pas votre vm!!"
      });
    }
  });
};

/**
 * Get my vm
 */
exports.meVmStop = function (req, res, next) {
  var vmId = req.params.id;
  console.log("vmId :", vmId);
  var userId = req.user._id;
  User.aggregate([{
      $unwind: '$Vms'
    },
    {
      $match: {
        'Vms._id': mongoose.Types.ObjectId(vmId),
        '_id': userId
      }
    },
    {
      $project: {
        'Vm': '$Vms'
      }
    }
  ]).exec((err, data) => {
    var infoVm = data[0].Vm;
    if (infoVm) {
      console.log("Stop id :", infoVm.idContainer);
      docker.getContainer(infoVm.idContainer).stop(function (err, data) {
        console.log(data, err);
        if (!err) {
          User.findOneAndUpdate({
            "Vms._id": mongoose.Types.ObjectId(infoVm._id)
          }, {
            "$set": {
              "Vms.$.info": "Off"
            }
          }, {
            'new': true
          }).exec((err, data) => {
            console.log(data);
            // Stocke les Infos de la vm dans le cache
            res.status(200).json({
              message: "Stop Vm"
            });
          });
        } else {
          res.status(500).json({
            message: "Erreur Vm"
          });
        }

      });
    } else {
      res.status(401).json({
        message: "Erreur : Ce n'est pas votre vm!!"
      });
    }
  });
};

/**
 * Get my vm
 */
exports.meVmStart = function (req, res, next) {
  var vmId = req.params.id;
  console.log("vmId :", vmId);
  var userId = req.user._id;
  User.aggregate([{
      $unwind: '$Vms'
    },
    {
      $match: {
        'Vms._id': mongoose.Types.ObjectId(vmId),
        '_id': userId
      }
    },
    {
      $project: {
        'Vm': '$Vms'
      }
    }
  ]).exec((err, data) => {
    var infoVm = data[0].Vm;
    if (infoVm) {
      console.log("Start id :", infoVm.idContainer);
      docker.getContainer(infoVm.idContainer).start(function (err, data) {
        console.log(data, err);
        if (!err) {
          User.findOneAndUpdate({
            "Vms._id": mongoose.Types.ObjectId(infoVm._id)
          }, {
            "$set": {
              "Vms.$.info": "On"
            }
          }, {
            'new': true
          }).exec((err, data) => {
            console.log(data);
            // Stocke les Infos de la vm dans le cache
            res.status(200).json({
              message: "Start Vm"
            });
          });
        } else {
          res.status(500).json({
            message: "Erreur Start Vm"
          });
        }

      });
    } else {
      res.status(401).json({
        message: "Erreur : Ce n'est pas votre vm!!"
      });
    }
  });
};

/**
 * Get my vm
 */
exports.meVmRemove = function (req, res, next) {
  var vmId = req.params.id;
  console.log("vmId :", vmId);
  var userId = req.user._id;
  let matchObject;
  if(req.user.role === 'admin'){
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
    var infoVm = data[0].Vm;
    if (infoVm) {
      docker.getContainer(infoVm.idContainer).stop(function (err, data) {
        docker.getContainer(infoVm.idContainer).remove(function (err, data) {
          console.log(data, err);
          if (!err) {
            User.update({
                "_id": userId
              }, {
                "$pull": {
                  "Vms": {
                    "_id": mongoose.Types.ObjectId(infoVm._id)
                  }
                }
              },
              function (err, numAffected) {
                console.log(numAffected);
                Admin.findByIdAndUpdate("58b7f5b6a616f40ee068cea4", {
                  $inc: {
                    nbvm: -1
                  }
                }, {
                  'new': true
                }, function (err, data) {});
                // Stocke les Infos de la vm dans le cache
                res.status(200).json({
                  message: "Remove Vm"
                });
              }
            );
          } else {
            res.status(500).json({
              message: "Erreur remove Vm"
            });
          }
        });
      });

    } else {
      res.status(401).json({
        message: "Erreur : Ce n'est pas votre vm!!"
      });
    }
  });
};

/**
 * Authentication callback
 */
exports.authCallback = function (req, res, next) {
  res.redirect('/');
};
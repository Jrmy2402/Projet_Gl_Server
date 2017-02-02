var generator = require('dockerfile-generator');


exports.generate = function () {
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
};
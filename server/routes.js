/**
 * Main application routes
 */

'use strict';

var path = require('path');

module.exports = function(app) {

  // Insert routes below
  app.use('/api/catalogs', require('./api/catalog'));
  app.use('/api/users', require('./api/user'));
  app.use('/api/applis', require('./api/appli'));
  app.use('/api/turnkeys', require('./api/turnkey'));
  app.use('/api/admins', require('./api/admin'));

  app.use('/auth', require('./auth')); 

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname,'../../client', 'dist/index.html'));
  }); 

};

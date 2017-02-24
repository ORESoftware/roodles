#!/usr/bin/env node

const http = require('http');

const server = http.createServer(function (req, res) {
  setTimeout(function () {
    res.send('flowers');
  }, 100);
});

server.listen(3000, function () {

  console.log(' => Server is listening on port 3000');

  process.once('SIGINT', function (code) {
    console.log('SIGINT received...');
    server.close();
    process.exit(code);
  });

});


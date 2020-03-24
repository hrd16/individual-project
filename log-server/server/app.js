const express = require('express');
const bodyParser = require('body-parser');
require('console-stamp')(console, '[HH:MM:ss.l]');
let server = require('http').createServer();

const app = express();
server.on('request', app);
app.use(express.static('../client/build'));
app.use(bodyParser.text( { type: 'application/x-ndjson', limit: '50mb' } ));

app.use('/api/logging', require('./modules/logging.js'));

module.exports = server
const express = require('express');
const bodyParser = require('body-parser');
require('console-stamp')(console, '[HH:MM:ss.l]');
let server = require('http').createServer();
const Handler = require('./handler.js');

const app = express();
server.on('request', app);
app.use(express.static('../client/build'));
app.use(bodyParser.text( { type: 'application/x-ndjson', limit: '50mb' } ));

let handler = new Handler();
handler.subscribe('app', msg => console.log(msg));

app.use('/api/logging', require('./modules/logging.js')(handler));

module.exports = server
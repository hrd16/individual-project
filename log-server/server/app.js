const express = require('express');

require('console-stamp')(console, '[HH:MM:ss.l]');
let server = require('http').createServer();
const Handler = require('./handler.js');

// Parse args
let namespace = process.argv[2];
let config_str = process.argv[3];

console.debug(`Namespace: ${namespace}`);
console.debug(`Config yml: ${config_str}`);

let sim_params = JSON.parse(config_str.substring(1, config_str.length - 1));
let sim_config = {namespace: namespace, params: sim_params};

// Create server
const app = express();
server.on('request', app);
app.use(express.static('../client/build'));

let handler = new Handler();
//handler.subscribe('app', msg => console.debug(msg));

require('./modules/ws.js')(handler, server);
require('./modules/filesys.js')(handler);

app.use('/api/logging', require('./modules/logging.js')(handler, namespace));
app.use('/api/sim', require('./modules/sim.js')(sim_config));

module.exports = server;
const express = require('express');
const bodyParser = require('body-parser');
var ndjson = require('ndjson')
const { Readable } = require('stream')
const WebSocket = require('ws');
require('console-stamp')(console, '[HH:MM:ss.l]');
let server = require('http').createServer();

const app = express();

const wss = new WebSocket.Server({ server: server, path: '/api/ws' });
server.on('request', app);

app.use(bodyParser.text( { type: 'application/x-ndjson', limit: '50mb' } ));

const apiRouter = express.Router();
app.use('/api', apiRouter);

app.use(express.static('../client/build'));

var app_logs = [];

apiRouter.post('/app', function (req, res) {
    let data = req.body;

    let newMsgs = [];

    Readable.from([data]).pipe(ndjson.parse())
        .on('data', function(msg) {
            console.log(JSON.stringify(msg));
            let pod_name = msg.kubernetes !== undefined ? msg.kubernetes.pod_name : 'undefined';
            let log = msg.log || 'undefined';
            let timestamp = msg.timestamp || 'undefined';
            let logMsg = {timestamp: timestamp, node: pod_name, message: log};
            console.log(logMsg);
            newMsgs.push(logMsg);
        })
        .on('end', function() {
            app_logs = app_logs.concat(newMsgs);

            wss.clients.forEach(function each(client) {
                client.send(JSON.stringify(newMsgs));
            });
        });
    
    res.sendStatus(200);
});

var proxy_logs = [];

wss.on('connection', function connection(ws) {
    ws.send(JSON.stringify(app_logs))
});

apiRouter.get('/helloworld', function(req, res) {
    res.send(`${app_logs.length}`);
});

apiRouter.post('/proxy', function (req, res) {
    let data = req.body;

    let newMsgs = [];

    Readable.from([data]).pipe(ndjson.parse())
        .on('data', function(msg) {
            let pod_name = msg.kubernetes !== undefined ? msg.kubernetes.pod_name : 'undefined';
            let log = msg.log || 'undefined';
            let timestamp = msg.timestamp || 'undefined';
            let logMsg = {timestamp: timestamp, node: pod_name, message: log};
            console.log(logMsg);
            newMsgs.push(logMsg);
        })
        .on('end', function() {
            proxy_logs = proxy_logs.concat(newMsgs);

            wss.clients.forEach(function each(client) {
                //client.send(JSON.stringify(newMsgs));
            });
        });
        
    res.sendStatus(200);
});

module.exports = server
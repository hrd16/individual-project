const express = require('express');
const bodyParser = require('body-parser');
var ndjson = require('ndjson')
const { Readable } = require('stream')
const WebSocket = require('ws');
require('console-stamp')(console, '[HH:MM:ss.l]');
let server = require('http').createServer();

const app = express();
const port = 3000;

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
            let pod_name = msg.kubernetes !== undefined ? msg.kubernetes.pod_name : 'undefined';
            let log = msg.log || 'undefined';
            let logMsg = {pod: pod_name, msg: log};
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
            let logMsg = {pod: pod_name, msg: log};
            console.log(logMsg);
            newMsgs.push(logMsg);
        })
        .on('end', function() {
            proxy_logs = proxy_logs.concat(newMsgs);

            wss.clients.forEach(function each(client) {
                client.send(JSON.stringify(newMsgs));
            });
        });
        
   res.sendStatus(200);
});

//server.listen(port, () => console.log(`Log server listening on port ${port}!`));

module.exports = server

/*
Sample fluentd json
{
   "log":"[   listen] - b'Hello World 17854' from ('10.1.3.79', 54736)\n",
   "stream":"stderr",
   "docker":{
      "container_id":"140c333cccf205fc34e15c59ad2085e4c726d7d974d08b0709fa8ac8e0c0a914"
   },
   "kubernetes":{
      "container_name":"app",
      "namespace_name":"default",
      "pod_name":"app-1",
      "container_image":"app:1.0",
      "container_image_id":"docker://sha256:4e2e427678c1d277482265c5ca39ed3668c74fe9d649da84c0bfb98bef1e1bb2",
      "pod_id":"2e2b7e4f-432e-11ea-bec2-025000000001",
      "host":"docker-desktop",
      "labels":{
         "app":"app-service",
         "controller-revision-hash":"app-dc7cd9cbf",
         "statefulset_kubernetes_io/pod-name":"app-1"
      },
      "master_url":"https://10.96.0.1:443/api",
      "namespace_id":"180672a1-063d-11ea-ad93-025000000001"
   }
}
*/
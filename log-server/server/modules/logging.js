var ndjson = require('ndjson')
const { Readable } = require('stream')

const router = express.Router();

var app_logs = [];

router.post('/app', function (req, res) {
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

router.post('/proxy', function (req, res) {
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
                client.send(JSON.stringify(newMsgs));
            });
        });
        
    res.sendStatus(200);
});

module.exports = router;
const express = require('express');
var ndjson = require('ndjson')
const { Readable } = require('stream')

module.exports = function Logging(handler) {
    const router = express.Router();

    router.post('/app', function (req, res) {
        let data = req.body;

        Readable.from([data]).pipe(ndjson.parse())
            .on('data', function(msg) {
                console.log(JSON.stringify(msg));
                let pod_name = msg.kubernetes !== undefined ? msg.kubernetes.pod_name : 'undefined';
                let log = msg.log || 'undefined';
                let timestamp = msg.timestamp || 'undefined';
                let logMsg = {timestamp: timestamp, node: pod_name, message: log};
                console.debug(logMsg);
                handler.publish('app', logMsg);
            })
            .on('end', function() {
                
            });
        
        res.sendStatus(200);
    });

    router.post('/proxy', function (req, res) {
        let data = req.body;

        Readable.from([data]).pipe(ndjson.parse())
            .on('data', function(msg) {
                let pod_name = msg.kubernetes !== undefined ? msg.kubernetes.pod_name : 'undefined';
                let log = msg.log || 'undefined';
                let timestamp = msg.timestamp || 'undefined';
                let logMsg = {timestamp: timestamp, node: pod_name, message: log};
                console.debug(logMsg);
                handler.publish('proxy', logMsg);
            })
            .on('end', function() {
                
            });
            
        res.sendStatus(200);
    });

    return router;
}
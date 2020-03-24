const express = require('express');
var ndjson = require('ndjson');
const { Readable } = require('stream');

module.exports = function (handler) {
    const router = express.Router();

    router.post('/app', function (req, res) {
        Readable.from([req.body]).pipe(ndjson.parse())
            .on('data', function(record) {
                let pod_name = record.kubernetes !== undefined ? record.kubernetes.pod_name : 'undefined';
                let msg = {timestamp: record.timestamp, node: pod_name, msg: record.log};
                handler.publish('app', msg);
            });
        
        res.sendStatus(200);
    });

    router.post('/proxy', function (req, res) {
        Readable.from([req.body]).pipe(ndjson.parse())
            .on('data', function(record) {
                let pod_name = record.kubernetes !== undefined ? record.kubernetes.pod_name : 'undefined';
                let msg = {timestamp: record.timestamp, node: pod_name, msg: record.log};
                handler.publish('proxy', msg);
            });

        res.sendStatus(200);
    });

    return router;
};
const express = require('express');
var ndjson = require('ndjson');
const { Readable } = require('stream');

module.exports = function (handler) {
    const router = express.Router();

    function log(tag) {
        router.post(`/${tag}`, function (req, res) {
            let msgs = [];

            Readable.from([req.body]).pipe(ndjson.parse())
                .on('data', function(record) {
                    let pod_name = record.kubernetes !== undefined ? record.kubernetes.pod_name : 'undefined';
                    let msg = {timestamp: record.timestamp, node: pod_name, msg: record.log};
                    msgs.push(msg);
                })
                .on('end', () => {
                    handler.publish(tag, msgs);
                });

            res.sendStatus(200);
        });
    }

    log('app');
    log('proxy');

    return router;
};
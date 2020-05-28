const express = require('express');
const bodyParser = require('body-parser');
var ndjson = require('ndjson');
const { Readable } = require('stream');

module.exports = function (handler, namespace) {
    const router = express.Router();

    router.use(bodyParser.text( { type: 'application/x-ndjson', limit: '50mb' } ));

    function log(tag) {
        router.post(`/${tag}`, function (req, res) {
            let msgs = [];

            Readable.from([req.body]).pipe(ndjson.parse())
                .on('data', function(record) {
                    if (record.kubernetes === undefined) {
                        return;
                    }

                    if (record.kubernetes.namespace_name !== namespace) {
                        return;
                    }

                    let pod_name = record.kubernetes.pod_name;
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

/*
{
  "log": "2020/05/28 09:27:29 /Chord/Notify - app-3.app-service.7fd3656123eb4d76a17f330dd7d286e8.svc.cluster.local\n",
  "stream": "stderr",
  "docker": {
    "container_id": "b9655fdf3af4fbb31139235737650b816c3cec828987bd3e62b3301e678e9901"
  },
  "kubernetes": {
    "container_name": "goproxy",
    "namespace_name": "7fd3656123eb4d76a17f330dd7d286e8",
    "pod_name": "app-0",
    "container_image": "app-proxy:1.0",
    "container_image_id": "docker://sha256:b9448848a3e84e1dcd5cc248bfc54caa00e8578c4a1704a7581cb3da0013d088",
    "pod_id": "5f31708e-a0c5-11ea-ae66-025000000001",
    "host": "docker-desktop",
    "labels": {
      "app": "app-service",
      "controller-revision-hash": "app-8c7d56ddd",
      "statefulset_kubernetes_io/pod-name": "app-0"
    },
    "master_url": "https://10.96.0.1:443/api",
    "namespace_id": "5f147fc0-a0c5-11ea-ae66-025000000001"
  },
  "timestamp": "1590658049456"
}
*/
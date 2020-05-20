const express = require('express');
const bodyParser = require('body-parser');
const k8s = require('@kubernetes/client-node');

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

module.exports = function (sim_config) {
    const router = express.Router();

    router.use(bodyParser.json())

    let podNames = genPodNames(sim_config.params.server.replicas);
    handleEvents(sim_config, podNames);

    router.get(`/config`, function (req, res) {
        res.send(JSON.stringify(sim_config));
    });

    router.post(`/kill-pod`, function (req, res) {
        let podName = req.body.podName;
        console.debug(`Kill Pod Request: ${podName}`);
        k8sApi.deleteNamespacedPod(name=podName, namespace=sim_config.namespace)
        res.send('');
    });

    return router;
};

function genPodNames(replicas) {
    let names = [];
    for (let i = 0; i < replicas; i++) {
        names.push(`app-${i}`);
    }
    return names;
}

function handleEvents(sim_config, podNames) {
    let events = sim_config.params.server.events;
    for (let event of events) {
        let typeFunc = typeFuncs[event.type];
        let regexp = new RegExp(event.selector);
        setTimeout(() => {
            let targetPodNames = podNames.filter(podName => podName.match(regexp));
            typeFunc(sim_config, targetPodNames);
        }, event.time);
    }
}

let typeFuncs = {
    'kill': killPod
};

function killPod(sim_config, podNames) {
    console.debug(`Kill Pods ${JSON.stringify(podNames)}`);
    for (let podName of podNames) {
        k8sApi.deleteNamespacedPod(name=podName, namespace=sim_config.namespace)
    }
}
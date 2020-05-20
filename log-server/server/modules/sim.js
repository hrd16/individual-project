const express = require('express');
const k8s = require('@kubernetes/client-node');

const kc = new k8s.KubeConfig();
kc.loadFromDefault();
const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

module.exports = function (sim_config) {
    const router = express.Router();

    let podNames = genPodNames(sim_config.params.server.replicas);
    handleEvents(sim_config, podNames);

    // setTimeout(() => {
    //     k8sApi.listNamespacedPod(namespace=sim_config)
    // }, 30000);

    router.get(`/config`, function (req, res) {
        res.send(JSON.stringify(sim_config));
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
    for (let podName of podNames) {
        k8sApi.deleteNamespacedPod(name=podName, namespace=sim_config.namespace)
    }
}
const WebSocket = require('ws');

function get_metrics(received) {
    let metrics = [];
    let keys = Object.keys(received);
    for (let i = 0; i < keys.length; i++) {
        let node = keys[i];
        metrics.push({'node': node, 'received': received[node]});
    }
    return metrics;
}

module.exports = function (handler, server) {
    const wss = new WebSocket.Server({ server: server, path: '/api/ws' });

    let app_logs = [];
    let received = {};

    handler.subscribe('app', msgs => {
        app_logs = app_logs.concat(msgs);
        wss.clients.forEach(client => {
            client.send(JSON.stringify({type: 'node', val: msgs}));
        });
    });

    handler.subscribe('app', msgs => { 
        msgs.forEach(msg => {
            if (!(msg.node in received)) {
                received[msg.node] = 0;
            }
            received[msg.node]++;
        });
        wss.clients.forEach(client => {
            client.send(JSON.stringify({type: 'metrics', val: get_metrics(received)}));
        });
    });

    wss.on('connection', function connection(ws) {
        ws.send(JSON.stringify({type: 'node', val: app_logs}));
        ws.send(JSON.stringify({type: 'metrics', val: get_metrics(received)}));
    });
};
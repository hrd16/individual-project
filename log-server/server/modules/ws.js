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
    let proxy_logs = [];
    let received = {};

    // Send node logs
    handler.subscribe('app', msgs => {
        app_logs = app_logs.concat(msgs);
        wss.clients.forEach(client => {
            client.send(JSON.stringify({type: 'node', val: msgs}));
        });
    });

    // Send message logs
    handler.subscribe('proxy', msgs => {
        proxy_logs = proxy_logs.concat(msgs);
        wss.clients.forEach(client => {
            client.send(JSON.stringify({type: 'messages', val: msgs}));
        });
    });

    // Send metrics
    handler.subscribe('proxy', msgs => { 
        msgs.forEach(msg => {
            if (!(msg.to in received)) {
                received[msg.to] = 0;
            }
            received[msg.to]++;
        });
        wss.clients.forEach(client => {
            client.send(JSON.stringify({type: 'metrics', val: get_metrics(received)}));
        });
    });

    wss.on('connection', function connection(ws) {
        ws.send(JSON.stringify({type: 'node', val: app_logs}));
        ws.send(JSON.stringify({type: 'messages', val: proxy_logs}));
        ws.send(JSON.stringify({type: 'metrics', val: get_metrics(received)}));
    });
};
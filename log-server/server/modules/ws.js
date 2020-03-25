const WebSocket = require('ws');

module.exports = function (handler, server) {
    const wss = new WebSocket.Server({ server: server, path: '/api/ws' });

    let app_logs = [];

    handler.subscribe('app', msgs => {
        app_logs.concat(msgs);
        wss.clients.forEach(client => {
            client.send(JSON.stringify(msgs));
        });
    });

    wss.on('connection', function connection(ws) {
        ws.send(JSON.stringify(app_logs));
    });
};
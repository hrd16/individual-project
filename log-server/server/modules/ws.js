const WebSocket = require('ws');

module.exports = function (handler, server) {
    const wss = new WebSocket.Server({ server: server, path: '/api/ws' });

    let app_logs = [];

    handler.subscribe('app', msg => {
        app_logs.push(msg);
        wss.clients.forEach(client => {
            client.send(JSON.stringify([msg]));
        });
    });

    wss.on('connection', function connection(ws) {
        ws.send(JSON.stringify(app_logs));
    });
};
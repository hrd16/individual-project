const WebSocket = require('ws');

const wss = new WebSocket.Server({ server: server, path: '/api/ws' });

wss.on('connection', function connection(ws) {
    ws.send(JSON.stringify(app_logs))
});
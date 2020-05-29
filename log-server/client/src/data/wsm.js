import NodeHandler from './handlers/node'
import MessagesHandler from './handlers/messages'
import MetricsHandler from './handlers/metrics';

const URL = 'ws://localhost:31234/api/ws';

class WSM {
    ws = new WebSocket(URL);

    nodeHandler = new NodeHandler();
    messagesHandler = new MessagesHandler();
    metricsHandler = new MetricsHandler();

    handlers = {
        'node': this.nodeHandler,
        'messages': this.messagesHandler,
        'metrics': this.metricsHandler
    };

    constructor() {
        this.ws.onopen = () => {
            console.debug('wsm connected');
        }

        this.ws.onmessage = evt => {
            const data = JSON.parse(evt.data);
            console.debug(data);
            this.handlers[data.type].onMessage(data);
        }
    
        this.ws.onclose = () => {
            console.debug('wsm disconnected');
            this.ws = new WebSocket(URL);
        };
    }

}

export default WSM;
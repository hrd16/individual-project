import NodeHandler from './handlers/node'
import MetricsHandler from './handlers/metrics';

const URL = 'ws://localhost:31234/api/ws';

class WSM {
    ws = new WebSocket(URL);

    nodeHandler = new NodeHandler();
    metricsHandler = new MetricsHandler();

    handlers = {
        'node': this.nodeHandler,
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
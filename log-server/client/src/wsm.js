const URL = 'ws://localhost:31234/api/ws';

class WSM {
    ws = new WebSocket(URL);

    constructor() {
        this.ws.onopen = () => {
            console.debug('connected');
        }
    
        this.ws.onclose = () => {
            console.debug('disconnected');
            this.ws = new WebSocket(URL);
        };
    }

}

const wsm = new WSM();

export default wsm;
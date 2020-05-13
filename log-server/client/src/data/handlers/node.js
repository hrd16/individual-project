class NodeHandler {

    messages = [];
    listeners = [];

    onMessage(data) {
        const msgs = data.val;

        msgs.forEach(msg => {
            this.messages.push({key: this.messages.length, ...msg});
        });

        this.listeners.forEach(handler => {
            handler(this.messages);
        });
    }

    subscribeToMessages(handler) {
        this.listeners.push(handler);
    }

    testData() {
        let messages = [];
        let messagesPerSecond = 200;
        let nodes = 5;
        let duration = 60;
        let startTime = Date.now();
        let key = 0;

        for (let i = 0; i < duration * messagesPerSecond; i++) {
            for (let n = 0; n < nodes; n++) {
                let timestamp = new Date(startTime - Math.round(Math.random() * duration * 1000)).getTime();
                messages.push({key: key++, timestamp: timestamp, node: `app-${n}`, msg: 'xyz'})
            }
        }
        return messages;
    }

}

export default NodeHandler;
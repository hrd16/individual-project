class MetricsHandler {

    metrics = [];
    listeners = [];

    onMessage(data) {
        const metrics = data.val;

        for (let i = 0; i < metrics.length; i++) {
          metrics[i].key = i;
        }

        this.metrics = metrics;

        this.listeners.forEach(handler => {
            handler(this.metrics);
        });
    }

    subscribeToMessages(handler) {
        this.listeners.push(handler);
    }

    unsubscribeToMessages(handler) {
        this.listeners = this.listeners.filter(h => h !== handler);
    }

}

export default MetricsHandler;
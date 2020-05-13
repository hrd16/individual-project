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

    subscribeToMetrics(handler) {
        this.listeners.push(handler);
    }

    testData() {
        let metrics = [];

        let key = 0;
        let nodes = 5;
        for (let n = 0; n < nodes; n++) {
          metrics.push({key: key++, node: `app-${n}`, received: 1000 + key})
        }

        return metrics;
    }

}

export default MetricsHandler;
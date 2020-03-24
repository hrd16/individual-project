class Handler {
    constructor() {
        this.subcribers = {};
    }

    subscribe(key, handler) {
        if (this.subcribers[key]) {
            this.subcribers[key].push(handler);
        } else {
            this.subcribers[key] = [handler];
        }
    }

    publish(key, message) {
        if (this.subcribers[key]) {
            for (let i = 0; i < this.subcribers[key].length; i++) {
                this.subcribers[key][i](message);
            }
        }
    }
}

module.exports = Handler;
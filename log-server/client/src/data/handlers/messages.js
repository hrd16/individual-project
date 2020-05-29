class MessageHandler {

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

    unsubscribeToMessages(handler) {
        this.listeners = this.listeners.filter(h => h !== handler);
    }

}

export default MessageHandler;
import React, { Component } from 'react';
import { Table } from 'antd';
var dateFormat = require('dateformat');

const URL = 'ws://localhost:31234/api/ws';

class Log extends Component {

    state = {
        messages: [] //this.testData()
    }

    ws = new WebSocket(URL);

    testData() {
        let messages = [];
        let messagesPerSecond = 200;
        let nodes = 5;
        let duration = 5;
        let startTime = Date.now();
        let key = 0;

        for (let i = 0; i < duration * messagesPerSecond; i++) {
            for (let n = 0; n < nodes; n++) {
                let timestamp = new Date(startTime - Math.round(Math.random() * duration * 1000));
                messages.push({key: key++, timestamp: timestamp, node: `app-${n}`, message: 'xyz'})
            }
        }
        return messages;
    }

    addMessage(message) {
        this.setState(state => ({ messages: [message, ...state.messages]}));
    }

    componentDidMount() {
        this.ws.onopen = () => {
            console.log('connected');
        }
      
        this.ws.onmessage = evt => {
            const msgs = JSON.parse(evt.data);
            console.log(msgs);
            msgs.forEach(msg => {
                this.addMessage(msg);
            });
        }
      
          this.ws.onclose = () => {
            console.log('disconnected');
            this.setState({
              ws: new WebSocket(URL),
            });
          };
    }
    

    render() {   
        const columns = [
            {
                title: 'Timestamp',
                dataIndex: 'timestamp',
                width: 175,
                render: (t, r, i) => dateFormat(r.timestamp, "H:MM:ss.l"),
                defaultSortOrder: 'descend',
                sorter: (a, b) => a.timestamp - b.timestamp,
            },
            {
                title: 'Node',
                dataIndex: 'node',
                width: 175,
                filters: [
                    {
                        text: 'app-0',
                        value: 'app-0'
                    },
                    {
                        text: 'app-1',
                        value: 'app-1'
                    },
                    {
                        text: 'app-2',
                        value: 'app-2'
                    },
                    {
                        text: 'app-3',
                        value: 'app-3'
                    },
                    {
                        text: 'app-4',
                        value: 'app-4'
                    }
                ],
                onFilter: (value, record) => record.node === value,
            },
            {
                title: 'Output',
                dataIndex: 'message',
            },
        ];

        return (
            <div>
                <Table dataSource={this.state.messages} columns={columns} pagination={{ pageSize: 50 }} />
            </div>
        )
    }

}

export default Log;
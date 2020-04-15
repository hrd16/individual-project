import React, { Component } from 'react';
import { Table } from 'antd';
import wsm from '../wsm';

class Metrics extends Component {

    state = {
        metrics: []
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

    componentDidMount() {
        wsm.ws.onmessage = evt => {
          const data = JSON.parse(evt.data);
          if (data.type !== 'metrics') {
            return;
          }

          const metrics = data.val;
          console.debug(metrics);

          for (let i = 0; i < metrics.length; i++) {
            metrics[i].key = i;
          }

          this.setState({ metrics: metrics});
        }
    }

    render() {   
        const columns = [
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
                    }
                ],
                onFilter: (value, record) => record.node === value,
            },
            {
                title: 'Received',
                dataIndex: 'received',
                width: 175,
                sorter: (a, b) => a.received - b.received,
            },
        ];

        return (
            <div>
                <Table dataSource={this.state.metrics} columns={columns} pagination={{ pageSize: 50 }} />
            </div>
        )
    }

}

export default Metrics;
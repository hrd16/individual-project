import React, { Component } from 'react';
import { Table } from 'antd';

class Metrics extends Component {

    state = {
        metrics: this.props.metricsHandler.metrics
    }
    
    constructor(props) {
        super(props);
        props.metricsHandler.subscribeToMetrics(this.handleMetricsChange);
    }

    handleMetricsChange = (metrics) => {
        this.setState(state => ({...state, metrics: metrics}))
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
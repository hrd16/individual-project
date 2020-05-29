import React, { Component } from 'react';
import { Table, Input, Button } from 'antd';
import Highlighter from 'react-highlight-words';
import { SearchOutlined } from '@ant-design/icons';

var dateFormat = require('dateformat');

class Node extends Component {

  state = {
    messages: this.props.nodeHandler.messages
  }

  componentDidMount() {
    this.props.nodeHandler.subscribeToMessages(this.handleMessagesChange);
  }

  componentWillUnmount() {
    this.props.nodeHandler.unsubscribeToMessages(this.handleMessagesChange);
  }

  handleMessagesChange = (messages) => {
    this.setState(state => ({...state, messages: messages}));
    this.forceUpdate();
  }

  getColumnSearchProps = dataIndex => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          ref={node => {
            this.searchInput = node;
          }}
          placeholder={`Search ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
          style={{ width: 188, marginBottom: 8, display: 'block' }}
        />
        <Button
          type="primary"
          onClick={() => this.handleSearch(selectedKeys, confirm, dataIndex)}
          icon={<SearchOutlined />}
          size="small"
          style={{ width: 90, marginRight: 8 }}
        >
          Search
          </Button>
        <Button onClick={() => this.handleReset(clearFilters)} size="small" style={{ width: 90 }}>
          Reset
          </Button>
      </div>
    ),
    filterIcon: filtered => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
    onFilter: (value, record) =>
      record[dataIndex]
        .toString()
        .toLowerCase()
        .includes(value.toLowerCase()),
    onFilterDropdownVisibleChange: visible => {
      if (visible) {
        setTimeout(() => this.searchInput.select());
      }
    },
    render: text =>
      this.state.searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[this.state.searchText]}
          autoEscape
          textToHighlight={text.toString()}
        />
      ) : (
          text
        ),
  });

  handleSearch = (selectedKeys, confirm, dataIndex) => {
    confirm();
    this.setState({
      searchText: selectedKeys[0],
      searchedColumn: dataIndex,
    });
  };

  handleReset = clearFilters => {
    clearFilters();
    this.setState({ searchText: '' });
  };

  getFilters = (clients) => {
    let filters = [];

    filters = filters.concat(Array.from(Array(this.props.config.params.server.replicas).keys()).map(i => {
      return {
        text: `app-${i}`,
        value: `app-${i}`
      };
    }));

    if (clients && this.props.config.params.client !== undefined) {
      filters = filters.concat(Array.from(Array(this.props.config.params.client.replicas).keys()).map(i => {
        return {
          text: `client-${i}`,
          value: `client-${i}`
        };
      }));
    }
    return filters;
  }

  render() {
    const columns = [
      {
        title: 'Timestamp',
        dataIndex: 'timestamp',
        width: 175,
        render: (t, r, i) => dateFormat(new Date(parseInt(r.timestamp)), "H:MM:ss.l"),
        defaultSortOrder: 'descend',
        sorter: (a, b) => a.timestamp - b.timestamp,
      },
      {
        title: 'Node',
        dataIndex: 'node',
        width: 175,
        filters: this.getFilters(true),
        onFilter: (value, record) => record.node === value,
      },
      {
        title: 'Output',
        dataIndex: 'msg',
        ...this.getColumnSearchProps('msg')
      },
    ];

    return (
      <div>
        <Table 
          dataSource={this.state.messages} 
          columns={columns} 
          pagination={{ pageSize: 50 }}
          rowKey={record => record.key}
        />
      </div>
    )
  }

}

export default Node;
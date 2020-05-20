import React, { Component } from 'react';
import { Button } from 'antd';
import axios from 'axios';

class NodeDash extends Component {

  render() {
    return (
        <div style={{backgroundColor: '#FFFFFF', padding: '5px', border: '1px solid'}}>
            <p>Node</p>
            <p><b>app-{this.props.id}</b></p>
            <Button onClick={this.killPod}>Kill</Button>
        </div>
    )
  }

  killPod = () => {
    axios.post('http://localhost:31234/api/sim/kill-pod', {podName: `app-${this.props.id}`})
      .then(res => {
        console.log(res);
      })
      .catch(err => console.error(err));
  }

}

export default NodeDash;
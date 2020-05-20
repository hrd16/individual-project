import React, { Component } from 'react';
import { Row, Col } from 'antd';
import NodeDash from './NodeDash';

class Dashboard extends Component {

  render() {
    return (
      <div>
        <div>
          <pre style={{textAlign: 'left', fontSize: '12px'}}>
            {JSON.stringify(this.props.config, null, 4).replace(/["{[,}\]]/g, "").replace(/^\s*\n/gm, '')}
          </pre>
        </div>
        <br />
        <Row gutter={[16, 16]}>   
          {Array.from(Array(this.props.config.params.server.replicas).keys()).map(i => 
            <Col key={i} span={4}>
              <NodeDash id={i} />
            </Col>
          )}
        </Row>
      </div>
    )
  }

}

export default Dashboard;
import React, { Component } from 'react';
import Log from './components/Log'
import { Layout } from 'antd';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom'

import './App.css';
import LinkMenu from './components/LinkMenu';
import Metrics from './components/Metrics';
import WSM from './data/wsm';

const { Header, Content, Footer, Sider } = Layout;

class App extends Component {

  wsm = new WSM();

  render() {
    return (
      <Layout>
        <Router>
          <Sider
            style={{
              overflow: 'auto',
              height: '100vh',
              position: 'fixed',
              left: 0,
            }}
          >
            <div className="logo">
              <p>Simul</p>
            </div>
            <LinkMenu />
          </Sider>
          <Layout className="site-layout" style={{ marginLeft: 200, height: '100vh' }}>
            <Header className="site-layout-background" style={{ padding: 0 }} />
            <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
              <div className="site-layout-background" style={{ padding: 24, textAlign: 'center' }}>
                <Switch>
                  <Route exact path="/nodes">
                    <Log messages={this.wsm.nodeHandler.messages} />
                  </Route>

                  <Route exact path="/messages">
                    
                  </Route>
                  
                  <Route exact path="/metrics">
                    <Metrics metrics={this.wsm.metricsHandler.metrics} />
                  </Route>
                </Switch>
              </div>
            </Content>
            <Footer style={{ textAlign: 'center' }}></Footer>
          </Layout>
        </Router>
      </Layout>
    );
  }
}

export default App;

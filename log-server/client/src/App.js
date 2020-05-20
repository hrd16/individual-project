import React, { Component } from 'react';
import Log from './components/Log'
import { Layout, Spin } from 'antd';
import { MemoryRouter as Router, Switch, Route } from 'react-router-dom'
import axios from 'axios';
import './App.css';
import LinkMenu from './components/LinkMenu';
import Metrics from './components/Metrics';
import WSM from './data/wsm';
import Dashboard from './components/Dashboard';

const { Header, Content, Footer, Sider } = Layout;

class App extends Component {

  wsm = new WSM();
  state = {
    config: {}
  }

  componentDidMount() {
    axios.get('http://localhost:31234/api/sim/config')
      .then(res => {
        this.setConfig(res.data)
      })
      .catch(err => console.error(err));
  }

  setConfig = (config) => {
    this.setState(state => ({...state, config: config}));
  }

  render() {
    let content = <Spin></Spin>;

    if (this.state.config.params !== undefined) {
      content = (
        <Switch>
          <Route exact path="/">
            <Dashboard config={this.state.config} />
          </Route>

          <Route exact path="/nodes">
            <Log nodeHandler={this.wsm.nodeHandler} config={this.state.config} />
          </Route>

          <Route exact path="/messages">
            
          </Route>

          <Route exact path="/metrics">
            <Metrics metricsHandler={this.wsm.metricsHandler} config={this.state.config} />
          </Route>
        </Switch>
      );
    }

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
            <LinkMenu />
          </Sider>
          <Layout className="site-layout" style={{ marginLeft: 200, height: '100vh' }}>
            <Header className="site-layout-background" style={{ padding: 0 }} />
            <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
              <div className="site-layout-background" style={{ padding: 24, textAlign: 'center' }}>
                {content}
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

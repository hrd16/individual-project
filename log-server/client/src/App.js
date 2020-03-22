import React from 'react';
import Log from './components/Log'
import { Layout, Menu } from 'antd';

import {
  ApartmentOutlined,
  CommentOutlined,
  BarChartOutlined
} from '@ant-design/icons';

import './App.css';

const { Header, Content, Footer, Sider } = Layout;

function App() {
  return (
    // <div className="App">
    //   <header className="App-header">
    //     <Button type="primary">Button</Button>
    //     <Log />
    //   </header>
    // </div>
    <Layout>
       <Sider
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
        }}
      >
        <div className="logo">
          dashboard
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['4']}>
          <Menu.Item key="1">
            <ApartmentOutlined />
            <span className="nav-text">Nodes</span>
          </Menu.Item>
          <Menu.Item key="2">
            <CommentOutlined />
            <span className="nav-text">Messages</span>
          </Menu.Item>
          <Menu.Item key="3">
            <BarChartOutlined />
            <span className="nav-text">Metrics </span>
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout className="site-layout" style={{ marginLeft: 200 }}>
      <Header className="site-layout-background" style={{ padding: 0 }} />
      <Content style={{ margin: '24px 16px 0', overflow: 'initial' }}>
        <div className="site-layout-background" style={{ padding: 24, textAlign: 'center' }}>
          <Log />
        </div>
      </Content>
      <Footer style={{ textAlign: 'center' }}>Ant Design ©2018 Created by Ant UED</Footer>
      </Layout>
    </Layout>
  );
}

export default App;

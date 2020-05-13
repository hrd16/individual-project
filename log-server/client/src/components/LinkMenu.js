import React from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Menu } from 'antd';

import {
    ApartmentOutlined,
    CommentOutlined,
    BarChartOutlined
  } from '@ant-design/icons';

const LinkMenu = withRouter(props => {
  const { location } = props;
  return (
        <>
          <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '32px', margin: '16px'}}>
            <Link to="/">
              <p style={{color: 'white', margin: '0px', fontSize: '20px', fontFamily: 'Roboto', opacity: 0.90, fontWeight: 'bold', paddingRight: '14px'}}>
                > simul
              </p>
            </Link>
          </div>
          <Menu theme="dark" mode="inline" defaultSelectedKeys={['4']} selectedKeys={[location.pathname]}>
              <Menu.Item key="/nodes">
                <ApartmentOutlined />
                <Link to="/nodes" className="nav-text">Nodes</Link>
              </Menu.Item>
              <Menu.Item key="/messages">
                <CommentOutlined />
                <Link to="/messages" className="nav-text">Messages</Link>
              </Menu.Item>
              <Menu.Item key="/metrics">
                <BarChartOutlined />
                <Link to="/metrics" className="nav-text">Metrics</Link>
              </Menu.Item>
          </Menu>
        </>
    );
});

export default LinkMenu;
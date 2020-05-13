import React, { Component } from 'react';

class Dashboard extends Component {

  render() {
    return (
      <div>
        <p>{JSON.stringify(this.props.config)}</p>
      </div>
    )
  }

}

export default Dashboard;
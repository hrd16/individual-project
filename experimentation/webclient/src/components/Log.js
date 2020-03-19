import React, { Component } from 'react'
import styled from 'styled-components'

const URL = 'ws://localhost:32338'

const Container = styled.div`

`;

const Message = styled.p`
    margin: 0
`;

class Log extends Component {

    state = {
        messages: []
    }

    ws = new WebSocket(URL)

    addMessage(message) {
        this.setState(state => ({ messages: [message, ...state.messages]}))
    }

    componentDidMount() {
        this.ws.onopen = () => {
            console.log('connected')
        }
      
        this.ws.onmessage = evt => {
            const msgs = JSON.parse(evt.data)
            console.log(msgs)
            msgs.forEach(msg => {
                this.addMessage(msg)
            })
        }
      
          this.ws.onclose = () => {
            console.log('disconnected')
            // reconnect on connection loss
            this.setState({
              ws: new WebSocket(URL),
            })
          }
    }

    render() {
        return (
            <Container>
                {this.state.messages.map((message, index) =>
                    <Message key={index}>{JSON.stringify(message)}</Message>
                )}
            </Container>
        )
    }

}

export default Log;
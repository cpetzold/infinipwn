import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import { ipcRenderer as ipc } from 'electron'



class App extends Component {
  constructor() {
    super()

    this.state = {
      rgbVals: []
    }
  }

  componentDidMount() {
    ipc.on('update', (e, rgbVals) => {
      this.setState({ rgbVals })
    })
  }
  
  renderStrip(strip, i) {
    return (
      <div key={i} style={{ display: 'flex', flexDirection: 'row'  }}>
        {strip.map(([r, g, b], j) => <div key={j} style={{
          display: 'block',
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: `rgb(${r},${g},${b})`
        }} />)}
      </div>
    )
  }

  render() {
    const { rgbVals } = this.state
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        '-webkit-app-region': 'drag',
      }}>
        {rgbVals.reverse().map(this.renderStrip)}
      </div>
    )
  }
}

ReactDOM.render(
  <App />,
  document.body
)
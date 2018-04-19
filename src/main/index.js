import { flattenDeep } from 'lodash'
import SerialPort from 'serialport'
import chroma from 'chroma-js'
import Table from './Table'

import createApp from './app'

import hueRotate from './animations/hueRotate'
import mouseScreen from './animations/mouseScreen'
import metaballs from './animations/metaballs'
import mic from './animations/mic'
import controllerTest from './animations/controllerTest'

const port = new SerialPort('/dev/cu.usbmodem2131261')
const table = new Table()
let window

table.addAnimation(metaballs())
// table.addAnimation(mouseScreen)
// table.addAnimation(hueRotate({ speed: 5 }))
// table.addAnimation(mic)
// table.addAnimation(controllerTest)

function update() {
  table.update()
  if (port) {
    renderToTable()
  }
  // renderToApp()
}

function renderToTable() {
  port.write('*')
  port.write(Buffer.from(flattenDeep(table.rgbVals())))
}

function renderToApp() {
  window.send('update', table.rgbVals())
}

async function start() {
  const { mainWindow } = await createApp()
  window = mainWindow

  setInterval(update, 20)
}

start()
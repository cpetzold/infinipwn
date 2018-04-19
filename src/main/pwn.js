import SerialPort from 'serialport'
import chroma from 'chroma-js'
import Table from './Table'

import hueRotate from './animations/hueRotate'
import mouseScreen from './animations/mouseScreen'
import metaballs from './animations/metaballs'
import mic from './animations/mic'

const port = new SerialPort('/dev/cu.usbmodem2131261')
const table = new Table()

// table.addAnimation(metaballs())
// table.addAnimation(mouseScreen)
// table.addAnimation(hueRotate({ speed: 2 }))
table.addAnimation(mic)

function update() {
  table.update()
  port.write('*')
  port.write(Buffer.from(table.rgbVals().flatten(2)))
}

setInterval(update, 16)
import chroma from 'chroma-js'
import dualShock from 'dualshock-controller'
import Vector from 'victor'

function wrap(x, m) {
  return ((x % m) + m) % m
}

export default (table, next) => {
  const controller = dualShock({
    //you can use a ds4 by uncommenting this line.
    config: "dualshock4-generic-driver",
    //if the above configuration doesn't work for you,
    //try uncommenting the following line instead.
    //config: "dualshock4-alternate-driver"
    //if using ds4 comment this line.
    // config: "dualShock3",
    //smooths the output from the acelerometers (moving averages) defaults to true
    accelerometerSmoothing: true,
    //smooths the output from the analog sticks (moving averages) defaults to false
    analogStickSmoothing: false
  })

  let acc = new Vector(0, 0)
  let vel = new Vector(0, 0)
  let pos = new Vector(table.ledsPerStrip / 2, 0)

  let color = chroma.random()

  controller.on('square:press', () => color = chroma.random())

  return () => {
    acc.x = (controller.left.x - (255 / 2)) * -0.004
    acc.y = (controller.left.y - (255 / 2)) * -0.004

    vel.add(acc).multiplyScalar(0.9)

    pos.x = wrap(pos.x + vel.x, table.ledsPerStrip - 1)
    pos.y = wrap(pos.y + vel.y, table.numStrips - 1)

    table.setAll(chroma('black'))
    table.set(Math.round(pos.x), Math.round(pos.y), color)

    acc = new Vector(0, 0)
  }
}
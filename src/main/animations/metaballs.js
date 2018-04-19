import chroma from 'chroma-js'
import ms from 'ms'
import Vector from 'victor'

function wrap(x, m) {
  return ((x % m) + m) % m
}

const padding = 0

class Ball {
  constructor(pos, speed) {
    this.pos = pos
    const x = (Math.random() + 0.1) * (Math.random() > 0.5 ? -1 : 1) * speed
    const y = (Math.random() + 0.1) * (Math.random() > 0.5 ? -1 : 1) * speed
    this.vel = new Vector(x, y)
  }

  update(table) {
    this.pos.add(this.vel)
    this.pos.x = wrap(this.pos.x, table.ledsPerStrip)

    if (this.pos.y < -padding || this.pos.y > table.numStrips + padding) {
      this.vel.y *= -1.0
    }
  }
}

function distance(v1, v2, xwrap) {
  const add = new Vector(xwrap / 2, 0)
  const v1c = new Vector(wrap(v1.x + add.x, xwrap), v1.y)
  const v2c = new Vector(wrap(v2.x + add.x, xwrap), v2.y)
  const d1 = v1c.distance(v2c)
  const d2 = v1.distance(v2)
  return Math.min(d1, d2)
}

export default ({ numBalls = 10, speed = 0.6 } = {}) => (table, next) => {
  setTimeout(next, ms('30min'))

  const topLeft = new Vector(0, table.numStrips)
  const bottomRight = new Vector(table.ledsPerStrip, 0)
  const randPoint = () => new Vector().randomize(topLeft, bottomRight)

  const balls = []
  for (let i = 0; i < numBalls; i++) {
    balls.push(new Ball(randPoint(), speed))
  }

  return () => {
    balls.forEach(ball => ball.update(table))

    for (let x = 0; x < table.ledsPerStrip; x++) {
      for (let y = 0; y < table.numStrips; y++) {
        const pos = new Vector(x, y)
        const sum = balls.reduce((total, ball) => total + (1300 / distance(ball.pos, pos, table.ledsPerStrip)), 0)
        const rsum = Math.round(sum)

        table.set(x, y, chroma.hsl((rsum / 500) * 360, 1, 0.3))
        // table.set(x, y, chroma.mix('blue', 'red', rsum / 500))
      }
    }
  }
}
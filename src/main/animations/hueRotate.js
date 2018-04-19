import chroma from 'chroma-js'
import ms from 'ms'

export default ({ speed = 1 } = {}) => (table, next) => {
  setTimeout(next, ms('10s'))

  let hue = 0
  return () => {
    table.setAll(chroma.hsl(hue, 1, 0.1))

    hue += speed
    if (hue > 360) {
      hue = 0
    }
  }
}
import robot from 'robotjs'
import chroma from 'chroma-js'

export default (table, next) => {
  return () => {
    const { x, y } = robot.getMousePos()
    const screenColorHex = robot.getPixelColor(x, y)
    table.setAll(chroma(screenColorHex))
  }
}
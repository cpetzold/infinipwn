import chroma from 'chroma-js'

export default class Table {
  constructor({
    strips = 6,
    ledsPerStrip = 180,
    startingColor = chroma('black')
  } = {}) {
    this.animations = []
    this.currAnimationIndex = 0
    this.currAnimation = null
    this.leds = new Array(strips).fill(0)
    this.leds = this.leds.map(_ => new Array(ledsPerStrip))
    this.setAll(startingColor)
  }

  get numStrips() {
    return this.leds.length
  }

  get ledsPerStrip() {
    return this.leds[0].length
  }

  set(x, y, color) {
    this.leds[y][x] = color
  }

  setAll(color) {
    this.leds = this.leds.map(strip => strip.fill(color))
  }

  next() {
    this.currAnimationIndex++
    if (this.currAnimationIndex >= this.animations.length) {
      this.currAnimationIndex = 0
    }

    this.currAnimation = this.animations[this.currAnimationIndex](this, this.next.bind(this))
  }

  addAnimation(animation) {
    this.animations.push(animation)
    if (this.animations.length == 1) {
      this.currAnimation = animation(this, this.next.bind(this))
    }
  }

  update() {
    this.currAnimation && this.currAnimation()
  }

  rgbVals() {
    return this.leds.map(strip => strip.map(color => color.rgb()))
  }
}
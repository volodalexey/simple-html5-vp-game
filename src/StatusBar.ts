import { Container, Text } from 'pixi.js'

export class StatusBar extends Container {
  static options = {
    padding: 20,
    textColor: 0xbb5857,
    textColorShadow: 0x98cbd8,
    textShadowOffset: 0.5,
    textSize: 40
  }

  public timeText!: Text
  public timeTextShadow!: Text

  constructor () {
    super()
    this.setup()
  }

  static getTimeText (append: string | number): string {
    return `Time: ${append}`
  }

  setup (): void {
    const {
      options: {
        padding,
        textSize,
        textColor,
        textShadowOffset,
        textColorShadow
      }
    } = StatusBar

    const timeTextShadow = new Text(StatusBar.getTimeText(0), {
      fontSize: textSize * 0.8,
      fill: textColorShadow,
      align: 'center'
    })
    timeTextShadow.position.set(0, padding)
    this.addChild(timeTextShadow)
    this.timeTextShadow = timeTextShadow
    const timeText = new Text(StatusBar.getTimeText(0), {
      fontSize: textSize * 0.8,
      fill: textColor,
      align: 'center'
    })
    timeText.position.set(0 + textShadowOffset, padding + textShadowOffset)
    this.addChild(timeText)
    this.timeText = timeText
  }

  updateTime (time: number): void {
    const timeTxt = (time * 0.001).toFixed(1)
    this.timeText.text = StatusBar.getTimeText(timeTxt)
    this.timeTextShadow.text = StatusBar.getTimeText(timeTxt)
  }
}

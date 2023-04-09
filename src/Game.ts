import { Container, TilingSprite, type Texture, Graphics } from 'pixi.js'
import { type IPlayerOptions, Player } from './Player'
import { StatusBar } from './StatusBar'
import { StartModal } from './StartModal'
import { InputHandler } from './InputHandler'
import { CollisionBlock } from './CollisionBlock'
import { type IMapSettings, MapSettings } from './MapSettings'
import { logCameraboxBounds, logLayout } from './logger'

export interface IGameOptions {
  viewWidth: number
  viewHeight: number
  levelSettings: IMapSettings
  textures: {
    levelBackgroundTexture: Texture
    warriorTextures: IPlayerOptions['textures']
  }
}

interface IBoundsData {
  top: number
  right: number
  bottom: number
  left: number
}

export class Game extends Container {
  public gameEnded = false
  public time = 0

  static options = {
    maxTime: 2500000,
    scale: 4,
    camerabox: {
      initWidth: 200,
      initHeight: 80
    }
  }

  public viewWidth: number
  public viewHeight: number
  public player!: Player
  public inputHandler!: InputHandler
  public background!: TilingSprite
  public statusBar!: StatusBar
  public startModal!: StartModal
  public camerabox = new Graphics()
  public collisionBlocks = new Container<CollisionBlock>()
  constructor (options: IGameOptions) {
    super()

    this.viewWidth = options.viewWidth
    this.viewHeight = options.viewHeight
    this.setup(options)

    this.addEventLesteners()

    this.initLevel(options)
  }

  setup ({
    viewWidth,
    viewHeight,
    textures: {
      levelBackgroundTexture,
      warriorTextures
    }
  }: IGameOptions): void {
    const background = new TilingSprite(levelBackgroundTexture, viewWidth, viewHeight)
    this.addChild(background)
    this.background = background

    this.statusBar = new StatusBar()
    this.addChild(this.statusBar)

    this.addChild(this.collisionBlocks)

    this.player = new Player({ game: this, textures: warriorTextures })
    this.addChild(this.player)

    this.camerabox.beginFill(0xffff00)
    this.camerabox.drawRect(0, 0, Game.options.camerabox.initWidth, Game.options.camerabox.initHeight)
    this.camerabox.endFill()
    this.camerabox.alpha = logCameraboxBounds.enabled ? 0.5 : 0
    this.addChild(this.camerabox)

    this.inputHandler = new InputHandler({ eventTarget: this, relativeToTarget: this.player })

    this.startModal = new StartModal({ viewWidth, viewHeight })
    this.startModal.visible = false
    this.addChild(this.startModal)

    this.scale.set(Game.options.scale)
    this.background.tileScale.set(Game.options.scale)
  }

  getCameraboxBounds (scaled = true): IBoundsData {
    const { scale } = Game.options
    const { x, y, width, height } = this.camerabox
    const ret = {
      top: scaled ? y * scale : y,
      right: scaled ? (x + width) * scale : x + width,
      bottom: scaled ? (y + height) * scale : y + height,
      left: scaled ? x * scale : x
    }
    return ret
  }

  updateCamerabox (): void {
    this.camerabox.position = {
      x: this.player.hitbox.position.x - 50,
      y: this.player.hitbox.position.y
    }
  }

  getViewportBounds (): IBoundsData {
    const { tilePosition: { x, y }, width, height } = this.background
    const ret = {
      top: y,
      right: x + width,
      bottom: y + height,
      left: x
    }
    return ret
  }

  addEventLesteners (): void {
    this.startModal.on('click', this.startGame)
  }

  startGame = (): void => {
    this.startModal.visible = false
    this.gameEnded = false
    this.time = 0
    this.player.restart()
    this.inputHandler.restart()
  }

  endGame (success = false): void {
    this.gameEnded = true
    this.player.stop()
    this.startModal.visible = true
    this.startModal.reasonText.text = success ? 'Win!!' : 'Time out!'
  }

  handleResize ({ viewWidth, viewHeight }: {
    viewWidth: number
    viewHeight: number
  }): void {
    this.viewWidth = viewWidth
    this.viewHeight = viewHeight
    logLayout(`x=${this.x} y=${this.y} w=${this.width} h=${this.height}`)
  }

  handleUpdate (deltaMS: number): void {
    if (this.gameEnded) {
      return
    }
    this.time += deltaMS
    this.statusBar.updateTime(this.time)
    if (this.time > Game.options.maxTime) {
      this.endGame()
      return
    }
    this.player.handleUpdate(deltaMS)
    this.handleCamera()
  }

  handleCamera (): void {
    // console.log(this.player.hitbox.width, this.player.hitbox.height)
    // console.log(this.background.tilePosition.x)
    const { player } = this
    player.updateHitbox()
    this.updateCamerabox()
    const cameraboxBounds = this.getCameraboxBounds()
    // this.background.tilePosition.x = -this.player.x
    // this.background.tilePosition.y = -this.player.y

    // if (player.velocity.vy < 0) {
    //   this.shouldPanCameraDown(cameraboxBounds)
    // } else if (player.velocity.vy > 0) {
    //   this.shouldPanCameraUp(cameraboxBounds)
    // }
    const { scale } = Game.options
    const viewportBounds = this.getViewportBounds()
    if (cameraboxBounds.bottom > viewportBounds.bottom) {
      this.background.tilePosition.y -= (cameraboxBounds.bottom - viewportBounds.bottom) / scale
    }
  }

  shouldPanCameraUp (cameraboxBounds: IBoundsData): void {
    const { player, camerabox, background, viewHeight } = this

    const { scale } = Game.options
    // const scaledCanvasHeight = this.height / Game.options.scale
    // if (
    //   cameraboxBounds.bottom + player.velocity.vy * scale >=
    //   viewHeight
    // ) { return }

    if (
      cameraboxBounds.bottom >=
      Math.abs(background.tilePosition.y) + viewHeight
    ) {
      background.tilePosition.y -= player.velocity.vy * scale
    }
  }

  shouldPanCameraDown (cameraboxBounds: IBoundsData): void {
    const { player, camerabox, background } = this
    if (camerabox.position.y + player.velocity.vy <= 0) return

    if (camerabox.position.y <= Math.abs(background.tilePosition.y)) {
      background.position.y -= player.velocity.vy
    }
  }

  initLevel ({ levelSettings }: IGameOptions): void {
    const cell = 16
    const collisionPoints = MapSettings.mapTileToPositions({
      mapSettings: levelSettings,
      layerName: 'FloorCollisions',
      tileIds: [202],
      tilesPerRow: 36,
      cell
    })

    collisionPoints.forEach(cp => {
      this.collisionBlocks.addChild(new CollisionBlock({
        initX: cp.x,
        initY: cp.y,
        cell
      }))
    })

    this.player.restart()
  }
}

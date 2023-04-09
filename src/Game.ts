import { Container, Sprite, type Texture, Graphics } from 'pixi.js'
import { type IPlayerOptions, Player } from './Player'
import { StatusBar } from './StatusBar'
import { StartModal } from './StartModal'
import { InputHandler } from './InputHandler'
import { CollisionBlock } from './CollisionBlock'
import { type IMapSettings, MapSettings } from './MapSettings'
import { logCameraboxBounds, logLayout, logViewportBounds } from './logger'

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
    maxTime: 1000000,
    scale: 3,
    camerabox: {
      offset: {
        x: -42,
        y: -34
      },
      initWidth: 100,
      initHeight: 100
    }
  }

  public viewWidth: number
  public viewHeight: number
  public player!: Player
  public inputHandler!: InputHandler
  public background!: Sprite
  public statusBar!: StatusBar
  public startModal!: StartModal
  public camerabox = new Graphics()
  public floorCollisionBlocks = new Container<CollisionBlock>()
  public platformCollisionBlocks = new Container<CollisionBlock>()
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
    // const background = new TilingSprite(levelBackgroundTexture, viewWidth, viewHeight)
    const background = new Sprite(levelBackgroundTexture)
    this.addChild(background)
    this.background = background

    this.statusBar = new StatusBar()
    this.addChild(this.statusBar)

    this.addChild(this.floorCollisionBlocks)
    this.addChild(this.platformCollisionBlocks)

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
    // this.background.scale.set(Game.options.scale)
    // this.player.scale.set(Game.options.scale)
    // this.background.tileScale.set(Game.options.scale)
  }

  getCameraboxBounds (scale?: number): IBoundsData {
    const { velocity: { vx, vy } } = this.player
    const { x, y, width, height } = this.camerabox
    const bounds: IBoundsData = {
      top: y,
      right: x + width,
      bottom: y + height,
      left: x
    }
    if (typeof scale === 'number') {
      bounds.top = scale * bounds.top
      bounds.right = scale * bounds.right
      bounds.bottom = scale * bounds.bottom
      bounds.left = scale * bounds.left
    }
    // const bounds = this.camerabox.getBounds()
    return bounds
  }

  updateCamerabox (): void {
    const { position } = this.player.hitbox
    const { offset: { x, y } } = Game.options.camerabox
    this.camerabox.position = {
      x: position.x + x,
      y: position.y + y
    }
  }

  getViewportBounds (scale: number): IBoundsData {
    // const { tilePosition: { x, y }, width, height } = this.background
    const { viewWidth, viewHeight } = this
    const { pivot: { x, y } } = this
    const bounds = {
      top: y,
      right: x + viewWidth,
      bottom: y + viewHeight,
      left: x
    }
    if (typeof scale === 'number') {
      bounds.top = scale * bounds.top
      bounds.right = scale * bounds.right
      bounds.bottom = scale * bounds.bottom
      bounds.left = scale * bounds.left
    }
    return bounds
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
    // const cameraboxBounds = this.getCameraboxBounds(this.scale.x)
    const cameraboxBounds = this.getCameraboxBounds()
    // const cameraboxBounds = this.getLocalBounds(this.camerabox.getLocalBounds())
    // this.background.tilePosition.x = -this.player.x
    // this.background.tilePosition.y = -this.player.y

    // if (player.velocity.vy < 0) {
    //   this.shouldPanCameraDown(cameraboxBounds)
    // } else if (player.velocity.vy > 0) {
    //   this.shouldPanCameraUp(cameraboxBounds)
    // }
    // const { scale } = Game.options
    const viewportBounds = this.getViewportBounds(1 / Game.options.scale)
    // if (cameraboxBounds.bottom > viewportBounds.bottom) {
    //   console.log(`vb-top=${viewportBounds.top} vb-bottom=${viewportBounds.bottom}`)
    //   console.log(`Before pivot.y=${this.pivot.y}`)
    //   this.pivot.y += (cameraboxBounds.bottom - viewportBounds.bottom) / scale
    //   console.log(`After pivot.y=${this.pivot.y}`)
    // } else if (cameraboxBounds.top < viewportBounds.top) {
    //   this.pivot.y -= (viewportBounds.top - cameraboxBounds.top) / scale
    // }
    // if (cameraboxBounds.right > viewportBounds.right) {
    //   this.pivot.x += (cameraboxBounds.right - viewportBounds.right) / scale
    // } else if (cameraboxBounds.left < viewportBounds.left) {
    //   this.pivot.x -= (viewportBounds.left - cameraboxBounds.left) / scale
    // }
    logViewportBounds.ifChanged(viewportBounds.top, viewportBounds.right, viewportBounds.bottom, viewportBounds.left)
    // logCameraboxBounds.ifChanged(cameraboxBounds.top, cameraboxBounds.right, cameraboxBounds.bottom, cameraboxBounds.left)
    // this.pivot.x = player.x
    this.pivot.y = this.camerabox.y - this.camerabox.height
    if (cameraboxBounds.bottom > viewportBounds.bottom) {
      // this.pivot.y += (cameraboxBounds.bottom - viewportBounds.bottom) / Game.options.scale
      //   console.log(`vb-top=${viewportBounds.top} vb-bottom=${viewportBounds.bottom}`)
      //   console.log(`Before pivot.y=${this.pivot.y}`)
      //   this.pivot.y += (cameraboxBounds.bottom - viewportBounds.bottom) / scale
      //   console.log(`After pivot.y=${this.pivot.y}`)
      // } else if (cameraboxBounds.top < viewportBounds.top) {
      //   this.pivot.y -= (viewportBounds.top - cameraboxBounds.top) / scale
      // }
    }
  }

  shouldPanCameraUp (cameraboxBounds: IBoundsData): void {
    // const { player, camerabox, background, viewHeight } = this

    // const { scale } = Game.options
    // // const scaledCanvasHeight = this.height / Game.options.scale
    // // if (
    // //   cameraboxBounds.bottom + player.velocity.vy * scale >=
    // //   viewHeight
    // // ) { return }

    // if (
    //   cameraboxBounds.bottom >=
    //   Math.abs(background.tilePosition.y) + viewHeight
    // ) {
    //   background.tilePosition.y -= player.velocity.vy * scale
    // }
  }

  shouldPanCameraDown (cameraboxBounds: IBoundsData): void {
    // const { player, camerabox, background } = this
    // if (camerabox.position.y + player.velocity.vy <= 0) return

    // if (camerabox.position.y <= Math.abs(background.tilePosition.y)) {
    //   background.position.y -= player.velocity.vy
    // }
  }

  initLevel ({ levelSettings }: IGameOptions): void {
    const cell = 16
    const floorCollisionPoints = MapSettings.mapTileToPositions({
      mapSettings: levelSettings,
      layerName: 'FloorCollisions',
      tileIds: [202],
      tilesPerRow: 36,
      cell
    })

    floorCollisionPoints.forEach(cp => {
      this.floorCollisionBlocks.addChild(new CollisionBlock({
        initX: cp.x,
        initY: cp.y,
        initWidth: cell,
        initHeight: cell
      }))
    })

    const platformCollisionPoints = MapSettings.mapTileToPositions({
      mapSettings: levelSettings,
      layerName: 'PlatformCollisions',
      tileIds: [202],
      tilesPerRow: 36,
      cell
    })

    platformCollisionPoints.forEach(cp => {
      this.platformCollisionBlocks.addChild(new CollisionBlock({
        initX: cp.x,
        initY: cp.y,
        initWidth: cell,
        initHeight: cell / 2
      }))
    })

    this.player.restart()
  }
}

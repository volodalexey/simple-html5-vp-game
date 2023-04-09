import { type Application, Container } from 'pixi.js'
import { type IScene } from './SceneManager'
import { Game, type IGameOptions } from './Game'
import { type IMapSettings } from './MapSettings'

interface IMainSceneOptions {
  app: Application
  viewWidth: number
  viewHeight: number
  levelSettings: IMapSettings
  textures: IGameOptions['textures']
}

export class MainScene extends Container implements IScene {
  public gravity = 0.7
  public gameEnded = false

  public game!: Game

  constructor (options: IMainSceneOptions) {
    super()

    this.setup(options)
  }

  setup ({ viewWidth, viewHeight, textures, levelSettings }: IMainSceneOptions): void {
    const game = new Game({
      viewWidth,
      viewHeight,
      textures,
      levelSettings
    })
    this.addChild(game)
    this.game = game
  }

  handleResize (options: {
    viewWidth: number
    viewHeight: number
  }): void {
    this.game.handleResize(options)
  }

  handleUpdate (deltaMS: number): void {
    this.game.handleUpdate(deltaMS)
  }
}

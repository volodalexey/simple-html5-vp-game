import { AnimatedSprite, Container, Graphics, type Texture } from 'pixi.js'
import {
  IdleLeft, IdleRight,
  RunLeft, RunRight,
  JumpLeft, JumpRight,
  FallLeft, FallRight,
  type PlayerState, EPlayerState
} from './PlayerState'
import { type Game } from './Game'
import { logPlayerBounds, logPlayerState } from './logger'
import { type CollisionBlock } from './CollisionBlock'

export interface IPlayerOptions {
  game: Game
  textures: {
    idleLeftTextures: Texture[]
    idleRightTextures: Texture[]
    jumpLeftTextures: Texture[]
    jumpRightTextures: Texture[]
    fallLeftTextures: Texture[]
    fallRightTextures: Texture[]
    runLeftTextures: Texture[]
    runRightTextures: Texture[]
  }
}

export enum PlayerAnimation {
  idleLeft = 'idleLeft',
  idleRight = 'idleRight',
  runLeft = 'runLeft',
  runRight = 'runRight',
  jumpLeft = 'jumpLeft',
  jumpRight = 'jumpRight',
  fallLeft = 'fallLeft',
  fallRight = 'fallRight',
}

export class Player extends Container {
  public velocity = {
    vx: 0,
    vy: 0
  }

  public hitbox = {
    position: {
      x: 0,
      y: 0
    },
    offset: {
      x: 0,
      y: 10
    },
    width: 17,
    height: 30
  }

  static options = {
    scale: 0.5,
    moveSpeed: 2,
    jumpSpeed: 4,
    gravity: 0.1,
    idleAnimationSpeed: 0.2,
    jumpFallAnimationSpeed: 0.2,
    runAnimationSpeed: 0.2
  }

  public game!: Game
  public states!: Record<EPlayerState, PlayerState>
  public currentState!: PlayerState
  idleLeftAnimation!: AnimatedSprite
  idleRightAnimation!: AnimatedSprite
  runLeftAnimation!: AnimatedSprite
  runRightAnimation!: AnimatedSprite
  jumpLeftAnimation!: AnimatedSprite
  jumpRightAnimation!: AnimatedSprite
  fallLeftAnimation!: AnimatedSprite
  fallRightAnimation!: AnimatedSprite
  public currentAnimation!: AnimatedSprite
  spritesContainer!: Container<AnimatedSprite>
  public playerBox!: Graphics
  public groundBlock?: CollisionBlock

  constructor (options: IPlayerOptions) {
    super()
    this.game = options.game
    this.setup(options)
    this.updateHitbox()
    if (logPlayerBounds.enabled) {
      const graphics = new Graphics()
      graphics.beginFill(0xff00ff)
      graphics.drawRect(0, 0, this.width, this.height)
      graphics.endFill()
      graphics.alpha = 0.5
      this.addChild(graphics)

      const hitboxGraphics = new Graphics()
      hitboxGraphics.beginFill(0x00ffff)
      hitboxGraphics.drawRect(this.hitbox.position.x, this.hitbox.position.y, this.hitbox.width, this.hitbox.height)
      hitboxGraphics.endFill()
      hitboxGraphics.alpha = 0.5
      this.addChild(hitboxGraphics)
    }

    this.states = {
      [EPlayerState.idleLeft]: new IdleLeft({ game: options.game }),
      [EPlayerState.idleRight]: new IdleRight({ game: options.game }),
      [EPlayerState.runLeft]: new RunLeft({ game: options.game }),
      [EPlayerState.runRight]: new RunRight({ game: options.game }),
      [EPlayerState.jumpLeft]: new JumpLeft({ game: options.game }),
      [EPlayerState.jumpRight]: new JumpRight({ game: options.game }),
      [EPlayerState.fallLeft]: new FallLeft({ game: options.game }),
      [EPlayerState.fallRight]: new FallRight({ game: options.game })
    }
  }

  setup ({
    textures: {
      idleLeftTextures,
      idleRightTextures,
      runLeftTextures,
      runRightTextures,
      jumpLeftTextures,
      jumpRightTextures,
      fallLeftTextures,
      fallRightTextures
    }
  }: IPlayerOptions): void {
    const { idleAnimationSpeed, jumpFallAnimationSpeed, runAnimationSpeed } = Player.options
    const playerBox = new Graphics()
    this.addChild(playerBox)
    this.playerBox = playerBox

    const spritesContainer = new Container<AnimatedSprite>()
    this.addChild(spritesContainer)
    this.spritesContainer = spritesContainer

    const idleLeftAnimation = new AnimatedSprite(idleLeftTextures)
    spritesContainer.addChild(idleLeftAnimation)
    this.idleLeftAnimation = idleLeftAnimation

    const idleRightAnimation = new AnimatedSprite(idleRightTextures)
    spritesContainer.addChild(idleRightAnimation)
    this.idleRightAnimation = idleRightAnimation

    idleLeftAnimation.animationSpeed = idleRightAnimation.animationSpeed = idleAnimationSpeed

    const runLeftAnimation = new AnimatedSprite(runLeftTextures)
    spritesContainer.addChild(runLeftAnimation)
    this.runLeftAnimation = runLeftAnimation

    const runRightAnimation = new AnimatedSprite(runRightTextures)
    spritesContainer.addChild(runRightAnimation)
    this.runRightAnimation = runRightAnimation

    runLeftAnimation.animationSpeed = runRightAnimation.animationSpeed = runAnimationSpeed

    const jumpLeftAnimation = new AnimatedSprite(jumpLeftTextures)
    spritesContainer.addChild(jumpLeftAnimation)
    this.jumpLeftAnimation = jumpLeftAnimation

    const jumpRightAnimation = new AnimatedSprite(jumpRightTextures)
    spritesContainer.addChild(jumpRightAnimation)
    this.jumpRightAnimation = jumpRightAnimation

    const fallLeftAnimation = new AnimatedSprite(fallLeftTextures)
    spritesContainer.addChild(fallLeftAnimation)
    this.fallLeftAnimation = fallLeftAnimation

    const fallRightAnimation = new AnimatedSprite(fallRightTextures)
    spritesContainer.addChild(fallRightAnimation)
    this.fallRightAnimation = fallRightAnimation

    jumpLeftAnimation.animationSpeed = jumpRightAnimation.animationSpeed =
    fallLeftAnimation.animationSpeed = fallRightAnimation.animationSpeed = jumpFallAnimationSpeed

    spritesContainer.scale.set(Player.options.scale)
  }

  hideAllAnimations (): void {
    this.spritesContainer.children.forEach(spr => {
      spr.visible = false
    })
  }

  switchAnimation (animation: PlayerAnimation): void {
    let newAnimation
    switch (animation) {
      case PlayerAnimation.idleLeft:
        newAnimation = this.idleLeftAnimation
        break
      case PlayerAnimation.idleRight:
        newAnimation = this.idleRightAnimation
        break
      case PlayerAnimation.runLeft:
        newAnimation = this.runLeftAnimation
        break
      case PlayerAnimation.runRight:
        newAnimation = this.runRightAnimation
        break
      case PlayerAnimation.jumpLeft:
        newAnimation = this.jumpLeftAnimation
        break
      case PlayerAnimation.jumpRight:
        newAnimation = this.jumpRightAnimation
        break
      case PlayerAnimation.fallLeft:
        newAnimation = this.fallLeftAnimation
        break
      case PlayerAnimation.fallRight:
        newAnimation = this.fallRightAnimation
        break
    }
    if (newAnimation === this.currentAnimation) {
      return
    }
    this.currentAnimation = newAnimation
    this.hideAllAnimations()
    this.currentAnimation.gotoAndPlay(0)
    this.currentAnimation.visible = true
  }

  setState (state: EPlayerState): void {
    this.currentState = this.states[state]
    this.currentState.enter()
    logPlayerState(`state=${state}`)
  }

  jump (): void {
    this.velocity.vy = -Player.options.jumpSpeed
  }

  isOnGround (): boolean {
    return Boolean(this.groundBlock)
  }

  isFalling (): boolean {
    return this.velocity.vy > Player.options.gravity
  }

  stop (): void {
    this.velocity.vx = 0
    this.velocity.vy = 0
  }

  handleUpdate (deltaMS: number): void {
    const { inputHandler } = this.game

    this.currentState.handleInput()
    if (inputHandler.hasDirectionLeft()) {
      this.velocity.vx = -Player.options.moveSpeed
    } else if (inputHandler.hasDirectionRight()) {
      this.velocity.vx = Player.options.moveSpeed
    } else {
      this.velocity.vx = 0
    }

    const horizontalBlock = this.checkForHorizontalCollisions()
    if (horizontalBlock == null) {
      this.x += this.velocity.vx
    }

    this.groundBlock = this.checkForVerticalCollisions()
    if (this.groundBlock == null) {
      this.applyGravity()
    }
  }

  restart (): void {
    this.velocity.vx = 0
    this.velocity.vy = 0
    this.setPosition({ x: 100, y: 50 })
    this.setState(EPlayerState.idleRight)
  }

  checkForHorizontalCollisions (): CollisionBlock | undefined {
    const playerBounds = this.getHitboxBounds({ addXVelocity: true })

    return this.game.floorCollisionBlocks.children.find(collisionBlock => {
      const blockBounds = collisionBlock.getRectBounds()
      if (
        playerBounds.left <= blockBounds.right &&
        playerBounds.right >= blockBounds.left &&
        playerBounds.bottom > blockBounds.top &&
        playerBounds.top < blockBounds.bottom
      ) {
        if (this.velocity.vx < 0) {
          this.velocity.vx = 0
          this.setPosition({ x: blockBounds.right })
          return true
        }

        if (this.velocity.vx > 0) {
          this.velocity.vx = 0
          this.setPosition({ x: blockBounds.left - this.hitbox.width })
          return true
        }
      }
      return false
    })
  }

  checkForVerticalCollisions (): CollisionBlock | undefined {
    // const { gravity } = Player.options
    const playerBounds = this.getHitboxBounds()
    const nextPlayerBottom = playerBounds.bottom + this.velocity.vy
    let groundBlock = this.game.floorCollisionBlocks.children.find(collisionBlock => {
      const blockBounds = collisionBlock.getRectBounds()
      const collideByX = playerBounds.left <= blockBounds.right && playerBounds.right >= blockBounds.left
      if (!collideByX) {
        return false
      }
      if (
        playerBounds.bottom <= blockBounds.top && nextPlayerBottom > blockBounds.top
      ) {
        this.velocity.vy = 0
        this.groundBlock = collisionBlock
        this.setPosition({ y: blockBounds.top - this.hitbox.height })
        return true
      }

      return false
    })

    if (groundBlock != null) {
      return groundBlock
    }

    groundBlock = this.game.platformCollisionBlocks.children.find(collisionBlock => {
      const blockBounds = collisionBlock.getRectBounds()

      const collideByX = playerBounds.left <= blockBounds.right && playerBounds.right >= blockBounds.left
      if (!collideByX) {
        return false
      }
      if (playerBounds.bottom <= blockBounds.top && nextPlayerBottom > blockBounds.top) {
        this.velocity.vy = 0
        this.groundBlock = collisionBlock
        this.setPosition({ y: blockBounds.top - this.hitbox.height })
        return true
      }
      return false
    })

    return groundBlock
  }

  applyGravity (): void {
    this.position.y += this.velocity.vy
    this.velocity.vy += Player.options.gravity
    // this.velocity.vy = Number(this.velocity.vy.toFixed(2))
  }

  updateHitbox (): void {
    const { position, offset, width, height } = this.hitbox
    position.x = this.position.x + (this.width - width) / 2 + offset.x
    position.y = this.position.y + (this.height - height) / 2 + offset.y
  }

  setPosition ({ x, y }: { x?: number, y?: number }): void {
    this.updateHitbox()
    if (x != null) {
      this.position.x = x + (this.position.x - this.hitbox.position.x)
    }
    if (y != null) {
      this.position.y = y + (this.position.y - this.hitbox.position.y)
    }
  }

  getHitboxBounds ({ addXVelocity = false, addYVelocity = false } = {}): {
    top: number
    right: number
    bottom: number
    left: number
  } {
    this.updateHitbox()
    const bounds = {
      top: this.hitbox.position.y,
      right: this.hitbox.position.x + this.hitbox.width,
      bottom: this.hitbox.position.y + this.hitbox.height,
      left: this.hitbox.position.x
    }
    if (addXVelocity) {
      bounds.left += this.velocity.vx
      bounds.right += this.velocity.vx
    }
    if (addYVelocity) {
      bounds.top += this.velocity.vy
      bounds.bottom += this.velocity.vy
    }
    return bounds
  }
}

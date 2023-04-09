import './styles.css'
import { SceneManager } from './SceneManager'
import { MainScene } from './MainScene'
import { LoaderScene } from './LoaderScene'

async function run (): Promise<void> {
  const ellipsis: HTMLElement | null = document.querySelector('.ellipsis')
  if (ellipsis != null) {
    ellipsis.style.display = 'none'
  }
  await SceneManager.initialize()
  const loaderScene = new LoaderScene({
    viewWidth: SceneManager.width,
    viewHeight: SceneManager.height
  })
  await SceneManager.changeScene(loaderScene)
  await loaderScene.initializeLoader()
  const { levelBackground, levelSettings, spritesheet: { animations } } = loaderScene.getAssets()
  await SceneManager.changeScene(new MainScene({
    app: SceneManager.app,
    viewWidth: SceneManager.width,
    viewHeight: SceneManager.height,
    levelSettings,
    textures: {
      levelBackgroundTexture: levelBackground,
      warriorTextures: {
        idleLeftTextures: animations['Warrior-Idle-Left'],
        idleRightTextures: animations['Warrior-Idle-Right'],
        jumpLeftTextures: animations['Warrior-Jump-Left'],
        jumpRightTextures: animations['Warrior-Jump-Right'],
        fallLeftTextures: animations['Warrior-Fall-Left'],
        fallRightTextures: animations['Warrior-Fall-Right'],
        runLeftTextures: animations['Warrior-Run-Left'],
        runRightTextures: animations['Warrior-Run-Right']
      }
    }
  }))
}

run().catch((err) => {
  console.error(err)
  const errorMessageDiv: HTMLElement | null = document.querySelector('.error-message')
  if (errorMessageDiv != null) {
    errorMessageDiv.classList.remove('hidden')
    errorMessageDiv.innerText = ((Boolean(err)) && (Boolean(err.message))) ? err.message : err
  }
  const errorStackDiv: HTMLElement | null = document.querySelector('.error-stack')
  if (errorStackDiv != null) {
    errorStackDiv.classList.remove('hidden')
    errorStackDiv.innerText = ((Boolean(err)) && (Boolean(err.stack))) ? err.stack : ''
  }
  const canvas: HTMLCanvasElement | null = document.querySelector('canvas')
  if (canvas != null) {
    canvas.parentElement?.removeChild(canvas)
  }
})

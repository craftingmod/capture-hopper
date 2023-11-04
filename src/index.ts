import fs from "node:fs/promises"
import { defaultConfig } from "./config.js"
import { getPicturesFolder } from "platform-folders"
import { openApp } from "open"
import Path from "node:path"
import { NotiAction, notify } from "./notify.js"
import { makeTitle, wrapPath } from "./util.js"
import Debug from "debug"
import chalk from "chalk"
import { enLang, koLang } from "./lang/lang.js"

const debug = Debug("capture-hopper:main")
const country = Intl.DateTimeFormat().resolvedOptions().locale
const translation = (country.indexOf("KR") >= 0) ? koLang : enLang

// 설정 읽기
const configPath = Path.resolve(".", "config.json")
let config = { ...defaultConfig }
try {
  const configString = await fs.readFile(configPath, { encoding: "utf8" })
  config = {
    ...config,
    ...JSON.parse(configString),
  }
  await fs.writeFile(configPath, JSON.stringify(config, null, 2))
} catch (err) {
  await fs.writeFile(configPath, JSON.stringify(config, null, 2))
}

// 스크린샷 폴더 확인
if (config.capturePath === "") {
  // Windows 기본 캡쳐 폴더
  config.capturePath = Path.resolve(getPicturesFolder(), "Screenshots")
}
try {
  config.capturePath = Path.resolve(config.capturePath)
  await fs.access(config.capturePath, fs.constants.R_OK)
} catch (err) {
  const notiResp = await notify({
    title: makeTitle(translation.titleNoDir),
    message: translation.messageNoDir.replace("%s", config.capturePath),
    sound: true,
    wait: true,
  })
  if (notiResp === NotiAction.CLICKED) {
    await openApp(configPath, { wait: true })
  }
  process.exit(-1)
}

// 출력 형식 확인
if (config.movePattern === "") {
  const notiResp = await notify({
    title: makeTitle(translation.titleOutputType),
    message: translation.messageOutputType.replace("%s", configPath),
    sound: true,
    wait: true,
  })
  if (notiResp === NotiAction.CLICKED) {
    await openApp(configPath, { wait: true })
  }
  process.exit(0) // return 대신
}

/**
 * 파일 하나를 적당한 위치의 디렉토리로 옮깁니다.
 * @returns 변경 사항이 있으면 `true`, 없으면 `false`
 */
async function processFile(filePath: string) {
  const fileStats = await fs.stat(filePath)
  const file = {
    name: Path.basename(filePath),
    path: Path.dirname(filePath),
  }
  const destPath = wrapPath(config.movePattern, fileStats, file, "png")
  try {
    await fs.access(Path.dirname(destPath), fs.constants.R_OK)
  } catch (err3) {
    await fs.mkdir(Path.dirname(destPath), { recursive: true })
  }
  try {
    await fs.access(destPath, fs.constants.R_OK)
    return {
      success: false,
      path: filePath,
    }
  } catch (err2) {
    await fs.access(Path.dirname(destPath), fs.constants.W_OK)
    if (!config.removeOrginal) {
      await fs.copyFile(filePath, destPath)
    } else {
      await fs.rename(filePath, destPath)
    }
    return {
      success: true,
      path: destPath,
    }
  }
}

/**
 * 기존 디렉토리에 있는 파일 옮기기
 */
try {
  debug(`경로: ${chalk.green(config.capturePath)}`)
  const captureFiles = (await fs.readdir(Path.resolve(config.capturePath), { withFileTypes: true })).filter((v) => v.name.endsWith(".png"))
  // 파일들 옮기기
  let filesMoved = 0
  let filesIndex = 0
  while (filesIndex < captureFiles.length) {
    const targetFile = captureFiles[filesIndex]
    // 소스 파일 경로
    const filePath = Path.resolve(targetFile.path, targetFile.name)
    debug(`(${chalk.yellow((filesIndex + 1))}/${chalk.red(captureFiles.length)}) ${chalk.green(filePath)} 처리 중`)
    // 처리
    const isMoved = (await processFile(filePath)).success
    if (isMoved) {
      filesMoved += 1
    }
    filesIndex += 1
  }
  // 옮긴 파일이 있으면
  if (filesMoved > 0) {
    await notify({
      title: makeTitle(translation.titleBatchMove),
      message: translation.messageBatchMove.replace("%s", filesMoved.toString()),
      sound: true,
    })
  }
} catch (err) {
  await notify({
    title: makeTitle(translation.titleError),
    message: translation.messageError.replace("%s", String(err)),
    sound: true,
  })
  console.error(err)
}

// 변경 사항 감지
async function runDaemon() {
  try {
    const watcher = fs.watch(config.capturePath)
    let lastWatched = -1n
    for await (const event of watcher) {
      if (event.eventType !== "rename" || event.filename == null || !event.filename.endsWith(".png")) {
        continue
      }
      try {
        const filePath = Path.resolve(config.capturePath, event.filename)
        const fileStat = await fs.stat(filePath, { bigint: true })
        if (fileStat.birthtimeMs >= lastWatched) {
          debug(`파일 변경: ${chalk.green(filePath)}`)
          lastWatched = fileStat.birthtimeMs
          const processResult = await processFile(filePath)
          if (config.moveNotification && processResult.success) {
            notify({
              title: makeTitle(translation.titleSingleMove),
              message: translation.messageSingleMove.replace("%s", event.filename),
              sound: true,
              wait: true,
            }).then((action) => {
              if (action === NotiAction.CLICKED) {
                openApp(processResult.path)
              }
            })
          }
        }
      } catch (err) {
        console.error(err)
      }
    }
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return
    }
    throw err
  }
}

runDaemon()

import { Stats } from "node:fs"
import Path from "node:path"

function padNumber(num: number | string, size: number) {
  return num.toString().padStart(size, "0")
}

export function wrapPath(path: string, fileStats: Stats, filePath: { path: string, name: string }, extension: string) {
  let createdDate = new Date()
  if (fileStats.mtimeMs < fileStats.ctimeMs) {
    createdDate = fileStats.mtime
  } else {
    createdDate = fileStats.ctime
  }
  let outputPath = path

  const wrapDateMap = {
    "{year2}": createdDate.getFullYear() % 100,
    "{year}": createdDate.getFullYear(),
    "{month}": createdDate.getMonth() + 1,
    "{day}": createdDate.getDate(),
    "{hours}": createdDate.getHours(),
    "{minutes}": createdDate.getMinutes(),
    "{seconds}": createdDate.getSeconds(),
  }
  for (const [key, value] of Object.entries(wrapDateMap)) {
    outputPath = outputPath.replaceAll(key, padNumber(value, 2))
  }

  const wrapStringMap = {
    "{orgdir}": filePath.path,
    "{namecode}": cyrb53(filePath.name, 3512).toString(16),
  }
  for (const [key, value] of Object.entries(wrapStringMap)) {
    outputPath = outputPath.replaceAll(key, value)
  }

  if (!outputPath.endsWith(`.${extension}`)) {
    outputPath += `.${extension}`
  }
  return Path.resolve(outputPath)
}

export function makeTitle(title: string) {
  return `[CaptureHopper] ${title}`
}

export async function sleep(ms: number) {
  return new Promise<void>((res) => {
    setTimeout(() => {
      res()
    }, ms)
  })
}

const cyrb53 = (str: string, seed = 0) => {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};
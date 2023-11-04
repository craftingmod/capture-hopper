import { Stats } from "node:fs"

function padNumber(num: number | string, size: number) {
  return num.toString().padStart(size, "0")
}

export function wrapPath(path: string, fileStats: Stats, filePath: { path: string, name: string }, extension: string) {
  const createdDate = fileStats.birthtime

  const wrapMap = {
    "{year2}": createdDate.getFullYear() % 100,
    "{year}": createdDate.getFullYear(),
    "{month}": createdDate.getMonth() + 1,
    "{day}": createdDate.getDate(),
    "{hours}": createdDate.getHours(),
    "{minutes}": createdDate.getMinutes(),
    "{seconds}": createdDate.getSeconds(),
  }
  let outputPath = path
  for (const [key, value] of Object.entries(wrapMap)) {
    outputPath = outputPath.replaceAll(key, padNumber(value, 2))
  }
  if (!outputPath.endsWith(`.${extension}`)) {
    outputPath += `.${extension}`
  }
  return outputPath
}

export function makeTitle(title: string) {
  return `[CaptureHopper] ${title}`
}
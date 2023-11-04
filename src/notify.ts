import Notifier from "node-notifier"
import Path from "node:path"

export enum NotiAction {
  CLICKED = "clicked",
  DISMISSED = "dismissed",
  NONE = "none",
  UNKNOWN = "",
}

export const notify = (notification: Notifier.Notification & { sound?: boolean, wait?: boolean }) => new Promise<NotiAction>((res, rej) => {
  const timeout = setTimeout(() => rej(new Error("Timeout!")), 60000)
  Notifier.notify({
    icon: Path.resolve("./icon_default.png"),
    ...notification,
  }, (err, response, metadata) => { // err, response, metadata
    const action = (metadata as { action: string } | undefined)?.action ?? ""
    if (notification.wait !== true) {
      res(NotiAction.NONE)
      return
    }
    clearTimeout(timeout)
    if (err != null) {
      rej(err)
      return
    }
    console.log(action)
    switch (action) {
      case NotiAction.CLICKED:
        res(NotiAction.CLICKED)
        break
      case NotiAction.DISMISSED:
        res(NotiAction.DISMISSED)
        break
      default:
        res(NotiAction.UNKNOWN)
    }
  })
  if (notification.wait !== true) {
    clearTimeout(timeout)
    res(NotiAction.NONE)
  }
})
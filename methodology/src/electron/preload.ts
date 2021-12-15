import { shell } from 'electron'

function openUrl(url: string) {
  shell.openExternal(url)
}

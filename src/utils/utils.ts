// 校验url
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}

export const copyText = (text: string): void => {
  if (!text) {
    return
  }
  let textArea = document.createElement("textarea")
  textArea.value = text
  // 使text area不在viewport，同时设置不可见
  textArea.style.position = "absolute"
  textArea.style.left = "-999999px"
  textArea.style.top = "-999999px"
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()
  document.execCommand("copy")
  textArea.remove()
}
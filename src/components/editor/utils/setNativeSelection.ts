export function setNativeSelection (key: string): void {
  const node = document.querySelectorAll(`[data-offset-key="${key}-0-0"]`)[0]
  // set the native selection to the node so the caret is not in the text and
  // the selectionState matches the native selection
  const selection = window.getSelection()
  const range = document.createRange()
  range.setStart(node, 0)
  range.setEnd(node, 0)
  selection.removeAllRanges()
  selection.addRange(range)
}
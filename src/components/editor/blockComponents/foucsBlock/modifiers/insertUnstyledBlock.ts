import {
  EditorState,
  ContentBlock,
  genKey as generateRandomKey,
  ContentState,
  SelectionState,
} from "draft-js";

export function insertUnstyledBlock (
  editorState: EditorState,
  afterCurrentBlock: boolean = false
): EditorState {
  const contentState = editorState.getCurrentContent()
  const selectionState = editorState.getSelection()
  const currentKey = selectionState.getStartKey()
  const newKey = generateRandomKey()
  const newBlock = new ContentBlock({ key: newKey, type: 'unstyled' })
  const blockMap = contentState.getBlockMap()
  const array: ContentBlock[] = []
  blockMap.forEach((block, key) => {
    if (key === currentKey) {
      if (afterCurrentBlock) {
        array.push(block as ContentBlock)
        array.push(newBlock)
      } else {
        array.push(newBlock)
        array.push(block as ContentBlock)
      }
    } else {
      array.push(block as ContentBlock)
    }
  })
  const newContentState = ContentState.createFromBlockArray(array)
  const newSelectionState = new SelectionState({
    anchorKey: newKey,
    anchorOffset: 0,
    focusKey: newKey,
    focusOffset: 0,
    isBackward: false,
    hasFocus: true
  })
  return EditorState.forceSelection(
    EditorState.push(editorState, newContentState, 'insert-fragment'),
    newSelectionState as SelectionState
  )
}
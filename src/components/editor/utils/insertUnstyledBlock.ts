import {
  EditorState,
  ContentBlock,
  ContentState,
  SelectionState,
} from "draft-js";

export function insertUnstyledBlock (
  editorState: EditorState,
  newBlock: ContentBlock,
  newSelectionState: SelectionState,
  afterCurrentBlock: boolean = false,
  modifiedBlock?: ContentBlock,
): EditorState {
  const contentState = editorState.getCurrentContent()
  const selectionState = editorState.getSelection()
  const currentKey = selectionState.getStartKey()
  const blockMap = contentState.getBlockMap()
  const array: ContentBlock[] = []
  blockMap.forEach((block, key) => {
    if (key === currentKey) {
      if (afterCurrentBlock) {
        array.push(modifiedBlock || block as ContentBlock)
        array.push(newBlock)
      } else {
        array.push(newBlock)
        array.push(modifiedBlock || block as ContentBlock)
      }
    } else {
      array.push(block as ContentBlock)
    }
  })
  const newContentState = ContentState.createFromBlockArray(array)
  return EditorState.forceSelection(
    EditorState.push(editorState, newContentState, 'insert-fragment'),
    newSelectionState as SelectionState
  )
}
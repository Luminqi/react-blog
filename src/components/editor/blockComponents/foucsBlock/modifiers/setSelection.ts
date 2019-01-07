import {
  EditorState,
  SelectionState
} from 'draft-js'

export function setSelection (editorState: EditorState, direction: string): EditorState {
  const contentState = editorState.getCurrentContent()
  const selectionState = editorState.getSelection()
  const key = selectionState.getStartKey()
  console.log('setSelection: ', key)
  const newSelectedBlock = direction === 'up' || direction === 'left'
    ? contentState.getBlockBefore(key)
    : contentState.getBlockAfter(key) 
  if (!newSelectedBlock) return editorState
  const newKey = newSelectedBlock.getKey()
  if (newKey === key) return editorState
  console.log(newSelectedBlock)
  const newOffset = newSelectedBlock.getLength()
  const newSelectionState = new SelectionState({
    anchorKey: newKey,
    anchorOffset: newOffset,
    focusKey: newKey,
    focusOffset: newOffset,
    isBackward: false,
    hasFocus: true
  })
  return EditorState.forceSelection(
    editorState,
    newSelectionState
  )
} 
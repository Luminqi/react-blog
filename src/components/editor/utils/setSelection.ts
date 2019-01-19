import {
  EditorState,
  SelectionState,
  ContentState
} from 'draft-js'
import { setNativeSelection } from './setNativeSelection';

function findAccessibleBlock (contentState: ContentState, blockKey: string, direction: 'up' | 'down') {
  let currentKey = blockKey
  do {
    const adjacentBlock = direction === 'up'
      ? contentState.getBlockBefore(currentKey)
      : contentState.getBlockAfter(currentKey)
    if (!adjacentBlock) return null
    const adjacentType = adjacentBlock.getType() as string
    if (adjacentType === 'caption-block' || adjacentType === 'section') {
      currentKey = adjacentBlock.getKey()
      continue
    }
    return adjacentBlock
  } while (true)
}

export function setSelection (editorState: EditorState, direction: string): EditorState {
  const contentState = editorState.getCurrentContent()
  const selectionState = editorState.getSelection()
  const key = selectionState.getStartKey()
  const newSelectedBlock = direction === 'up' || direction === 'left'
    ? findAccessibleBlock(contentState, key, 'up')
    : findAccessibleBlock(contentState, key, 'down')
  if (!newSelectedBlock) return editorState
  const newKey = newSelectedBlock.getKey()
  if (newKey === key) return editorState
  const newType = newSelectedBlock.getType() as string
  if (newType === 'image-block' || newType === 'video-block') {
    setNativeSelection(newKey)
  }
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
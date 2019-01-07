import {
  EditorState,
  SelectionState,
  Modifier
} from 'draft-js'

export function removeBlock (editorState: EditorState, blockKey: string): EditorState {
  const contentState = editorState.getCurrentContent()
  const selectionState = editorState.getSelection()
  const previousKey = contentState.getKeyBefore(blockKey)
  const previousBlock = contentState.getBlockForKey(previousKey)
  if (!previousBlock) {
    const newSelectionState = selectionState.set('anchorOffset', 0) as SelectionState
    const newContentState = Modifier.setBlockType(contentState, newSelectionState, 'unstyled')
    const finalContentState = Modifier.replaceText(newContentState, newSelectionState, '')
    const finalSelectionState = new SelectionState({
      anchorKey: blockKey,
      anchorOffset: 0,
      focusKey: blockKey,
      focusOffset: 0,
      isBackward: false,
      hasFocus: true
    })
    return EditorState.forceSelection(
      EditorState.push(editorState, finalContentState, 'change-block-type'),
      finalSelectionState
    )
  }
  const targetRange = new SelectionState({
    anchorKey: previousKey,
    anchorOffset: previousBlock.getLength(),
    focusKey: blockKey,
    focusOffset: selectionState.getFocusOffset()
  })
  const newContentState = Modifier.removeRange(contentState, targetRange, 'backward')
  const newSelectionState = new SelectionState({
    anchorKey: previousKey,
    anchorOffset: previousBlock.getLength(),
    focusKey: previousKey,
    focusOffset: previousBlock.getLength(),
    isBackward: false,
    hasFocus: true
  })
  return EditorState.forceSelection(
    EditorState.push(editorState, newContentState, 'remove-range'),
    newSelectionState
  )
}
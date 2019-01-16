import {
  EditorState,
  ContentState,
  SelectionState,
  Modifier,
  ContentBlock,
  genKey as generateRandomKey, 
} from 'draft-js'

export function removeBlock (editorState: EditorState, blockKey: string, lastBlockKey?: string): EditorState {
  const contentState = editorState.getCurrentContent()
  const endBlock = contentState.getBlockForKey(lastBlockKey || blockKey)
  const previousKey = contentState.getKeyBefore(blockKey)
  const previousBlock = contentState.getBlockForKey(previousKey)
  if (!previousBlock) {
    const blockMap = contentState.getBlockMap()
    const newKey = generateRandomKey()
    const newBlock = new ContentBlock({ key: newKey, type: 'unstyled'}) 
    const array: ContentBlock[] = [newBlock]
    const lastKey = lastBlockKey || blockKey
    let meetLast = false
    blockMap.forEach((block, key) => {
      if (key === lastKey) {
        meetLast = true
      } else {
        if (meetLast) {
          array.push(block as ContentBlock)
        }
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
      EditorState.push(editorState, newContentState, 'remove-range'),
      newSelectionState
    )
  }

  const targetRange = new SelectionState({
    anchorKey: previousKey,
    anchorOffset: previousBlock.getLength(),
    focusKey: lastBlockKey || blockKey,
    focusOffset: endBlock.getLength()
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
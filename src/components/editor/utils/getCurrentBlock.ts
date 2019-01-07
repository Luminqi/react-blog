import {
  EditorState,
  ContentBlock
} from 'draft-js'

export function getCurrentBlock (editorState: EditorState): ContentBlock {
  const contentState = editorState.getCurrentContent()
  const selectionState = editorState.getSelection()
  const key = selectionState.getStartKey()
  const block = contentState.getBlockForKey(key)
  return block
}
import { EditorState } from "draft-js";

export function caretAtEdge (editorState: EditorState, blockKey: string, direction: string): boolean {
  const selectionState = editorState.getSelection()
  switch (direction) {
    case 'up':
    case 'down': return true
    case 'left': return selectionState.getAnchorOffset() === 0
    case 'right': {
      const currentBlock = editorState.getCurrentContent().getBlockForKey(blockKey)
      return selectionState.getFocusOffset() === currentBlock.getLength()
    }
    default: return false
  }
}
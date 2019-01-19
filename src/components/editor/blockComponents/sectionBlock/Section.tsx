import React from 'react'
import {
  EditorState,
  ContentBlock,
  ContentState,
  SelectionState
} from 'draft-js'
import { caretAtEdge } from '../../utils/caretAtEdge'
import './Section.css'
import { setNativeSelection } from '../../utils/setNativeSelection';
import { setSelection } from '../../utils/setSelection';

interface Props {
  block: ContentBlock
  contentState: ContentState
}

export function Section ({ block } : Props) {
  return (
    <hr className="section-divider" />
  )
}

export function handleArrow (
  e: React.KeyboardEvent<HTMLSpanElement>,
  direction: string,
  editorState: EditorState,
  changeEditorState: (editorState: EditorState) => void
) {
  const contentState = editorState.getCurrentContent()
  const selectionState = editorState.getSelection()
  const key = selectionState.getStartKey()
  const adjacentBlock = direction === 'up' || direction === 'left'
    ? contentState.getBlockBefore(key)
   : contentState.getBlockAfter(key)
  if (
    adjacentBlock &&
    adjacentBlock.getType() as string === 'section' &&
    caretAtEdge(editorState, key, direction)
  ) {
    e.preventDefault()
    changeEditorState(setSelection(editorState, direction))
    return
  }
}
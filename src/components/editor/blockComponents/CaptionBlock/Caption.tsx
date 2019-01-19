import React, { useContext, useEffect } from 'react'
import {
  ContentBlock,
  ContentState,
  EditorBlock,
  EditorState,
  SelectionState,
  DraftHandleValue,
  genKey as generateRandomKey,
  Modifier
} from 'draft-js'
import { EditorContext } from '../../Editor'
import { FocusContext } from '../../Editor'
import { caretAtEdge } from '../../utils/caretAtEdge'
import { setNativeSelection } from '../../utils/setNativeSelection'
import { insertUnstyledBlock } from '../../utils/insertUnstyledBlock'
import { removeBlock } from '../../utils/removeBlock'
import './Caption.css'
import { setSelection } from '../../utils/setSelection';

interface Props {
  block: ContentBlock
  contentState: ContentState
}

export function Caption (props: Props) {
  const { block, contentState } = props
  const focusedBlockKey = useContext(FocusContext)
  const { updateInlineToolTip, updateAddButton } = useContext(EditorContext)!
  const captionKey = block.getKey()
  const captionHasFocus = captionKey === focusedBlockKey
  const mediaKey = contentState.getKeyBefore(block.getKey())
  const mediaHasFocus = mediaKey === focusedBlockKey
  const visible =
    captionHasFocus ||
    mediaHasFocus ||
    block.getText() !== ''
      ? true
      : false
  useEffect(() => {
    updateAddButton()
    updateInlineToolTip()
  }, [visible])
  return (
    <div className="Caption" style={visible ? { } : { display: 'none' }}>
      <EditorBlock {...props} />
    </div>
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
  const block = contentState.getBlockForKey(key)
  const type = block.getType() as string
  if (caretAtEdge(editorState, key, direction)) {
    if (type === 'caption-block') {
      e.preventDefault()
      switch (direction) {
        case 'up':
        case 'left': {
          const previousBlock = contentState.getBlockBefore(key)
          const previousKey = previousBlock.getKey()
          const previousType = previousBlock.getType() as any
          if (!previousBlock) return
          if (previousType !== 'image-block' && previousType !== 'video-block') return
          const beforeTwoBlock = contentState.getBlockBefore(previousKey)
          let newSelectionState = null
          if (beforeTwoBlock) {
            newSelectionState = new SelectionState({
              anchorKey: beforeTwoBlock.getKey(),
              anchorOffset: beforeTwoBlock.getLength(),
              focusKey: beforeTwoBlock.getKey(),
              focusOffset: beforeTwoBlock.getLength(),
              isBackward: false,
              hasFocus: true
            }) 
          } else {
            newSelectionState = new SelectionState({
              anchorKey: previousKey,
              anchorOffset: 0,
              focusKey: previousKey,
              focusOffset: 0,
              isBackward: false,
              hasFocus: true
            })
          }
          changeEditorState(EditorState.forceSelection(
            editorState,
            newSelectionState
          ))
          return 
        }
        case 'down':
        case 'right': {
          changeEditorState(setSelection(editorState, direction))
          return 
        }
        default: return
      }
    } else {
      // handle access caption block
      const adjacentBlock = direction === 'up' || direction === 'left'
        ? contentState.getBlockBefore(key)
        : contentState.getBlockAfter(key)
      if (!adjacentBlock) return
      const adjacentType = adjacentBlock.getType() as string
      if (adjacentType === 'caption-block') {
        e.preventDefault()
        changeEditorState(setSelection(editorState, direction))
        return 
      }
    }
  }
}

export function handleKeyCommand (
  command: string,
  editorState: EditorState,
  changeEditorState: (editorState: EditorState) => void
): DraftHandleValue {
  const contentState = editorState.getCurrentContent()
  const selectionState = editorState.getSelection()
  const key = selectionState.getStartKey()
  const block = contentState.getBlockForKey(key)
  const type = block.getType() as string
  const previousBlock = contentState.getBlockBefore(key)
  const nextBlock = contentState.getBlockAfter(key)
  if (type === 'caption-block') {
    if (selectionState.isCollapsed()) {
      if (
        (selectionState.getAnchorOffset() === 0 && command === 'backspace') ||
        (selectionState.getAnchorOffset() === block.getLength() && command === 'delete')
      ) {
        const previousKey = contentState.getKeyBefore(key)
        const newSelectionState = new SelectionState({
          anchorKey: previousKey,
          anchorOffset: 0,
          focusKey: previousKey,
          focusOffset: 0,
          isBackward: false,
          hasFocus: true
        })
        setNativeSelection(previousKey)
        changeEditorState(EditorState.forceSelection(editorState, newSelectionState))
        return 'handled'
      }
    }
  }
  
  if (previousBlock && previousBlock.getType() as string === 'caption-block') {
    if (selectionState.isCollapsed() && selectionState.getAnchorOffset() === 0) {
      if (command === 'backspace') {
        let newEditorState = editorState
        if (nextBlock && block.getLength() === 0 ) {
          newEditorState = removeBlock(editorState, key)
        }
        const mediaKey = contentState.getKeyBefore(previousBlock.getKey())
        const newSelectionState = new SelectionState({
          anchorKey: mediaKey,
          anchorOffset: 0,
          focusKey: mediaKey,
          focusOffset: 0,
          isBackward: false,
          hasFocus: true
        })
        setNativeSelection(mediaKey)
        changeEditorState(EditorState.forceSelection(newEditorState, newSelectionState))
        return 'handled'
      }
    }
  }

  return 'not-handled'
}

export function handleReturn (
  editorState: EditorState,
  changeEditorState: (editorState: EditorState) => void
): DraftHandleValue {
  const contentState = editorState.getCurrentContent()
  const selectionState = editorState.getSelection()
  const key = selectionState.getStartKey()
  const start = selectionState.getStartOffset()
  const end = selectionState.getEndOffset()
  const block = contentState.getBlockForKey(key)
  const text = block.getText()
  const length = block.getLength()
  if (start === 0) {
    const blockWithNewText = block.set('text', '') as ContentBlock
    const newKey = generateRandomKey()
    const newText = text.slice(end - length)
    const newBlock = new ContentBlock({ key: newKey, type: 'unstyled', text: newText })
    const newSelectionState = new SelectionState({
      anchorKey: newKey,
      anchorOffset: 0,
      focusKey: newKey,
      focusOffset: 0,
      isBackward: false,
      hasFocus: true
    })
    changeEditorState(insertUnstyledBlock(editorState, newBlock, newSelectionState, true, blockWithNewText))
    return 'handled'
  } 
  if (end === length) {
    const newText = text.slice(0, start)
    const blockWithNewText = block.set('text', newText) as ContentBlock
    const newKey = generateRandomKey()
    const newBlock = new ContentBlock({ key: newKey, type: 'unstyled' })
    const newSelectionState = new SelectionState({
      anchorKey: newKey,
      anchorOffset: 0,
      focusKey: newKey,
      focusOffset: 0,
      isBackward: false,
      hasFocus: true
    })
    changeEditorState(insertUnstyledBlock(editorState, newBlock, newSelectionState, true, blockWithNewText))
    return 'handled'
  }
  if (start !== 0 && end !== length) {
    if (start === end) return 'handled'
    const newContentState = Modifier.replaceText(contentState, selectionState, '')
    const newSelectionState = new SelectionState({
      anchorKey: key,
      anchorOffset: start,
      focusKey: key,
      focusOffset: start,
      isBackward: false,
      hasFocus: true
    })
    changeEditorState(EditorState.forceSelection(
      EditorState.push(editorState, newContentState, 'remove-range'),
      newSelectionState
    ))
    return 'handled'
  }
  return 'not-handled'
}
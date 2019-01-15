import React, { useContext, useState, useRef, useEffect } from 'react'
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

interface Props {
  block: ContentBlock
  contentState: ContentState
}

// export function Caption ({ block, contentState }: Props) {
//   const inputRef = useRef(null)
//   const  [caption, setCaption] = useState('Type caption for image (optional)')
//   const focusedBlockKey = useContext(FocusContext)
//   const { setReadOnly } = useContext(EditorContext) as any
//   const mediaHasFocus = contentState.getKeyBefore(block.getKey()) === focusedBlockKey
//   const visible =
//     inputRef.current === document.activeElement ||
//     mediaHasFocus ||
//     caption !== 'Type caption for image (optional)'
//       ? true
//       : false
//   const handleChange = (e: React.SyntheticEvent<HTMLInputElement>) => {
//     const value = (e.target as HTMLInputElement).value
//     setCaption(value)
//   }
//   const handleFocus = () => {
//     setReadOnly(true)
//   }
//   const handleBlur = () => {
//     setReadOnly(false)
//   }
//   return (
//     <input
//       className="imgcaption"
//       ref={inputRef}
//       value={caption}
//       onFocus={handleFocus}
//       onBlur={handleBlur}
//       onChange={handleChange}
//       style={visible ? {} : { display: 'none'}}
//     />
//   )
// }

export function Caption (props: Props) {
  const { block, contentState } = props
  const focusedBlockKey = useContext(FocusContext)
  const { updateInlineToolTip, updateAddButton } = useContext(EditorContext)!
  const captionHasFocus = block.getKey() === focusedBlockKey
  const mediaHasFocus = contentState.getKeyBefore(block.getKey()) === focusedBlockKey
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
    <div style={visible ? {} : { display: 'none' }}>
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
          console.log(beforeTwoBlock)
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
          const nextBlock = contentState.getBlockAfter(key)
          const newSelectionState = new SelectionState({
            anchorKey: nextBlock.getKey(),
            anchorOffset: nextBlock.getLength(),
            focusKey: nextBlock.getKey(),
            focusOffset: nextBlock.getLength(),
            isBackward: false,
            hasFocus: true
          })
          changeEditorState(EditorState.forceSelection(
            editorState,
            newSelectionState
          ))
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
      const adjacentKey = adjacentBlock.getKey()
      if (adjacentType === 'caption-block') {
        e.preventDefault()
        const blockBesideCaption = direction === 'up' || direction === 'left'
          ? contentState.getBlockBefore(adjacentKey)
          : contentState.getBlockAfter(adjacentKey)
        setNativeSelection(blockBesideCaption.getKey())
        const newSelectionState = new SelectionState({
          anchorKey: blockBesideCaption.getKey(),
          anchorOffset: blockBesideCaption.getLength(),
          focusKey: blockBesideCaption.getKey(),
          focusOffset: blockBesideCaption.getLength(),
          isBackward: false,
          hasFocus: true
        })
        changeEditorState(EditorState.forceSelection(
          editorState,
          newSelectionState
        ))
        return 
      }
    }
  }
}

// export function handleKeyCommand (command: string, editorState: EditorState): DraftHandleValue {

// }

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
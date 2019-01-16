import React, { Component, useState, useRef, useEffect } from 'react'
import {
  ContentBlock,
  ContentState,
  EditorState,
  DraftHandleValue,
  SelectionState
} from 'draft-js'
import { List } from 'immutable'
import MediumEditor from '../../Editor'
import { setNativeSelection } from '../../utils/setNativeSelection'
import { deleteCommands } from '../../utils/deleteCommands'
import { removeBlock } from '../../utils/removeBlock'
import { useAlignment } from '../alignmentBlock/Alignment'
import './Img.css'


interface Props {
  block: ContentBlock
  contentState: ContentState
  blockProps: {
    // getEditorState(): EditorState
    // setEditorState(editorState: EditorState): void
  }
}

interface State {
  caption: string
}

function processImageSize (width: number, height: number): {width: number; height: number;} {
  if (width <= 700) {
    return {
      width,
      height
    }
  } else {
    return {
      width: 700,
      height: Math.floor(height * 700 / width)
    }
  }
}

export function Img ({ block } : Props) {
  useEffect(() => {
    setNativeSelection(block.getKey())
  }, [])
  const { alignment } = useAlignment(block)
  const data = block.getData()
  const src = data.get('src')
  const { width, height } = processImageSize(data.get('width'), data.get('height'))
  let alignmentStyle = {}
  switch (alignment) {
    case 'OUTSETLEFT': {
      alignmentStyle = {
        display: 'block'
      }
      break
    }
    case 'INSETCENTER': {
      alignmentStyle = {
        display: 'block',
        margin: '0 auto'
      }
      break
    }
    case 'OUTSETCENTER': {
      alignmentStyle = {
        display: 'block',
        position: 'relative',
        left: -150,
        width: 1000,
        height: Math.floor(height * 1000 / width)
      }
      break
    }
    case 'FILLWIDTH': {
      alignmentStyle = {
        display: 'block',
        position: 'relative',
        width: '100vw',
        left: 'calc(-50vw + 50%)',
        height: `${Math.floor(height * 100 / width)}vw`
      }
      break
    }
  }
  return (
    (src && alignment)
    &&
      <MediumEditor.Focus block={block}>
        {
          ({
            hasFocus
          }: {
            hasFocus: boolean
          }) => (
            <img
              className={`image ${hasFocus ? 'focused' : 'blurred'} ${alignment.toLocaleLowerCase()}`}
              style={{
                width,
                height,
                ...alignmentStyle
              }}
              src={src}
            />
          )
        }
      </MediumEditor.Focus>
  )
}

export function handleKeyCommand (
  command: string,
  editorState: EditorState,
  focusBlockKeyStore: List<string>,
): [EditorState, DraftHandleValue] {
  const contentState = editorState.getCurrentContent()
  const selectionState = editorState.getSelection()
  const key = selectionState.getStartKey()
  const previousBlock = contentState.getBlockBefore(key)
  const nextBlock = contentState.getBlockAfter(key)
  if (focusBlockKeyStore.includes(key)) {
    if (deleteCommands.includes(command)) {
      const newEditorState = removeBlock(editorState, key)
      return [newEditorState, 'handled']
    }
  }
  if (previousBlock && previousBlock.getType() as string === 'image-block') {
    if (selectionState.isCollapsed() && selectionState.getAnchorOffset() === 0) {
      if (!nextBlock) {
        const previousKey = previousBlock.getKey()
        const newSelectionState = new SelectionState({
          anchorKey: previousKey,
          anchorOffset: 0,
          focusKey: previousKey,
          focusOffset: 0,
          isBackward: false,
          hasFocus: true
        })
        setNativeSelection(previousKey)
        const newEditorState = EditorState.forceSelection(editorState, newSelectionState)
        return [newEditorState, 'handled']
      }
    }
  }
  return [editorState, 'not-handled']
}

// export class Img extends Component<Props, State> {
//   componentDidMount () {
//     setNativeSelection(this.props.block.getKey())
//   }
//   getImage = (): string => {
//     const { block } = this.props
//     const data = block.getData()
//     const src = data.get('src')
//     return src
//   }
//   render () {
//     const src = this.getImage()
//     console.log('ImgProps: ', this.props)
//     return (
//       src
//       &&
//       <MediumEditor.Focus {...this.props}>
//         {
//           ({
//             hasFocus
//           }: {
//             hasFocus: boolean
//           }) => (
//             <img className={`image ${hasFocus ? 'focused' : 'blurred'}`} src={src} />
//           )
//         }
//       </MediumEditor.Focus>
//     )
//   }
// }

function findLastTextNode(node: Node) : Node | null {
  if (node.nodeType === Node.TEXT_NODE) return node;
  let children = node.childNodes;
  for (let i = children.length-1; i>=0; i--) {
    let textNode = findLastTextNode(children[i]);
    if (textNode !== null) return textNode;
  }
  return null;
}

function replaceCaret(el: HTMLElement) {
  // Place the caret at the end of the element
  const textNode = el.childNodes[0]
  // do not move caret if element was not focused
  const isTargetFocused = document.activeElement === el;
  if (textNode !== null && textNode.nodeValue !== null && isTargetFocused) {
    const range = document.createRange();
    const sel = window.getSelection();
    range.setStart(textNode, textNode.nodeValue.length);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    if (el instanceof HTMLElement) el.focus();
  }
}

function ImgCaption ({
  hasFocus,
  setReadOnly
}: {
  hasFocus: boolean
  setReadOnly(value: boolean): void
}) {
  const spanRef = useRef(null)
  const [caption, setCaption] = useState('Type caption for image (optional)')
  const visibility = !hasFocus && caption === 'Type caption for image (optional)'
    ? 'hidden'
    : 'visible'
  let lastHtml = 'Type caption for image (optional)'
  useEffect(() => {
    const span = spanRef.current as any
    if (span !== null) {
      // if (span.innerHTMl !== caption) {
      //   span.innerHTML = lastHtml = caption
      // }
      console.log(span.childNodes)
      replaceCaret(span)
      // if (document.activeElement === span) {
      //   const range = document.createRange()
      //   const sel = window.getSelection()
      //   range.setStart(span, caption.length)
      //   range.collapse(true)
      //   sel.removeAllRanges()
      //   sel.addRange(range)
      // }
    }
  })
  const handleInput = (e: React.FormEvent) => {
    const span = spanRef.current
    if (span !== null) {
      const html = (span as HTMLElement).innerHTML
      if (html !== lastHtml) {
        setCaption(html)
      }
      lastHtml = html
    }
    // setCaption((span as HTMLElement).innerHTML)
  }
  const handleFocus = () => {
    setReadOnly(true)
  }
  const handleBlur = () => {
    setReadOnly(false)
  }
  return (
    <span
      contentEditable={true}
      style={{visibility}}
      ref={spanRef}
      onInput={handleInput}
      onFocus={handleFocus}
      onBlur={handleBlur}
      dangerouslySetInnerHTML={{__html: caption}}
    />
  )
}
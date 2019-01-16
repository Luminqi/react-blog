import React, { PureComponent } from 'react'
import {
  Editor,
  EditorState,
  getDefaultKeyBinding,
  KeyBindingUtil,
  CompositeDecorator,
  DraftHandleValue,
  ContentBlock,
  ContentState,
  RichUtils,
  Modifier,
  SelectionState,
  getVisibleSelectionRect,
  genKey as generateRandomKey, 
  CharacterMetadata,
  convertToRaw
} from 'draft-js'
import { OrderedSet, Map, List } from 'immutable'
import 'draft-js/dist/Draft.css'
import './Editor.css'
import { AddButton } from './addButton/AddButton'
import { InlineToolTip } from './inlineToolTip/InlineToolTip'
import {
  Img,
  handleKeyCommand as handleImageKeyCommand
} from './blockComponents/imageBlock/Img'
import {
  Caption,
  handleArrow as handleCaptionArrow,
  handleReturn as handleCaptionReturn,
  handleKeyCommand as handleCaptionKeyCommand,
} from './blockComponents/CaptionBlock/Caption'
import { Section } from './blockComponents/sectionBlock/Section'
import { Focus } from './blockComponents/foucsBlock/Focus'
import { Link } from './link/Link'
import { getCurrentBlock } from './utils/getCurrentBlock'
import { setNativeSelection } from './utils/setNativeSelection'
import { insertUnstyledBlock } from './utils/insertUnstyledBlock'
import { removeBlock } from './utils/removeBlock'
import { setSelection } from './blockComponents/foucsBlock/modifiers/setSelection'
import { caretAtEdge } from './utils/caretAtEdge'
import { deleteCommands } from './utils/deleteCommands'

interface State {
  editorState: EditorState
  readOnly: boolean
  currentBlockKey: string
  focusBlockKeyStore: List<string>
  alignmentBlockStore: Map<string, string>
  addButtonTopOffset: number | null
  addButtonVisibility: boolean
  inlineToolTipPosition: {top: number; left: number; width: number} | null
  inlineToolTipVisibility: boolean
  inlineStyle: OrderedSet<string> | null
}

const { hasCommandModifier } = KeyBindingUtil

function myKeyBindingFn (e: React.KeyboardEvent): string | null {
  const keyCode = e.keyCode
  switch (true) {
    case keyCode === 83 && hasCommandModifier(e): return 'save'
    default: return getDefaultKeyBinding(e)
  }
}

const DraftDefaultBlockRenderMap = {
  h1: 'header-one',
  h2: 'header-two',
  pre: 'code-block',
}

const StringToTypeMap = {
  '```': DraftDefaultBlockRenderMap.pre
}


function defineBlockType (currentInput: string): string {
  switch (currentInput) {
    case '```': return 'code-block'
    case '* ': return 'unordered-list-item'
    case '1. ': return 'ordered-list-item'
    default: return 'default'
  }
}

function myBlockStyleFn (contentBlock: ContentBlock) {
  const type = contentBlock.getType() as string
  switch (type) {
    case 'unstyled': {
      return 'myUnstyled'
    }
    case 'code-block': {
      return 'myCodeBlock'
    }
    case 'header-three': {
      return 'myH3Block'
    }
    case 'header-four': {
      return 'myH4Block'
    }
    case 'blockquote': {
      return 'myBlockQuote'
    }
    case 'image-block': {
      return 'myImageBlock'
    }
    default: return type
  }
}


// const blockRenderMap = Map({
//   'section': {
//     element: 'section'
//   },
//   'image-block': {
//     element: 'img'
//   },
//   'video-block': {
//     element: 'video'
//   }
// })

// const extendedBlockRenderMap: any = DefaultDraftBlockRenderMap.merge(blockRenderMap)

function getCurrentLineIndex (lines: string[], key: number): number {
  const linesEndOffset = lines.map(line => line.length + 1)
  linesEndOffset[0] = linesEndOffset[0] - 1
  let offset = 0
  let i = 0
  while(i < lines.length) {
    offset = offset + linesEndOffset[i]
    if (key <= offset) {
      break
    }
    i = i + 1  
  }
  return i
}
function getSelectedBlockNode (): HTMLElement | null {
  const selection = window.getSelection() || document.getSelection()
  if (selection.rangeCount == 0) return null
  let node: any = selection.getRangeAt(0).startContainer
  do {
    if (node.getAttribute && node.getAttribute('data-block') === 'true')
      return node
    node = node.parentNode
  } while (node != null)
  return null
}

async function getImageBlockNodeRect (key: string): Promise<{top: number; left: number; width: number;}> {
  const imageNode = document.querySelectorAll(`[data-offset-key="${key}-0-0"] img`)[0] as HTMLImageElement
  if (imageNode.complete) {
    return imageNode.getBoundingClientRect()
  } else {
    return await new Promise(resolve => {
      imageNode.onload = () => {
       resolve(imageNode.getBoundingClientRect()) 
      }
    })
  }
}

function insertNewBlock (
  editorState: EditorState,
  newType: 'image-block' | 'video-block' | 'section',
  data: any
): EditorState {
  const selection = editorState.getSelection()
  if (!selection.isCollapsed()) return editorState
  const block = getCurrentBlock(editorState)
  const type = block.getType()
  if (type !== 'unstyled') return editorState
  const textLength = block.getLength()
  if (textLength !== 0) return editorState
  const contentState = editorState.getCurrentContent()
  const currentKey = block.getKey()
  const nextBlock = contentState.getBlockAfter(currentKey)
  switch (newType) {
    case 'image-block':
    case 'video-block': {
      if (!nextBlock) {
        const newKey = generateRandomKey()
        const newBlock = new ContentBlock({ key: newKey, type: newType, data })
        const newCaptionBlock = new ContentBlock({ key: generateRandomKey(), type: 'caption-block' })
        const blockMap = contentState.getBlockMap()
        const array: ContentBlock[] = []
        blockMap.forEach((block, key) => {
          if (key === currentKey) {
              array.push(newBlock, newCaptionBlock)
          }
          array.push(block as ContentBlock)
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
          EditorState.push(editorState, newContentState, 'insert-fragment'),
          newSelectionState
        )
      } else {
        const newCaptionBlock = new ContentBlock({ key: generateRandomKey(), type: 'caption-block' })
        const blockMap = contentState.getBlockMap()
        const array: ContentBlock[] = []
        blockMap.forEach((block, key) => {
          array.push(block as ContentBlock)
          if (key === currentKey) {
            array.push(newCaptionBlock)
          }
        })
        const contentStateWithCaption = ContentState.createFromBlockArray(array)
        const newContentState = Modifier.setBlockType(contentStateWithCaption, selection, newType)
        const finalContentState = Modifier.setBlockData(newContentState, selection, data)
        const newSelectionState = new SelectionState({
          anchorKey: currentKey,
          anchorOffset: 0,
          focusKey: currentKey,
          focusOffset: 0,
          isBackward: false,
          hasFocus: true
        })
        return EditorState.forceSelection(
          EditorState.push(editorState, finalContentState, 'insert-fragment'),
          newSelectionState
        )
      }
    }
    case 'section': {
      if (!nextBlock) {
        const newKey = generateRandomKey()
        const newBlock = new ContentBlock({ key: newKey, type: newType })
        const blockMap = contentState.getBlockMap()
        const array: ContentBlock[] = []
        blockMap.forEach((block, key) => {
          if (key === currentKey) {
              array.push(newBlock)
          }
          array.push(block as ContentBlock)
        })
        const newContentState = ContentState.createFromBlockArray(array)
        const newSelectionState = new SelectionState({
          anchorKey: currentKey,
          anchorOffset: 0,
          focusKey: currentKey,
          focusOffset: 0,
          isBackward: false,
          hasFocus: true
        })
        return EditorState.forceSelection(
          EditorState.push(editorState, newContentState, 'insert-fragment'),
          newSelectionState
        )
      } else {
        const newContentState = Modifier.setBlockType(contentState, selection, newType)
        const newSelectionState = new SelectionState({
          anchorKey: nextBlock.getKey(),
          anchorOffset: nextBlock.getLength(),
          focusKey: nextBlock.getKey(),
          focusOffset: nextBlock.getLength(),
          isBackward: false,
          hasFocus: true
        })
        return EditorState.forceSelection(
          EditorState.push(editorState, newContentState, 'change-block-type'),
          newSelectionState
        )
      }
    }
    default: return editorState
  }
}

function myBlockRenderer (contentBlock: ContentBlock) {
  const type = contentBlock.getType() as string
  switch (type) {
    case 'image-block': {
      return {
        component: Img,
        editable: false
      }
    }
    case 'caption-block': {
      return {
        component: Caption,
        editable: true
      }
    }
    case 'section': {
      return {
        component: Section,
        editable: false
      }
    }
  }
}

function findLinkEntities (contentBlock: ContentBlock, callback: (start: number, end: number) => void, contentState: ContentState) {
  contentBlock.findEntityRanges(
    (character: CharacterMetadata) => {
      const entityKey = character.getEntity()
      return (
        entityKey !== null &&
        contentState.getEntity(entityKey).getType() === 'LINK'
      )
    },
    callback
  )
}

const decorator = new CompositeDecorator([
  {
    strategy: findLinkEntities,
    component: Link,
  },
])

interface EditorControls {
  setEditorState: (editorState: EditorState) => void
  updateInlineToolTip(): Promise<void>
  updateAddButton(): void
}

export const EditorContext = React.createContext(null) as React.Context<EditorControls | null>
export const FocusContext =  React.createContext(null) as React.Context<string | null>
export const AlignmentContext = React.createContext(null) as React.Context<Map<string, string> | null>
export default class MediumEditor extends PureComponent<object, State> {
  static Focus = (props: any) => (
    <EditorContext.Consumer>
      {editorControls =>
        <FocusContext.Consumer>
          {currentBlockKey =>
            <Focus currentBlockKey={currentBlockKey} {...editorControls} {...props} />
          }
        </FocusContext.Consumer>
      }
    </EditorContext.Consumer>
  )
  _editor: Editor | null = null
  _inlineTools: { [key: string]: 'able' | 'disable' } | null = null
  _editorControls: EditorControls | null = null
  constructor (props: object) {
    super(props)
    this.state = {
      editorState: EditorState.createEmpty(decorator),
      readOnly: false,
      currentBlockKey: '',
      focusBlockKeyStore: List(),
      alignmentBlockStore: Map(),
      addButtonTopOffset: null,
      addButtonVisibility: false,
      inlineToolTipPosition: null,
      inlineToolTipVisibility: false,
      inlineStyle: null
    }
    this._editorControls = this.getEditorControls()
  }
  setReadOnly = (value: boolean) => {
    this.setState({
      readOnly: value
    })
  }
  addFocusBlockKey = (key: string) => {
    this.setState({
      focusBlockKeyStore: this.state.focusBlockKeyStore.push(key)
    })
  }
  removeFocusBlockKey = (key: string) => {
    this.setState({
      focusBlockKeyStore: this.state.focusBlockKeyStore.filter(item => item !== key)
    })
  }
  getCurrentBlockKey = (): string => {
    const editorState= this.state.editorState
    return editorState.getSelection().getStartKey()
  } 
  setFocusToBlock = (key: string) => {
    setNativeSelection(key)
    const newSelectionState = new SelectionState({
      anchorKey: key,
      anchorOffset: 0,
      focusKey: key,
      focusOffset: 0,
      isBackward: false,
      hasFocus: true
    })
    this.onChange(EditorState.forceSelection(
      this.state.editorState,
      newSelectionState
    ))
  }
  changeBlockAlignment = (alignment: string): void => {
    const editorState = this.state.editorState
    const key = editorState.getSelection().getStartKey()
    const newSelectionState = new SelectionState({
      anchorKey: key,
      anchorOffset: 0,
      focusKey: key,
      focusOffset: 0,
      isBackward: false,
      hasFocus: true
    })
    this.focus()
    setNativeSelection(key)
    this.setState({
      alignmentBlockStore: this.state.alignmentBlockStore.set(key, alignment),
      editorState: EditorState.forceSelection(editorState, newSelectionState)
    })
  }
  addAlignmentBlock = (key: string, alignment: string): void => {
    this.setState({
      alignmentBlockStore: this.state.alignmentBlockStore.set(key, alignment)
    })
  }
  removeAlignmentBlock = (key: string): void => {
    this.setState({
      alignmentBlockStore: this.state.alignmentBlockStore.delete(key)
    })
  }
  getBlockAlignment = (key: string): string | null=> {
    const alignmentBlockStore = this.state.alignmentBlockStore
    if (alignmentBlockStore.has(key)) {
      return alignmentBlockStore.get(key) as string
    }
    return null
  }
  getAlignmentBlockControls = () => {
    return {
      addAlignmentBlock: this.addAlignmentBlock,
      removeAlignmentBlock: this.removeAlignmentBlock
    }
  }
  getEditorControls = () => {
    return {
      setEditorState: this.onChange,
      getCurrentBlockKey: this.getCurrentBlockKey,
      addFocusBlockKey: this.addFocusBlockKey,
      removeFocusBlockKey: this.removeFocusBlockKey,
      setReadOnly: this.setReadOnly,
      setFocusToBlock: this.setFocusToBlock,
      updateInlineToolTip: this.updateInlineToolTip,
      updateAddButton: this.updateAddButton,
      getAlignmentBlockControls: this.getAlignmentBlockControls
    }
  }
  focus = (): void =>{
    if (this._editor) 
    this._editor.focus()
  }
  hideAddButton = (): void => {
    this.setState({
      addButtonVisibility: false
    })
  }
  insertBlock = (type: "video-block" | "image-block" | 'section', data?: Map<any, any>): void => {
    const newEditorState = insertNewBlock(this.state.editorState, type, data)
    this.onChange(newEditorState)
  }
  changeInlineStyle = (style: string): void => {
    const selectionState = this.state.editorState.getSelection()
    this.onChange(EditorState.forceSelection(
      RichUtils.toggleInlineStyle(this.state.editorState, style),
      selectionState
    ))
  }
  changeBlockType = (type: string): void => {
    const selectionState = this.state.editorState.getSelection()
    this.onChange(EditorState.forceSelection(
      RichUtils.toggleBlockType(this.state.editorState, type),
      selectionState
    ))
  }
  confirmLink = (url: string) => {
    const editorState = this.state.editorState
    const contentState = editorState.getCurrentContent()
    const selectionState = editorState.getSelection()
    const contentStateWithEntity = contentState.createEntity(
      'LINK',
      'IMMUTABLE',
      {
        url,
        selectionState
      }
    )
    const entityKey = contentStateWithEntity.getLastCreatedEntityKey()
    const newEditorState = EditorState.push(editorState, contentStateWithEntity, 'apply-entity')
    const startKey = selectionState.getStartKey()
    const endOffset = selectionState.getEndOffset()
    const newSelectionState = new SelectionState({
      anchorKey: startKey,
      anchorOffset: endOffset,
      focusKey: startKey,
      focusOffset: endOffset,
      isBackward: false,
      hasFocus: true
    })
    this.onChange(EditorState.forceSelection(
      RichUtils.toggleLink(newEditorState, selectionState, entityKey),
      newSelectionState
    ))
  }
  removeLink = () => {
    const editorState = this.state.editorState
    const selectionState = editorState.getSelection()
    if (!selectionState.isCollapsed()) {
      const contentState = editorState.getCurrentContent()
      const key = selectionState.getStartKey()
      const offset = selectionState.getStartOffset()
      const block = contentState.getBlockForKey(key)
      const entityKey= block.getEntityAt(offset)
      if (entityKey) {
        const linkInstance = contentState.getEntity(entityKey)
        const linkSelectRange = linkInstance.getData().selectionState
        this.onChange(EditorState.forceSelection(
          RichUtils.toggleLink(editorState, linkSelectRange, null),
          selectionState
        ))
      }
    }
  }
  hasLink = (): boolean => {
    const editorState = this.state.editorState
    const selectionState = editorState.getSelection()
    if (!selectionState.isCollapsed()) {
      const contentState = editorState.getCurrentContent()
      const key = selectionState.getStartKey()
      const offset = selectionState.getStartOffset()
      const block = contentState.getBlockForKey(key)
      const entityKey= block.getEntityAt(offset)
      if (entityKey) {
        return contentState.getEntity(entityKey).getType() === 'LINK'
      }
    }
    return false
  }
  componentDidMount () {
    this.focus()
    this.updateAddButton()
    this.updateCurrentBlockKey()
  }
  componentDidUpdate (prevProps: object, prevState: State) {
    if (this.state.editorState !== prevState.editorState) {
      this.updateAddButton()
      this.updateInlineToolTip()
      this.updateCurrentBlockKey()
    } else if (this.state.alignmentBlockStore !== prevState.alignmentBlockStore) {
      this.updateInlineToolTip()
    }
  }
  updateCurrentBlockKey () {
    const { editorState, currentBlockKey }= this.state
    const key = editorState.getSelection().getStartKey()
    if (key !== currentBlockKey) {
    //   console.log(focusBlockKeyStore)
    //   if (focusBlockKeyStore.includes(key)) {
    //     this.setState({
    //       currentBlockKey: key
    //     })
    //     return
    //   }
    //   if (focusBlockKeyStore.includes(currentBlockKey)) {
    //     this.setState({
    //       currentBlockKey: ''
    //     })
    //     return
    //   }
      this.setState({
        currentBlockKey: key
      })
    }
  }
  updateInlineToolTip = async (): Promise<void> => {
    const editorState = this.state.editorState
    const contentState = editorState.getCurrentContent()
    const selection = editorState.getSelection()
    const key = selection.getStartKey()
    const block = contentState.getBlockForKey(key)
    const type = block.getType()
    let inlineToolTipPosition: {top: number; left: number; width: number} | null
      = this.state.inlineToolTipPosition
    let inlineToolTipVisibility: boolean = this.state.inlineToolTipVisibility
    let inlineStyle: any = this.state.inlineStyle
    let selectionRect = null
    if (selection.isCollapsed()) {
      inlineToolTipVisibility = false
      if (this.state.alignmentBlockStore.has(key)) {
        switch (type as string) {
          case 'image-block': {
            selectionRect = await getImageBlockNodeRect(key)
          }
        }
      }
    } else {
      selectionRect = getVisibleSelectionRect(window)
    }
    if (selectionRect) {
      const { top, left, width } = selectionRect 
      inlineToolTipPosition = {
        top: top + window.pageYOffset,
        left: left + window.pageXOffset,
        width
      }
      inlineToolTipVisibility = true
      switch (type as string) {
        case 'header-three':
        case 'header-four':
        case 'blockquote': 
        case 'unstyled': {
          this._inlineTools = {
            BOLD: type === 'unstyled' ? 'able' : 'disable',
            ITALIC: type === 'unstyled' ? 'able' : 'disable',
            LINK: 'able',
            H3: 'able',
            H4: 'able',
            BLOCKQUOTE: 'able'
          }
          inlineStyle = editorState.getCurrentInlineStyle()
          console.log('updateInlineToolTip, haslink: ', this.hasLink())
          if (this.hasLink()) {
            inlineStyle = inlineStyle.add('LINK')
          }
          if (type === 'header-three') {
            inlineStyle = inlineStyle.add('H3')
          }
          if (type === 'header-four') {
            inlineStyle = inlineStyle.add('H4')
          }
          if (type === 'blockquote') {
            inlineStyle = inlineStyle.add('BLOCKQUOTE')
          }
          break
        }
        case 'code-block': {
          this._inlineTools = {
            BOLD: 'able',
            ITALIC: 'able',
            LINK: 'able',
            H3: 'able',
            H4: 'able',
            BLOCKQUOTE: 'able'
          }
          inlineStyle = editorState.getCurrentInlineStyle()
          if (this.hasLink()) {
            inlineStyle = inlineStyle.add('LINK')
          }
          break
        }
        case 'image-block': {
          if (block.getData().get('width') >= 1000) {
            this._inlineTools = {
              OUTSETLEFT: 'able',
              INSETCENTER: 'able',
              OUTSETCENTER: 'able',
              FILLWIDTH: 'able'
            }
          } else {
            this._inlineTools = {
              OUTSETLEFT: 'able',
              INSETCENTER: 'able'
            }
          }
          inlineStyle = this.getBlockAlignment(key)
          break
        }
        default: this._inlineTools = null
      }
    }
    this.setState({
      inlineToolTipPosition,
      inlineToolTipVisibility,
      inlineStyle
    })
  }
  updateAddButton = (): void => {
    const selection = this.state.editorState.getSelection()
    const hasFocus = selection.getHasFocus()
    if (hasFocus) {
      const block = getCurrentBlock(this.state.editorState)
      if (block.getType() === 'unstyled') {
        const node = getSelectedBlockNode()
        if (node) {
          const topOffset = node.offsetTop
          const visibility = block.getLength() === 0
          this.setState({
            addButtonTopOffset: topOffset,
            addButtonVisibility: visibility
          })
        }
      } else {
        this.setState({
          addButtonVisibility: false
        })
      }
    }
  }
  onChange = (editorState: EditorState): void => {
    console.log('onChange')
    this.setState({
      editorState
    })
  }
  handleReturn = (e: React.KeyboardEvent, editorState: EditorState): DraftHandleValue => {
    const contentState = editorState.getCurrentContent()
    const selectionState = editorState.getSelection()
    const key = selectionState.getStartKey()
    const start = selectionState.getStartOffset()
    const end = selectionState.getEndOffset()
    const block = contentState.getBlockForKey(key)
    const text = block.getText()
    const type = block.getType() as string
    const length = block.getLength()
    switch (type) {
      case 'caption-block': {
        return handleCaptionReturn(editorState, this.onChange)
      }
      case 'header-three':
      case 'header-four':
      case 'blockquote': {
        if (start === 0) {
          const newKey = generateRandomKey()
          const newBlock = new ContentBlock({ key: newKey, type: 'unstyled'})
          const newText = text.slice(end - length)
          const blockWithNewText = block.set('text', newText) as ContentBlock
          const newSelectionState = new SelectionState({
            anchorKey: key,
            anchorOffset: 0,
            focusKey: key,
            focusOffset: 0,
            isBackward: false,
            hasFocus: true
          })
          this.onChange(insertUnstyledBlock(editorState, newBlock, newSelectionState, false, blockWithNewText))
          return 'handled'
        }
        if (end === length) {
          const newKey = generateRandomKey()
          const newBlock = new ContentBlock({ key: newKey, type: 'unstyled'})
          const newText = text.slice(0, start)
          const blockWithNewText = block.set('text', newText) as ContentBlock
          const newSelectionState = new SelectionState({
            anchorKey: newKey,
            anchorOffset: 0,
            focusKey: newKey,
            focusOffset: 0,
            isBackward: false,
            hasFocus: true
          })
          this.onChange(insertUnstyledBlock(editorState, newBlock, newSelectionState, true, blockWithNewText))
          return 'handled'
        }
        return 'not-handled'
      }
      case 'code-block': {
        let newContentState = null
        if (selectionState.isCollapsed()) {
          const lines = text.split('\n')
          const index = getCurrentLineIndex(lines, start)
          const currentLine = lines[index]
          const matches = /^ +/g.exec(currentLine)
          const currentIndent = matches ? matches[0] : ''
          const newLine = '\n' + currentIndent
          newContentState = Modifier.insertText(
            contentState,
            selectionState,
            newLine
          )
        } else {
          newContentState = Modifier.replaceText(
            contentState,
            selectionState,
            '\n'
          )
        }
        const newEditorState = EditorState.forceSelection(
          EditorState.push(editorState, newContentState, 'insert-characters'),
          newContentState.getSelectionAfter()
        )
        this.onChange(newEditorState)
        return 'handled'
      }
    }
    if (this.state.focusBlockKeyStore.includes(key)) {
      const newKey = generateRandomKey()
      const newBlock = new ContentBlock({ key: newKey, type: 'unstyled'})
      const newSelectionState = new SelectionState({
        anchorKey: newKey,
        anchorOffset: 0,
        focusKey: newKey,
        focusOffset: 0,
        isBackward: false,
        hasFocus: true
      })
      this.onChange(insertUnstyledBlock(editorState, newBlock, newSelectionState))
      return 'handled'
    }
    return 'not-handled'
  }
 
  handleKeyCommand = (command: string, editorState: EditorState): DraftHandleValue => {
    if (command === 'save') {
      console.log('save: ', convertToRaw(this.state.editorState.getCurrentContent()))
      return 'handled'
    }
    
    // const [imgEditorState, imgHandleValue] = handleImageKeyCommand(command, editorState, this.state.focusBlockKeyStore)
    // const [captEditorState, captHandleValue] = handleCaptionKeyCommand(command, imgEditorState)
    // const handleValue = [imgHandleValue, captHandleValue]
    // if (handleValue.includes('handled')) {
    //   this.onChange(captEditorState)
    //   return 'not-handled'
    // }

    //image-block logic
    const contentState = editorState.getCurrentContent()
    const selectionState = editorState.getSelection()
    const key = selectionState.getStartKey()
    const block = contentState.getBlockForKey(key)
    const type = block.getType() as string
    const previousBlock = contentState.getBlockBefore(key)
    const nextBlock = contentState.getBlockAfter(key)
    if (this.state.focusBlockKeyStore.includes(key) && deleteCommands.includes(command)) {
      const nextKey = contentState.getKeyAfter(key)
      const nextBlock = contentState.getBlockAfter(key)
      if (nextBlock.getType() as string === 'caption-block') {
        this.onChange(removeBlock(editorState, key, nextKey))
      } else {
        this.onChange(removeBlock(editorState, key))
      }
      return 'handled'
    }
    
    if (type === 'caption-block') {
      if (selectionState.isCollapsed() && selectionState.getAnchorOffset() === 0) {
        if (command === 'backspace') {
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
          this.onChange(EditorState.forceSelection(editorState, newSelectionState))
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
          this.onChange(EditorState.forceSelection(newEditorState, newSelectionState))
          return 'handled'
        }
      }
    }
    return 'not-handled'
  }
  handleBeforeInput = (
    chars: string,
    editorState: EditorState
  ): DraftHandleValue => {
    const contentState = editorState.getCurrentContent()
    const selectionState = editorState.getSelection()
    const key = selectionState.getStartKey()
    const block = contentState.getBlockForKey(key)
    const currentType = block.getType()
    if (currentType !== 'unstyled') return 'not-handled'
    const inputStr = block.getText() + chars
    const type = defineBlockType(inputStr)
    switch (type) {
      case 'code-block': 
      case 'unordered-list-item':
      case 'ordered-list-item': {
        const newSelectionState = selectionState.set('anchorOffset', 0) as SelectionState
        const newContentState = Modifier.setBlockType(contentState, newSelectionState, type)
        const finalContentState = Modifier.replaceText(newContentState, newSelectionState, '')
        this.onChange(EditorState.push(editorState, finalContentState, 'change-block-type'))
        return 'handled'
      }
      default: return 'not-handled'
    }
  }
  handleArrow = (e: React.KeyboardEvent, direction: string) => {
    const { editorState, focusBlockKeyStore } = this.state
    const selectionState = editorState.getSelection()
    const key = selectionState.getStartKey()
    if (focusBlockKeyStore.includes(key)) {
      e.preventDefault()
      this.onChange(setSelection(editorState, direction))
      return 
    }
    const contentState = editorState.getCurrentContent()
    const adjacentBlock = direction === 'up' || direction === 'left'
      ? contentState.getBlockBefore(key)
      : contentState.getBlockAfter(key)
    if (adjacentBlock &&
      focusBlockKeyStore.includes(adjacentBlock.getKey()) &&
      caretAtEdge(editorState, key, direction)
    ) {
      e.preventDefault()
      setNativeSelection(adjacentBlock.getKey())
      this.onChange(setSelection(editorState, direction))
      return
    }
  } 
  onUpArrow = (e: React.KeyboardEvent<any>): void => {
    this.handleArrow(e, 'up')
    handleCaptionArrow(e, 'up', this.state.editorState, this.onChange)
  }
  onDownArrow = (e: React.KeyboardEvent<any>): void => {
    this.handleArrow(e, 'down')
    handleCaptionArrow(e, 'down', this.state.editorState, this.onChange)
  }
  onRightArrow = (e: React.KeyboardEvent<any>): void => {
    this.handleArrow(e, 'right')
    handleCaptionArrow(e, 'right', this.state.editorState, this.onChange)
  }
  onLeftArrow = (e: React.KeyboardEvent<any>): void => {
    this.handleArrow(e, 'left')
    handleCaptionArrow(e, 'left', this.state.editorState, this.onChange)
  }
  render () {
    const {
      editorState,
      readOnly,
      addButtonTopOffset,
      addButtonVisibility,
      inlineToolTipPosition,
      inlineToolTipVisibility,
      inlineStyle
    } = this.state
    return (
      <EditorContext.Provider value={this._editorControls}>
        <AlignmentContext.Provider value={this.state.alignmentBlockStore}>
          <FocusContext.Provider value={this.state.currentBlockKey}>
            <div className="editor-wrapper">
              <Editor
                ref={elm => this._editor = elm}
                editorState={editorState}
                onChange={this.onChange}
                handleReturn={this.handleReturn}
                handleKeyCommand={this.handleKeyCommand}
                handleBeforeInput={this.handleBeforeInput}
                keyBindingFn={myKeyBindingFn}
                blockStyleFn={myBlockStyleFn}
                // blockRenderMap={extendedBlockRenderMap}
                blockRendererFn={myBlockRenderer}
                onUpArrow={this.onUpArrow}
                onDownArrow={this.onDownArrow}
                onRightArrow={this.onRightArrow}
                onLeftArrow={this.onLeftArrow}
                readOnly={readOnly}
                // placeholder='Title'
              />
              <AddButton
                topOffset={addButtonTopOffset}
                visibility={addButtonVisibility}
                hideButton={this.hideAddButton}
                focusEditor={this.focus}
                changeEditorState={this.insertBlock}
              />
              <InlineToolTip
                position={inlineToolTipPosition}
                visibility={inlineToolTipVisibility}
                toolList={this._inlineTools}
                activeStyle={inlineStyle}
                changeInlineStyle={this.changeInlineStyle}
                changeBlockType={this.changeBlockType}
                changeBlockAlignment={this.changeBlockAlignment}
                confirmLink={this.confirmLink}
                removeLink={this.removeLink}
              />
            </div>
          </FocusContext.Provider>
        </AlignmentContext.Provider>
      </EditorContext.Provider>
    )
  }
}

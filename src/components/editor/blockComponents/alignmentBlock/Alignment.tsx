import React, { Component, useContext, useEffect } from 'react'
import { ContentBlock, EditorState } from 'draft-js'
import { EditorContext } from '../../Editor'
import { AlignmentContext } from '../../Editor'

// interface Props {
//   getBlockAlignment(key: string): string | null
//   addAlignmentBlock(key: string, alignment: string): void
//   removeAlignmentBlock(key: string): void
//   block: ContentBlock
// }

// export class Alignment extends Component<Props, object> {
//   componentDidMount () {
//     this.props.addAlignmentBlock(this.props.block.getKey(), 'center')
//   }
//   componentWillUnmount () {
//     this.props.removeAlignmentBlock(this.props.block.getKey())
//   }
//   render () {
//     return this.props.children
//   } 
// }

export function useAlignment (block: ContentBlock) {
  const { getAlignmentBlockControls } = useContext(EditorContext) as any
  const alignmentBlockStore = useContext(AlignmentContext)
  const { addAlignmentBlock, removeAlignmentBlock } = getAlignmentBlockControls()
  const key = block.getKey()
  useEffect(() => {
    addAlignmentBlock(key, 'INSETCENTER')
    return () => {
      removeAlignmentBlock(key)
    }
  }, [])
  let alignment = null
  if (alignmentBlockStore) {
    alignment = alignmentBlockStore.get(key) || null
  }
  return {
    alignment
  }
}


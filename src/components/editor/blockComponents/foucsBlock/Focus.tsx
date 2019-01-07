import React, { PureComponent, Component, useEffect } from 'react'
import { ContentBlock, EditorState } from 'draft-js'
import { EditorContext } from '../../Editor'
import './Focus.css'

interface injectedProps {
  hasFocus: boolean
  setReadOnly(value: string): void
}

interface Props {
  currentBlockKey: string
  getCurrentBlockKey(): string
  addFocusBlockKey(key: string): void
  removeFocusBlockKey(key: string): void
  setReadOnly(value: string): void
  setFocusToBlock(key: string): void
  block: ContentBlock
  children(props: injectedProps): JSX.Element
}

// export function Focus ({
//   getCurrentBlockKey,
//   addFocusBlockKey,
//   removeFocusBlockKey,
//   setReadOnly,
//   setFocusToBlock,
//   block,
//   children
// }: Props) {
//   useEffect(() => {
//     addFocusBlockKey(block.getKey())
//     return () => {
//       removeFocusBlockKey(block.getKey())
//     }
//   })
//   const handleClick = (e: React.MouseEvent) => {
//     e.preventDefault()
//     if (getCurrentBlockKey() !== block.getKey())
//     setFocusToBlock(block.getKey())
//   }
//   const hasFocus =  getCurrentBlockKey() === block.getKey() 
//   const status = hasFocus ? 'focused' : 'blurred'
//   return (
//     <div className={`focusBlock ${status}`} onClick={handleClick}>
//       {children({
//         hasFocus,
//         setReadOnly: setReadOnly
//       })}
//     </div>
//   )
// }
// export class Focus extends PureComponent<Props, object> {
//   componentDidMount () {
//     this.props.addFocusBlockKey(this.props.block.getKey())
//   }

//   componentWillUnmount () {
//     this.props.removeFocusBlockKey(this.props.block.getKey())
//   }

//   handleClick = (e: React.MouseEvent) => {
//     e.preventDefault()
//     const { getCurrentBlockKey, setFocusToBlock, block } = this.props
//     if (getCurrentBlockKey() !== block.getKey())
//     setFocusToBlock(block.getKey())
//   }

//   render () {
//     const { getCurrentBlockKey, block, setReadOnly } = this.props
//     const hasFocus =  getCurrentBlockKey() === block.getKey() 
//     const status = hasFocus ? 'focused' : 'blurred'
//     return (
//       <div className={`focusBlock ${status}`} onClick={this.handleClick}>
//         {this.props.children({
//           hasFocus,
//           setReadOnly: setReadOnly
//         })}
//       </div>
//     )
//   }
// }

export class Focus extends PureComponent<Props, object> {
  componentDidMount () {
    this.props.addFocusBlockKey(this.props.block.getKey())
  }

  componentWillUnmount () {
    this.props.removeFocusBlockKey(this.props.block.getKey())
  }

  handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    const { currentBlockKey, setFocusToBlock, block } = this.props
    if (currentBlockKey !== block.getKey())
    setFocusToBlock(block.getKey())
  }

  render () {
    const { currentBlockKey, block, setReadOnly } = this.props
    const hasFocus =  currentBlockKey === block.getKey() 
    const status = hasFocus ? 'focused' : 'blurred'
    return (
      <div className={`focusBlock ${status}`} onClick={this.handleClick}>
        {this.props.children({
          hasFocus,
          setReadOnly: setReadOnly
        })}
      </div>
    )
  }
}
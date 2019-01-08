import React, { PureComponent, useRef, useCallback } from 'react'
import { Map } from 'immutable'
import './AddButton.css'

interface injectedProps {
  topOffset: number | null
  visibility: boolean
  displayChildren: boolean
  handleButtonClick(): void
  handleChildClick(): void
  changeEditorState(type: "section" | "video-block" | "image-block", data?: Map<any, any>): void
}
interface Props {
  topOffset: number | null
  visibility: boolean
  hideButton(): void
  focusEditor(): void
  changeEditorState(type: "section" | "video-block" | "image-block", data?: Map<any, any>): void
  children(props: injectedProps): JSX.Element
}
interface State {
  displayChildren: boolean
}


// how to implement shouldComponentUpdate(compare both props and state) in hooks
// React.memo only compare props
class BaseButton extends PureComponent<Props, State> {
  state = {
    displayChildren: false
  }
  componentDidUpdate () {
    if (!this.props.visibility) {
      this.setState({displayChildren: false})
    }
  }
  handleButtonClick = () => {
    if (!this.props.visibility) return
    this.setState({displayChildren: !this.state.displayChildren})
  }
  handleChildClick = () => {
    this.props.hideButton()
  }
  render () {
    const { topOffset, visibility, changeEditorState } = this.props
    return this.props.children({
      topOffset,
      visibility,
      displayChildren: this.state.displayChildren,
      handleButtonClick: this.handleButtonClick,
      handleChildClick: this.handleChildClick,
      changeEditorState
    })
  }
}


export const AddButton = React.memo(({
  topOffset,
  visibility,
  hideButton,
  focusEditor,
  changeEditorState
}: {
  topOffset: number | null
  visibility: boolean
  hideButton: () => void
  focusEditor: () => void
  changeEditorState(type: "section" | "video-block" | "image-block", data?: Map<any, any>): void
}): JSX.Element => {
  return (
    <BaseButton
      topOffset={topOffset}
      visibility={visibility}
      hideButton={hideButton}
      focusEditor={focusEditor}
      changeEditorState={changeEditorState}
    >
      {
        ({
          topOffset,
          visibility,
          displayChildren,
          handleButtonClick,
          handleChildClick,
          changeEditorState
        }) => (
          <ToolTip topOffset={topOffset} visibility={visibility}>
            <ToolButton iconStatus={displayChildren} onButtonClick={handleButtonClick} />
            <ToolMenu openMenu={displayChildren} onChildClick={handleChildClick}>
              <ImgBtn visibility={displayChildren} changeEditorState={changeEditorState} />
              <VideoBtn visibility={displayChildren} changeEditorState={changeEditorState} />
              <SectionBtn visibility={displayChildren} changeEditorState={changeEditorState} />
            </ToolMenu>
          </ToolTip>
        )
      }
    </BaseButton>
  )
})

function ToolTip ({
  topOffset,
  visibility,
  ...props
}: {
  topOffset: number | null
  visibility: boolean
}) {
  const style: {
    top?: number,
    visibility?: 'hidden'
  } = topOffset === null
    ? { visibility: 'hidden' }
    : visibility
      ? { top: topOffset}
      : { top: topOffset, visibility: 'hidden'}
  return (
    <div 
      className="tooltip"
      style={style}
      {...props}
    />
  )
}

function ToolButton ({
  onButtonClick,
  iconStatus,
  ...props
}: {
  onButtonClick: () => void
  iconStatus: boolean
}) {
  const status = iconStatus ? 'close' : 'add'
  return (
    <button className={`tooltip-button ${status}`} onClick={onButtonClick} {...props}>
      <svg className="add-svg">
        <path d="M20 12h-7V5h-1v7H5v1h7v7h1v-7h7" fillRule="evenodd"></path>
      </svg>
    </button>
  )
}

function ToolMenu ({
  openMenu,
  onChildClick,
  ...props
}: {
  openMenu: boolean
  onChildClick: () => void
}) {
  const status = openMenu ? 'showing' : 'hiding'
  return (
    <div
      className={`tooltip-menu ${status}`}
      // style={openMenu ? {} : {display: "none"}}
      style={{visibility: openMenu ? 'visible' : 'hidden'}}
      onClick={onChildClick}
      {...props}
    />
  )
}

function ImgBtn ({
  visibility,
  changeEditorState,
  ...props
}:{
  visibility: boolean
  changeEditorState(type: "section" | "video-block" | "image-block", data?: Map<any, any>): void
}) {
  const inputEl = useRef(null)
  const handleClick = useCallback(() => {
    const input = inputEl.current
    if (input !== null) {
      (input as HTMLInputElement).click()
    }
  }, [])
  const handleChange = useCallback(async (e: React.SyntheticEvent): Promise<void> => {
    const target = e.target as any
    const file = target.files[0]
    if (file.type.indexOf('image/') === 0) {
      const src = window.URL.createObjectURL(file)
      const image = new Image()
      image.src = src
      const { width, height } = await new Promise(resolve => {
        if (image.complete) {
          resolve({
            width: image.width,
            height: image.height
          })
        } else {
          image.onload = () => {
            resolve({
              width: image.width,
              height: image.height
            })
          }
        }
      })
      const data = Map({
        src,
        width,
        height
      })
      changeEditorState('image-block', data)
    }
  }, [])
  const handleInputClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLInputElement
    target.value = ''
  }, [])
  const status = visibility ? 'showing' : 'hiding'
  return (
    <>
      <button className={`tooltip-menu-btn img-btn ${status}`} onClick={handleClick} {...props}>
        <svg className="tooltip-svg img-svg">
          <g fillRule="evenodd"><path d="M4.042 17.05V8.857c0-1.088.842-1.85 1.935-1.85H8.43C8.867 6.262 9.243 5 9.6 5.01L15.405 5c.303 0 .755 1.322 1.177 2 0 .077 2.493 0 2.493 0 1.094 0 1.967.763 1.967 1.85v8.194c-.002 1.09-.873 1.943-1.967 1.943H5.977c-1.093.007-1.935-.85-1.935-1.937zm2.173-9.046c-.626 0-1.173.547-1.173 1.173v7.686c0 .625.547 1.146 1.173 1.146h12.683c.625 0 1.144-.53 1.144-1.15V9.173c0-.626-.52-1.173-1.144-1.173h-3.025c-.24-.63-.73-1.92-.873-2 0 0-5.052.006-5 0-.212.106-.87 2-.87 2l-2.915.003z"></path><path d="M12.484 15.977a3.474 3.474 0 0 1-3.488-3.49A3.473 3.473 0 0 1 12.484 9a3.474 3.474 0 0 1 3.488 3.488c0 1.94-1.55 3.49-3.488 3.49zm0-6.08c-1.407 0-2.59 1.183-2.59 2.59 0 1.408 1.183 2.593 2.59 2.593 1.407 0 2.59-1.185 2.59-2.592 0-1.406-1.183-2.592-2.59-2.592z"></path></g>
        </svg>
      </button>
      <input
        ref={inputEl}
        type="file"
        accept="image/*"
        onChange={handleChange}
        onClick={handleInputClick}
        style={{display: "none"}}
      />
    </>
  )
}

function VideoBtn ({
  visibility,
  changeEditorState,
  ...props
}:{
  visibility: boolean
  changeEditorState(type: "section" | "video-block" | "image-block", data?: Map<any, any>): void
}) {
  const status = visibility ? 'showing' : 'hiding'
  return (
    <button className={`tooltip-menu-btn video-btn ${status}`} {...props}>
      <svg className="tooltip-svg video-svg">
        <path d="M18.8 11.536L9.23 5.204C8.662 4.78 8 5.237 8 5.944v13.16c0 .708.662 1.165 1.23.74l9.57-6.33c.514-.394.606-1.516 0-1.978zm-.993 1.45l-8.294 5.267c-.297.213-.513.098-.513-.264V7.05c0-.36.218-.477.513-.264l8.294 5.267c.257.21.257.736 0 .933z" fillRule="evenodd"></path>
      </svg>
    </button>
  )
}

function SectionBtn ({
  visibility,
  changeEditorState,
  ...props
}:{
  visibility: boolean
  changeEditorState(type: "section" | "video-block" | "image-block", data?: Map<any, any>): void
}) {
  const handleClick = useCallback(() => {
    changeEditorState('section')
  }, [])
  const status = visibility ? 'showing' : 'hiding'
  return (
    <button className={`tooltip-menu-btn section-btn ${status}`} onClick={handleClick} {...props}>
      <svg className="tooltip-svg section-svg">
        <g fillRule="evenodd">
          <path d="M8.45 12H5.3c-.247 0-.45.224-.45.5 0 .274.203.5.45.5h5.4c.247 0 .45-.226.45-.5 0-.276-.203-.5-.45-.5H8.45z"></path>
          <path d="M17.45 12H14.3c-.247 0-.45.224-.45.5 0 .274.203.5.45.5h5.4c.248 0 .45-.226.45-.5 0-.276-.202-.5-.45-.5h-2.25z"></path>
        </g>
      </svg>
    </button>
  )
}
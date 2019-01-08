import React, { Component, PureComponent, useRef, useState, useEffect, useCallback } from 'react'
import { EditorState } from 'draft-js'
import { OrderedSet } from 'immutable'
import './InlineToolTip.css'

interface Props {
  position: {
    top: number
    left: number
    width: number
  } | null
  visibility: boolean
  toolList: string[] | null
  activeStyle: OrderedSet<string> | null
  changeInlineStyle(style: string): void
  changeBlockType(type: string): void
  changeBlockAlignment(alignment: string): void
  confirmLink(url: string): void
  removeLink(): void
}

export const InlineToolTip = React.memo(({
  position,
  visibility,
  toolList,
  activeStyle,
  changeInlineStyle,
  changeBlockType,
  changeBlockAlignment,
  confirmLink,
  removeLink
}: Props): JSX.Element | null => {
  const [showInput, setShowInput] = useState(false)
  useEffect(() => {
   setShowInput(false) 
  }, [visibility, position])
  return (
    (position && toolList) 
    &&
    <Popover position={position} visibility={visibility}>
      {showInput 
        ? <LinkInput setShowInput={setShowInput} confirmLink={confirmLink} />
        : <InlineToolSet toolList={toolList}>
            <Bold active={!!activeStyle && activeStyle.includes('BOLD')} changeInlineStyle={changeInlineStyle} />
            <Italic active={!!activeStyle && activeStyle.includes('ITALIC')} changeInlineStyle={changeInlineStyle} />
            <Link active={!!activeStyle && activeStyle.includes('LINK')} setShowInput={setShowInput} removeLink={removeLink} />
            <Separator />
            <H3 active={!!activeStyle && activeStyle.includes('H3')} changeBlockType={changeBlockType} />
            <H4 active={!!activeStyle && activeStyle.includes('H4')} changeBlockType={changeBlockType} />
            <BlockQuote active={!!activeStyle && activeStyle.includes('BLOCKQUOTE')} changeBlockType={changeBlockType} />
            <Outsetleft active={!!activeStyle && activeStyle.includes('OUTSETLEFT')} changeBlockAlignment={changeBlockAlignment} />
            <Insetcenter active={!!activeStyle && activeStyle.includes('INSETCENTER')} changeBlockAlignment={changeBlockAlignment} />
            <Outsetcenter active={!!activeStyle && activeStyle.includes('OUTSETCENTER')} changeBlockAlignment={changeBlockAlignment} />
            <Fillwidth active={!!activeStyle && activeStyle.includes('FILLWIDTH')} changeBlockAlignment={changeBlockAlignment} />
          </InlineToolSet>
      }
    </Popover>
  )
}) 
  // toggleTool = (type: string): void => {
  //   const activeTools: string[] = this.state.activeTools 
  //   if (activeTools.includes(type)) {
  //     const newActiveTools = activeTools.filter(toolType => toolType !== type)
  //     this.setState({
  //       activeTools: newActiveTools
  //     })
  //   } else {
  //     this.setState({
  //       activeTools: [...activeTools, type]
  //     })
  //   }
  // }

function getEditorWrapperOffset (): {wrapperTop: number; wrapperLeft: number;} {
  const editorWrapper = document.querySelector('.editor-wrapper') as Element
  const wrapperRect = editorWrapper.getBoundingClientRect()
  const wrapperTop = wrapperRect.top + window.pageYOffset
  const wrapperLeft = wrapperRect.left + window.pageXOffset
  return {
    wrapperTop,
    wrapperLeft
  }
}

function Popover ({
  position,
  visibility,
  children,
  ...props
}: {
  position: {
    top: number
    left: number
    width: number
  }
  visibility: boolean
  children: JSX.Element
}): JSX.Element {
  const popoverRef = useRef(null)
  const [style, setStyle] = useState(
    { top: 0, left: 0, visibility: 'hidden'} as { top: number, left: number, visibility: 'visible' | 'hidden'}
  )
  useEffect(() => {
    const { clientWidth, clientHeight } = popoverRef.current as any
    const { top, left, width } = position
    const { wrapperTop, wrapperLeft } = getEditorWrapperOffset()
    setStyle((prevState: {
      top: number
      left: number
      visibility: 'visible' | 'hidden'
    }) => ({
      ...prevState,
      top: top - clientHeight - wrapperTop,
      left: left + Math.floor((width - clientWidth) / 2 ) - wrapperLeft,
      visibility: visibility ? 'visible' : 'hidden'
    }))
  }, [position, visibility, children])
  const status = visibility ? 'showing' : 'hiding'
  return (
    <div className={`popover ${status}`} ref={popoverRef} style={style} {...props}>
      <div className="popover-content">
        {children}
      </div>
      <div className="popover-arrow"></div>
    </div>
  )
}

function InlineToolSet ({
  toolList,
  children,
  ...props
}: {
  toolList: string[]
  children: JSX.Element[]
}): JSX.Element {
  return (
    <div className="inlineToolSet" {...props}>
      {children.filter(element => {
        const type = element.type as React.ComponentClass | React.FunctionComponent
        const name = type.displayName || type.name
        const styleName = (name as string).toLocaleUpperCase()
        return toolList.includes(styleName) || (name === 'Separator' && toolList.includes('H3'))
      })}
    </div>
  )
}

function Separator (props: object) {
  const style = {
    width: 1,
    height: 24,
    margin: '0 6px',
    background: 'rgba(255, 255, 255, 0.2)'
  }
  return (
    <div className="inline-separator" style={style} />
  )
}

function Bold ({
  active,
  changeInlineStyle,
  ...props
}: {
  active: boolean
  changeInlineStyle(style: string): void
}) {
  const status = active ? 'activated' : 'unactivated'
  const handleBoldClick = useCallback(() => {
    changeInlineStyle('BOLD')
  }, [])
  return (
    <button className="inline-btn bold" onClick={handleBoldClick} {...props}>
      <svg className={`inline-svg bold-svg ${status}`}>
        <path d="M10.308 17.993h-5.92l.11-.894.783-.12c.56-.11.79-.224.79-.448V5.37c0-.225-.113-.336-.902-.448H4.5l-.114-.894h6.255c4.02 0 5.58 1.23 5.58 3.13 0 1.896-1.78 3.125-3.79 3.463v.11c2.69.34 4.25 1.56 4.25 3.57 0 2.35-2.01 3.69-6.37 3.69l.02.01h-.02zm-.335-12.96H8.967V10.5h1.23c1.788 0 2.79-1.23 2.79-2.683 0-1.685-1.004-2.803-3.006-2.803v.02zm-.223 6.36h-.783v5.588l1.225.23h.22c1.67 0 3.01-1.004 3.01-2.792 0-2.122-1.566-3.016-3.69-3.016h.018z" fillRule="evenodd"></path>
      </svg>
    </button>
  )
}


function Italic ({
  active,
  changeInlineStyle,
  ...props
}: {
  active: boolean
  changeInlineStyle(style: string): void
}) {
  const status = active ? 'activated' : 'unactivated'
  const handleItalicClick = useCallback(() => {
    changeInlineStyle('ITALIC')
  }, [])
  return (
    <button className="inline-btn italic" onClick={handleItalicClick} {...props}>
      <svg className={`inline-svg italic-svg ${status}`}>
        <path d="M9.847 18.04c-.533 0-2.027-.64-1.92-.853l2.027-7.68-.64-.214-1.387 1.494-.427-.427c.534-1.173 1.707-2.667 2.774-2.667.533 0 2.24.534 2.133.854l-2.133 7.786.533.214 1.6-1.067.427.427c-.64 1.066-1.92 2.133-2.987 2.133zm2.347-11.733c-.96 0-1.387-.64-1.387-1.387 0-1.067.747-1.92 1.493-1.92.854 0 1.387.64 1.387 1.493-.107 1.067-.747 1.814-1.493 1.814z" fillRule="evenodd"></path>
      </svg>
    </button>
  )
}

function H3 ({
  active,
  changeBlockType,
  ...props
}: {
  active: boolean
  changeBlockType(type: string): void
}) {
  const status = active ? 'activated' : 'unactivated'
  const handleH3Click = useCallback(() => {
    changeBlockType('header-three')
  }, [])
  return (
    <button className="inline-btn h3" onClick={handleH3Click} {...props}>
      <svg className={`inline-svg h3-svg ${status}`}>
        <path d="M3 2v4.747h1.656l.383-2.568.384-.311h3.88V15.82l-.408.38-1.56.12V18h7.174v-1.68l-1.56-.12-.407-.38V3.868h3.879l.36.311.407 2.568h1.656V2z" fillRule="evenodd"></path>
      </svg>
    </button>
  )
}

function H4 ({
  active,
  changeBlockType,
  ...props
}: {
  active: boolean
  changeBlockType(type: string): void
}) {
  const status = active ? 'activated' : 'unactivated'
  const handleH4Click = useCallback(() => {
    changeBlockType('header-four')
  }, [])
  return (
    <button className="inline-btn h4" onClick={handleH4Click} {...props}>
      <svg className={`inline-svg h4-svg ${status}`}>
        <path d="M4 5.5v4.74h1.657l.384-2.569.384-.312h2.733v8.461l-.41.38-1.91.12V18h7.179v-1.68l-1.912-.12-.405-.38V7.359h2.729l.36.312.408 2.57h1.657V5.5z" fillRule="evenodd"></path>
      </svg>
    </button>
  )
}

function BlockQuote ({
  active,
  changeBlockType,
  ...props
}: {
  active: boolean
  changeBlockType(type: string): void
}) {
  const status = active ? 'activated' : 'unactivated'
  const handleBlockQuoteClick = useCallback(() => {
    changeBlockType('blockquote')
  }, [])
  return (
    <button className="inline-btn blockquote" onClick={handleBlockQuoteClick} {...props}>
      <svg className={`inline-svg blockquote-svg ${status}`}>
        <path d="M15.48 18.024c-2.603 0-4.45-2.172-4.45-4.778 0-3.263 2.498-6.3 6.517-8.803l1.297 1.303c-2.497 1.63-3.91 3.042-3.91 5.214 0 2.824 3.91 3.582 3.91 3.91.11 1.41-1.194 3.15-3.366 3.15h.004v.004z"></path>
        <path d="M6.578 18.024c-2.606 0-4.453-2.172-4.453-4.778 0-3.263 2.497-6.3 6.515-8.803l1.303 1.303c-2.606 1.63-3.907 3.042-3.907 5.106 0 2.823 3.91 3.58 3.91 3.91 0 1.518-1.304 3.257-3.368 3.257z"></path>
      </svg>
    </button>
  )
}

function Link ({
  active,
  setShowInput,
  removeLink,
  ...props
}: {
  active: boolean
  setShowInput: React.Dispatch<React.SetStateAction<boolean>>
  removeLink(): void
}) {
  const status = active ? 'activated' : 'unactivated'
  const handleLinkClick = useCallback(() => {
    if (!active) {
      setShowInput(true)
    } else {
      removeLink()
    }
  }, [active])
  return (
    <button className="inline-btn link-btn" onClick={handleLinkClick} {...props}>
      <svg className={`inline-svg link-svg ${status}`}>
        <path d="M2.2 13.17c0-.575.125-1.11.375-1.605l.02-.018v-.02c.014 0 .02-.008.02-.02 0-.014 0-.02.02-.02.122-.256.31-.52.576-.805l3.19-3.18c0-.008 0-.015.01-.02.01-.006.01-.013.01-.02.44-.413.91-.7 1.44-.853-.63.71-1.03 1.5-1.19 2.36-.04.24-.06.52-.06.81 0 .14.01.24.02.33L4.67 12.1c-.19.19-.316.407-.376.653a1.33 1.33 0 0 0-.057.415c0 .155.02.314.06.477.075.21.2.403.376.58l1.286 1.31c.27.276.62.416 1.03.416.42 0 .78-.14 1.06-.42l1.23-1.25.79-.78 1.15-1.16c.08-.09.19-.22.28-.4.103-.2.15-.42.15-.67 0-.16-.02-.31-.056-.45l-.02-.02v-.02l-.07-.14c0-.01-.013-.03-.04-.06l-.06-.13-.02-.02c0-.02-.01-.03-.02-.05a.592.592 0 0 0-.143-.16l-.48-.5c0-.042.015-.1.04-.15l.06-.12 1.17-1.14.087-.09.56.57c.023.04.08.1.16.18l.05.04c.006.018.02.036.035.06l.04.054c.01.01.02.025.03.04.03.023.04.046.04.058.04.04.08.09.1.14l.02.02c0 .018.01.03.024.04l.105.197v.02c.098.157.19.384.297.68a1 1 0 0 1 .04.255c.06.21.08.443.08.7 0 .22-.02.43-.06.63-.12.71-.44 1.334-.95 1.865l-.66.67-.97.972-1.554 1.57C8.806 17.654 7.98 18 7.01 18s-1.8-.34-2.487-1.026l-1.296-1.308a3.545 3.545 0 0 1-.913-1.627 4.541 4.541 0 0 1-.102-.88v-.01l-.012.01zm5.385-3.433c0-.183.023-.393.07-.63.13-.737.448-1.362.956-1.87l.66-.662.97-.983 1.56-1.56C12.48 3.34 13.3 3 14.27 3c.97 0 1.8.34 2.483 1.022l1.29 1.314c.44.438.744.976.913 1.618.067.32.102.614.102.87 0 .577-.123 1.11-.375 1.605l-.02.01v.02l-.02.04c-.148.27-.35.54-.6.81l-3.187 3.19c0 .01 0 .01-.01.02-.01 0-.01.01-.01.02-.434.42-.916.7-1.427.83.63-.67 1.03-1.46 1.19-2.36.04-.26.06-.53.06-.81 0-.14-.01-.26-.02-.35l1.99-1.97c.18-.21.3-.42.35-.65.04-.12.05-.26.05-.42 0-.16-.02-.31-.06-.48-.07-.19-.19-.38-.36-.58l-1.3-1.3a1.488 1.488 0 0 0-1.06-.42c-.42 0-.77.14-1.06.41L11.98 6.7l-.79.793-1.157 1.16c-.088.075-.186.21-.294.4-.09.233-.14.46-.14.67 0 .16.02.31.06.452l.02.02v.023l.06.144c0 .006.01.026.05.06l.06.125.02.02c0 .01 0 .013.01.02 0 .005.01.01.01.02.05.08.1.134.14.16l.47.5c0 .04-.02.093-.04.15l-.06.12-1.15 1.15-.1.08-.56-.56a2.31 2.31 0 0 0-.18-.187c-.02-.01-.02-.03-.02-.04l-.02-.02a.375.375 0 0 1-.1-.122c-.03-.024-.05-.043-.05-.06l-.1-.15-.02-.02-.02-.04L8 11.4v-.02a5.095 5.095 0 0 1-.283-.69 1.035 1.035 0 0 1-.04-.257 2.619 2.619 0 0 1-.093-.7v.007z" fillRule="evenodd"></path>
      </svg>
    </button>
  )
}

function LinkInput ({
  setShowInput,
  confirmLink,
  ...props
}: {
  setShowInput: React.Dispatch<React.SetStateAction<boolean>>
  confirmLink(url: string): void
}) {
  const [value, setValue] = useState('')
  const handleChange = useCallback((e: React.SyntheticEvent<HTMLInputElement>) => {
    setValue((e.target as HTMLInputElement).value)
  }, [])
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.keyCode === 13 && value) {
      e.preventDefault()
      confirmLink(value)
      setShowInput(false)
    }
  }, [value])
  const handleClick = useCallback(() => {
    setValue('')
    setShowInput(false)
  }, [])
  return (
    <div className="linkinput" {...props}>
      <input
        className="linkinput-field"
        type="text"
        placeholder="Paste or type a link…"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <button className="linkinput-button" onClick={handleClick}>
        <svg className="linkinput-svg-cancel">
          <path d="M13.792 4.6l-4.29 4.29-4.29-4.29-.612.613 4.29 4.29-4.29 4.29.613.612 4.29-4.29 4.29 4.29.612-.613-4.29-4.29 4.29-4.29" fillRule="evenodd"></path>
        </svg>
      </button>
    </div>
  )
}

function Outsetleft ({
  active,
  changeBlockAlignment,
  ...props
}: {
  active: boolean
  changeBlockAlignment(alignment: string): void
}) {
  const status = active ? 'activated' : 'unactivated'
  const handleOutsetleftClick = useCallback(() => {
    changeBlockAlignment('OUTSETLEFT')
  }, [])
  return (
    <button className="inline-btn outsetleft" onClick={handleOutsetleftClick} {...props}>
      <svg className={`block-svg outsetleft-svg ${status}`}>
        <path d="M2 16.99V9.047c0-.112.042-.22.123-.32a.384.384 0 0 1 .32-.152h11.93c.102 0 .2.05.296.15.09.103.14.21.14.322v7.943c0 .122-.05.225-.14.31a.44.44 0 0 1-.31.13H2.44a.427.427 0 0 1-.44-.44zm5.847 3.517v-.87c0-.1.038-.194.114-.28.08-.086.17-.13.27-.13h14.22c.13 0 .23.046.32.14.09.09.14.18.14.27v.87a.42.42 0 0 1-.14.332c-.09.08-.19.13-.31.13H8.23a.34.34 0 0 1-.274-.14.545.545 0 0 1-.107-.34zm0-14.108v-.92c0-.13.038-.23.114-.32a.35.35 0 0 1 .27-.13h14.22c.13 0 .23.04.32.13s.14.19.14.31v.92c0 .09-.04.18-.14.26-.09.08-.19.13-.31.13H8.23c-.1 0-.19-.05-.267-.13a.447.447 0 0 1-.11-.27zm8.497 7.09v-.9c0-.15.048-.27.144-.37a.477.477 0 0 1 .328-.14l5.624-.01c.12 0 .23.04.32.14.093.09.14.21.14.36v.9c0 .11-.047.21-.14.32-.09.1-.2.15-.32.15l-5.625.01c-.12 0-.23-.05-.327-.15a.467.467 0 0 1-.144-.33zm0-3.58v-.86c0-.11.048-.22.144-.32.097-.1.207-.16.328-.15l5.624-.01c.12 0 .23.05.32.15.092.1.14.21.14.32v.87c0 .13-.047.24-.14.32-.09.08-.2.12-.32.12l-5.625.01a.45.45 0 0 1-.334-.13.408.408 0 0 1-.13-.32zm0 7.04v-.9c0-.15.05-.27.146-.37a.474.474 0 0 1 .327-.14l5.624-.01c.13 0 .23.04.33.14.09.09.14.21.14.36v.89c0 .11-.04.21-.13.32-.09.1-.2.15-.32.15l-5.62.01c-.12 0-.23-.05-.32-.16a.485.485 0 0 1-.14-.32z" fillRule="evenodd"></path>
      </svg>
    </button>
  )
}

function Insetcenter ({
  active,
  changeBlockAlignment,
  ...props
}: {
  active: boolean
  changeBlockAlignment(alignment: string): void
}) {
  const status = active ? 'activated' : 'unactivated'
  const handleInsetcenterClick = useCallback(() => {
    changeBlockAlignment('INSETCENTER')
  }, [])
  return (
    <button className="inline-btn insetcenter" onClick={handleInsetcenterClick} {...props}>
      <svg className={`block-svg insetcenter-svg ${status}`}>
        <path d="M5 20.558v-.9c0-.122.04-.226.122-.312a.404.404 0 0 1 .305-.13h13.347a.45.45 0 0 1 .32.13c.092.086.138.19.138.312v.9a.412.412 0 0 1-.138.313.435.435 0 0 1-.32.13H5.427a.39.39 0 0 1-.305-.13.432.432 0 0 1-.122-.31zm0-3.554V9.01c0-.12.04-.225.122-.31a.4.4 0 0 1 .305-.13h13.347c.122 0 .23.043.32.13.092.085.138.19.138.31v7.994a.462.462 0 0 1-.138.328.424.424 0 0 1-.32.145H5.427a.382.382 0 0 1-.305-.145.501.501 0 0 1-.122-.328zM5 6.342v-.87c0-.12.04-.23.122-.327A.382.382 0 0 1 5.427 5h13.347c.122 0 .23.048.32.145a.462.462 0 0 1 .138.328v.87c0 .12-.046.225-.138.31a.447.447 0 0 1-.32.13H5.427a.4.4 0 0 1-.305-.13.44.44 0 0 1-.122-.31z" fillRule="evenodd"></path>
      </svg>
    </button>
  )
}

function Outsetcenter ({
  active,
  changeBlockAlignment,
  ...props
}: {
  active: boolean
  changeBlockAlignment(alignment: string): void
}) {
  const status = active ? 'activated' : 'unactivated'
  const handleOutsetcenterClick = useCallback(() => {
    changeBlockAlignment('OUTSETCENTER')
  }, [])
  return (
    <button className="inline-btn outsetcenter" onClick={handleOutsetcenterClick} {...props}>
      <svg className={`block-svg outsetcenter-svg ${status}`}>
        <path d="M3 17.004V9.01a.4.4 0 0 1 .145-.31.476.476 0 0 1 .328-.13h17.74c.12 0 .23.043.327.13a.4.4 0 0 1 .145.31v7.994a.404.404 0 0 1-.145.313.48.48 0 0 1-.328.13H3.472a.483.483 0 0 1-.327-.13.402.402 0 0 1-.145-.313zm2.212 3.554v-.87c0-.13.05-.243.145-.334a.472.472 0 0 1 .328-.137H19c.124 0 .23.045.322.137a.457.457 0 0 1 .138.335v.86c0 .12-.046.22-.138.31a.478.478 0 0 1-.32.13H5.684a.514.514 0 0 1-.328-.13.415.415 0 0 1-.145-.32zm0-14.246v-.84c0-.132.05-.243.145-.334A.477.477 0 0 1 5.685 5H19a.44.44 0 0 1 .322.138.455.455 0 0 1 .138.335v.84a.451.451 0 0 1-.138.334.446.446 0 0 1-.32.138H5.684a.466.466 0 0 1-.328-.138.447.447 0 0 1-.145-.335z" fillRule="evenodd"></path>
      </svg>
    </button>
  )
}

function Fillwidth ({
  active,
  changeBlockAlignment,
  ...props
}: {
  active: boolean
  changeBlockAlignment(alignment: string): void
}) {
  const status = active ? 'activated' : 'unactivated'
  const handleFillwidthClick = useCallback(() => {
    changeBlockAlignment('FILLWIDTH')
  }, [])
  return (
    <button className="inline-btn fillwidth" onClick={handleFillwidthClick} {...props}>
      <svg className={`block-svg fillwidth-svg ${status}`}>
      <path d="M4.027 17.24V5.492c0-.117.046-.216.14-.3a.453.453 0 0 1 .313-.123h17.007c.117 0 .22.04.313.12.093.08.14.18.14.3v11.74c0 .11-.046.21-.14.3a.469.469 0 0 1-.313.12H4.48a.432.432 0 0 1-.314-.13.41.41 0 0 1-.14-.3zm2.943 3.407v-.833a.45.45 0 0 1 .122-.322.387.387 0 0 1 .276-.132H18.61a.35.35 0 0 1 .27.132.472.472 0 0 1 .116.322v.833c0 .117-.04.216-.116.3a.361.361 0 0 1-.27.123H7.368a.374.374 0 0 1-.276-.124.405.405 0 0 1-.122-.3z" fillRule="evenodd"></path>
      </svg>
    </button>
  )
}


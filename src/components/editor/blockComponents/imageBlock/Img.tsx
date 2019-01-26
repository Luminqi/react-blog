import React, { useEffect, useLayoutEffect } from 'react'
import {
  ContentBlock,
  ContentState,
} from 'draft-js'
import MediumEditor from '../../Editor'
import { setNativeSelection } from '../../utils/setNativeSelection'
import { useAlignment } from '../alignmentBlock/Alignment'
import './Img.css'


interface Props {
  block: ContentBlock
  contentState: ContentState
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

export function Img ({ block, contentState } : Props) {
  const key = block.getKey()
  useEffect(() => {
    setNativeSelection(key)
  }, [])
  const { alignment } = useAlignment(block)
  const data = block.getData()
  const src = data.get('src')
  const { width, height } = processImageSize(data.get('width'), data.get('height'))
  let alignmentStyle = {}
  const imgBlockNode = document.querySelector(`[data-offset-key="${key}-0-0"]`)
  useLayoutEffect(() => {
    if (imgBlockNode) {
      if (alignment === 'OUTSETLEFT') {
        imgBlockNode.classList.add('outsetleft')
      } else {
        imgBlockNode.classList.remove('outsetleft')
      }
    }
  }, [alignment])
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
            hasFocus,
            handleClick
          }: {
            hasFocus: boolean
            handleClick(e: React.MouseEvent<HTMLElement>): void
          }) => (
            <img
              className={`image ${hasFocus ? 'focused' : 'blurred'} ${alignment.toLocaleLowerCase()}`}
              style={{
                width,
                height,
                ...alignmentStyle
              }}
              src={src}
              onClick={handleClick}
            />
          )
        }
      </MediumEditor.Focus>
  )
}


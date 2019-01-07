import React from 'react'
import {
  ContentBlock,
  ContentState
} from 'draft-js'
import './Section.css'

interface Props {
  block: ContentBlock
  contentState: ContentState
}

export function Section ({ block } : Props) {
  console.log('section component')
  return (
    <hr className="section-divider" />
  )
}
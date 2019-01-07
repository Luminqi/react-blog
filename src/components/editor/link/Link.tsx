import React from 'react'
import { ContentState } from 'draft-js';

interface Props {
  contentState: ContentState
  entityKey: string
  children: JSX.Element
}

export function Link (props: Props ) {
  const {url} = props.contentState.getEntity(props.entityKey).getData()
  return (
    <a className="link" href={url} style={{textDecoration: 'underline'}}>
      {props.children}
    </a>
  )
}
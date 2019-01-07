import React, { useState, useEffect } from 'react'

function useTest (state: number) {
  useEffect(() => {
   console.log('useTest, state: ', state) 
  })
}

export default function Test () {
  const [state, setState] = useState(0)
  useTest(state)
  useEffect(() => {
    console.log('in effect')
  })
  return (
    <button onClick={() => setState(0)}>Click {state}</button>
  )
}

import React, { useState, useEffect } from 'react'

function useTest (state: number) {
  useEffect(() => {
   console.log('useTest, state: ', state) 
  })
}

const Button = React.memo(({ setState, ...props }: { setState: React.Dispatch<React.SetStateAction<number>>}) => {
  useEffect(() => {
    console.log('in button effect')
  })
  return (
    <button onClick={() => setState(0)}>Click</button>
  )
})

export default function Test () {
  const [state, setState] = useState(0)
  useTest(state)
  useEffect(() => {
    console.log('in test effect')
  })
  return (
    <div>
      <Button setState={setState} />
      {state}
    </div>
  )
}

import React, { useReducer, useRef, useState } from 'react'
import { Observable, Observer, merge } from 'rxjs';
import { debounceTime, switchMap, filter, map, tap, takeUntil, mapTo } from 'rxjs/operators'
import { useEventCallback } from 'rxjs-hooks'
import {
  State,
  Action,
  ClearButtonProps,
  InputProps,
  ToggleButtonProps,
  ItemProps
} from './types'
import { callAll, combineReducers } from './util'
import {
  Warn,
  SearchIcon,
  Loading,
  ClearButton,
  ToggleButton,
  Menu
} from './childComponents'
import './AutoComplete.css'

const autoCompleteReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case 'clear': {
      return {
        ...state,
        inputValue: ''
      }
    }
    case 'open': {
      return {
        ...state,
        isOpen: true
      }
    }
    case 'close': {
      return {
        ...state,
        isOpen: false
      }
    }
    case 'toggle': {
      return {
        ...state,
        isOpen: !state.isOpen
      }
    }
    case 'change': {
      return {
        ...state,
        inputValue: action.payload.inputValue
      }
    }
    case 'select': {
      return {
        ...state,
        inputValue: action.payload.selectedValue
      }
    }
    default: return state
  }
}


// just a example how to use 'stateReducer' to change the bahaviour of the component
const addEmojis = (state: State, action: Action): State => {
  switch (action.type) {
    case 'change': {
      let value = state.inputValue
      const pattern = /.*smile$/g
      if (pattern.test(value)) {
        value = value.slice(0, value.length - 5) + '😜'
      }
      return {
        ...state,
        inputValue: value
      }
    }
    default: return state
  }
}

/* The idea comes from module 'downshift'. To write a highly reusable component,
you have to decide what part of code you want to share with the users. The more
decisions you make, the more useful you can be for some particular use cases.
The fewer decisions you make, the more reusable and flexible your component can
be. There is a balance here.

For the autocomplete, I decided to make no decisions about what it looks like,
but take control of the user interactions and state changes.

There are two useful pattern I learned from 'downshift':

1. stateReducer: 'downshift' is written before React hooks publish. And I find
this pattern can just replaced by 'useReducer'.

2. prop getters: Instead of rendering things for users and exposing many options
to allow for extensibility, provide 'prop getters' which are just functions used
to apply props to elements. And this is the user's responsibility to apply the
prop getters to the appropriate element.

'downshift' uses 'render prop' to reuse code. I think use React hooks can make
implementation easier and more straightforward. */
 
function useAutoComplete ({
  stateReducer = (state: State, action: Action) => state
} = {}) {
  const [state, dispatch] = useReducer(
    combineReducers(autoCompleteReducer, stateReducer),
    { inputValue: '', isOpen: false }
  )
  const handleEvent = (type: string, payload?: object) => () => {
    const action = payload ? { type, payload } : { type }
    dispatch(action)
  }
  const getInputProps = ({
    onChange = undefined, ...props
  }: InputProps = {}) => {
    const handleChange = (e: React.ChangeEvent) => {
      const value = (e.target as HTMLInputElement).value
      dispatch({type: 'change', payload: { inputValue: value}})
    } 
    return {
      value: state.inputValue,
      onChange: callAll(onChange, handleChange),
      ...props
    }
  }
  const getToggleButtonProps = ({
    onClick = undefined, ...props
  }: ToggleButtonProps = {}) => {
    return {
      isOpen: state.isOpen,
      onClick: callAll(onClick, handleEvent('toggle')),
      ...props
    }
  }
  const getClearButtonProps = ({
    onClick = undefined, ...props
  }: ClearButtonProps = {}) => {
    return {
      onClick: callAll(onClick, handleEvent('clear')),
      ...props
    }
  }
  const getItemProps =  ({
    selectedValue, onClick = undefined, ...props
  }: ItemProps) => {
    return {
      onClick: callAll(onClick, handleEvent('select', { selectedValue })),
      ...props
    }
  }
  const openMenu = () => {
    dispatch({type: 'open'})
  }
  const closeMenu = () => {
    dispatch({type: 'close'})
  }
  return {
    inputValue: state.inputValue,
    isOpen: state.isOpen,
    getInputProps,
    getToggleButtonProps,
    getClearButtonProps,
    getItemProps,
    openMenu,
    closeMenu
  }
}

export function fakeFetchData (value: string): Observable<string[]> {
  const result = [
    value,
    value + value,
    value + value + value
  ]
  return Observable.create((observer: Observer<string[]>) => {
    const id = setTimeout(() => {
      console.log('received')
      observer.next(result)
      observer.complete()
    }, 2000)
    return () => {
      clearTimeout(id)
    }
  })
}

/* I can move more logic in useAutoComplete, like the 'isLoading' and 'isWarning'
state or even the rxjs related code. But i want to make useAutoComplete minimun
API here. */

export default function AutoComplete () {
  const {
    inputValue,
    isOpen,
    getInputProps,
    getToggleButtonProps,
    getClearButtonProps,
    getItemProps,
    openMenu,
    closeMenu
  } = useAutoComplete({
    stateReducer: addEmojis
  })
  const inputRef = useRef(null)
  const focusInput = () => {
    const input = inputRef.current
    if (input)
    (input as HTMLInputElement).focus()
  }
  const [isLoading, setIsLoading] = useState(false)
  const [isWarning, setIsWarning] = useState(false)
  const [changeCallBack, items] = useEventCallback((event$: Observable<React.SyntheticEvent>) => {
    const warn$ = event$.pipe(
      map(event => (event.target as HTMLInputElement).value),
      filter(value => value.length > 30),
      tap(() => {
        setIsLoading(false)
        setIsWarning(true)
        closeMenu()
      }),
      mapTo([] as string[])
    )
    const default$ = event$.pipe(
      map(event => (event.target as HTMLInputElement).value),
      debounceTime(500),
      filter(value => value.length > 0 && value.length <= 30),
      tap(() => {
        setIsLoading(true)
        setIsWarning(false)
      }),
      switchMap(value => fakeFetchData(value).pipe(takeUntil(warn$))),
      tap(() => {
        setIsLoading(false)
        openMenu()
      })
    )
    return merge(default$, warn$)
  })
  return (
    <div className="autocomplete">
      <Warn visibility={isWarning} />
      <div className="autocomplete-input-wrapper">
        <input
          className="autocomplete-input"
          ref={inputRef}
          {...getInputProps({onChange: e => changeCallBack(e!)})}
        />
        <SearchIcon />
        <ClearButton {...getClearButtonProps({onClick: focusInput, visibility: inputValue !== ''})} />
        <div className="autocomplete-button-wrpper">
          { 
            isLoading
              ? <Loading />
              : items && items.length
                ? <ToggleButton {...getToggleButtonProps()} />
                : null
          }
        </div>
      </div>
      <Menu items={items} isOpen={isOpen} isLoading={isLoading} getItemProps={getItemProps} />
    </div>
  )
}

/* The Problem:

When you type 'smile', it will convert to a emoji '😜'. This behaviour is accomplished
by 'addEmojis' stateReducer. But the text used to fetch data is still 'smile', and the
desired behaviour is fetching data with the final text with emojis.

The Reason:

The reason is that the callback returned by 'useEventCallback' run before state actually
changed. And as i use the event.target.value to fetch the data, it will be a mismatch.

The Possible Solutions:

1. pass [initalValue] as the third param to useEventCallback.(not even acceptable)

we can use withLatestFrom(input$) to get the current inputValue. But as I have said,
the callback returned by 'useEventCallback' run before state actually changed, so this
current inputValue is not right. But as I use debounceTime operator, if i use withLatestFrom
after debounceTime, it may give me the right answer.

This problem can be generalized as:

The excution of the callback returned by useEventCallback is before the state changed,
but in the callback we make assumption that state will changed to the exact value as we want.

2. apply 'useObservable'. (acceptable but not good)

Instead of using 'useEventCallback', apply 'useObservable' with the [initalValue] as the
third param. Because now the initalValue becomes a stream, we can be sure the initalValue
is up to date with the state of component.

But this will arise a new problem:

In my autocomplete component, there are two actions can modify the inputValue, one is 'change'
(type charactors in input), another is 'select' (select items in search result). And i only
want to fetch data when 'change' action happens. But now the 'select' action wil trigger the
data fetching as well.

The possible solution for the upper problem can be saving more info with inputValue. Instead of
only updating inputValue, we can update a action type with it. The inputValue state will become
something like this: ['change', 'aaaaa'], ['select', 'aaaaa']. Then we can filter out the select
action with fliter operator.

3. make action to be an observalbe

The second solution can solve the intial problem, but will add many unnecessary info in state.
The best solution I think is to subscribe to the action stream.

I have create a 'useReducerEffect' hook to solve this problem. Please see the comment in
'AutoComplete_test.tsx' */



import React, { useReducer, useRef, useEffect, useState, useMemo } from 'react'
import { Observable, merge, BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, switchMap, filter, map, tap, takeUntil, mapTo, withLatestFrom } from 'rxjs/operators'
import {
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
import {
  fakeFetchData
} from './AutoComplete'
import './AutoComplete.css'

/* How to use:

1. Call the useReducer hook, which return state and dispatch.
2. Pass state and dispatch and other params into 'useReducerEffect'.
3. Replace dispatch with dispatchWithEffect for the particular action.

type EffectFactory<Action, State> =
  (action$: Observable<Action>, state$: Observable<State>) => Observable<any>

const [state, dispatch] = useReducer(reducer, initialState, initalAction)
const [result, dispatchWithEffect] =
  useReducerEffect(effectFactory, state, dispatch, initalAction, initialResult)


Now we have two versions of dispatch. You can call orignal 'dispatch', but this action
will not appear in the effectFactory's action$. And the action dispatched by 'dispatchWithEffect'
will appear. The state$ in effectFactory is guaranteed to be up to date. This means when
a action comes in effectFactory's action$, this action already passed the reducer and updated
the state. */

type EffectFactory<Action, State> = (action$: Observable<Action>, state$: Observable<State>) => Observable<any>
type ReturnValue<Action> = [any, (action: Action) => void]

function useReducerEffect<Action, State> (
  effectFactory: EffectFactory<Action, State>,
  state: State,
  dispatch: React.Dispatch<Action>,
  initialAction?: Action,
  initialResult?: any
): ReturnValue<Action> {
  const [result, setResult] = useState(initialResult !== undefined ? initialResult : null)
  const { state$, action$, actions, dispatchWithEffect } = useMemo(() => {
    const stateSubject$ = new BehaviorSubject(state)
    const actionSubject$ = initialAction !== undefined
      ? new BehaviorSubject(initialAction)
      : new Subject<Action>()
    // use a array to accumulate actions
    const actions: Action[] = [] 
    const dispatchWithEffect = (action: Action) => {
      dispatch(action)
      actions.push(action)
    }
    return {
      state$: stateSubject$,
      action$: actionSubject$,
      actions,
      dispatchWithEffect
    }
  }, [])

  // update state$ before action$ to prevent stale state
  useEffect(() => {
    state$.next(state)
  }, [state])

  useEffect(() => {
    while(actions.length) {
      action$.next(actions.shift())
    }
  })

  useEffect(() => {
    const output$ = effectFactory(action$, state$)
    const subscription = output$.subscribe((value) => {
      setResult(value)
    })
    return () => {
      subscription.unsubscribe()
      action$.complete()
      state$.complete()
    }
  }, [])

  return [result, dispatchWithEffect]
}

/* The problem:

The main difficulty is to make the effect happened after the state update. If 'dispatch' have a
second callback param like 'setState' in Class Component, which can perform effect after this
update, the problem can be easily solved.

But it doesn't provide such api, and I haven't found a way to achieve this behaviour. 

There are some use cases I have considered:

1. mix use of dispatch and dispatchWithEffect:

I have to only pass the action dispatched by 'dispatchWithEffect' to action$

2. call multiple dispatchWithEffect in one event handler which only trigger one rerender

I have to accumulate the actions and wait for the update then pass them into action$

The assumption I have made to my realization:

1. 'useReducer' and 'useReducerEffect' are called in same Functional Component or same custom
hook.
2. Calling the 'dispatch' will trigger the component's rerendering and thus re-excute the 
'useReducerEffect'.
3. From the excution of 'dispatch' to the update of state(the rerender trigged exactly by this action),
there must be no other rerendering between them.

Any situation against upper assumption will make my realization broken. And I think the last one
will not be ture easily. */

interface State {
  inputValue: string
  isOpen: boolean
  isLoading: boolean
  isWarning: boolean
}

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
    case 'setIsLoading': {
      return {
        ...state,
        isLoading: action.payload.isLoading
      }
    }
    case 'setIsWarning': {
      return {
        ...state,
        isWarning: action.payload.isWarning
      }
    }
    default: return state
  }
}

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

// I have moved more logic into useAutoComplete
function useAutoComplete ({
  stateReducer = (state: State, action: Action) => state
} = {}) {
  const [state, dispatch] = useReducer(
    combineReducers(autoCompleteReducer, stateReducer),
    { inputValue: '', isOpen: false, isLoading: false, isWarning: false }
  )
  const effectFactory = (action$: Observable<Action>, state$: Observable<State>) => {
    const warn$ = state$.pipe(
      map(state => state.inputValue),
      filter(value => value.length > 30),
      tap(() => {
        dispatch({type: 'setIsLoading', payload: { isLoading: false }})
        dispatch({type: 'setIsWarning', payload: { isWarning: true }})
        closeMenu()
      }),
      mapTo([] as string[])
    )
    const default$ = action$.pipe(
      filter(action => action.type === 'change'),
      withLatestFrom(state$), // state$ is up to date before I call debounceTime
      debounceTime(500),
      map(([_action, state]) => state.inputValue),
      filter(value => value.length > 0 && value.length <= 30),
      tap(() => {
        dispatch({type: 'setIsLoading', payload: { isLoading: true }})
        dispatch({type: 'setIsWarning', payload: { isWarning: false }})
      }),
      switchMap(value => fakeFetchData(value).pipe(takeUntil(warn$))),
      tap(() => {
        dispatch({type: 'setIsLoading', payload: { isLoading: false }})
        openMenu()
      })
    )
    return merge(default$, warn$)
  }
  const [items, dispatchWithEffect] = useReducerEffect(
    effectFactory,
    state,
    dispatch
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
      // use new dispatch !!!!!!!!!
      dispatchWithEffect({type: 'change', payload: { inputValue: value}})
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
    isLoading: state.isLoading,
    isWarning: state.isWarning,
    items,
    getInputProps,
    getToggleButtonProps,
    getClearButtonProps,
    getItemProps,
    openMenu,
    closeMenu
  }
}

// AutoComplete becomes cleaner
export default function AutoComplete () {
  const {
    inputValue,
    isOpen,
    isLoading,
    isWarning,
    items,
    getInputProps,
    getToggleButtonProps,
    getClearButtonProps,
    getItemProps,
  } = useAutoComplete({
    stateReducer: addEmojis
  })
  const inputRef = useRef(null)
  const focusInput = () => {
    const input = inputRef.current
    if (input)
    (input as HTMLInputElement).focus()
  }
  return (
    <div className="autocomplete">
      <Warn visibility={isWarning} />
      <div className="autocomplete-input-wrapper">
        <input
          className="autocomplete-input"
          ref={inputRef}
          {...getInputProps()}
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

import {
  Reducer
} from './types'

export function callAll (...fns: (Function | undefined)[]) {
  return (...args: any[]) => {
    fns.forEach(fn => {
      if (fn) {
        fn(...args)
      }
    })
  }
}

export function combineReducers<State, Action> (...reducers: Reducer<State, Action>[]) {
  return (state: State, action: Action) => 
    reducers.reduce((newState, reducer) => reducer(newState, action), state)
}
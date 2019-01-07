export interface State {
  inputValue: string
  isOpen: boolean
}

export interface Action {
  type: string
  payload?: any
}

export interface ClearButtonProps {
  onClick?: (e?: React.SyntheticEvent) => void
  [key: string]: any
}

export interface InputProps {
  onChange?: (e?: React.SyntheticEvent) => void
  [key: string]: any
}

export interface ToggleButtonProps {
  onClick?: (e?: React.SyntheticEvent) => void
  [key: string]: any
}

export interface ItemProps {
  selectedValue: string
  onClick?: (e?: React.SyntheticEvent) => void
  [key: string]: any
}

export type Reducer<State, Action> = (state: State, action: Action) => State

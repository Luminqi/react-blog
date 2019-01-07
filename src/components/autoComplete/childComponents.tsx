import React from 'react'
import {
  ClearButtonProps,
  ToggleButtonProps,
  ItemProps
} from './types'

const Warn = React.memo(({ visibility, ...props }: { visibility: boolean}) => {
  return (
    <div
      className="autocomplete-warn"
      style={{ visibility: visibility ? 'visible' : 'hidden' }}
      {...props}
    >
      <div className="autocomplete-warn-content">
        <span>You input too much charactors</span>
      </div>
      <div className="autocomplete-warn-arrow"></div>
    </div>
  )
})

const SearchIcon = React.memo((props: object) => {
  return (
    <div className="autocomplete-search" {...props}>
      <svg className="autocomplete-svg search-svg" viewBox="0 0 1024 1024">
        <path d="M999.592902 991.251373L712.326619 692.501398c73.271365-73.484026 118.664812-174.787972 118.664812-286.512304 0-223.873986-182.115108-405.989094-405.989094-405.989094s-405.989094 182.115108-405.989094 405.989094 182.115108 405.989094 405.989094 405.989095c98.268694 0 188.456271-35.127723 258.750383-93.416158l287.962264 299.484622a19.294148 19.294148 0 0 0 27.336599 0.541319 19.332814 19.332814 0 0 0 0.541319-27.336599zM425.002337 773.312561c-202.549892 0-367.323466-164.773574-367.323466-367.323467s164.773574-367.323466 367.323466-367.323466 367.323466 164.773574 367.323466 367.323466-164.792907 367.323466-367.323466 367.323467z"></path>
      </svg>
    </div>
  )
})

const Loading = React.memo((props: object) => {
  return (
    <div className="autocomplete-loading" {...props}>
      <svg className="autocomplete-svg loading-svg" viewBox="0 0 1024 1024">
      <path d="M512.02048 0c-278.75328 0-505.46688 222.76096-511.85664 499.97824 5.91872-241.8688 189.82912-435.97824 415.8464-435.97824 229.74464 0 416.01024 200.58112 416.01024 448 0 53.02272 42.98752 96.01024 96.01024 96.01024s96.01024-42.98752 96.01024-96.01024c0-282.76736-229.23264-512-512-512zM512.02048 1024c278.75328 0 505.46688-222.76096 511.85664-499.97824-5.91872 241.8688-189.82912 435.97824-415.8464 435.97824-229.74464 0-416.01024-200.58112-416.01024-448 0-53.02272-42.98752-96.01024-96.01024-96.01024s-96.01024 42.98752-96.01024 96.01024c0 282.76736 229.23264 512 512 512z"></path>
      </svg>
    </div>
  )
})

const ClearButton = React.memo(({
  onClick,
  visibility,
  ...props
}: ClearButtonProps) => {
  return (
    <button
      className="autocomplete-clearbtn"
      onClick={onClick}
      style={{ visibility: visibility ? 'visible' : 'hidden'}}
      {...props}
    >
      <svg className="autocomplete-svg clear-svg" viewBox="0 0 20 20">
        <path d="M1,1 L19,19" />
        <path d="M19,1 L1,19" />
      </svg>
    </button>
  )
})

const ToggleButton = React.memo(({
  isOpen,
  onClick,
  ...props
}: ToggleButtonProps) => {
  return (
    <button
      className="autocomplete-togglebtn"
      onClick={onClick}
      {...props}
    >
      <svg
        className="autocomplete-svg arrow-svg"
        style={{transform: `${isOpen ? 'rotate(180deg)' : 'none'}`}}
        viewBox="0 0 1024 1024"
      >
        <path d="M505.6 708.8l-440-440c-8-8-19.2-8-27.2 0v0c-8 8-8 19.2 0 27.2l460.8 460.8c8 8 19.2 8 27.2 0v0c0 0 1.6-1.6 1.6-1.6l459.2-459.2c8-8 8-19.2 0-27.2v0c-8-8-19.2-8-27.2 0l-441.6 440c-3.2 3.2-9.6 3.2-12.8 0z"></path>
      </svg>
    </button>
  )
})

const Menu = React.memo(({
 items,
 isOpen,
 isLoading,
 getItemProps
}: {
  items: string[] | null
  isOpen: boolean
  isLoading: boolean
  getItemProps: (props: ItemProps) => {
    onClick: (...args: any[]) => void
  }
}) => {
  const showMenu = !!(items && items.length && isOpen && !isLoading)
  return (
    showMenu
      ? <ul className="autocomplete-menu">
          {
            items!.map(item =>
              <li
                className="autocomplete-item"
                key={item}
                {...getItemProps({ selectedValue: item })}
              >
                {item}
              </li>
            )
          }
        </ul>
      : null
  )
})

export {
  Warn,
  SearchIcon,
  Loading,
  ClearButton,
  ToggleButton,
  Menu
}
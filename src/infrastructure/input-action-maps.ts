const inputControlsMap: { [key:string]: any} = {
  /* Keyboard Mappings */
  w: 'MOVE_UP', 87: 'MOVE_UP',
  s: 'MOVE_DOWN', 83: 'MOVE_DOWN',
  a: 'MOVE_LEFT', 65: 'MOVE_LEFT',
  d: 'MOVE_RIGHT', 68: 'MOVE_RIGHT',
  q: 'ROTATE_LEFT',
  e: 'ROTATE_RIGHT',
  Backspace: 'GO_BACK', Delete: 'GO_BACK', 46: 'GO_BACK', 8: 'GO_BACK',
  Enter: 'ACTIVATE', Return: 'ACTIVATE', 13: 'ACTIVATE',
  Shift: 'MOVE_IN',
  Control: 'MOVE_OUT',
  ArrowUp: 'MOVE_UP',
  ArrowDown: 'MOVE_DOWN',
  ArrowLeft: 'MOVE_LEFT',
  ArrowRight: 'MOVE_RIGHT',
  /*                  */

  /* Mouse and Touch Mappings */
  PointerTap: 'ACTIVATE',
  /*                  */

};

const InputActionsMap = {
  inputControlsMap
}

export default InputActionsMap;
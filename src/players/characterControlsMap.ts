const characterControlsMap: { [key:string]: string} = {
  /* Keyboard Mappings */
  w: 'MOVE_FORWARD',W: 'MOVE_FORWARD', 87: 'MOVE_FORWARD',
  s: 'MOVE_BACK',S: 'MOVE_BACK', 83: 'MOVE_BACK',
  a: 'MOVE_LEFT',A: 'MOVE_LEFT', 65: 'MOVE_LEFT',
  d: 'MOVE_RIGHT',D: 'MOVE_RIGHT', 68: 'MOVE_RIGHT',
  "Shift":'SHIFT_DOWN',
  //q: 'ROTATE_LEFT',
  //e: 'ROTATE_RIGHT',
  r: 'RELOAD',R: 'RELOAD', 82: 'RELOAD',
  " ": 'JUMP', 32: 'JUMP',
  /*                  */

  /* Mouse and Touch Mappings */
  pointerup:'MOUSECLICK',
  pointerdown:'MOUSECLICK'
  /*                  */

};

const CharacterActionsMap = {
  characterControlsMap
}

export default CharacterActionsMap;
const characterControlsMap: { [key:string]: string} = {
  /* Keyboard Mappings */
  // w: 'MOVE_UP', 87: 'MOVE_UP',
  // s: 'MOVE_DOWN', 83: 'MOVE_DOWN',
  // a: 'MOVE_LEFT', 65: 'MOVE_LEFT',
  // d: 'MOVE_RIGHT', 68: 'MOVE_RIGHT',
  // //q: 'ROTATE_LEFT',
  // //e: 'ROTATE_RIGHT',
  r: 'RELOAD', 82: 'RELOAD',
  // " ": 'JUMP', 32: 'JUMP',
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
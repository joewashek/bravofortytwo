import { Observable, Scene, Sound, SoundTrack } from "@babylonjs/core";
import soundFileMap, { SoundId } from "./GameSoundMap";
import logger from "../infrastructure/logger";

export enum SoundChannelKeys {
  MUSIC = "music",
  SFX = "sfx",
  UI = "ui"
}

export type SoundChannels = {
  [key:string]: SoundTrack
}

type SoundRegister = {
  [key:string]: Sound
}

class GameSoundManager{
  private _onSoundPlaybackEnded = new Observable();
  private _onReadyObservable = new Observable();
  private _channels: SoundChannels;

  private _registeredSounds: SoundRegister = {};

  sound(id:string) {
    return this._registeredSounds[id];
  }

  constructor(private _scene:Scene,...soundIds:SoundId[]){
    this._channels = {
      music: new SoundTrack(_scene, { mainTrack: false, volume: 0.89 }),
      sfx: new SoundTrack(_scene, { mainTrack: true, volume: 1 }),
      ui: new SoundTrack(_scene, { mainTrack: false, volume: 0.94 })
    }
    
    const onReadyPromises : Promise<unknown>[] = [];
    soundIds.forEach(soundId =>{
      const mapped = soundFileMap[soundId];
      const chan = this._channels[soundId] ?? this._scene.mainSoundTrack;
      if(!mapped){
        logger.logError("Sound not found in mapping file: "+soundId);
        return;
      }
      const prom = new Promise((resolve, reject) => {
        const sound = new Sound(soundId, mapped.url, this._scene, () => {
            chan.addSound(this._registeredSounds[soundId]);
            resolve(soundId);
        }, {
            autoplay: false,
            loop: mapped.loop,
            spatialSound: mapped.channel === 'sfx'
        });
        sound.onEndedObservable.add((endedSound, state) => {
            this._onSoundPlaybackEnded.notifyObservers(endedSound.name);
        });
        this._registeredSounds[soundId] = sound;
        });
        onReadyPromises.push(prom);
    })
    Promise.all(onReadyPromises)
            .then(readyIds => this._onReadyObservable.notifyObservers(readyIds))
            .catch(err =>{
              logger.logError(err);
            });
  }

  get onReadyObservable(){
    return this._onReadyObservable;
  }
}

export default GameSoundManager;
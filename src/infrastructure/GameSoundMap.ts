import titleSongUrl from "../assets/sounds/space-trucker-title-theme.m4a";
import shotgunUrl from "../assets/sounds/sfx/Shotgun-Close-Gunshot-A-www.fesliyanstudios.com.mp3";

export interface ISoundFile{
  url:string,
  channel: string,
  loop: boolean
}

export enum SoundId{
  TITLE = "title",
  SHOTGUN = "shotgun"
}

const soundFileMap: Record<SoundId,ISoundFile> = {
  "title": { url: titleSongUrl, channel: 'music', loop: true },
  "shotgun": { url: shotgunUrl, channel: 'sfx', loop: false }
};

export default soundFileMap;

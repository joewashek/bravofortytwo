import titleSongUrl from "../assets/sounds/space-trucker-title-theme.m4a";

export interface ISoundFile{
  url:string,
  channel: string,
  loop: boolean
}

export enum SoundId{
  TITLE = "title"
}

const soundFileMap: Record<SoundId,ISoundFile> = {
  "title": { url: titleSongUrl, channel: 'music', loop: true }
};

export default soundFileMap;

import { useState, useEffect, useRef } from 'react';
import { folderService } from '../../../shared/services/folderService';

export const useAudio = (src?: string) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadedSrc, setLoadedSrc] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadAudio = async () => {
      if (!src) {
        setLoadedSrc(null);
        return;
      }

      if (src.startsWith('file://')) {
        // Load local file via IPC
        // Remove file:// prefix to get absolute path
        const path = src.replace('file://', '');
        const dataUri = await folderService.loadAudioFile(path);
        if (isMounted) {
          setLoadedSrc(dataUri);
        }
      } else {
        // Web URL or already data URI
        if (isMounted) {
          setLoadedSrc(src);
        }
      }
    };

    loadAudio();

    return () => {
      isMounted = false;
    };
  }, [src]);

  useEffect(() => {
    if (!loadedSrc) return;

    // cleanup previous audio if exists
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(loadedSrc);
    audioRef.current = audio;

    const setAudioData = () => {
      setDuration(audio.duration);
      setCurrentTime(audio.currentTime);
    };

    const setAudioTime = () => {
      setCurrentTime(audio.currentTime);
    };

    const setAudioEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    // Events
    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', setAudioEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', setAudioEnded);
      audio.pause();
    };
  }, [loadedSrc]);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((e) => console.error('Audio playback failed:', e));
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  return {
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seek,
  };
};

import { useEffect, useRef, useState } from 'react';
import { song } from '@/content/song';

const formatTime = (seconds: number): string => {
  if (!Number.isFinite(seconds)) return '0:00';
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
};

export const MusicCv = () => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrubbingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [lyricsOpen, setLyricsOpen] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => {
      if (!scrubbingRef.current) setPosition(audio.currentTime);
    };
    const onEnded = () => {
      setPlaying(false);
      setPosition(0);
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('durationchange', onLoaded);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('durationchange', onLoaded);
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('lyrics-open', lyricsOpen);
    return () => root.classList.remove('lyrics-open');
  }, [lyricsOpen]);

  const toggle = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (playing) {
        audio.pause();
        setPlaying(false);
      } else {
        await audio.play();
        setPlaying(true);
        setLyricsOpen(true);
      }
    } catch (error) {
      console.error('[MusicCv] Could not play the track:', error);
      setFailed(true);
      setPlaying(false);
    }
  };

  const seek = (seconds: number) => {
    const audio = audioRef.current;
    setPosition(seconds);
    if (audio) audio.currentTime = seconds;
  };

  const fraction = duration > 0 ? position / duration : 0;
  const seekable = duration > 0 && !failed;

  return (
    <div className={`music-cv${lyricsOpen ? ' is-open' : ''}`}>
      <div className="music-cv__controls">
        <button
          type="button"
          className={`music-cv__play${playing ? ' is-playing' : ''}`}
          onClick={toggle}
          aria-pressed={playing}
          aria-label={playing ? `Pause ${song.title}` : `Play ${song.title}`}
        >
          <span className="music-cv__bars" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="music-cv__text">
            <span className="music-cv__title">{failed ? 'Track unavailable' : song.title}</span>
            <span className="music-cv__subtitle">{song.subtitle}</span>
          </span>
        </button>

        <button
          type="button"
          className="music-cv__toggle"
          onClick={() => setLyricsOpen((open) => !open)}
          aria-expanded={lyricsOpen}
          aria-controls="song-lyrics"
          aria-label={lyricsOpen ? 'Hide the words' : 'Show the words'}
          title={lyricsOpen ? 'Hide the words' : 'Show the words'}
        >
          <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" focusable="false">
            <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none">
              <line x1="3" y1="4.5" x2="17" y2="4.5" />
              <line x1="3" y1="8.5" x2="12.5" y2="8.5" />
              <line x1="6.5" y1="12.5" x2="17" y2="12.5" />
              <line x1="6.5" y1="16.5" x2="13" y2="16.5" />
            </g>
          </svg>
        </button>
      </div>

      {seekable && (
        <div className="music-cv__scrub">
          <span className="music-cv__time">{formatTime(position)}</span>
          <input
            type="range"
            className="music-cv__range"
            min={0}
            max={duration}
            step={0.1}
            value={position}
            style={{ '--played': `${fraction * 100}%` } as React.CSSProperties}
            onPointerDown={() => {
              scrubbingRef.current = true;
            }}
            onPointerUp={() => {
              scrubbingRef.current = false;
            }}
            onChange={(event) => seek(Number(event.target.value))}
            aria-label="Seek within the track"
          />
          <span className="music-cv__time">{formatTime(duration)}</span>
        </div>
      )}

      <div className="music-cv__lyrics" id="song-lyrics" hidden={!lyricsOpen}>
        <header className="music-cv__heading">
          <p className="music-cv__heading-title">{song.title}</p>
          <p className="music-cv__heading-sub">{song.subtitle}</p>
        </header>
        <div className="music-cv__scroll">
          {song.sections.map((section, index) => (
            <div key={index} className={`song-part${section.crew ? ' song-part--crew' : ''}`}>
              <p className="song-part__label">{section.label}</p>
              {section.lines.map((line, lineIndex) => (
                <p key={`${lineIndex}-${line}`} className="song-part__line">
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>

      <audio ref={audioRef} src={song.url} preload="metadata" />
    </div>
  );
};

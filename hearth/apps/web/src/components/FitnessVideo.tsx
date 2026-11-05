import { useEffect, useRef, useState } from 'react';
import { subscribeNativePresentation } from '../native/presentation';
import { fitnessLibraryApi } from '../api/fitnessLibrary';
// Arrow-scroll written instructions without trapping remote focus at either edge.
/* eslint-disable jsx-a11y/no-noninteractive-tabindex, jsx-a11y/no-noninteractive-element-interactions */
export function FitnessVideo({
  assetId,
  name,
  instructions,
}: {
  assetId: string;
  name: string;
  instructions: string;
}) {
  const ref = useRef<HTMLVideoElement>(null),
    playRef = useRef<HTMLButtonElement>(null);
  const [playing, setPlaying] = useState(false),
    [waiting, setWaiting] = useState(false),
    [error, setError] = useState('');
  useEffect(() => {
    const video = ref.current;
    // React may replay effect setup after cleanup; restore the protected source then.
    const source = fitnessLibraryApi.video(assetId);
    if (video && video.getAttribute('src') !== source) video.setAttribute('src', source);
    playRef.current?.focus();
    const hide = () => {
      if (document.hidden) video?.pause();
    };
    document.addEventListener('visibilitychange', hide);
    const leave = () => video?.pause();
    window.addEventListener('pagehide', leave);
    const unsubscribe = subscribeNativePresentation((snapshot) => {
      if (!snapshot.active) video?.pause();
    });
    return () => {
      unsubscribe();
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('pagehide', leave);
      video?.pause();
      video?.removeAttribute('src');
      video?.load();
    };
  }, [assetId]);
  async function play(replay = false) {
    const video = ref.current;
    if (!video) return;
    setError('');
    try {
      if (replay) video.currentTime = 0;
      if (!replay && !video.paused) video.pause();
      else await video.play();
    } catch (failure) {
      // Pausing or closing while media loads cancels play normally.
      if (
        !video.isConnected ||
        (failure instanceof DOMException && failure.name === 'AbortError' && video.paused)
      )
        return;
      setError('This clip could not play. Try again, or return to your workout.');
      setWaiting(false);
    }
  }
  return (
    <div className="fitness-video">
      <video
        ref={ref}
        src={fitnessLibraryApi.video(assetId)}
        playsInline
        muted
        preload="metadata"
        aria-label={`${name} silent demonstration`}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onCanPlay={() => setWaiting(false)}
        onError={() => {
          setPlaying(false);
          setWaiting(false);
          setError(
            'This clip is unavailable or cannot play on this device. Your workout is unchanged.',
          );
        }}
      />
      <div className="fitness-video-controls">
        <button
          ref={playRef}
          type="button"
          className="button button--primary focusable"
          data-focus-id="fitness-video-play"
          onClick={() => void play()}
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <button
          type="button"
          className="button focusable"
          data-focus-id="fitness-video-replay"
          onClick={() => void play(true)}
        >
          Replay
        </button>
      </div>
      <p className="fitness-video-status" role="status">
        {waiting
          ? 'Loading clip…'
          : 'Silent demonstration · watching does not tick off your workout.'}
      </p>
      {error ? (
        <div role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="button focusable"
            onClick={() => {
              setError('');
              ref.current?.load();
            }}
          >
            Reload clip
          </button>
        </div>
      ) : null}
      {instructions ? (
        <div
          className="fitness-video-instructions"
          role="region"
          aria-label="Demonstration instructions"
          tabIndex={0}
          onKeyDown={(event) => {
            const region = event.currentTarget,
              down = event.key === 'ArrowDown',
              up = event.key === 'ArrowUp';
            if (
              down
                ? region.scrollTop + region.clientHeight < region.scrollHeight - 1
                : up && region.scrollTop > 0
            ) {
              event.preventDefault();
              event.stopPropagation();
              region.scrollBy({ top: down ? 80 : -80, behavior: 'instant' });
            }
          }}
        >
          {instructions}
        </div>
      ) : null}
    </div>
  );
}

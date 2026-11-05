import { StrictMode } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { FitnessVideo } from './FitnessVideo';

vi.mock('../api/fitnessLibrary', () => ({
  fitnessLibraryApi: { video: (id: string) => `/api/fitness/demonstrations/${id}` },
}));
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('keeps a playable source after effect replay without autoplay, then releases it on close', () => {
  const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => {});
  const { unmount } = render(
    <StrictMode>
      <FitnessVideo assetId="fixture_clip" name="Squat" instructions="Written steps" />
    </StrictMode>,
  );
  const video = screen.getByLabelText('Squat silent demonstration');
  expect(video).toHaveAttribute('src', '/api/fitness/demonstrations/fixture_clip');
  expect(play).not.toHaveBeenCalled();
  expect(screen.getByRole('button', { name: /^Play$/ })).toHaveFocus();
  unmount();
  expect(video).not.toHaveAttribute('src');
  expect(pause).toHaveBeenCalled();
});

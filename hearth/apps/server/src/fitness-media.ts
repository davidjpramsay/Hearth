import { MAX_FITNESS_CLIP_BYTES } from '@hearth/shared';
import { RepositoryError } from './repository.js';
const invalid = () =>
  new RepositoryError(
    'VALIDATION_ERROR',
    'Choose a self-contained H.264 MP4 demonstration, up to 25 MB and ten minutes.',
  );
type Box = { type: string; start: number; end: number };
// Bounded ISO BMFF container validation, not a decoder. Browsers still handle damaged frames.
export function validateFitnessClip(bytes: Buffer): void {
  if (bytes.length > MAX_FITNESS_CLIP_BYTES || bytes.length < 32) throw invalid();
  let count = 0;
  function boxes(start: number, end: number): Box[] {
    const result: Box[] = [];
    while (start < end) {
      if (++count > 10000 || end - start < 8) throw invalid();
      let size = bytes.readUInt32BE(start),
        header = 8;
      if (size === 1) {
        if (end - start < 16) throw invalid();
        const big = bytes.readBigUInt64BE(start + 8);
        if (big > BigInt(bytes.length)) throw invalid();
        size = Number(big);
        header = 16;
      } else if (size === 0) size = end - start;
      if (size < header || size > end - start) throw invalid();
      result.push({
        type: bytes.toString('ascii', start + 4, start + 8),
        start: start + header,
        end: start + size,
      });
      start += size;
    }
    return result;
  }
  function one(items: Box[], type: string): Box {
    const matches = items.filter((b) => b.type === type);
    if (matches.length !== 1) throw invalid();
    return matches[0]!;
  }
  const top = boxes(0, bytes.length);
  const ftyp = one(top, 'ftyp');
  if (
    ftyp.end - ftyp.start < 8 ||
    !top.some((b) => b.type === 'mdat' && b.end > b.start) ||
    top.some((b) => b.type === 'moof')
  )
    throw invalid();
  const moov = one(top, 'moov'),
    children = boxes(moov.start, moov.end),
    mvhd = one(children, 'mvhd');
  const version = bytes[mvhd.start];
  const offset = version === 0 ? 12 : version === 1 ? 20 : -1;
  if (offset < 0 || mvhd.end - mvhd.start < offset + (version === 0 ? 8 : 12)) throw invalid();
  const timescale = bytes.readUInt32BE(mvhd.start + offset);
  const duration =
    version === 0
      ? bytes.readUInt32BE(mvhd.start + offset + 4)
      : Number(bytes.readBigUInt64BE(mvhd.start + offset + 4));
  if (!timescale || duration <= 0 || duration / timescale > 600) throw invalid();
  const tracks = children.filter((b) => b.type === 'trak');
  if (tracks.length < 1 || tracks.length > 2) throw invalid();
  let videos = 0;
  for (const track of tracks) {
    const mdia = one(boxes(track.start, track.end), 'mdia');
    const mdiaBoxes = boxes(mdia.start, mdia.end),
      handler = one(mdiaBoxes, 'hdlr');
    if (handler.end - handler.start < 12) throw invalid();
    const kind = bytes.toString('ascii', handler.start + 8, handler.start + 12);
    if (!['vide', 'soun'].includes(kind)) throw invalid();
    const minf = one(mdiaBoxes, 'minf'),
      minfBoxes = boxes(minf.start, minf.end);
    const dinf = one(minfBoxes, 'dinf'),
      dref = one(boxes(dinf.start, dinf.end), 'dref');
    if (dref.end - dref.start < 8) throw invalid();
    const refs = boxes(dref.start + 8, dref.end);
    if (
      refs.length !== 1 ||
      refs[0]!.type !== 'url ' ||
      refs[0]!.end - refs[0]!.start !== 4 ||
      bytes.readUInt32BE(refs[0]!.start) !== 1
    )
      throw invalid();
    const stbl = one(minfBoxes, 'stbl'),
      stsd = one(boxes(stbl.start, stbl.end), 'stsd');
    if (stsd.end - stsd.start < 8) throw invalid();
    const samples = boxes(stsd.start + 8, stsd.end);
    if (samples.length !== 1) throw invalid();
    const sample = samples[0]!;
    if (sample.end - sample.start < 8 || bytes.readUInt16BE(sample.start + 6) !== 1)
      throw invalid();
    if (kind === 'vide') {
      videos++;
      if (sample.type !== 'avc1' || sample.end - sample.start < 78) throw invalid();
      const width = bytes.readUInt16BE(sample.start + 24),
        height = bytes.readUInt16BE(sample.start + 26);
      if (!width || !height || width > 3840 || height > 3840) throw invalid();
      one(boxes(sample.start + 78, sample.end), 'avcC');
    } else if (sample.type !== 'mp4a') throw invalid();
  }
  if (videos !== 1) throw invalid();
}
export function fitnessByteRange(
  header: string | undefined,
  size: number,
): { start: number; end: number } | null | 'invalid' {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return 'invalid';
  const first = match[1] ? Number(match[1]) : null;
  const last = match[2] ? Number(match[2]) : null;
  if (
    (first !== null && !Number.isSafeInteger(first)) ||
    (last !== null && !Number.isSafeInteger(last))
  )
    return 'invalid';
  const start = first ?? Math.max(0, size - (last ?? 0));
  const end = first === null ? size - 1 : Math.min(last ?? size - 1, size - 1);
  return start >= size || start > end ? 'invalid' : { start, end };
}

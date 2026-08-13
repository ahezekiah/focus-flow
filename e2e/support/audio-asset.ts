/**
 * A small, real mp3 payload for upload specs — an ID3 tag followed by silent
 * MPEG-1 Layer III frames. Real bytes matter: specs prove the exact file the designer
 * chose comes back out of storage byte for byte.
 */
export interface AudioPayload {
  /** File name as it would appear on the designer's desktop. */
  name: string;
  mimeType: string;
  buffer: Buffer;
  byteLength: number;
}

/** 128 kbps at 44.1 kHz — floor(144 * 128000 / 44100). */
const FRAME_BYTES = 417;
const ID3_HEADER = Buffer.from([0x49, 0x44, 0x33, 3, 0, 0, 0, 0, 0, 0]);

function silentFrames(count: number): Buffer {
  return Buffer.concat(
    Array.from({ length: count }, () => {
      const frame = Buffer.alloc(FRAME_BYTES);
      frame.set([0xff, 0xfb, 0x90, 0x00]);
      return frame;
    }),
  );
}

/**
 * The mime type is stated rather than inferred from the extension: the app forwards
 * whatever the browser reports, and the API only accepts a known audio type.
 */
export function mp3Asset(fileName: string, frames = 32): AudioPayload {
  const buffer = Buffer.concat([ID3_HEADER, silentFrames(frames)]);

  return {
    name: fileName.endsWith(".mp3") ? fileName : `${fileName}.mp3`,
    mimeType: "audio/mpeg",
    buffer,
    byteLength: buffer.byteLength,
  };
}

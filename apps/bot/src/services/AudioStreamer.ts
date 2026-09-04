import { createAudioResource, StreamType, type AudioResource } from '@discordjs/voice';
import prism from 'prism-media';
import type { Readable } from 'node:stream';
import type { TrackMetadata } from '../extractors/BaseExtractor.js';
import { YoutubeExtractor } from '../extractors/YoutubeExtractor.js';
import { LocalFileExtractor } from '../extractors/LocalFileExtractor.js';

export interface AudioStreamerOptions {
  volume?: number;
  seek?: number;
  filter?: string;
}

export class AudioStreamer {
  private youtubeExtractor: YoutubeExtractor;
  private localExtractor: LocalFileExtractor;

  constructor(cookiesPath?: string) {
    this.youtubeExtractor = new YoutubeExtractor(cookiesPath);
    this.localExtractor = new LocalFileExtractor();
  }

  public async getTrackInfo(query: string, requestedBy?: string) {
    if (this.localExtractor.validate(query)) {
      return await this.localExtractor.extract(query, requestedBy);
    }
    return await this.youtubeExtractor.extract(query, requestedBy);
  }

  public async createAudioResource(
    track: TrackMetadata,
    options: AudioStreamerOptions = {}
  ): Promise<{ resource: AudioResource<TrackMetadata>; cleanup: () => void }> {
    let inputStream: Readable;

    if (track.source === 'local') {
      inputStream = await this.localExtractor.createStream(track);
    } else {
      inputStream = this.youtubeExtractor.createStream(track);
    }

    // BUG-A4 FIX: Tách rõ input args và output args để -af filter vào đúng output section
    // Cấu trúc chuẩn FFmpeg: [input_opts] [-ss seek] [-af filter] [output_format]
    const ffmpegInputArgs: string[] = [
      '-analyzeduration', '0',
      '-loglevel', 'error',
    ];

    // DESIGN-06: Seek support — -ss trước output để seek hiệu quả
    if (options.seek && options.seek > 0) {
      ffmpegInputArgs.push('-ss', String(options.seek));
    }

    const ffmpegOutputArgs: string[] = [];
    if (options.filter) {
      // -af phải là OUTPUT filter — đứng TRƯỚC output format flags
      ffmpegOutputArgs.push('-af', options.filter);
    }
    ffmpegOutputArgs.push('-f', 's16le', '-ar', '48000', '-ac', '2');

    const ffmpegArgs = [...ffmpegInputArgs, ...ffmpegOutputArgs];


    const transcoder = new prism.FFmpeg({
      args: ffmpegArgs,
    });

    const outputStream = inputStream.pipe(transcoder);

    const resource = createAudioResource(outputStream, {
      inputType: StreamType.Raw,
      inlineVolume: true,
      metadata: track,
    });

    if (options.volume !== undefined && resource.volume) {
      resource.volume.setVolume(options.volume / 100);
    }

    const cleanup = () => {
      try {
        inputStream.destroy();
        transcoder.destroy();
        outputStream.destroy();
      } catch (_err) {
        // Safe destroy
      }
    };

    return { resource, cleanup };
  }
}

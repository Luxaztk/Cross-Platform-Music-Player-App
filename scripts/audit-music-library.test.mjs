import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';

import {
  buildSummary,
  parseCliArgs,
  scanMusicFolder,
  splitTagValues,
  toCsv,
  writeReports,
} from './audit-music-library.mjs';

function createRecord(overrides = {}) {
  return {
    path: 'album/song.mp3',
    extension: '.mp3',
    sizeBytes: 1_024,
    parsed: true,
    error: '',
    title: 'Song',
    artist: 'Artist',
    album: 'Album',
    albumArtist: '',
    year: 2024,
    moods: [],
    genres: [],
    hasEmbeddedLyrics: false,
    lyricTagCount: 0,
    hasCoverArt: false,
    bpm: null,
    durationSeconds: 120,
    bitrate: 320_000,
    sampleRate: 44_100,
    channels: 2,
    container: 'MPEG',
    codec: 'MPEG 1 Layer 3',
    lossless: false,
    ...overrides,
  };
}

function createSilentWav() {
  const sampleRate = 8_000;
  const channels = 1;
  const bitsPerSample = 16;
  const sampleCount = 800;
  const dataSize = sampleCount * channels * (bitsPerSample / 8);
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28);
  buffer.writeUInt16LE(channels * (bitsPerSample / 8), 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

test('parseCliArgs reads a Windows folder and scanner options', () => {
  assert.deepEqual(parseCliArgs(['D:\\Music', '--output', 'D:\\Reports', '--limit', '50']), {
    input: 'D:\\Music',
    output: 'D:\\Reports',
    concurrency: parseCliArgs([]).concurrency,
    limit: 50,
    help: false,
  });
});

test('parseCliArgs rejects invalid positive integer options', () => {
  assert.throws(() => parseCliArgs(['D:\\Music', '--limit', '0']), /positive integer/u);
});

test('splitTagValues normalizes common multi-value delimiters', () => {
  assert.deepEqual(splitTagValues(['Sad; Melancholic', 'Calm / Acoustic']), [
    'Sad',
    'Melancholic',
    'Calm',
    'Acoustic',
  ]);
});

test('buildSummary calculates metadata coverage from parsed files only', () => {
  const records = [
    createRecord({ moods: ['Sad'], genres: ['Ballad'], hasEmbeddedLyrics: true }),
    createRecord({ path: 'album/second.flac', extension: '.flac', genres: ['Ballad'] }),
    createRecord({ path: 'broken.mp3', parsed: false, error: 'broken', title: '', artist: '' }),
  ];

  const summary = buildSummary(records);

  assert.deepEqual(summary.totals, {
    audioFiles: 3,
    parsed: 2,
    errors: 1,
    sizeBytes: 3_072,
    durationSeconds: 240,
  });
  assert.deepEqual(summary.coverage.mood, { count: 1, percentage: 50 });
  assert.deepEqual(summary.coverage.genre, { count: 2, percentage: 100 });
  assert.deepEqual(summary.coverage.embeddedLyrics, { count: 1, percentage: 50 });
  assert.deepEqual(summary.topGenres[0], { value: 'Ballad', count: 2 });
});

test('toCsv quotes commas and double quotes and includes a UTF-8 BOM', () => {
  const csv = toCsv([
    createRecord({
      path: 'album/a, b.mp3',
      title: 'A "quoted" song',
      moods: ['Sad', 'Calm'],
    }),
  ]);

  assert.equal(csv.startsWith('\uFEFF'), true);
  assert.match(csv, /"album\/a, b\.mp3"/u);
  assert.match(csv, /"A ""quoted"" song"/u);
  assert.match(csv, /"Sad \| Calm"/u);
});

test('scanMusicFolder parses audio recursively and writeReports creates JSON and CSV', async (context) => {
  const tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'melovista-audit-test-'));
  assert.equal(path.resolve(tempDirectory).startsWith(path.resolve(os.tmpdir())), true);
  context.after(async () => {
    await fs.rm(tempDirectory, { recursive: true, force: true });
  });

  const nestedDirectory = path.join(tempDirectory, 'nested');
  await fs.mkdir(nestedDirectory);
  await Promise.all([
    fs.writeFile(path.join(nestedDirectory, 'silence.wav'), createSilentWav()),
    fs.writeFile(path.join(nestedDirectory, 'ignored.txt'), 'not audio', 'utf8'),
  ]);

  const scanResult = await scanMusicFolder(tempDirectory, { concurrency: 2 });
  assert.equal(scanResult.discoveredAudioFiles, 1);
  assert.equal(scanResult.scannedAudioFiles, 1);
  assert.equal(scanResult.files[0].path, path.join('nested', 'silence.wav'));
  assert.equal(scanResult.files[0].parsed, true);
  assert.equal(scanResult.files[0].extension, '.wav');

  const outputDirectory = path.join(tempDirectory, 'reports');
  const reportResult = await writeReports(scanResult, outputDirectory);
  const [jsonReport, csvReport] = await Promise.all([
    fs.readFile(reportResult.jsonPath, 'utf8'),
    fs.readFile(reportResult.csvPath, 'utf8'),
  ]);
  assert.match(jsonReport, /"discoveredAudioFiles": 1/u);
  assert.match(csvReport, /silence\.wav/u);
});

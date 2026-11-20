#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseFile } from 'music-metadata';

const SUPPORTED_EXTENSIONS = new Set([
  '.aac',
  '.aiff',
  '.alac',
  '.flac',
  '.m4a',
  '.m4b',
  '.mp3',
  '.mp4',
  '.oga',
  '.ogg',
  '.opus',
  '.wav',
  '.wma',
]);

const DEFAULT_CONCURRENCY = Math.max(1, Math.min(8, os.availableParallelism?.() ?? 4));

export function printHelp() {
  console.log(`
MeloVista music library audit

Usage:
  npm run audit:music -- <music-folder> [options]

Options:
  --output <folder>       Report destination. Defaults to the OS temp folder.
  --concurrency <number>  Files parsed in parallel (default: ${DEFAULT_CONCURRENCY}).
  --limit <number>        Scan only the first N audio files (useful for sampling).
  --help                  Show this help.

Examples:
  npm run audit:music -- "D:\\Music"
  npm run audit:music -- "D:\\Music" --output "D:\\Reports\\music-audit"
  npm run audit:music -- "D:\\Music" --limit 50

The scanner is read-only. It does not follow symbolic links and never writes to
the music folder unless that folder is explicitly supplied via --output.
`);
}

export function parseCliArgs(argv) {
  const result = {
    input: '',
    output: '',
    concurrency: DEFAULT_CONCURRENCY,
    limit: undefined,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--help' || arg === '-h') {
      result.help = true;
      continue;
    }
    if (arg === '--output') {
      result.output = requireOptionValue(argv, ++index, '--output');
      continue;
    }
    if (arg === '--concurrency') {
      result.concurrency = parsePositiveInteger(
        requireOptionValue(argv, ++index, '--concurrency'),
        '--concurrency',
      );
      continue;
    }
    if (arg === '--limit') {
      result.limit = parsePositiveInteger(requireOptionValue(argv, ++index, '--limit'), '--limit');
      continue;
    }
    if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    }
    if (result.input) {
      throw new Error(`Unexpected extra argument: ${arg}`);
    }
    result.input = arg;
  }

  return result;
}

function requireOptionValue(argv, index, optionName) {
  const value = argv[index];
  if (!value || value.startsWith('-')) {
    throw new Error(`${optionName} requires a value`);
  }
  return value;
}

function parsePositiveInteger(rawValue, optionName) {
  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${optionName} must be a positive integer`);
  }
  return value;
}

export function splitTagValues(values) {
  const source = Array.isArray(values) ? values : values ? [values] : [];
  return source
    .flatMap((value) => String(value).split(/[;,|/]+/u))
    .map((value) => value.trim())
    .filter(Boolean);
}

function hasEmbeddedLyrics(metadata) {
  const commonLyrics = metadata.common.lyrics;
  if (
    Array.isArray(commonLyrics) &&
    commonLyrics.some(
      (tag) => Boolean(tag.text?.trim()) || (Array.isArray(tag.syncText) && tag.syncText.length > 0),
    )
  ) {
    return true;
  }

  const lyricTagPattern = /(^|:)(uslt|sylt|lyrics?|unsyncedlyrics|syncedlyrics|melovista_lrc)$/iu;
  return Object.values(metadata.native ?? {}).some((tags) =>
    tags.some((tag) => lyricTagPattern.test(String(tag.id))),
  );
}

async function walkAudioFiles(rootPath) {
  const audioFiles = [];
  const directories = [rootPath];

  while (directories.length > 0) {
    const currentDirectory = directories.pop();
    let entries;
    try {
      entries = await fs.readdir(currentDirectory, { withFileTypes: true });
    } catch (error) {
      throw new Error(`Cannot read directory "${currentDirectory}": ${toErrorMessage(error)}`);
    }

    entries.sort((left, right) => left.name.localeCompare(right.name, 'en'));
    for (const entry of entries) {
      const entryPath = path.join(currentDirectory, entry.name);
      if (entry.isSymbolicLink()) continue;
      if (entry.isDirectory()) {
        directories.push(entryPath);
        continue;
      }
      if (entry.isFile() && SUPPORTED_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        audioFiles.push(entryPath);
      }
    }
  }

  return audioFiles.sort((left, right) => left.localeCompare(right, 'en'));
}

async function inspectAudioFile(filePath, rootPath) {
  const relativePath = path.relative(rootPath, filePath);
  const extension = path.extname(filePath).toLowerCase();
  let sizeBytes = 0;

  try {
    const stats = await fs.stat(filePath);
    sizeBytes = stats.size;
    const metadata = await parseFile(filePath, {
      skipCovers: false,
      skipPostHeaders: false,
      includeChapters: false,
    });
    const { common, format } = metadata;
    const moods = splitTagValues(common.mood);
    const genres = splitTagValues(common.genre);

    return {
      path: relativePath,
      extension,
      sizeBytes,
      parsed: true,
      error: '',
      title: common.title?.trim() ?? '',
      artist: common.artist?.trim() ?? '',
      album: common.album?.trim() ?? '',
      albumArtist: common.albumartist?.trim() ?? '',
      year: Number.isFinite(common.year) ? common.year : null,
      moods,
      genres,
      hasEmbeddedLyrics: hasEmbeddedLyrics(metadata),
      lyricTagCount: common.lyrics?.length ?? 0,
      hasCoverArt: Boolean(common.picture?.length),
      bpm: Number.isFinite(common.bpm) ? common.bpm : null,
      durationSeconds: Number.isFinite(format.duration) ? format.duration : null,
      bitrate: Number.isFinite(format.bitrate) ? format.bitrate : null,
      sampleRate: Number.isFinite(format.sampleRate) ? format.sampleRate : null,
      channels: Number.isFinite(format.numberOfChannels) ? format.numberOfChannels : null,
      container: format.container ?? '',
      codec: format.codec ?? '',
      lossless: format.lossless ?? null,
    };
  } catch (error) {
    return {
      path: relativePath,
      extension,
      sizeBytes,
      parsed: false,
      error: toErrorMessage(error),
      title: '',
      artist: '',
      album: '',
      albumArtist: '',
      year: null,
      moods: [],
      genres: [],
      hasEmbeddedLyrics: false,
      lyricTagCount: 0,
      hasCoverArt: false,
      bpm: null,
      durationSeconds: null,
      bitrate: null,
      sampleRate: null,
      channels: null,
      container: '',
      codec: '',
      lossless: null,
    };
  }
}

export async function scanMusicFolder(rootPath, options = {}) {
  const resolvedRoot = path.resolve(rootPath);
  const stats = await fs.stat(resolvedRoot).catch(() => null);
  if (!stats?.isDirectory()) {
    throw new Error(`Music folder does not exist or is not a directory: ${resolvedRoot}`);
  }

  const allFiles = await walkAudioFiles(resolvedRoot);
  const files = options.limit ? allFiles.slice(0, options.limit) : allFiles;
  const concurrency = Math.max(1, Math.min(options.concurrency ?? DEFAULT_CONCURRENCY, 32));
  const records = new Array(files.length);
  let cursor = 0;
  let completed = 0;

  async function worker() {
    while (cursor < files.length) {
      const index = cursor;
      cursor += 1;
      records[index] = await inspectAudioFile(files[index], resolvedRoot);
      completed += 1;
      options.onProgress?.(completed, files.length, records[index]);
    }
  }

  const workerCount = Math.min(concurrency, Math.max(files.length, 1));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return {
    root: resolvedRoot,
    discoveredAudioFiles: allFiles.length,
    scannedAudioFiles: files.length,
    limited: files.length < allFiles.length,
    files: records,
  };
}

function countRecords(records, predicate) {
  return records.reduce((count, record) => count + (predicate(record) ? 1 : 0), 0);
}

function percentage(count, total) {
  return total === 0 ? 0 : Number(((count / total) * 100).toFixed(1));
}

function topValues(records, selector, limit = 15) {
  const valuesByKey = new Map();
  for (const record of records) {
    for (const value of selector(record)) {
      const displayValue = String(value).trim();
      if (!displayValue) continue;
      const key = displayValue.toLocaleLowerCase('en');
      const current = valuesByKey.get(key);
      valuesByKey.set(key, {
        value: current?.value ?? displayValue,
        count: (current?.count ?? 0) + 1,
      });
    }
  }
  return [...valuesByKey.values()]
    .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value, 'en'))
    .slice(0, limit);
}

export function buildSummary(records) {
  const parsed = records.filter((record) => record.parsed);
  const total = records.length;
  const parsedCount = parsed.length;
  const moodCount = countRecords(parsed, (record) => record.moods.length > 0);
  const genreCount = countRecords(parsed, (record) => record.genres.length > 0);
  const lyricsCount = countRecords(parsed, (record) => record.hasEmbeddedLyrics);
  const titleCount = countRecords(parsed, (record) => Boolean(record.title));
  const artistCount = countRecords(parsed, (record) => Boolean(record.artist));
  const albumCount = countRecords(parsed, (record) => Boolean(record.album));
  const coverCount = countRecords(parsed, (record) => record.hasCoverArt);
  const bpmCount = countRecords(parsed, (record) => record.bpm !== null);

  return {
    totals: {
      audioFiles: total,
      parsed: parsedCount,
      errors: total - parsedCount,
      sizeBytes: records.reduce((sum, record) => sum + record.sizeBytes, 0),
      durationSeconds: parsed.reduce((sum, record) => sum + (record.durationSeconds ?? 0), 0),
    },
    coverage: {
      mood: { count: moodCount, percentage: percentage(moodCount, parsedCount) },
      genre: { count: genreCount, percentage: percentage(genreCount, parsedCount) },
      embeddedLyrics: { count: lyricsCount, percentage: percentage(lyricsCount, parsedCount) },
      title: { count: titleCount, percentage: percentage(titleCount, parsedCount) },
      artist: { count: artistCount, percentage: percentage(artistCount, parsedCount) },
      album: { count: albumCount, percentage: percentage(albumCount, parsedCount) },
      coverArt: { count: coverCount, percentage: percentage(coverCount, parsedCount) },
      bpm: { count: bpmCount, percentage: percentage(bpmCount, parsedCount) },
    },
    topMoods: topValues(parsed, (record) => record.moods),
    topGenres: topValues(parsed, (record) => record.genres),
    topArtists: topValues(parsed, (record) => (record.artist ? [record.artist] : [])),
    extensions: topValues(records, (record) => [record.extension || '(none)'], 50),
    containers: topValues(parsed, (record) => (record.container ? [record.container] : []), 50),
    codecs: topValues(parsed, (record) => (record.codec ? [record.codec] : []), 50),
  };
}

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function toCsv(records) {
  const columns = [
    ['path', (record) => record.path],
    ['extension', (record) => record.extension],
    ['parsed', (record) => record.parsed],
    ['error', (record) => record.error],
    ['title', (record) => record.title],
    ['artist', (record) => record.artist],
    ['album', (record) => record.album],
    ['albumArtist', (record) => record.albumArtist],
    ['year', (record) => record.year],
    ['moods', (record) => record.moods.join(' | ')],
    ['genres', (record) => record.genres.join(' | ')],
    ['hasEmbeddedLyrics', (record) => record.hasEmbeddedLyrics],
    ['lyricTagCount', (record) => record.lyricTagCount],
    ['hasCoverArt', (record) => record.hasCoverArt],
    ['bpm', (record) => record.bpm],
    ['durationSeconds', (record) => record.durationSeconds],
    ['sizeBytes', (record) => record.sizeBytes],
    ['container', (record) => record.container],
    ['codec', (record) => record.codec],
    ['bitrate', (record) => record.bitrate],
    ['sampleRate', (record) => record.sampleRate],
    ['channels', (record) => record.channels],
    ['lossless', (record) => record.lossless],
  ];

  const header = columns.map(([name]) => csvCell(name)).join(',');
  const rows = records.map((record) =>
    columns.map(([, getValue]) => csvCell(getValue(record))).join(','),
  );
  return `\uFEFF${[header, ...rows].join('\r\n')}\r\n`;
}

function timestampForPath(date = new Date()) {
  return date.toISOString().replace(/[:.]/gu, '-');
}

export async function writeReports(scanResult, outputDirectory = '') {
  const reportDirectory = path.resolve(
    outputDirectory || path.join(os.tmpdir(), 'melovista-music-audit', timestampForPath()),
  );
  await fs.mkdir(reportDirectory, { recursive: true });

  const summary = buildSummary(scanResult.files);
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    root: scanResult.root,
    discoveredAudioFiles: scanResult.discoveredAudioFiles,
    scannedAudioFiles: scanResult.scannedAudioFiles,
    limited: scanResult.limited,
    summary,
    files: scanResult.files,
  };
  const jsonPath = path.join(reportDirectory, 'music-library-audit.json');
  const csvPath = path.join(reportDirectory, 'music-library-audit.csv');

  await Promise.all([
    fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8'),
    fs.writeFile(csvPath, toCsv(scanResult.files), 'utf8'),
  ]);

  return { reportDirectory, jsonPath, csvPath, summary };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** unitIndex).toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function formatDuration(seconds) {
  const rounded = Math.round(seconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const remainingSeconds = rounded % 60;
  return `${hours}h ${minutes}m ${remainingSeconds}s`;
}

function formatCoverage(metric, parsedCount) {
  return `${metric.count}/${parsedCount} (${metric.percentage}%)`;
}

function printTopValues(label, values) {
  const rendered = values.length > 0
    ? values.slice(0, 10).map((item) => `${item.value} (${item.count})`).join(', ')
    : '(none)';
  console.log(`${label}: ${rendered}`);
}

export function printSummary(scanResult, reportResult) {
  const { summary } = reportResult;
  const { totals, coverage } = summary;

  console.log('\nMeloVista music library audit');
  console.log(`Root: ${scanResult.root}`);
  console.log(`Discovered audio files: ${scanResult.discoveredAudioFiles}`);
  if (scanResult.limited) {
    console.log(`Scanned sample: ${scanResult.scannedAudioFiles}`);
  }
  console.log(`Parsed: ${totals.parsed}/${totals.audioFiles}`);
  console.log(`Parse errors: ${totals.errors}`);
  console.log(`Total size: ${formatBytes(totals.sizeBytes)}`);
  console.log(`Total duration: ${formatDuration(totals.durationSeconds)}`);
  console.log('\nMetadata coverage');
  console.log(`Mood tags: ${formatCoverage(coverage.mood, totals.parsed)}`);
  console.log(`Genre tags: ${formatCoverage(coverage.genre, totals.parsed)}`);
  console.log(`Embedded lyrics: ${formatCoverage(coverage.embeddedLyrics, totals.parsed)}`);
  console.log(`Titles: ${formatCoverage(coverage.title, totals.parsed)}`);
  console.log(`Artists: ${formatCoverage(coverage.artist, totals.parsed)}`);
  console.log(`Albums: ${formatCoverage(coverage.album, totals.parsed)}`);
  console.log(`Cover art: ${formatCoverage(coverage.coverArt, totals.parsed)}`);
  console.log(`BPM: ${formatCoverage(coverage.bpm, totals.parsed)}`);
  console.log('');
  printTopValues('Top moods', summary.topMoods);
  printTopValues('Top genres', summary.topGenres);
  printTopValues('Formats', summary.extensions);
  console.log('\nReports');
  console.log(`JSON: ${reportResult.jsonPath}`);
  console.log(`CSV:  ${reportResult.csvPath}`);
}

function toErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}

export async function main(argv = process.argv.slice(2)) {
  let args;
  try {
    args = parseCliArgs(argv);
  } catch (error) {
    console.error(`Error: ${toErrorMessage(error)}`);
    printHelp();
    return 1;
  }

  if (args.help) {
    printHelp();
    return 0;
  }
  if (!args.input) {
    console.error('Error: a music folder is required.');
    printHelp();
    return 1;
  }

  try {
    let lastPrinted = 0;
    console.log(`Scanning: ${path.resolve(args.input)}`);
    const scanResult = await scanMusicFolder(args.input, {
      concurrency: args.concurrency,
      limit: args.limit,
      onProgress: (completed, total) => {
        if (completed === total || completed - lastPrinted >= 25) {
          lastPrinted = completed;
          console.log(`Progress: ${completed}/${total}`);
        }
      },
    });
    const reportResult = await writeReports(scanResult, args.output);
    printSummary(scanResult, reportResult);
    return 0;
  } catch (error) {
    console.error(`Audit failed: ${toErrorMessage(error)}`);
    return 1;
  }
}

const entryPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (entryPath === import.meta.url) {
  process.exitCode = await main();
}

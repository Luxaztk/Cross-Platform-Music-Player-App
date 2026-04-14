import { File, Directory, Paths } from 'expo-file-system'

import type { Song } from '@music/types'

type PickedAsset = {
  uri: string
  name?: string | null
}

function sanitizeBaseName(name: string) {
  return name
    .replace(/\.[^/.]+$/, '') // remove extension
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

async function ensureDir(dir: Directory) {
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true })
  }
}

function nowId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export async function importPickedAudioAssets(
  assets: PickedAsset[],
  opts?: { existingSourceUris?: Set<string> },
): Promise<{ songs: Song[]; skippedDuplicates: number }> {
  const baseDir = new Directory(Paths.document, 'melovista/audio')
  await ensureDir(baseDir)

  const imported: Song[] = []
  let skippedDuplicates = 0
  const seenSourceUris = new Set<string>()

  for (const asset of assets) {
    try {
      if (!asset.uri) continue
      if (seenSourceUris.has(asset.uri)) continue
      seenSourceUris.add(asset.uri)

      if (opts?.existingSourceUris?.has(asset.uri)) {
        skippedDuplicates++
        continue
      }

      console.log(`[import] Attempting to import: ${asset.uri}`)

      const originalName = asset.name || 'audio'
      const id = nowId()
      const destName = `${safeFileName(originalName.replace(/\.[^/.]+$/, ''))}-${id}.mp3`
      const destFile = new File(baseDir, destName)

      // Use byte transfer for maximum compatibility with content:// URIs on Android
      const sourceFile = new File(asset.uri)
      const content = await sourceFile.bytes()
      destFile.write(content)

      if (!destFile.exists) {
        console.warn(`[import] File was written but exists property is false: ${destFile.uri}`)
      }

      const title = sanitizeBaseName(originalName || destName)

      imported.push({
        id,
        filePath: destFile.uri,
        title: title || 'Unknown Title',
        artist: 'Unknown Artist',
        artists: ['Unknown Artist'],
        album: 'Unknown Album',
        duration: 0,
        genre: 'Unknown Genre',
        year: null,
        coverArt: null,
        fileSize: destFile.size,
        sourceUrl: asset.uri,
      })
    } catch (err) {
      console.error(`[import] Failed to import ${asset.uri}:`, err)
      // We skip this file and continue with others
    }
  }

  return { songs: imported, skippedDuplicates }
}

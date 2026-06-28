import { File, Directory, Paths } from 'expo-file-system'
import { createAudioPlayer } from 'expo-audio'
// import * as MediaLibrary from 'expo-media-library'
import type { Song } from '@music/types'

type PickedAsset = {
  uri: string
  name?: string | null
}

type AudioMetadata = {
  title?: string
  artist?: string
  album?: string
  genre?: string
  year?: number
  duration?: number
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

async function extractAudioMetadata(fileUri: string): Promise<AudioMetadata> {
  // try {
  //   // Try to get metadata from MediaLibrary first
  //   const asset = await MediaLibrary.getAssetInfoAsync(fileUri)
  //   if (asset) {
  //     return {
  //       title: asset.filename?.replace(/\.[^/.]+$/, ''),
  //       duration: asset.duration ? Math.round(asset.duration * 1000) : undefined,
  //     }
  //   }
  // } catch (err) {
  //   console.warn(`[metadata] MediaLibrary extraction failed for ${fileUri}:`, err)
  // }

  // Fallback: manually calculate duration using expo-audio
  try {
    const player = createAudioPlayer({ uri: fileUri })
    // Wait for the player to load
    await new Promise(resolve => setTimeout(resolve, 1000))
    const duration = player.duration ?? undefined
    console.log(`[metadata] Extracted duration for imported file: ${player.duration}ms`)
    player.remove() // Clean up the player
    return { duration }
  } catch (err) {
    console.warn(`[metadata] Audio duration extraction failed for ${fileUri}:`, err)
    return {}
  }
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

      // Extract metadata from the original file
      const metadata = await extractAudioMetadata(asset.uri)

      const title = metadata.title || sanitizeBaseName(originalName || destName)
      const duration = metadata.duration || 0

      imported.push({
        id,
        filePath: destFile.uri,
        title: title || 'Unknown Title',
        artist: metadata.artist || 'Unknown Artist',
        artists: metadata.artist ? [metadata.artist] : ['Unknown Artist'],
        album: metadata.album || 'Unknown Album',
        duration,
        genre: metadata.genre || 'Unknown Genre',
        year: metadata.year || null,
        coverArt: null,
        fileSize: destFile.size,
        sourceUrl: asset.uri,
        dateAdded: new Date().toISOString(),
      })

      console.log(`[import] Successfully imported: ${title} (${duration}ms)`)
    } catch (err) {
      console.error(`[import] Failed to import ${asset.uri}:`, err)
      // We skip this file and continue with others
    }
  }

  return { songs: imported, skippedDuplicates }
}

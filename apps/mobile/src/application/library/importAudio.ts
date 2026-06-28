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
    const duration = player.duration ?? undefined // returns duration in seconds
    console.log(`[metadata] Extracted duration for imported file: ${player.duration} seconds`)
    player.remove() // Clean up the player
    return { duration }
  } catch (err) {
    console.warn(`[metadata] Audio duration extraction failed for ${fileUri}:`, err)
    return {}
  }
}

function syncSafeInt(bytes: Uint8Array) {
  return ((bytes[0] & 0x7f) << 21) | ((bytes[1] & 0x7f) << 14) | ((bytes[2] & 0x7f) << 7) | (bytes[3] & 0x7f)
}

function parseInt32(bytes: Uint8Array) {
  return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]
}

function decodeAscii(bytes: Uint8Array) {
  return String.fromCharCode(...bytes).replace(/\0+$/, '')
}

function decodeLatin1(bytes: Uint8Array) {
  return String.fromCharCode(...bytes).replace(/\0+$/, '')
}

function decodeText(bytes: Uint8Array, encoding: number) {
  if (!bytes || bytes.length === 0) return ''

  try {
    switch (encoding) {
      case 1:
        return new TextDecoder('utf-16le').decode(bytes).replace(/\u0000/g, '').replace(/\uFEFF/g, '')
      case 2:
        return new TextDecoder('utf-16be').decode(bytes).replace(/\u0000/g, '').replace(/\uFEFF/g, '')
      case 3:
        return new TextDecoder('utf-8').decode(bytes).replace(/\u0000/g, '').replace(/\uFEFF/g, '')
      default:
        return new TextDecoder('latin1').decode(bytes).replace(/\u0000/g, '').replace(/\uFEFF/g, '')
    }
  } catch {
    return decodeLatin1(bytes)
  }

}

function normalizeArtists(artistString: string) {
  return artistString
    .split(/\s*[\/;,]\s*/)
    .map((part) => part.trim())
    .filter(Boolean)
}

function base64FromBytes(bytes: Uint8Array) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  let result = ''
  let i = 0

  while (i < bytes.length) {
    const byte1 = bytes[i++] ?? 0
    const byte2 = bytes[i++] ?? 0
    const byte3 = bytes[i++] ?? 0

    const enc1 = byte1 >> 2
    const enc2 = ((byte1 & 3) << 4) | (byte2 >> 4)
    const enc3 = ((byte2 & 15) << 2) | (byte3 >> 6)
    const enc4 = byte3 & 63

    if (i - 1 >= bytes.length) {
      result += `${chars.charAt(enc1)}${chars.charAt(enc2)}==`
      break
    }

    if (i >= bytes.length) {
      result += `${chars.charAt(enc1)}${chars.charAt(enc2)}${chars.charAt(enc3)}=`
      break
    }

    result += `${chars.charAt(enc1)}${chars.charAt(enc2)}${chars.charAt(enc3)}${chars.charAt(enc4)}`
  }

  return result
}

function parseId3v2Tags(bytes: Uint8Array) {
  if (bytes.length < 10 || decodeAscii(bytes.subarray(0, 3)) !== 'ID3') return null
  const version = bytes[3]
  const size = syncSafeInt(bytes.subarray(6, 10))
  const end = 10 + size
  const metadata: Partial<Song> = {}
  let offset = 10

  while (offset + 10 <= end && offset + 10 <= bytes.length) {
    const frameId = decodeAscii(bytes.subarray(offset, offset + 4))
    const frameSize = version === 4 ? syncSafeInt(bytes.subarray(offset + 4, offset + 8)) : parseInt32(bytes.subarray(offset + 4, offset + 8))
    if (!frameId.trim() || frameSize <= 0) break

    const frameData = bytes.subarray(offset + 10, offset + 10 + frameSize)
    const encoding = frameData[0]
    const body = frameData.subarray(1)

    switch (frameId) {
      case 'TIT2':
        metadata.title = decodeText(body, encoding)
        break
      case 'TPE1': {
        const artist = decodeText(body, encoding)
        metadata.artist = artist
        metadata.artists = normalizeArtists(artist)
        break
      }
      case 'TALB':
        metadata.album = decodeText(body, encoding)
        break
      case 'TCON':
        metadata.genre = decodeText(body, encoding)
        break
      case 'TYER':
      case 'TDRC': {
        const yearText = decodeText(body, encoding).trim()
        const year = parseInt(yearText, 10)
        if (!Number.isNaN(year)) metadata.year = year
        break
      }
      case 'USLT':
        metadata.lyrics = decodeText(body.subarray(body.indexOf(0) + 1), encoding)
        break
      case 'SYLT':
        metadata.syncedLyrics = decodeText(body.subarray(body.indexOf(0) + 1), encoding)
        break
      case 'APIC': {
        const mimeEnd = body.indexOf(0)
        const mimeType = decodeAscii(body.subarray(0, mimeEnd)) || 'image/jpeg'
        let ptr = mimeEnd + 1
        const pictureType = body[ptr++]
        const descEnd = body.indexOf(0, ptr)
        if (descEnd === -1) break
        ptr = descEnd + 1
        const imageData = body.subarray(ptr)
        if (imageData.length > 0) {
          metadata.coverArt = `data:${mimeType};base64,${base64FromBytes(imageData)}`
        }
        break
      }
    }

    offset += 10 + frameSize
  }

  return metadata
}

function parseId3v1Tags(bytes: Uint8Array) {
  if (bytes.length < 128) return null
  const tag = bytes.subarray(bytes.length - 128)
  if (decodeAscii(tag.subarray(0, 3)) !== 'TAG') return null

  const title = decodeLatin1(tag.subarray(3, 33)).trim()
  const artist = decodeLatin1(tag.subarray(33, 63)).trim()
  const album = decodeLatin1(tag.subarray(63, 93)).trim()
  const yearValue = decodeLatin1(tag.subarray(93, 97)).trim()
  const genreValue = tag[127]

  const metadata: Partial<Song> = {}
  if (title) metadata.title = title
  if (artist) {
    metadata.artist = artist
    metadata.artists = normalizeArtists(artist)
  }
  if (album) metadata.album = album
  if (yearValue) {
    const year = parseInt(yearValue, 10)
    if (!Number.isNaN(year)) metadata.year = year
  }
  if (genreValue >= 0) metadata.genre = `Genre ${genreValue}`

  return metadata
}

async function readAudioMetadata(file: File): Promise<Partial<Song>> {
  try {
    const bytes = await file.bytes()
    if (!bytes || bytes.length === 0) return {}

    const id3v2 = parseId3v2Tags(bytes)
    const id3v1 = parseId3v1Tags(bytes)
    const metadata: Partial<Song> = { ...id3v1, ...id3v2 }

    // const duration = parseMp3Duration(bytes)
    // if (duration !== null) {
    //   metadata.duration = Math.round(duration)
    // }
    console.log(`[importAudio] Read metadata for ${file.uri}:`, metadata.title, metadata.artist, metadata.duration)

    return metadata
  } catch (error) {
    console.warn('[importAudio] Failed to read metadata:', error)
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
      // const metadata = await extractAudioMetadata(destFile.uri)
      const metadata = await readAudioMetadata(destFile)
      console.log("aish: ", metadata.title)
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

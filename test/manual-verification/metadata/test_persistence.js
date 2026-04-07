const { MetadataManager } = require('./apps/desktop/electron/modules/metadata/MetadataManager');
const mm = require('music-metadata');
const fs = require('fs');
const path = require('path');

async function testPersistence() {
  const manager = new MetadataManager();
  const testFile = path.join(__dirname, 'test_audio.mp3');
  const tempFile = path.join(__dirname, 'test_temp.mp3');

  if (!fs.existsSync(testFile)) {
    console.log('No test_audio.mp3 found. Please provide one for testing.');
    return;
  }

  // Copy to temp file
  fs.copyFileSync(testFile, tempFile);
  console.log('Testing on:', tempFile);

  const newMetadata = {
    title: 'Melovista Persisted Title ' + Date.now(),
    artist: 'Antigravity AI',
    album: 'Deepmind Chronicles',
    originId: 'test-id-123',
    sourceUrl: 'https://youtube.com/watch?v=test'
  };

  try {
    console.log('Writing metadata...');
    await manager.writeMetadata(tempFile, newMetadata);
    console.log('Success writing.');

    console.log('Reading back with music-metadata...');
    const result = await mm.parseFile(tempFile);
    
    console.log('--- Results ---');
    console.log('Title:', result.common.title);
    console.log('Artist:', result.common.artist);
    console.log('Album:', result.common.album);
    
    const titleMatch = result.common.title === newMetadata.title;
    const artistMatch = result.common.artist === newMetadata.artist;
    
    if (titleMatch && artistMatch) {
      console.log('✅ VERIFICATION SUCCESS: Metadata persisted correctly!');
    } else {
      console.log('❌ VERIFICATION FAILED: Metadata mismatch.');
    }

  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    // Cleanup if you want
    // fs.unlinkSync(tempFile);
  }
}

testPersistence();

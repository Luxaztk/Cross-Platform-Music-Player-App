const { LibraryService } = require('./packages/core/dist/services/LibraryService');

// Mock Storage Adapter
class MockStorage {
  constructor(songs) { this.songs = songs; this.library = { id: '0', songIds: Object.keys(songs) }; }
  async getSongs() { return this.songs; }
  async getLibrary() { return this.library; }
  async saveSongs(s) { this.songs = s; }
  async saveLibrary(l) { this.library = l; }
  async getPlaylists() { return { '0': this.library }; }
}

async function testSmartFingerprint() {
  // Existing Song (High Quality)
  const existingSongs = {
    'song-1': {
      id: 'song-1',
      filePath: 'G:\\Web\\Music\\media\\Gió Vẫn Hát.mp3',
      title: 'Gió Vẫn Hát',
      artist: 'Long Phạm',
      duration: 240.144,
      hash: 'p2:22ccdebdec98dddahjjd8dkeeekiha666beeec7bcaa8dea7gnhdde9dbcbbaa58'
    }
  };

  const service = new LibraryService(new MockStorage(existingSongs));

  // Case 1: New Download (Different Quality, Same Duration)
  // Our manual count was ~78% similarity
  const newSong = {
    id: 'song-new-1',
    filePath: 'C:\\Users\\Admin\\Music\\Downloads\\gio_van_hat.mp3',
    title: 'Gió Vẫn Hát (YouTube)',
    artist: 'Cafe Buồn',
    duration: 240.144,
    hash: 'p2:24ccdfbdeb98dddahjjd8ejeeekhh9666cdeec8bcaa8dea6hngdde9dbcbbaa58'
  };

  console.log('Testing Case 1: Same song, different quality/metadata...');
  const result1 = await service.processAndAddSongs([newSong]);
  
  if (result1.addedCount === 0 && result1.duplicateSongs.length > 0) {
    console.log('✅ Success: Smart Fingerprinting detected the duplicate!');
    console.log('Reason:', result1.duplicateSongs[0].duplicateReason);
  } else {
    console.log('❌ Failure: Duplicate NOT detected.');
    console.log('Similarity was likely below the new threshold or duration check failed.');
  }

  // Case 2: Different Song, Same Duration (Hypothetical)
  const differentSong = {
    id: 'song-new-2',
    filePath: 'C:\\Users\\Admin\\Music\\Downloads\\completely_different.mp3',
    title: 'Random Song',
    artist: 'Random Artist',
    duration: 240.144, // Same duration
    hash: 'p2:zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz' // Totally different hash
  };

  console.log('\nTesting Case 2: Different song, same duration (False Positive check)...');
  const result2 = await service.processAndAddSongs([differentSong]);
  
  if (result2.addedCount === 1) {
    console.log('✅ Success: Different song was correctly added.');
  } else {
    console.log('❌ Failure: Different song was incorrectly marked as duplicate!');
  }
}

testSmartFingerprint();

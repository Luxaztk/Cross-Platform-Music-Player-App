const NodeID3 = require('node-id3');
const mm = require('music-metadata');
const fs = require('fs');

async function test() {
  const filePath = 'test.mp3';
  // Create a dummy mp3 by writing some random bytes
  fs.writeFileSync(filePath, Buffer.alloc(1024));

  const tags = {
    title: 'Test Song',
    userDefinedText: [
      { description: 'melovista_origin_id', value: '12345XYZ' },
      { description: 'melovista_source_url', value: 'https://youtube.com/watch?v=12345XYZ' }
    ]
  };

  NodeID3.write(tags, filePath);

  const metadata = await mm.parseFile(filePath);
  const out = "COMMON: " + JSON.stringify(metadata.common, null, 2) + "\nNATIVE: " + JSON.stringify(metadata.native, null, 2);
  fs.writeFileSync('test_id3_output.txt', out);
}

test().catch(console.error);

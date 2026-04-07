const NodeID3 = require('node-id3');
const fs = require('fs');

async function test() {
  const filePath = 'test.mp3';
  fs.writeFileSync(filePath, Buffer.alloc(1024));

  const tags = {
    title: 'Test Song',
    userDefinedText: [
      { description: 'melovista_origin_id', value: '12345XYZ' },
      { description: 'melovista_source_url', value: 'https://youtube.com/watch?v=12345XYZ' }
    ]
  };

  NodeID3.write(tags, filePath);

  const readTags = NodeID3.read(filePath);
  fs.writeFileSync('test_id3_output.txt', JSON.stringify(readTags, null, 2));
}

test().catch(console.error);

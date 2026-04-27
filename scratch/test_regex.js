const regex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/v\/|youtube\.com\/v=)([a-zA-Z0-9_-]{11})(?:\S+)?/;
const url = 'https://youtube.com/watch?v=dQw4w9WgXcQ';
const match = url.match(regex);
console.log('Match:', match ? match[1] : 'null');

const h1='22ccdebdec98dddahjjd8dkeeekiha666beeec7bcaa8dea7gnhdde9dbcbbaa58';
const h2='24ccdfbdeb98dddahjjd8ejeeekhh9666cdeec8bcaa8dea6hngdde9dbcbbaa58';
let m=0;
for(let i=0; i<h1.length; i++) if(h1[i]===h2[i]) m++;
console.log('Similarity:', (m/h1.length*100).toFixed(2) + '%');
console.log('Matches:', m, '/', h1.length);

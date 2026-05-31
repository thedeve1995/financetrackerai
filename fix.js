const fs = require('fs');
let lines = fs.readFileSync('src/app.js', 'utf8').split('\n');
lines[676] = '                const confirmed = await showConfirm(\'Hapus Aset\', `Hapus aset "${asset?.name}"? Data ini akan dihapus permanen.`, \'Hapus\');';
fs.writeFileSync('src/app.js', lines.join('\n'));

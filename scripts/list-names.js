const d = require('./foods_en.json');
const byCat = {};
d.forEach(x => {
  if (!byCat[x.category]) byCat[x.category] = [];
  byCat[x.category].push(x.name_en);
});
for (const [cat, names] of Object.entries(byCat).sort()) {
  console.log('\n=== ' + cat.toUpperCase() + ' (' + names.length + ') ===');
  names.forEach(n => console.log(n));
}

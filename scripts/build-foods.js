#!/usr/bin/env node
/**
 * Build foods.json from Diogenes GI database.
 * Uses keyword-based categorization instead of broken Diogenes food groups.
 */

const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'gi_full_raw.json'), 'utf8'));

// Keyword-based categorization
const CATEGORY_RULES = [
  { category: 'bread', patterns: [/\bbread\b/i, /\btoast\b/i, /\bbaguette\b/i, /\bciabatta\b/i, /\bpita\b/i, /\bpitta\b/i, /\bcroissant\b/i, /\bbrioche\b/i, /\broll[s]?\b/i, /\brusk\b/i, /\bcrumpet\b/i, /\bchapati\b/i, /\bnaan\b/i, /\btortilla\b/i, /\bflatbread\b/i, /\bwaffle\b/i] },
  { category: 'cereals', patterns: [/\bcereal\b/i, /\boat\b/i, /\bporridge\b/i, /\bmuesli\b/i, /\bgranola\b/i, /\bcorn\s?flakes\b/i, /\bbran\b/i, /\bwheatbix\b/i, /\bweetabix\b/i, /\bflakes\b/i, /\bcrunchy\b/i, /\bbarley\b/i, /\bbuckwheat\b/i, /\bmillet\b/i, /\bquinoa\b/i, /\bbulgur\b/i, /\bcouscous\b/i, /\bsemolina\b/i] },
  { category: 'rice', patterns: [/\brice\b/i, /\brisotto\b/i] },
  { category: 'pasta', patterns: [/\bpasta\b/i, /\bspaghetti\b/i, /\bmacaroni\b/i, /\bnoodle/i, /\bpenne\b/i, /\bfusilli\b/i, /\bfettuccin/i, /\blasagn/i, /\bravioli\b/i, /\btortellini\b/i, /\bvermicelli\b/i] },
  { category: 'potatoes', patterns: [/\bpotato/i, /\bchips\b/i, /\bfries\b/i, /\bcrisps\b/i] },
  { category: 'legumes', patterns: [/\bbean/i, /\blentil/i, /\bchickpea/i, /\bpea\b/i, /\bpeas\b/i, /\bhummus\b/i, /\bsoy\b/i, /\bsoya\b/i, /\btofu\b/i, /\bedamame\b/i] },
  { category: 'fruits', patterns: [/\bapple\b/i, /\bbanana/i, /\borange\b/i, /\bgrape/i, /\bstrawberr/i, /\bblueberr/i, /\braspberr/i, /\bcherry/i, /\bpeach/i, /\bpear\b/i, /\bplum\b/i, /\bkiwi/i, /\bmango/i, /\bpineapple/i, /\bmelon/i, /\bwatermelon/i, /\bapricot/i, /\bfig\b/i, /\bdate[s]?\b/i, /\braisin/i, /\bprune/i, /\bcranberr/i, /\bpomegranate/i, /\bpapaya/i, /\bfruit\b/i, /\bjuice\b/i, /\bsmoothie/i] },
  { category: 'vegetables', patterns: [/\bcarrot/i, /\btomato/i, /\bcucumber/i, /\bonion/i, /\bpepper\b/i, /\bbroccoli/i, /\bcabbage/i, /\bcauliflower/i, /\bspinach/i, /\blettuce/i, /\bcelery/i, /\bbeetroot/i, /\bpumpkin/i, /\bsquash\b/i, /\bzucchini/i, /\bcorn\b/i, /\bsweet\s?corn/i, /\beggplant/i, /\baubergine/i, /\bturnip/i, /\bparsnip/i, /\bswede\b/i, /\bartichoke/i, /\basparagus/i, /\bmushroom/i, /\bsalad\b/i, /\bcoleslaw/i, /\bvegetable/i] },
  { category: 'dairy', patterns: [/\bmilk\b/i, /\byoghurt/i, /\byogurt/i, /\bcheese/i, /\bcream\b/i, /\bcustard/i, /\bice\s?cream/i, /\bkefir/i, /\bbutter\b/i] },
  { category: 'nuts', patterns: [/\bnut\b/i, /\bnuts\b/i, /\bpeanut/i, /\balmond/i, /\bwalnut/i, /\bcashew/i, /\bpistachio/i, /\bhazelnut/i, /\bmacadamia/i] },
  { category: 'sweets', patterns: [/\bchocolate/i, /\bcandy/i, /\bcake\b/i, /\bbiscuit/i, /\bcookie/i, /\bmuffin/i, /\bdoughnut/i, /\bdonut/i, /\bpastry/i, /\bpie\b/i, /\btart\b/i, /\bflan\b/i, /\bpudding/i, /\bdessert/i, /\bscone\b/i, /\bbrownie/i, /\bice loll/i, /\bsorbet/i, /\bjam\b/i, /\bmarmalade/i, /\bhoney\b/i, /\bsyrup/i, /\bsweet\b/i] },
  { category: 'sugar', patterns: [/\bsugar\b/i, /\bglucose/i, /\bfructose/i, /\bsucrose/i, /\bmaltose/i, /\bdextrose/i, /\bmaltodextrin/i] },
  { category: 'beverages', patterns: [/\bbeer\b/i, /\bale\b/i, /\bwine\b/i, /\bcola\b/i, /\bsoda\b/i, /\bdrink\b/i, /\bcoffee\b/i, /\btea\b/i, /\bcocoa\b/i, /\bsquash\b/i] },
  { category: 'snacks', patterns: [/\bsnack/i, /\bcrackers\b/i, /\bpopcorn/i, /\bpretzel/i, /\bgranola bar/i, /\benergy bar/i, /\bcereal bar/i, /\bprotein bar/i] },
  { category: 'meat', patterns: [/\bchicken/i, /\bbeef\b/i, /\bpork\b/i, /\blamb\b/i, /\bsausage/i, /\bbacon\b/i, /\bham\b/i, /\bturkey/i, /\bburger/i] },
  { category: 'fish', patterns: [/\bfish\b/i, /\bsalmon/i, /\btuna\b/i, /\bcod\b/i, /\bprawn/i, /\bshrimp/i, /\bseafood/i] },
  { category: 'soups', patterns: [/\bsoup\b/i] },
  { category: 'sauces', patterns: [/\bsauce\b/i, /\bketchup/i, /\bmayonnaise/i, /\bdressing/i] },
];

function categorize(name) {
  for (const rule of CATEGORY_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(name)) return rule.category;
    }
  }
  return 'other';
}

// Brand/store names to filter out
const BRAND_PATTERNS = [
  /\b(sainsbury|tesco|asda|waitrose|morrisons|lidl|aldi|marks\s*&\s*spencer|m&s)\b/i,
  /\b(kellogg|nestle|heinz|cadbury|mcvitie|hovis|warburton|mcdonald|subway)\b/i,
  /\b(müller|danone|activia|actimel|yakult|innocent)\b/i,
  /\b(uncle\s*ben|ben'?s)\b/i,
  /\b(lu\b|liga\b|goed\s*moment)\b/i,
  /\b(robinsons?|ribena|lucozade|tropicana)\b/i,
  /\(\d+g\)/i, // "(425g)" type annotations
];

function isBrand(name) {
  return BRAND_PATTERNS.some(p => p.test(name));
}

// Noise patterns - too specific preparation details
const NOISE_PATTERNS = [
  /\bweighed as served\b/i,
  /\bweighed with\b/i,
  /\bsainsbury\b/i,
];

// Step 1: Deduplicate, filter confidence 1-5, valid data
const seen = new Map();
for (const item of raw) {
  const nameEn = (item['English translation'] || '').trim();
  const gi = parseFloat(item['GI value']);
  const cho = parseFloat(item['CHO (g/100g)']);
  const conf = parseInt(item['GI confidence level']);

  if (!nameEn || isNaN(gi) || isNaN(cho) || gi <= 0 || cho <= 0) continue;
  if (isNaN(conf) || conf > 5) continue;
  if (isBrand(nameEn)) continue;
  if (NOISE_PATTERNS.some(p => p.test(nameEn))) continue;

  const key = nameEn.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim();

  if (!seen.has(key) || conf < seen.get(key).conf) {
    seen.set(key, { name_en: nameEn, gi: Math.round(gi), carbs: Math.round(cho * 10) / 10, conf });
  }
}

console.log(`After dedup + filter: ${seen.size}`);

// Step 2: Categorize
let items = [...seen.values()].map(item => ({
  ...item,
  category: categorize(item.name_en),
}));

// Step 3: Remove 'other' with very low carbs (likely miscategorized spices, fats)
items = items.filter(item => {
  if (item.category === 'other' && item.carbs < 5) return false;
  return true;
});

// Step 4: Limit items per category to keep most useful
// For categories with too many items, keep those with best confidence
const PER_CATEGORY_LIMIT = {
  bread: 40, cereals: 40, rice: 20, pasta: 25, potatoes: 20,
  legumes: 30, fruits: 50, vegetables: 30, dairy: 30, nuts: 15,
  sweets: 50, sugar: 10, beverages: 20, snacks: 15,
  meat: 10, fish: 10, soups: 10, sauces: 10, other: 60,
};

const byCategory = {};
items.forEach(item => {
  if (!byCategory[item.category]) byCategory[item.category] = [];
  byCategory[item.category].push(item);
});

items = [];
for (const [cat, catItems] of Object.entries(byCategory)) {
  const limit = PER_CATEGORY_LIMIT[cat] || 30;
  catItems.sort((a, b) => a.conf - b.conf || b.carbs - a.carbs);
  items.push(...catItems.slice(0, limit));
}

console.log(`After category limits: ${items.length}`);

// Step 5: Sort and assign IDs
items.sort((a, b) => {
  if (a.category !== b.category) return a.category.localeCompare(b.category);
  return a.name_en.localeCompare(b.name_en);
});

const result = items.map((item, i) => ({
  id: i + 1,
  name_en: item.name_en,
  name_ru: '',
  gi: item.gi,
  carbs: item.carbs,
  category: item.category,
}));

const outputPath = path.join(__dirname, 'foods_en.json');
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(`\nWritten ${result.length} items to foods_en.json`);

// Stats
const cats = {};
result.forEach(x => { cats[x.category] = (cats[x.category] || 0) + 1; });
console.log('\nCategory breakdown:');
Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`  ${c}: ${n}`));

// Show samples per category
console.log('\n=== Samples per category ===');
for (const [cat, n] of Object.entries(cats).sort((a, b) => b[1] - a[1])) {
  const samples = result.filter(x => x.category === cat).slice(0, 3);
  console.log(`\n${cat} (${n}):`);
  samples.forEach(x => console.log(`  ${x.name_en} | GI:${x.gi} | CHO:${x.carbs}`));
}

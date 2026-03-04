/**
 * Food search with autocomplete.
 */
const FoodSearch = (() => {
  const MAX_RESULTS = 25;

  // Normalize string for search (lowercase, remove accents-like chars)
  function normalize(str) {
    return str.toLowerCase().replace(/ё/g, 'е');
  }

  function search(query, foods, categoryFilter) {
    const q = normalize(query.trim());
    if (!q && categoryFilter === 'all') return [];

    let results = foods;

    // Filter by category first
    if (categoryFilter && categoryFilter !== 'all') {
      results = results.filter(f => f.category === categoryFilter);
    }

    if (!q) {
      // Show category items sorted by GI
      return results.sort((a, b) => b.gi - a.gi).slice(0, MAX_RESULTS);
    }

    // Score-based search
    const scored = [];
    for (const food of results) {
      const nameRu = normalize(food.name_ru);
      const nameEn = normalize(food.name_en);

      let score = 0;

      // Exact start match (highest priority)
      if (nameRu.startsWith(q)) {
        score = 100;
      } else if (nameRu.includes(q)) {
        // Position-based: earlier match = higher score
        const pos = nameRu.indexOf(q);
        score = 80 - pos;
      } else if (nameEn.includes(q)) {
        score = 40;
      } else {
        // Word-start match
        const words = nameRu.split(/[\s(),\/]+/);
        for (const word of words) {
          if (word.startsWith(q)) {
            score = 70;
            break;
          }
        }
      }

      if (score > 0) {
        scored.push({ food, score });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, MAX_RESULTS).map(s => s.food);
  }

  return { search };
})();

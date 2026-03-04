/**
 * GL Tracker — App controller.
 */
(async () => {
  // ===== Category config =====
  const CATEGORY_LABELS = {
    bread: 'Хлеб', cereals: 'Крупы', rice: 'Рис', pasta: 'Макароны',
    potatoes: 'Картофель', legumes: 'Бобовые', fruits: 'Фрукты',
    vegetables: 'Овощи', dairy: 'Молочные', nuts: 'Орехи',
    sweets: 'Сладости', sugar: 'Сахар', beverages: 'Напитки',
    snacks: 'Снеки', soups: 'Супы', meals: 'Блюда',
    sauces: 'Соусы', protein: 'Мясо/Рыба',
  };

  const CATEGORY_COLORS = {
    bread: '#d4a053', cereals: '#c9a84c', rice: '#e0c97a', pasta: '#d9b66a',
    potatoes: '#c8a265', legumes: '#7a9e6c', fruits: '#d47e5a',
    vegetables: '#6b9e5a', dairy: '#9bb8d0', nuts: '#b08a5b',
    sweets: '#d4728a', sugar: '#e0a0a0', beverages: '#7ab0c0',
    snacks: '#c09060', soups: '#a0b87a', meals: '#b0856e',
    sauces: '#c07858', protein: '#9a7080',
  };

  // ===== DOM refs =====
  const $ = (sel) => document.querySelector(sel);
  const searchInput = $('#searchInput');
  const searchClear = $('#searchClear');
  const searchResults = $('#searchResults');
  const categoriesEl = $('#categories');
  const addModal = $('#addModal');
  const modalFoodName = $('#modalFoodName');
  const modalGI = $('#modalGI');
  const modalCarbs = $('#modalCarbs');
  const weightInput = $('#weightInput');
  const weightPresets = $('#weightPresets');
  const modalGL = $('#modalGL');
  const modalGLBar = $('#modalGLBar');
  const modalAddBtn = $('#modalAddBtn');
  const modalClose = $('#modalClose');
  const plateItems = $('#plateItems');
  const plateEmpty = $('#plateEmpty');
  const plateCount = $('#plateCount');
  const clearPlateBtn = $('#clearPlate');
  const glSummary = $('#glSummary');
  const glSummaryValue = $('#glSummaryValue');
  const glSummaryItems = $('#glSummaryItems');
  const glSummaryBar = $('#glSummaryBar');
  const glSummaryIndicator = $('#glSummaryIndicator');
  const infoBtn = $('#infoBtn');
  const infoModal = $('#infoModal');
  const infoModalClose = $('#infoModalClose');

  // ===== State =====
  let allFoods = [];
  let activeCategory = 'all';
  let selectedFood = null;

  // ===== Init =====
  try {
    allFoods = await FoodDB.init();
    buildCategories();
    setupListeners();
    Plate.setOnChange(renderPlate);
    renderPlate();
  } catch (err) {
    console.error('Init failed:', err);
    searchResults.innerHTML = '<div class="search-no-results">Ошибка загрузки базы данных</div>';
    searchResults.classList.add('open');
  }

  // ===== Categories =====
  function buildCategories() {
    const cats = FoodDB.getCategories();
    const order = ['bread', 'cereals', 'rice', 'pasta', 'potatoes', 'legumes', 'fruits', 'vegetables', 'dairy', 'nuts', 'sweets', 'sugar', 'beverages', 'snacks', 'soups', 'meals', 'sauces', 'protein'];

    let html = '<button class="cat-pill cat-pill--active" data-cat="all">Все</button>';
    for (const cat of order) {
      if (cats.has(cat)) {
        html += `<button class="cat-pill" data-cat="${cat}">${CATEGORY_LABELS[cat] || cat}</button>`;
      }
    }
    categoriesEl.innerHTML = html;
  }

  // ===== Search =====
  function doSearch() {
    const query = searchInput.value;
    searchClear.classList.toggle('visible', query.length > 0);

    const results = FoodSearch.search(query, allFoods, activeCategory);

    if (query.length === 0 && activeCategory === 'all') {
      searchResults.classList.remove('open');
      return;
    }

    if (results.length === 0) {
      searchResults.innerHTML = '<div class="search-no-results">Ничего не найдено</div>';
    } else {
      searchResults.innerHTML = results.map(food => {
        const giClass = Plate.giLevel(food.gi);
        const color = CATEGORY_COLORS[food.category] || '#999';
        return `
          <div class="search-result" data-id="${food.id}">
            <span class="search-result__cat-dot" style="background:${color}"></span>
            <div class="search-result__info">
              <div class="search-result__name">${highlight(food.name_ru, searchInput.value)}</div>
              <div class="search-result__meta">${food.carbs}г углеводов / 100г</div>
            </div>
            <span class="search-result__gi search-result__gi--${giClass}">GI ${food.gi}</span>
          </div>`;
      }).join('');
    }

    searchResults.classList.add('open');
  }

  function highlight(text, query) {
    if (!query) return text;
    const q = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${q})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
  }

  // ===== Add Modal =====
  function openAddModal(food) {
    selectedFood = food;
    modalFoodName.textContent = food.name_ru;
    modalGI.textContent = food.gi;
    modalCarbs.textContent = food.carbs;
    weightInput.value = 100;
    setActivePreset(100);
    updateModalGL();
    addModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeAddModal() {
    addModal.classList.remove('open');
    document.body.style.overflow = '';
    selectedFood = null;
  }

  function updateModalGL() {
    if (!selectedFood) return;
    const weight = parseInt(weightInput.value) || 0;
    const gl = Plate.calcGL(selectedFood.gi, selectedFood.carbs, weight);
    const level = Plate.glLevel(gl);

    modalGL.textContent = gl.toFixed(1);
    modalGL.className = 'gl-preview__value gl--' + level;

    const pct = Math.min(gl / 30 * 100, 100);
    modalGLBar.style.width = pct + '%';
    modalGLBar.className = 'gl-preview__fill gl-fill--' + level;
  }

  function setActivePreset(weight) {
    weightPresets.querySelectorAll('.preset-btn').forEach(btn => {
      btn.classList.toggle('preset-btn--active', parseInt(btn.dataset.weight) === weight);
    });
  }

  // ===== Plate Rendering =====
  function renderPlate() {
    const items = Plate.getItems();
    const count = Plate.getCount();
    const totalGL = Plate.getTotalGL();

    // Count badge
    plateCount.textContent = count;

    // Clear button visibility
    clearPlateBtn.classList.toggle('visible', count > 0);

    // Empty state
    plateEmpty.classList.toggle('hidden', count > 0);

    // Remove items that are no longer in the plate
    const existingEls = plateItems.querySelectorAll('.plate-item');
    existingEls.forEach(el => {
      const id = parseInt(el.dataset.id);
      if (!items.find(item => item.id === id)) {
        el.classList.add('plate-item--removing');
        el.addEventListener('animationend', () => el.remove());
      }
    });

    // Add new items
    items.forEach(item => {
      if (plateItems.querySelector(`.plate-item[data-id="${item.id}"]`)) return;
      const level = Plate.glLevel(item.gl);
      const color = CATEGORY_COLORS[item.food.category] || '#999';
      const el = document.createElement('div');
      el.className = 'plate-item';
      el.dataset.id = item.id;
      el.innerHTML = `
        <div class="plate-item__cat-dot" style="background:${color}"></div>
        <div class="plate-item__info">
          <div class="plate-item__name">${item.food.name_ru}</div>
          <div class="plate-item__detail">${item.weight_g}г &middot; GI ${item.food.gi} &middot; ${item.food.carbs}г угл.</div>
        </div>
        <div class="plate-item__gl">
          <div class="plate-item__gl-value gl--${level}">${item.gl.toFixed(1)}</div>
          <div class="plate-item__gl-label">GL</div>
        </div>
        <button class="plate-item__remove" data-remove="${item.id}" aria-label="Удалить">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>`;
      // Insert before empty state
      plateItems.insertBefore(el, plateEmpty);
    });

    // Summary
    if (count > 0) {
      glSummary.classList.add('visible');
      const level = Plate.dailyGLLevel(totalGL);
      glSummaryValue.textContent = totalGL.toFixed(1);
      glSummaryValue.className = 'gl-summary__value gl--' + level;
      glSummaryIndicator.className = 'gl-summary__indicator gl-fill--' + level;

      const pct = Math.min(totalGL / 150 * 100, 100);
      glSummaryBar.style.width = pct + '%';
      glSummaryBar.className = 'gl-summary__bar-fill gl-fill--' + level;

      const wordForm = count === 1 ? 'продукт' : (count < 5 ? 'продукта' : 'продуктов');
      glSummaryItems.textContent = `${count} ${wordForm}`;
    } else {
      glSummary.classList.remove('visible');
    }
  }

  // ===== Event Listeners =====
  function setupListeners() {
    // Search input
    let searchTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(doSearch, 80);
    });

    searchInput.addEventListener('focus', () => {
      if (searchInput.value || activeCategory !== 'all') doSearch();
    });

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-section')) {
        searchResults.classList.remove('open');
      }
    });

    // Clear search
    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchClear.classList.remove('visible');
      searchResults.classList.remove('open');
      searchInput.focus();
    });

    // Category pills
    categoriesEl.addEventListener('click', (e) => {
      const pill = e.target.closest('.cat-pill');
      if (!pill) return;
      activeCategory = pill.dataset.cat;
      categoriesEl.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('cat-pill--active'));
      pill.classList.add('cat-pill--active');
      doSearch();
    });

    // Search result click
    searchResults.addEventListener('click', (e) => {
      const result = e.target.closest('.search-result');
      if (!result) return;
      const food = allFoods.find(f => f.id === parseInt(result.dataset.id));
      if (food) {
        openAddModal(food);
        searchResults.classList.remove('open');
      }
    });

    // Modal close
    modalClose.addEventListener('click', closeAddModal);
    addModal.addEventListener('click', (e) => {
      if (e.target === addModal) closeAddModal();
    });

    // Weight input
    weightInput.addEventListener('input', () => {
      setActivePreset(parseInt(weightInput.value));
      updateModalGL();
    });

    // Weight +/- buttons
    document.querySelectorAll('.weight-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const delta = parseInt(btn.dataset.delta);
        const current = parseInt(weightInput.value) || 0;
        const newVal = Math.max(1, current + delta);
        weightInput.value = newVal;
        setActivePreset(newVal);
        updateModalGL();
      });
    });

    // Weight presets
    weightPresets.addEventListener('click', (e) => {
      const btn = e.target.closest('.preset-btn');
      if (!btn) return;
      weightInput.value = btn.dataset.weight;
      setActivePreset(parseInt(btn.dataset.weight));
      updateModalGL();
    });

    // Add to plate
    modalAddBtn.addEventListener('click', () => {
      if (!selectedFood) return;
      const weight = parseInt(weightInput.value) || 100;
      Plate.add(selectedFood, weight);
      closeAddModal();

      // Clear search
      searchInput.value = '';
      searchClear.classList.remove('visible');
    });

    // Remove from plate
    plateItems.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove]');
      if (!btn) return;
      Plate.remove(parseInt(btn.dataset.remove));
    });

    // Clear plate
    clearPlateBtn.addEventListener('click', () => {
      if (Plate.getCount() === 0) return;
      Plate.clear();
      // Remove all plate item elements
      plateItems.querySelectorAll('.plate-item').forEach(el => el.remove());
    });

    // Info modal
    infoBtn.addEventListener('click', () => {
      infoModal.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
    infoModalClose.addEventListener('click', () => {
      infoModal.classList.remove('open');
      document.body.style.overflow = '';
    });
    infoModal.addEventListener('click', (e) => {
      if (e.target === infoModal) {
        infoModal.classList.remove('open');
        document.body.style.overflow = '';
      }
    });

    // Prevent zoom on input focus (iOS)
    document.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
      input.addEventListener('focus', () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, viewport-fit=cover, user-scalable=no';
      });
      input.addEventListener('blur', () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        viewport.content = 'width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=no';
      });
    });
  }
})();

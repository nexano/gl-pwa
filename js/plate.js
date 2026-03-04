/**
 * Plate — in-memory collection of foods with GL calculation.
 */
const Plate = (() => {
  let items = []; // { id, food, weight_g, gl }
  let nextId = 1;
  let onChange = null;

  function calcGL(gi, carbs, weight_g) {
    return Math.round((gi * carbs * weight_g / 10000) * 10) / 10;
  }

  function add(food, weight_g) {
    const gl = calcGL(food.gi, food.carbs, weight_g);
    items.push({
      id: nextId++,
      food,
      weight_g,
      gl,
    });
    if (onChange) onChange();
    return items[items.length - 1];
  }

  function remove(id) {
    items = items.filter(item => item.id !== id);
    if (onChange) onChange();
  }

  function clear() {
    items = [];
    if (onChange) onChange();
  }

  function getItems() {
    return [...items];
  }

  function getTotalGL() {
    return Math.round(items.reduce((sum, item) => sum + item.gl, 0) * 10) / 10;
  }

  function getCount() {
    return items.length;
  }

  function setOnChange(fn) {
    onChange = fn;
  }

  // GL level classification for a single product
  function glLevel(gl) {
    if (gl <= 10) return 'low';
    if (gl <= 19) return 'mid';
    return 'high';
  }

  // GL level for daily total
  function dailyGLLevel(totalGL) {
    if (totalGL < 80) return 'low';
    if (totalGL <= 120) return 'mid';
    return 'high';
  }

  // GI level classification
  function giLevel(gi) {
    if (gi <= 55) return 'low';
    if (gi <= 69) return 'mid';
    return 'high';
  }

  return { add, remove, clear, getItems, getTotalGL, getCount, setOnChange, calcGL, glLevel, dailyGLLevel, giLevel };
})();

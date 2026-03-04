#!/usr/bin/env node
/**
 * Build curated foods.json.
 * Lookup GI/CHO values from Diogenes data, use curated Russian names.
 */

const fs = require('fs');
const path = require('path');

const raw = JSON.parse(fs.readFileSync(path.join(__dirname, 'gi_full_raw.json'), 'utf8'));

// Build lookup by English name (lowercase) -> { gi, carbs } (best confidence)
const lookup = new Map();
for (const item of raw) {
  const name = (item['English translation'] || '').toLowerCase().trim();
  const gi = parseFloat(item['GI value']);
  const cho = parseFloat(item['CHO (g/100g)']);
  const conf = parseInt(item['GI confidence level']) || 99;
  if (!name || isNaN(gi) || isNaN(cho)) continue;
  if (!lookup.has(name) || conf < lookup.get(name).conf) {
    lookup.set(name, { gi: Math.round(gi), carbs: Math.round(cho * 10) / 10, conf });
  }
}

console.log(`Lookup entries: ${lookup.size}`);

// Helper to find closest match
function findGI(searchTerms) {
  for (const term of searchTerms) {
    const key = term.toLowerCase().trim();
    if (lookup.has(key)) return lookup.get(key);
  }
  // Try substring match
  for (const term of searchTerms) {
    const key = term.toLowerCase().trim();
    for (const [name, val] of lookup) {
      if (name.includes(key) || key.includes(name)) return val;
    }
  }
  return null;
}

// Curated food list with Russian names
// Format: [name_ru, name_en, gi, carbs_per_100g, category]
// GI and carbs are from academic sources (Diogenes, Sydney University, Harvard)
const FOODS = [
  // === ХЛЕБ И ВЫПЕЧКА ===
  ["Белый хлеб", "White bread", 75, 49, "bread"],
  ["Белый хлеб (тост)", "White bread, toasted", 75, 49, "bread"],
  ["Цельнозерновой хлеб", "Wholemeal bread", 54, 41, "bread"],
  ["Ржаной хлеб", "Rye bread", 49, 37, "bread"],
  ["Хлеб с отрубями", "Bran bread", 47, 40, "bread"],
  ["Багет", "Baguette", 95, 56, "bread"],
  ["Чиабатта", "Ciabatta", 70, 47, "bread"],
  ["Лаваш (белый)", "Pitta bread, white", 67, 55, "bread"],
  ["Лаваш (цельнозерновой)", "Pitta bread, wholemeal", 56, 50, "bread"],
  ["Круассан", "Croissant", 67, 46, "bread"],
  ["Бриошь", "Brioche", 63, 53, "bread"],
  ["Тортилья (пшеничная)", "Wheat tortilla", 30, 50, "bread"],
  ["Чапати", "Chapati", 52, 44, "bread"],
  ["Наан", "Naan bread", 71, 48, "bread"],
  ["Хлебцы ржаные", "Rye crispbread", 64, 62, "bread"],
  ["Сухари", "Rusks", 70, 72, "bread"],
  ["Панировочные сухари", "Breadcrumbs", 74, 77, "bread"],
  ["Булочка белая", "White bread roll", 72, 52, "bread"],
  ["Солодовый хлеб", "Malt bread", 67, 56, "bread"],

  // === КРУПЫ И КАШИ ===
  ["Овсянка (геркулес)", "Rolled oats", 55, 60, "cereals"],
  ["Овсяная каша", "Porridge oats", 55, 60, "cereals"],
  ["Мюсли (без сахара)", "Muesli, no sugar", 49, 66, "cereals"],
  ["Мюсли (с сахаром)", "Muesli, with sugar", 56, 68, "cereals"],
  ["Гранола", "Granola", 55, 65, "cereals"],
  ["Кукурузные хлопья", "Corn flakes", 93, 84, "cereals"],
  ["Отруби (хлопья)", "Bran flakes", 74, 65, "cereals"],
  ["Отруби (All-Bran)", "All-Bran", 42, 48, "cereals"],
  ["Гречка (варёная)", "Buckwheat, boiled", 54, 20, "cereals"],
  ["Перловка (варёная)", "Pearl barley, boiled", 28, 23, "cereals"],
  ["Булгур (варёный)", "Bulgur wheat, boiled", 48, 18, "cereals"],
  ["Кускус (варёный)", "Couscous, boiled", 65, 23, "cereals"],
  ["Пшено (варёное)", "Millet, boiled", 71, 23, "cereals"],
  ["Киноа (варёная)", "Quinoa, boiled", 53, 21, "cereals"],
  ["Манная каша", "Semolina pudding", 55, 10, "cereals"],
  ["Манка (сухая)", "Semolina, dry", 55, 69, "cereals"],
  ["Рисовые хлопья", "Rice flakes", 82, 81, "cereals"],
  ["Воздушный рис (хлопья)", "Puffed rice", 82, 87, "cereals"],
  ["Кукурузная крупа", "Cornmeal", 68, 73, "cereals"],
  ["Овсяные отруби", "Oat bran", 55, 40, "cereals"],

  // === РИС ===
  ["Белый рис (варёный)", "White rice, boiled", 73, 28, "rice"],
  ["Белый рис (сырой)", "White rice, raw", 73, 80, "rice"],
  ["Бурый рис (варёный)", "Brown rice, boiled", 68, 32, "rice"],
  ["Бурый рис (сырой)", "Brown rice, raw", 68, 77, "rice"],
  ["Рис басмати (варёный)", "Basmati rice, boiled", 58, 28, "rice"],
  ["Рис басмати (сырой)", "Basmati rice, raw", 58, 78, "rice"],
  ["Рис длиннозерный (варёный)", "Long grain rice, boiled", 56, 28, "rice"],
  ["Рис пропаренный (варёный)", "Parboiled rice, boiled", 38, 28, "rice"],
  ["Рис жасмин (варёный)", "Jasmine rice, boiled", 89, 28, "rice"],
  ["Клейкий рис (варёный)", "Glutinous rice, boiled", 98, 22, "rice"],
  ["Рисовые лепёшки", "Rice cakes", 82, 79, "rice"],
  ["Ризотто", "Risotto", 69, 20, "rice"],

  // === МАКАРОНЫ ===
  ["Спагетти (варёные)", "Spaghetti, boiled", 49, 27, "pasta"],
  ["Спагетти цельнозерновые (варёные)", "Wholemeal spaghetti, boiled", 42, 24, "pasta"],
  ["Макароны (варёные)", "Macaroni, boiled", 47, 27, "pasta"],
  ["Пенне (варёные)", "Penne, boiled", 50, 27, "pasta"],
  ["Лапша яичная (варёная)", "Egg noodles, boiled", 40, 13, "pasta"],
  ["Лапша рисовая (варёная)", "Rice noodles, boiled", 53, 24, "pasta"],
  ["Лазанья", "Lasagne", 35, 12, "pasta"],
  ["Вермишель (варёная)", "Vermicelli, boiled", 35, 25, "pasta"],
  ["Фунчоза (варёная)", "Glass noodles, boiled", 39, 20, "pasta"],

  // === КАРТОФЕЛЬ ===
  ["Картофель варёный", "Potato, boiled", 78, 17, "potatoes"],
  ["Картофельное пюре", "Mashed potatoes", 87, 16, "potatoes"],
  ["Картофель запечённый", "Baked potato", 85, 17, "potatoes"],
  ["Картофель жареный", "Fried potatoes", 75, 25, "potatoes"],
  ["Молодой картофель (варёный)", "New potatoes, boiled", 62, 15, "potatoes"],
  ["Картофель фри", "French fries", 75, 35, "potatoes"],
  ["Чипсы картофельные", "Potato crisps", 56, 50, "potatoes"],
  ["Картофель в мундире", "Jacket potato", 85, 17, "potatoes"],
  ["Батат (сладкий картофель)", "Sweet potato, boiled", 63, 20, "potatoes"],
  ["Картофельное пюре (из порошка)", "Instant mashed potato", 85, 14, "potatoes"],
  ["Ямс (варёный)", "Yam, boiled", 37, 26, "potatoes"],

  // === БОБОВЫЕ ===
  ["Чечевица красная (варёная)", "Red lentils, boiled", 26, 17, "legumes"],
  ["Чечевица зелёная (варёная)", "Green lentils, boiled", 30, 17, "legumes"],
  ["Нут (варёный)", "Chickpeas, boiled", 28, 18, "legumes"],
  ["Фасоль белая (варёная)", "White beans, boiled", 31, 17, "legumes"],
  ["Фасоль красная (варёная)", "Kidney beans, boiled", 24, 17, "legumes"],
  ["Фасоль консервированная (в том. соусе)", "Baked beans, canned", 40, 15, "legumes"],
  ["Горох зелёный (варёный)", "Green peas, boiled", 48, 10, "legumes"],
  ["Горох жёлтый (варёный)", "Yellow split peas, boiled", 25, 17, "legumes"],
  ["Фасоль лимская (варёная)", "Butter beans, boiled", 31, 17, "legumes"],
  ["Маш (варёный)", "Mung beans, boiled", 31, 16, "legumes"],
  ["Соя (варёная)", "Soya beans, boiled", 16, 5, "legumes"],
  ["Чечевичный суп", "Lentil soup", 44, 12, "legumes"],
  ["Хумус", "Hummus", 6, 11, "legumes"],
  ["Тофу", "Tofu", 15, 2, "legumes"],

  // === ФРУКТЫ ===
  ["Яблоко", "Apple", 36, 12, "fruits"],
  ["Банан", "Banana", 51, 23, "fruits"],
  ["Банан (зелёный)", "Green banana", 30, 23, "fruits"],
  ["Апельсин", "Orange", 43, 9, "fruits"],
  ["Виноград", "Grapes", 46, 16, "fruits"],
  ["Груша", "Pear", 38, 12, "fruits"],
  ["Персик", "Peach", 42, 10, "fruits"],
  ["Абрикос", "Apricot", 34, 9, "fruits"],
  ["Слива", "Plum", 39, 10, "fruits"],
  ["Клубника", "Strawberry", 40, 6, "fruits"],
  ["Голубика", "Blueberry", 53, 12, "fruits"],
  ["Малина", "Raspberry", 32, 5, "fruits"],
  ["Вишня", "Cherry", 22, 12, "fruits"],
  ["Арбуз", "Watermelon", 76, 8, "fruits"],
  ["Дыня (канталупа)", "Cantaloupe melon", 65, 6, "fruits"],
  ["Манго", "Mango", 51, 14, "fruits"],
  ["Ананас", "Pineapple", 59, 12, "fruits"],
  ["Киви", "Kiwi fruit", 53, 11, "fruits"],
  ["Грейпфрут", "Grapefruit", 25, 7, "fruits"],
  ["Папайя", "Papaya", 59, 10, "fruits"],
  ["Гранат", "Pomegranate", 35, 14, "fruits"],
  ["Хурма", "Persimmon", 50, 19, "fruits"],
  ["Финики (сушёные)", "Dates, dried", 42, 75, "fruits"],
  ["Изюм", "Raisins", 64, 79, "fruits"],
  ["Курага", "Dried apricots", 31, 63, "fruits"],
  ["Чернослив", "Prunes", 29, 43, "fruits"],
  ["Инжир (сушёный)", "Dried figs", 61, 64, "fruits"],
  ["Яблоко сушёное", "Dried apple", 38, 60, "fruits"],
  ["Сок апельсиновый", "Orange juice", 50, 10, "fruits"],
  ["Сок яблочный", "Apple juice", 41, 12, "fruits"],
  ["Сок виноградный", "Grape juice", 48, 15, "fruits"],
  ["Сок ананасовый", "Pineapple juice", 46, 13, "fruits"],
  ["Сок грейпфрутовый", "Grapefruit juice", 48, 8, "fruits"],
  ["Консервированные персики", "Canned peaches", 52, 14, "fruits"],
  ["Фруктовый коктейль (конс.)", "Fruit cocktail, canned", 55, 15, "fruits"],

  // === ОВОЩИ ===
  ["Морковь (сырая)", "Carrots, raw", 16, 7, "vegetables"],
  ["Морковь (варёная)", "Carrots, boiled", 39, 5, "vegetables"],
  ["Свёкла (варёная)", "Beetroot, boiled", 64, 6, "vegetables"],
  ["Тыква (варёная)", "Pumpkin, boiled", 75, 4, "vegetables"],
  ["Кукуруза (варёная)", "Sweetcorn, boiled", 52, 17, "vegetables"],
  ["Кукуруза (консервированная)", "Sweetcorn, canned", 46, 16, "vegetables"],
  ["Пастернак (варёный)", "Parsnip, boiled", 52, 12, "vegetables"],
  ["Брюква (варёная)", "Swede, boiled", 72, 3, "vegetables"],
  ["Помидор", "Tomato", 15, 3, "vegetables"],
  ["Огурец", "Cucumber", 15, 2, "vegetables"],
  ["Перец болгарский", "Bell pepper", 15, 5, "vegetables"],
  ["Брокколи", "Broccoli", 15, 4, "vegetables"],
  ["Цветная капуста", "Cauliflower", 15, 3, "vegetables"],
  ["Капуста белокочанная", "Cabbage", 15, 4, "vegetables"],
  ["Шпинат", "Spinach", 15, 1, "vegetables"],
  ["Салат (листья)", "Lettuce", 15, 2, "vegetables"],
  ["Баклажан", "Eggplant", 15, 3, "vegetables"],
  ["Кабачок", "Zucchini", 15, 3, "vegetables"],
  ["Лук репчатый", "Onion", 15, 8, "vegetables"],
  ["Грибы", "Mushrooms", 15, 1, "vegetables"],
  ["Маслины / оливки", "Olives", 15, 4, "vegetables"],

  // === МОЛОЧНЫЕ ===
  ["Молоко цельное", "Whole milk", 27, 5, "dairy"],
  ["Молоко обезжиренное", "Skimmed milk", 32, 5, "dairy"],
  ["Йогурт натуральный", "Natural yoghurt", 36, 5, "dairy"],
  ["Йогурт фруктовый", "Fruit yoghurt", 41, 16, "dairy"],
  ["Йогурт обезжиренный", "Low-fat yoghurt", 33, 7, "dairy"],
  ["Кефир", "Kefir", 15, 4, "dairy"],
  ["Мороженое", "Ice cream", 51, 24, "dairy"],
  ["Мороженое (обезж.)", "Low-fat ice cream", 50, 27, "dairy"],
  ["Творог", "Cottage cheese", 10, 3, "dairy"],
  ["Сливки", "Cream", 15, 3, "dairy"],
  ["Молоко сгущённое", "Condensed milk", 61, 55, "dairy"],
  ["Сыр (твёрдый)", "Hard cheese", 10, 1, "dairy"],
  ["Какао (на молоке)", "Cocoa with milk", 43, 21, "dairy"],
  ["Молочный коктейль", "Milkshake", 37, 19, "dairy"],
  ["Заварной крем (кастард)", "Custard", 43, 16, "dairy"],

  // === ОРЕХИ И СЕМЕНА ===
  ["Арахис", "Peanuts", 14, 16, "nuts"],
  ["Кешью", "Cashew nuts", 22, 18, "nuts"],
  ["Миндаль", "Almonds", 15, 10, "nuts"],
  ["Грецкий орех", "Walnuts", 15, 7, "nuts"],
  ["Фисташки", "Pistachios", 15, 17, "nuts"],
  ["Фундук", "Hazelnuts", 15, 10, "nuts"],
  ["Орехи смесь", "Mixed nuts", 24, 15, "nuts"],
  ["Семена подсолнечника", "Sunflower seeds", 35, 15, "nuts"],
  ["Семена тыквы", "Pumpkin seeds", 25, 11, "nuts"],
  ["Семена чиа", "Chia seeds", 15, 8, "nuts"],
  ["Семена льна", "Flax seeds", 15, 2, "nuts"],

  // === СЛАДОСТИ И ВЫПЕЧКА ===
  ["Шоколад молочный", "Milk chocolate", 43, 55, "sweets"],
  ["Шоколад тёмный", "Dark chocolate", 23, 45, "sweets"],
  ["Шоколад белый", "White chocolate", 44, 59, "sweets"],
  ["Печенье овсяное", "Oatmeal cookie", 55, 65, "sweets"],
  ["Печенье песочное", "Shortbread", 64, 63, "sweets"],
  ["Печенье сахарное", "Sweet biscuit", 59, 77, "sweets"],
  ["Вафли", "Waffles", 76, 46, "sweets"],
  ["Пончик", "Doughnut", 76, 49, "sweets"],
  ["Пончик с джемом", "Jam doughnut", 76, 52, "sweets"],
  ["Кекс / маффин", "Muffin", 60, 51, "sweets"],
  ["Бисквит", "Sponge cake", 46, 54, "sweets"],
  ["Торт шоколадный", "Chocolate cake", 38, 52, "sweets"],
  ["Круассан с шоколадом", "Chocolate croissant", 67, 50, "sweets"],
  ["Блины (сладкие)", "Sweet pancakes", 67, 35, "sweets"],
  ["Мёд", "Honey", 55, 81, "sweets"],
  ["Джем / варенье", "Jam", 49, 69, "sweets"],
  ["Мармелад (цитрусовый)", "Marmalade", 48, 69, "sweets"],
  ["Нуга", "Nougat", 32, 66, "sweets"],
  ["Карамель", "Caramel candy", 60, 76, "sweets"],
  ["Пастила / маршмеллоу", "Marshmallow", 62, 81, "sweets"],
  ["Зефир", "Zephyr", 65, 79, "sweets"],
  ["Халва", "Halva", 70, 51, "sweets"],
  ["Пирог с яблоками", "Apple pie", 44, 31, "sweets"],
  ["Слоёное тесто", "Puff pastry", 59, 38, "sweets"],
  ["Сорбет / шербет", "Sorbet", 49, 27, "sweets"],
  ["Желе (с молоком)", "Jelly with milk", 55, 14, "sweets"],
  ["Пудинг шоколадный", "Chocolate pudding", 47, 20, "sweets"],
  ["Пудинг ванильный", "Vanilla pudding", 40, 18, "sweets"],
  ["Конфитюр (без сахара)", "Jam, reduced sugar", 26, 37, "sweets"],
  ["Батончик мюсли", "Cereal bar", 61, 70, "sweets"],

  // === САХАР И СИРОПЫ ===
  ["Сахар белый", "White sugar", 65, 100, "sugar"],
  ["Сахар коричневый", "Brown sugar", 65, 98, "sugar"],
  ["Сахарная пудра", "Icing sugar", 65, 100, "sugar"],
  ["Глюкоза", "Glucose", 99, 100, "sugar"],
  ["Фруктоза", "Fructose", 15, 100, "sugar"],
  ["Кленовый сироп", "Maple syrup", 54, 67, "sugar"],
  ["Сироп агавы", "Agave syrup", 15, 76, "sugar"],
  ["Мальтодекстрин", "Maltodextrin", 95, 95, "sugar"],

  // === НАПИТКИ ===
  ["Кола", "Cola", 63, 11, "beverages"],
  ["Фанта / апельсиновая газировка", "Orange soda", 68, 12, "beverages"],
  ["Энергетик (Red Bull)", "Energy drink", 70, 11, "beverages"],
  ["Спортивный напиток (изотоник)", "Sports drink, isotonic", 70, 6, "beverages"],
  ["Пиво", "Beer", 66, 3, "beverages"],
  ["Квас", "Kvass", 45, 5, "beverages"],
  ["Кофе с молоком (латте)", "Coffee latte", 27, 5, "beverages"],
  ["Какао (на воде)", "Cocoa, water-based", 43, 10, "beverages"],
  ["Чай с сахаром", "Tea with sugar", 65, 5, "beverages"],
  ["Компот", "Kompot (fruit drink)", 50, 12, "beverages"],
  ["Кисель", "Kissel", 50, 15, "beverages"],
  ["Смузи фруктовый", "Fruit smoothie", 44, 13, "beverages"],

  // === СНЕКИ ===
  ["Попкорн (простой)", "Popcorn, plain", 65, 55, "snacks"],
  ["Попкорн (карамельный)", "Popcorn, caramel", 72, 76, "snacks"],
  ["Крекеры", "Crackers", 70, 65, "snacks"],
  ["Крекеры цельнозерновые", "Wholemeal crackers", 59, 60, "snacks"],
  ["Сухарики / гренки", "Croutons", 70, 65, "snacks"],
  ["Кукурузные чипсы", "Tortilla chips", 63, 63, "snacks"],
  ["Крендельки (претцели)", "Pretzels", 83, 79, "snacks"],
  ["Рисовые хлебцы", "Rice cakes", 82, 79, "snacks"],
  ["Батончик Сникерс", "Snickers bar", 55, 59, "snacks"],
  ["Батончик Марс", "Mars bar", 62, 70, "snacks"],
  ["Батончик Твикс", "Twix bar", 44, 64, "snacks"],

  // === СУПЫ ===
  ["Суп-пюре из тыквы", "Pumpkin soup", 75, 6, "soups"],
  ["Суп минестроне", "Minestrone soup", 39, 5, "soups"],
  ["Суп чечевичный", "Lentil soup", 44, 12, "soups"],
  ["Суп куриный с лапшой", "Chicken noodle soup", 45, 6, "soups"],
  ["Суп гороховый", "Pea soup", 66, 12, "soups"],
  ["Суп-пюре из грибов", "Cream of mushroom soup", 45, 5, "soups"],
  ["Борщ", "Borscht", 30, 5, "soups"],

  // === ГОТОВЫЕ БЛЮДА ===
  ["Пицца (с сыром)", "Pizza, cheese", 60, 30, "meals"],
  ["Пицца (с овощами)", "Pizza, vegetable", 45, 28, "meals"],
  ["Суши (с рисом)", "Sushi, with rice", 55, 30, "meals"],
  ["Роллы (с рисом)", "Sushi rolls", 55, 28, "meals"],
  ["Пельмени / равиоли", "Ravioli / dumplings", 39, 25, "meals"],
  ["Блины (несладкие)", "Savoury pancakes", 60, 26, "meals"],
  ["Оладьи", "Fritters", 62, 30, "meals"],
  ["Каша овсяная (на молоке)", "Porridge with milk", 42, 12, "meals"],
  ["Каша рисовая (на молоке)", "Rice porridge with milk", 65, 16, "meals"],
  ["Каша гречневая (на воде)", "Buckwheat porridge, water", 50, 20, "meals"],
  ["Каша манная (на молоке)", "Semolina porridge, milk", 55, 15, "meals"],
  ["Плов", "Pilaf / plov", 60, 25, "meals"],
  ["Котлеты (куриные)", "Chicken cutlets", 50, 10, "meals"],
  ["Голубцы", "Cabbage rolls", 40, 8, "meals"],

  // === СОУСЫ И ПРИПРАВЫ ===
  ["Кетчуп", "Ketchup", 55, 24, "sauces"],
  ["Соус болоньезе", "Bolognese sauce", 45, 7, "sauces"],
  ["Соус томатный", "Tomato sauce", 45, 8, "sauces"],
  ["Майонез", "Mayonnaise", 15, 2, "sauces"],
  ["Горчица", "Mustard", 35, 5, "sauces"],

  // === МЯСО И РЫБА (с углеводами) ===
  ["Рыбные палочки (панир.)", "Fish fingers", 38, 14, "protein"],
  ["Куриные наггетсы", "Chicken nuggets", 46, 16, "protein"],
  ["Сосиски", "Sausages", 28, 8, "protein"],
  ["Колбаса варёная", "Cooked sausage", 28, 2, "protein"],
];

// Generate final JSON
const result = FOODS.map((item, i) => ({
  id: i + 1,
  name_ru: item[0],
  name_en: item[1],
  gi: item[2],
  carbs: item[3],
  category: item[4],
}));

const outputPath = path.join(__dirname, '..', 'data', 'foods.json');
fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

console.log(`Written ${result.length} items to data/foods.json`);

// Stats
const cats = {};
result.forEach(x => { cats[x.category] = (cats[x.category] || 0) + 1; });
console.log('\nCategory breakdown:');
Object.entries(cats).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`  ${c}: ${n}`));

// Validate: no duplicate name_ru
const nameSet = new Set();
const dupes = [];
result.forEach(x => {
  if (nameSet.has(x.name_ru)) dupes.push(x.name_ru);
  nameSet.add(x.name_ru);
});
if (dupes.length) console.log('\nDuplicate names:', dupes);
else console.log('\nNo duplicate names - OK');

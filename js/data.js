/* ==========================================================
   Контент и настройки студии.
   Всё, что мастер может захотеть поменять, собрано здесь.
   ========================================================== */

const CONFIG = {
  // Номер WhatsApp в международном формате, только цифры (без +)
  whatsapp: '77028864446',
  phone: '+7 702 886 44 46',
  instagram: 'master_nail.uralsk',
  twoGisUrl: 'https://2gis.kz/uralsk/search/%D0%A2%D0%94%20%D0%90%D1%81%D1%82%D0%B0%D0%BD%D0%B0',

  // График работы: 0 — воскресенье, 1 — понедельник … 6 — суббота
  workDays: [1, 2, 3, 4, 5, 6],
  openHour: 10,
  closeHour: 20,
  slotStepMin: 30,
  // На сколько дней вперёд можно записаться
  bookingHorizonDays: 45,

  // Уже занятые слоты: 'ГГГГ-ММ-ДД': ['ЧЧ:ММ', …]
  bookedSlots: {
    // '2026-10-07': ['10:00', '10:30', '11:00'],
  },
  // Демо-режим: часть слотов помечается занятыми, чтобы календарь
  // выглядел «живым». Отключите (false), когда подключите реальное расписание.
  demoBusy: true,
};

/* Прайс (актуален с 1 декабря 2025 г.)
   price — цена в тенге; priceTo — верхняя граница диапазона;
   priceFrom — «от»; plus — доплата к основной услуге («+1 000 ₸»).
   duration — ориентировочная длительность в минутах (уточните у мастера). */
const PRICE_DATE = { ru: 'Цены актуальны с 1 декабря 2025 г.', kk: 'Бағалар 2025 жылғы 1 желтоқсаннан бастап жарамды.' };

const CATEGORIES = [
  { id: 'manicure', swatch: '#E3C3AE', bg: '#EADFD2', name: { ru: 'Маникюр', kk: 'Маникюр' } },
  { id: 'extra', swatch: '#C99A92', bg: '#E3CFC6', name: { ru: 'Дополнительно и снятие', kk: 'Қосымша және алу' } },
  { id: 'pedicure', swatch: '#6E2A30', bg: '#E0CFCB', name: { ru: 'Педикюр', kk: 'Педикюр' } },
];

const SERVICES = [
  { id: 'mani-bare', cat: 'manicure', swatch: '#E6CDB9', price: 4000, duration: 60,
    name: { ru: 'Маникюр без покрытия', kk: 'Жабынсыз маникюр' } },
  { id: 'mani-gel', cat: 'manicure', swatch: '#C99A86', price: 7000, duration: 90,
    name: { ru: 'Маникюр с покрытием', kk: 'Жабынмен маникюр' } },
  { id: 'mani-strong', cat: 'manicure', swatch: '#B98378', price: 8000, duration: 120,
    name: { ru: 'Маникюр с укреплением', kk: 'Нығайтумен маникюр' },
    note: { ru: 'акригель / полигель', kk: 'акригель / полигель' } },
  { id: 'extension', cat: 'manicure', swatch: '#A4553A', price: 10000, priceTo: 11000, duration: 150,
    name: { ru: 'Наращивание ногтей', kk: 'Тырнақ ұзарту' } },

  { id: 'remove-other', cat: 'extra', swatch: '#D8BBA8', price: 1000, duration: 15,
    name: { ru: 'Снятие чужого покрытия', kk: 'Басқа шебердің жабынын алу' } },
  { id: 'remove-only', cat: 'extra', swatch: '#CDB79E', price: 1000, duration: 20,
    name: { ru: 'Снятие без последующего покрытия', kk: 'Кейін жабынсыз алу' } },
  { id: 'french', cat: 'extra', swatch: '#F3E8DE', price: 1000, plus: true, duration: 15,
    name: { ru: 'Френч', kk: 'Френч' } },
  { id: 'design', cat: 'extra', swatch: '#8B6B5C', price: 500, priceFrom: true, duration: 15,
    name: { ru: 'Дизайн', kk: 'Дизайн' } },
  { id: 'repair', cat: 'extra', swatch: '#B89A88', price: 500, priceTo: 1000, duration: 15,
    name: { ru: 'Ремонт 1 ногтя', kk: '1 тырнақты жөндеу' } },

  { id: 'pedi-full', cat: 'pedicure', swatch: '#6E2A30', price: 11000, duration: 120,
    name: { ru: 'Полный педикюр', kk: 'Толық педикюр' },
    note: { ru: 'стопы + пальчики + покрытие', kk: 'табан + саусақтар + жабын' } },
  { id: 'pedi-bare', cat: 'pedicure', swatch: '#D6AE98', price: 9000, duration: 90,
    name: { ru: 'Педикюр без покрытия', kk: 'Жабынсыз педикюр' },
    note: { ru: 'стопы + пальчики', kk: 'табан + саусақтар' } },
  { id: 'pedi-mini', cat: 'pedicure', swatch: '#9C5A57', price: 7000, duration: 75,
    name: { ru: 'Мини-педикюр', kk: 'Мини-педикюр' },
    note: { ru: 'только пальчики + покрытие', kk: 'тек саусақтар + жабын' } },
  { id: 'pedi-toes', cat: 'pedicure', swatch: '#E2C2AF', price: 5000, duration: 45,
    name: { ru: 'Обработка пальчиков', kk: 'Саусақтарды өңдеу' } },
];

/* Портфолио: style — фильтр, palette — цвета для плейсхолдера */
const PORTFOLIO = [
  { style: 'nude',   size: 'tall', palette: ['#E8CFBE', '#E8CFBE', '#E8CFBE', '#E8CFBE'], bg: '#EFE5D9', title: { ru: 'Молочный нюд', kk: 'Сүтті нюд' } },
  { style: 'french', size: '',     palette: ['#F0DDD0'], tip: '#FBF8F3', bg: '#E4D6C5', title: { ru: 'Тонкий френч', kk: 'Жіңішке френч' } },
  { style: 'design', size: 'wide', palette: ['#E3CBB8', '#A4553A', '#E3CBB8', '#2B2320'], deco: 'line', bg: '#F3ECE3', title: { ru: 'Графика и линии', kk: 'Графика мен сызықтар' } },
  { style: 'bright', size: '',     palette: ['#6E2A30', '#6E2A30', '#6E2A30', '#6E2A30'], bg: '#E9DCCD', title: { ru: 'Бордо', kk: 'Бордо' } },
  { style: 'nude',   size: 'tall', palette: ['#D9B7A2', '#D9B7A2', '#D9B7A2', '#D9B7A2'], bg: '#F5EEE6', title: { ru: 'Кофе с молоком', kk: 'Сүтті кофе' } },
  { style: 'design', size: 'tall', palette: ['#F1E6DA', '#C99A86', '#F1E6DA', '#C99A86'], deco: 'dots', bg: '#E2D2BF', title: { ru: 'Точечный акцент', kk: 'Нүктелі акцент' } },
  { style: 'french', size: '',     palette: ['#EAD3C4'], tip: '#6E2A30', bg: '#F2EAE0', title: { ru: 'Цветной френч', kk: 'Түрлі түсті френч' } },
  { style: 'bright', size: 'wide', palette: ['#A4553A', '#B4502F', '#A4553A', '#B4502F'], bg: '#EDE3D6', title: { ru: 'Терракота', kk: 'Терракота' } },
  { style: 'design', size: '',     palette: ['#E6CDB9', '#E6CDB9', '#8B6B5C', '#E6CDB9'], deco: 'moon', bg: '#F4EDE4', title: { ru: 'Лунный маникюр', kk: 'Ай маникюры' } },
  { style: 'nude',   size: '',     palette: ['#EED9CC', '#E2C2AF', '#D6AE98', '#C99A86'], bg: '#E7DACB', title: { ru: 'Градиент нюда', kk: 'Нюд градиенті' } },
  { style: 'bright', size: 'wide', palette: ['#2B2320', '#2B2320', '#2B2320', '#2B2320'], bg: '#EADFD2', title: { ru: 'Глубокий шоколад', kk: 'Қою шоколад' } },
  { style: 'french', size: 'wide', palette: ['#E9D2C3'], tip: '#2B2320', bg: '#F1E8DD', title: { ru: 'Графитовый френч', kk: 'Графит френч' } },
];

/* «Подбери оттенок»: 3 оттенка на каждое настроение/сезон */
const SHADES = {
  mood: [
    { id: 'calm', label: { ru: 'Спокойное', kk: 'Сабырлы' }, shades: [
      { hex: '#EAD7C9', name: { ru: 'Овсяное молоко', kk: 'Сұлы сүті' } },
      { hex: '#D8BBA8', name: { ru: 'Лён', kk: 'Зығыр' } },
      { hex: '#B89A88', name: { ru: 'Тёплый камень', kk: 'Жылы тас' } },
    ] },
    { id: 'romantic', label: { ru: 'Романтичное', kk: 'Романтикалық' }, shades: [
      { hex: '#E7C4BA', name: { ru: 'Пудра', kk: 'Опа' } },
      { hex: '#C98F84', name: { ru: 'Сухая роза', kk: 'Кепкен раушан' } },
      { hex: '#9C5A57', name: { ru: 'Рузвельт', kk: 'Рузвельт' } },
    ] },
    { id: 'bold', label: { ru: 'Смелое', kk: 'Батыл' }, shades: [
      { hex: '#A4553A', name: { ru: 'Терракота', kk: 'Терракота' } },
      { hex: '#6E2A30', name: { ru: 'Бордо', kk: 'Бордо' } },
      { hex: '#2B2320', name: { ru: 'Горький шоколад', kk: 'Ащы шоколад' } },
    ] },
    { id: 'office', label: { ru: 'Деловое', kk: 'Іскерлік' }, shades: [
      { hex: '#F1E6DA', name: { ru: 'Молочный', kk: 'Сүтті' } },
      { hex: '#C7B3A3', name: { ru: 'Тауп', kk: 'Тауп' } },
      { hex: '#7D6A60', name: { ru: 'Мокко', kk: 'Мокко' } },
    ] },
  ],
  season: [
    { id: 'spring', label: { ru: 'Весна', kk: 'Көктем' }, shades: [
      { hex: '#EFD9CB', name: { ru: 'Персиковый крем', kk: 'Шабдалы крем' } },
      { hex: '#D7B9A0', name: { ru: 'Песок', kk: 'Құм' } },
      { hex: '#B97E6A', name: { ru: 'Абрикос', kk: 'Өрік' } },
    ] },
    { id: 'summer', label: { ru: 'Лето', kk: 'Жаз' }, shades: [
      { hex: '#F4E9DE', name: { ru: 'Белый лён', kk: 'Ақ зығыр' } },
      { hex: '#D08A6A', name: { ru: 'Карамельный загар', kk: 'Карамель күнге күю' } },
      { hex: '#B4502F', name: { ru: 'Паприка', kk: 'Паприка' } },
    ] },
    { id: 'autumn', label: { ru: 'Осень', kk: 'Күз' }, shades: [
      { hex: '#A4553A', name: { ru: 'Терракота', kk: 'Терракота' } },
      { hex: '#8B6B5C', name: { ru: 'Корица', kk: 'Даршын' } },
      { hex: '#6E2A30', name: { ru: 'Спелая вишня', kk: 'Піскен шие' } },
    ] },
    { id: 'winter', label: { ru: 'Зима', kk: 'Қыс' }, shades: [
      { hex: '#ECE3DA', name: { ru: 'Первый снег', kk: 'Алғашқы қар' } },
      { hex: '#5A2328', name: { ru: 'Глинтвейн', kk: 'Глинтвейн' } },
      { hex: '#2B2320', name: { ru: 'Эспрессо', kk: 'Эспрессо' } },
    ] },
  ],
};

/* Отзывы */
const REVIEWS = [
  {
    name: 'Айгерим',
    service: { ru: 'Гель-лак, нюд', kk: 'Гель-лак, нюд' },
    swatch: '#E6CDB9',
    text: {
      ru: 'Хожу третий месяц — покрытие держится все четыре недели без сколов. И очень спокойно: никакой спешки, чай и тихая музыка.',
      kk: 'Үшінші ай келіп жүрмін — жабын төрт апта бойы сынбай тұрады. Өте тыныш: асығыс жоқ, шай мен баяу музыка.',
    },
  },
  {
    name: 'Дарья',
    service: { ru: 'Наращивание, френч', kk: 'Ұзарту, френч' },
    swatch: '#F0DDD0',
    text: {
      ru: 'Наконец-то френч с идеально тонкой линией. Асель сразу предложила форму, которая подошла к моим пальцам.',
      kk: 'Ақыры мінсіз жіңішке сызықты френч. Әсел саусақтарыма сай пішінді бірден ұсынды.',
    },
  },
  {
    name: 'Мадина',
    service: { ru: 'Дизайн, графика', kk: 'Дизайн, графика' },
    swatch: '#A4553A',
    text: {
      ru: 'Принесла картинку из Pinterest, а получилось даже лучше. Отдельное спасибо за крафт-пакет, вскрытый при мне.',
      kk: 'Pinterest-тен сурет әкелдім, ал нәтиже одан да жақсы болды. Құралдар салынған пакетті көз алдымда ашқаны үшін рахмет.',
    },
  },
  {
    name: 'Ольга',
    service: { ru: 'Педикюр', kk: 'Педикюр' },
    swatch: '#6E2A30',
    text: {
      ru: 'Аккуратно, бережно и без боли. Удобно, что можно записаться онлайн и сразу видеть свободное время.',
      kk: 'Ұқыпты, мұқият және ауыртпай. Онлайн жазылып, бос уақытты бірден көру ыңғайлы.',
    },
  },
];

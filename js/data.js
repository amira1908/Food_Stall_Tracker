/* ══════════════════════════════════════
       DATA
    ══════════════════════════════════════ */
let STALLS = [
  {
    id: 0, name: 'Abang Gpuk', ownerEmoji: '🍗', coverImg: null,
    status: 'open', hours: '11am–10pm', address: 'Block A, Jalan Kampus, UPNM',
    lat: 3.0510, lng: 101.7455, bg: 'linear-gradient(135deg,#c8a87a,#8b5e38)',
    phone: '123456789',
    menu: [
      { name: 'Ayam Gepuk', desc: 'Crispy fried chicken', price: 'RM7.00', img: null, emoji: '🍗' },
      { name: 'Ayam Goreng', desc: 'Classic fried chicken', price: 'RM6.50', img: null, emoji: '🍟' },
      { name: 'Nasi Putih', desc: 'Steamed white rice', price: 'RM1.50', img: null, emoji: '🍚' },
      { name: 'Nasi Lemak', desc: 'Coconut rice set', price: 'RM5.00', img: null, emoji: '🍛' },
      { name: 'Burger Daging', desc: 'Beef patty burger', price: 'RM8.00', img: null, emoji: '🍔' },
      { name: 'Teh Tarik', desc: 'Pulled milk tea', price: 'RM2.50', img: null, emoji: '🧋' },
      { name: 'Milo Ais', desc: 'Iced Milo beverage', price: 'RM2.50', img: null, emoji: '🥤' },
      { name: 'Air Kosong', desc: 'Plain water', price: 'RM0.50', img: null, emoji: '💧' },
    ]
  },
  {
    id: 1, name: 'Pool Cafe', ownerEmoji: '☕', coverImg: null,
    status: 'busy', hours: '8am–9pm', address: 'Near Kolam Renang, UPNM',
    lat: 3.0495, lng: 101.7472, bg: 'linear-gradient(135deg,#7ec8a8,#3a7a58)',
    phone: '0112345678',
    menu: [
      { name: 'Nasi Goreng', desc: 'Fried rice with egg & veg', price: 'RM6.00', img: null, emoji: '🍳' },
      { name: 'Mee Goreng', desc: 'Spicy fried noodles', price: 'RM6.00', img: null, emoji: '🍝' },
      { name: 'Burger Ayam', desc: 'Crispy chicken burger', price: 'RM7.00', img: null, emoji: '🍔' },
      { name: 'Roti Canai', desc: 'Flatbread with dhal', price: 'RM2.50', img: null, emoji: '🫓' },
      { name: 'Fried Chicken', desc: 'Golden fried food platter', price: 'RM8.00', img: null, emoji: '🍟' },
      { name: 'Kopi O', desc: 'Black coffee', price: 'RM2.00', img: null, emoji: '☕' },
      { name: 'Cendol', desc: 'Iced dessert, palm sugar', price: 'RM4.00', img: null, emoji: '🍧' },
    ]
  },
  {
    id: 2, name: 'Kedai Pak Mat', ownerEmoji: '🍲', coverImg: null,
    status: 'closed', hours: '7am–3pm', address: 'Blok Kantin Utama, UPNM',
    lat: 3.0523, lng: 101.7440, bg: 'linear-gradient(135deg,#d4a090,#9a4838)',
    phone: '0198765432',
    menu: [
      { name: 'Laksa Lemak', desc: 'Coconut curry noodles', price: 'RM8.00', img: null, emoji: '🍲' },
      { name: 'Asam Laksa', desc: 'Tamarind fish noodles', price: 'RM7.50', img: null, emoji: '🍜' },
      { name: 'Cendol', desc: 'Iced dessert', price: 'RM4.00', img: null, emoji: '🍧' },
    ]
  },
  {
    id: 3, name: 'Warung Mak Siti', ownerEmoji: '🌾', coverImg: null,
    status: 'open', hours: '10am–8pm', address: 'Jalan Kantin Lama, UPNM',
    lat: 3.0482, lng: 101.7462, bg: 'linear-gradient(135deg,#d4c890,#9a8438)',
    phone: '0167654321',
    menu: [
      { name: 'Nasi Campur', desc: 'Mixed rice', price: 'RM7.00', img: null, emoji: '🍱' },
      { name: 'Rendang Daging', desc: 'Beef rendang', price: 'RM10.00', img: null, emoji: '🥩' },
      { name: 'Ikan Bakar', desc: 'Grilled fish', price: 'RM9.00', img: null, emoji: '🐟' },
    ]
  },
  {
    id: 4, name: 'Restoran Al-Baik', ownerEmoji: '🫕', coverImg: null,
    status: 'busy', hours: '12pm–11pm', address: 'Pintu Masuk Utama, UPNM',
    lat: 3.0540, lng: 101.7488, bg: 'linear-gradient(135deg,#90b4d4,#385890)',
    phone: '0154321098',
    menu: [
      { name: 'Briyani Ayam', desc: 'Spiced rice & chicken', price: 'RM12.00', img: null, emoji: '🍛' },
      { name: 'Briyani Kambing', desc: 'Spiced rice & mutton', price: 'RM14.00', img: null, emoji: '🍛' },
      { name: 'Roti Naan', desc: 'Soft flatbread', price: 'RM2.50', img: null, emoji: '🫓' },
    ]
  },
];

const SUGS = [
  { n: 'Rice', e: '🍚' }, { n: 'Noodle', e: '🍜' }, { n: 'Burger', e: '🍔' },
  { n: 'Beverages', e: '🧋' }, { n: 'Dessert', e: '🍧' }, { n: 'Fried Food', e: '🍟' },
  { n: 'Nasi Lemak', e: '🍛' }, { n: 'Laksa', e: '🍲' }, { n: 'Roti Canai', e: '🫓' },
  { n: 'Mee Goreng', e: '🍝' }, { n: 'Teh Tarik', e: '🧋' }, { n: 'Ayam', e: '🍗' },
];

// In-memory accounts — pre-seeded
// status: 'approved' means owner can log in. 'pending' waits for admin approval.
let accounts = [
  {
    phone: '123456789',
    password: '123456',
    name: 'Abang Gpuk',
    stallName: 'Abang Gpuk',
    stallId: 0,
    status: 'approved',
    registeredAt: '2026-01-01',
    lastActive: '2026-05-11'
  }
];

let pendingOwners = [];

/* ══ State ══ */
let userLat = null, userLng = null;
let isOwner = false, ownerAcc = null;
let isAdmin = false;
let activeIdx = 0, stallFromScreen = 'screen-results';
let newItemImgData = null;

/* ══════════════════════════════════════
   INIT
══════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  renderSugs(SUGS);
  renderResults(STALLS);
});

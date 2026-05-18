/**
 * Geographic dataset for programmatic-SEO pages.
 *
 * Coverage priority (per [[seo-content-rules]]):
 *   1. Patna localities — deep, 80+ neighbourhoods
 *   2. Bihar — all 38 districts
 *   3. India — state-wise tier-1/2/3 cities
 *   4. World — NRI-target markets
 *
 * Free dataset. Lat/lng approximations are fine for the SEO/POI radius
 * lookups; precise pin comes from the seller when they actually list.
 */

export type GeoTier = "locality" | "city" | "district" | "metro" | "international";

export interface GeoEntry {
  slug: string;
  name: string;
  parent?: string;   // slug of the parent (city for locality, state for city)
  state?: string;
  country: string;
  tier: GeoTier;
  lat: number;
  lng: number;
  aliases?: string[]; // alt names searchers use (Hinglish, abbreviations)
}

// ─────────────────────────────────────────────────────────────
// 1. PATNA LOCALITIES — primary focus
// ─────────────────────────────────────────────────────────────

export const PATNA_LOCALITIES: GeoEntry[] = [
  { slug: "boring-road", name: "Boring Road", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6093, lng: 85.1235, aliases: ["Boring Canal Road"] },
  { slug: "kankarbagh", name: "Kankarbagh", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.5894, lng: 85.1567 },
  { slug: "patliputra-colony", name: "Patliputra Colony", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6219, lng: 85.0939, aliases: ["Pataliputra"] },
  { slug: "rajendra-nagar", name: "Rajendra Nagar", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6107, lng: 85.1505 },
  { slug: "bailey-road", name: "Bailey Road", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6116, lng: 85.0866, aliases: ["Beli Road"] },
  { slug: "gandhi-maidan", name: "Gandhi Maidan", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6196, lng: 85.1437 },
  { slug: "anisabad", name: "Anisabad", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.5826, lng: 85.1392 },
  { slug: "phulwari-sharif", name: "Phulwari Sharif", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.5468, lng: 85.0418 },
  { slug: "patrakar-nagar", name: "Patrakar Nagar", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6105, lng: 85.1062 },
  { slug: "khajpura", name: "Khajpura", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6042, lng: 85.1108 },
  { slug: "saguna-more", name: "Saguna More", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.5915, lng: 85.0463 },
  { slug: "danapur", name: "Danapur", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6356, lng: 85.0427, aliases: ["Dinapur"] },
  { slug: "patna-city", name: "Patna City", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.5985, lng: 85.2156 },
  { slug: "sultanganj", name: "Sultanganj", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6168, lng: 85.1801 },
  { slug: "rajiv-nagar", name: "Rajiv Nagar", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6034, lng: 85.0721 },
  { slug: "punaichak", name: "Punaichak", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6101, lng: 85.0913 },
  { slug: "indrapuri", name: "Indrapuri", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6028, lng: 85.0784 },
  { slug: "kurji", name: "Kurji", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6402, lng: 85.0764 },
  { slug: "digha", name: "Digha", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6432, lng: 85.0658 },
  { slug: "rupaspur", name: "Rupaspur", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6075, lng: 85.0517 },
  { slug: "ashok-rajpath", name: "Ashok Rajpath", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6209, lng: 85.1815 },
  { slug: "kadam-kuan", name: "Kadam Kuan", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6212, lng: 85.1559 },
  { slug: "mithapur", name: "Mithapur", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6033, lng: 85.1335 },
  { slug: "bankipore", name: "Bankipore", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6122, lng: 85.1397, aliases: ["Bankipur"] },
  { slug: "jakkanpur", name: "Jakkanpur", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.5972, lng: 85.1448 },
  { slug: "sabzibagh", name: "Sabzibagh", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6076, lng: 85.1582 },
  { slug: "hanuman-nagar", name: "Hanuman Nagar", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.5872, lng: 85.1633 },
  { slug: "mahendru", name: "Mahendru", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6212, lng: 85.1709 },
  { slug: "kumhrar", name: "Kumhrar", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.5872, lng: 85.1796 },
  { slug: "patel-nagar", name: "Patel Nagar", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6149, lng: 85.0942 },
  { slug: "salimpur-ahra", name: "Salimpur Ahra", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6182, lng: 85.1228 },
  { slug: "gardanibagh", name: "Gardanibagh", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.5993, lng: 85.1306 },
  { slug: "gola-road", name: "Gola Road", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6184, lng: 85.0521 },
  { slug: "buddha-marg", name: "Buddha Marg", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6098, lng: 85.1318 },
  { slug: "frazer-road", name: "Frazer Road", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6168, lng: 85.1421 },
  { slug: "exhibition-road", name: "Exhibition Road", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6144, lng: 85.1383 },
  { slug: "karbigahiya", name: "Karbigahiya", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6024, lng: 85.1469 },
  { slug: "khagaul", name: "Khagaul", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.5826, lng: 85.0498 },
  { slug: "beur", name: "Beur", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.5687, lng: 85.1262 },
  { slug: "naubatpur", name: "Naubatpur", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.4859, lng: 84.9329 },
  { slug: "bihta", name: "Bihta", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.5491, lng: 84.8678 },
  { slug: "maner", name: "Maner", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6485, lng: 84.8742 },
  { slug: "fatuha", name: "Fatuha", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.5147, lng: 85.2954 },
  { slug: "punpun", name: "Punpun", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.4796, lng: 85.1781 },
  { slug: "masaurhi", name: "Masaurhi", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.3439, lng: 85.0387 },
  { slug: "bakhtiarpur", name: "Bakhtiarpur", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.4868, lng: 85.5365 },
  { slug: "barh", name: "Barh", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.4848, lng: 85.7212 },
  { slug: "mokama", name: "Mokama", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.3953, lng: 85.9197 },
  { slug: "paliganj", name: "Paliganj", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.4128, lng: 84.9213 },
  { slug: "dulhin-bazar", name: "Dulhin Bazar", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.4382, lng: 84.8753 },
  { slug: "new-jagannath-puri", name: "Nageshwar Colony", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6098, lng: 85.0729, aliases: ["Nageshwar Colony"] },
  { slug: "shastri-nagar", name: "Shastri Nagar", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6213, lng: 85.1097 },
  { slug: "kidwaipuri", name: "Kidwaipuri", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6178, lng: 85.1107 },
  { slug: "ramkrishna-nagar", name: "Ramkrishna Nagar", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.5837, lng: 85.1715 },
  { slug: "new-bypass", name: "New Bypass Road", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.5872, lng: 85.1167 },
  { slug: "anandpuri", name: "Anandpuri", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6112, lng: 85.1148 },
  { slug: "transport-nagar", name: "Transport Nagar", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.5928, lng: 85.0814 },
  { slug: "alpana-market", name: "Alpana Market", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6168, lng: 85.1182 },
  { slug: "veerchand-patel-path", name: "Veerchand Patel Path", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6132, lng: 85.1346 },
  { slug: "south-gandhi-maidan", name: "South Gandhi Maidan", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6164, lng: 85.1437 },
  { slug: "ramna-road", name: "Ramna Road", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6147, lng: 85.1462 },
  { slug: "machhua-toli", name: "Machhua Toli", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6164, lng: 85.1538 },
  { slug: "yarpur", name: "Yarpur", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.5847, lng: 85.1284 },
  { slug: "agam-kuan", name: "Agam Kuan", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6082, lng: 85.1857 },
  { slug: "rukunpura", name: "Rukunpura", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6048, lng: 85.0612 },
  { slug: "ashiana-nagar", name: "Ashiana Nagar", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6038, lng: 85.0828 },
  { slug: "patliputra-industrial-area", name: "Patliputra Industrial Area", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6309, lng: 85.1004 },
  { slug: "ramjaipal-nagar", name: "Ramjaipal Nagar", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.5984, lng: 85.0712 },
  { slug: "saidpur", name: "Saidpur", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6042, lng: 85.1718 },
  { slug: "alamganj", name: "Alamganj", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6048, lng: 85.1968 },
  { slug: "malsalami", name: "Malsalami", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6014, lng: 85.2138 },
  { slug: "chowk-shikarpur", name: "Chowk Shikarpur", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6122, lng: 85.1907 },
  { slug: "mainpura", name: "Mainpura", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.5972, lng: 85.0938 },
  { slug: "bahadurpur", name: "Bahadurpur", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.5928, lng: 85.1497 },
  { slug: "lodipur", name: "Lodipur", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6107, lng: 85.1018 },
  { slug: "ashok-nagar-patna", name: "Ashok Nagar", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6149, lng: 85.1124 },
  { slug: "kotwali", name: "Kotwali", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6178, lng: 85.1357 },
  { slug: "patna-junction", name: "Patna Junction Area", parent: "patna", state: "bihar", country: "in", tier: "locality", lat: 25.6019, lng: 85.1376, aliases: ["Patna Railway Station"] },
];

// ─────────────────────────────────────────────────────────────
// 2. BIHAR — all 38 districts
// ─────────────────────────────────────────────────────────────

export const BIHAR_DISTRICTS: GeoEntry[] = [
  { slug: "patna", name: "Patna", state: "bihar", country: "in", tier: "city", lat: 25.5941, lng: 85.1376 },
  { slug: "gaya", name: "Gaya", state: "bihar", country: "in", tier: "city", lat: 24.7914, lng: 84.9994 },
  { slug: "bhagalpur", name: "Bhagalpur", state: "bihar", country: "in", tier: "city", lat: 25.2425, lng: 86.9842 },
  { slug: "muzaffarpur", name: "Muzaffarpur", state: "bihar", country: "in", tier: "city", lat: 26.1209, lng: 85.3647 },
  { slug: "darbhanga", name: "Darbhanga", state: "bihar", country: "in", tier: "city", lat: 26.1542, lng: 85.8918 },
  { slug: "purnia", name: "Purnia", state: "bihar", country: "in", tier: "city", lat: 25.7771, lng: 87.4753 },
  { slug: "begusarai", name: "Begusarai", state: "bihar", country: "in", tier: "city", lat: 25.4182, lng: 86.1272 },
  { slug: "ara", name: "Ara", state: "bihar", country: "in", tier: "city", lat: 25.5562, lng: 84.6634, aliases: ["Bhojpur", "Arrah"] },
  { slug: "chhapra", name: "Chhapra", state: "bihar", country: "in", tier: "city", lat: 25.7813, lng: 84.7475, aliases: ["Saran"] },
  { slug: "hajipur", name: "Hajipur", state: "bihar", country: "in", tier: "city", lat: 25.6856, lng: 85.2098, aliases: ["Vaishali"] },
  { slug: "motihari", name: "Motihari", state: "bihar", country: "in", tier: "city", lat: 26.6494, lng: 84.9072, aliases: ["East Champaran"] },
  { slug: "bettiah", name: "Bettiah", state: "bihar", country: "in", tier: "city", lat: 26.8024, lng: 84.5025, aliases: ["West Champaran"] },
  { slug: "sitamarhi", name: "Sitamarhi", state: "bihar", country: "in", tier: "city", lat: 26.5919, lng: 85.4823 },
  { slug: "madhubani", name: "Madhubani", state: "bihar", country: "in", tier: "city", lat: 26.3633, lng: 86.0717 },
  { slug: "samastipur", name: "Samastipur", state: "bihar", country: "in", tier: "city", lat: 25.8625, lng: 85.7818 },
  { slug: "saharsa", name: "Saharsa", state: "bihar", country: "in", tier: "city", lat: 25.8794, lng: 86.5938 },
  { slug: "madhepura", name: "Madhepura", state: "bihar", country: "in", tier: "city", lat: 25.9214, lng: 86.7903 },
  { slug: "khagaria", name: "Khagaria", state: "bihar", country: "in", tier: "city", lat: 25.5018, lng: 86.4708 },
  { slug: "munger", name: "Munger", state: "bihar", country: "in", tier: "city", lat: 25.3764, lng: 86.4734 },
  { slug: "lakhisarai", name: "Lakhisarai", state: "bihar", country: "in", tier: "city", lat: 25.1747, lng: 86.0959 },
  { slug: "sheikhpura", name: "Sheikhpura", state: "bihar", country: "in", tier: "city", lat: 25.1395, lng: 85.8459 },
  { slug: "jamui", name: "Jamui", state: "bihar", country: "in", tier: "city", lat: 24.9261, lng: 86.2233 },
  { slug: "banka", name: "Banka", state: "bihar", country: "in", tier: "city", lat: 24.8857, lng: 86.9181 },
  { slug: "katihar", name: "Katihar", state: "bihar", country: "in", tier: "city", lat: 25.5391, lng: 87.5765 },
  { slug: "kishanganj", name: "Kishanganj", state: "bihar", country: "in", tier: "city", lat: 26.1062, lng: 87.9505 },
  { slug: "araria", name: "Araria", state: "bihar", country: "in", tier: "city", lat: 26.1454, lng: 87.5208 },
  { slug: "supaul", name: "Supaul", state: "bihar", country: "in", tier: "city", lat: 26.1267, lng: 86.6053 },
  { slug: "buxar", name: "Buxar", state: "bihar", country: "in", tier: "city", lat: 25.5683, lng: 83.9888 },
  { slug: "bhabua", name: "Bhabua", state: "bihar", country: "in", tier: "city", lat: 25.0432, lng: 83.6094, aliases: ["Kaimur"] },
  { slug: "sasaram", name: "Sasaram", state: "bihar", country: "in", tier: "city", lat: 24.9499, lng: 84.0307, aliases: ["Rohtas"] },
  { slug: "aurangabad-bh", name: "Aurangabad", state: "bihar", country: "in", tier: "city", lat: 24.7522, lng: 84.3742, aliases: ["Aurangabad Bihar"] },
  { slug: "jehanabad", name: "Jehanabad", state: "bihar", country: "in", tier: "city", lat: 25.2148, lng: 84.9879 },
  { slug: "arwal", name: "Arwal", state: "bihar", country: "in", tier: "city", lat: 25.2528, lng: 84.6849 },
  { slug: "nawada", name: "Nawada", state: "bihar", country: "in", tier: "city", lat: 24.8866, lng: 85.5435 },
  { slug: "bihar-sharif", name: "Bihar Sharif", state: "bihar", country: "in", tier: "city", lat: 25.1979, lng: 85.5237, aliases: ["Nalanda"] },
  { slug: "gopalganj", name: "Gopalganj", state: "bihar", country: "in", tier: "city", lat: 26.4675, lng: 84.4378 },
  { slug: "siwan", name: "Siwan", state: "bihar", country: "in", tier: "city", lat: 26.2241, lng: 84.3556 },
  { slug: "sheohar", name: "Sheohar", state: "bihar", country: "in", tier: "city", lat: 26.5151, lng: 85.293 },
];

// ─────────────────────────────────────────────────────────────
// 3. INDIA — state-wise top cities (tier 1/2/3)
// ─────────────────────────────────────────────────────────────

export const INDIA_CITIES: GeoEntry[] = [
  // Maharashtra
  { slug: "mumbai", name: "Mumbai", state: "maharashtra", country: "in", tier: "metro", lat: 19.076, lng: 72.8777 },
  { slug: "pune", name: "Pune", state: "maharashtra", country: "in", tier: "metro", lat: 18.5204, lng: 73.8567 },
  { slug: "nagpur", name: "Nagpur", state: "maharashtra", country: "in", tier: "city", lat: 21.1458, lng: 79.0882 },
  { slug: "nashik", name: "Nashik", state: "maharashtra", country: "in", tier: "city", lat: 19.9975, lng: 73.7898 },
  { slug: "thane", name: "Thane", state: "maharashtra", country: "in", tier: "city", lat: 19.2183, lng: 72.9781 },
  { slug: "aurangabad", name: "Aurangabad", state: "maharashtra", country: "in", tier: "city", lat: 19.8762, lng: 75.3433, aliases: ["Chhatrapati Sambhajinagar"] },
  { slug: "navi-mumbai", name: "Navi Mumbai", state: "maharashtra", country: "in", tier: "city", lat: 19.033, lng: 73.0297 },
  // Karnataka
  { slug: "bengaluru", name: "Bengaluru", state: "karnataka", country: "in", tier: "metro", lat: 12.9716, lng: 77.5946, aliases: ["Bangalore"] },
  { slug: "mysuru", name: "Mysuru", state: "karnataka", country: "in", tier: "city", lat: 12.2958, lng: 76.6394, aliases: ["Mysore"] },
  { slug: "mangaluru", name: "Mangaluru", state: "karnataka", country: "in", tier: "city", lat: 12.9141, lng: 74.856, aliases: ["Mangalore"] },
  { slug: "hubballi", name: "Hubballi", state: "karnataka", country: "in", tier: "city", lat: 15.3647, lng: 75.124, aliases: ["Hubli"] },
  { slug: "belgaum", name: "Belagavi", state: "karnataka", country: "in", tier: "city", lat: 15.8497, lng: 74.4977, aliases: ["Belgaum"] },
  // Tamil Nadu
  { slug: "chennai", name: "Chennai", state: "tamil-nadu", country: "in", tier: "metro", lat: 13.0827, lng: 80.2707 },
  { slug: "coimbatore", name: "Coimbatore", state: "tamil-nadu", country: "in", tier: "city", lat: 11.0168, lng: 76.9558 },
  { slug: "madurai", name: "Madurai", state: "tamil-nadu", country: "in", tier: "city", lat: 9.9252, lng: 78.1198 },
  { slug: "trichy", name: "Tiruchirappalli", state: "tamil-nadu", country: "in", tier: "city", lat: 10.7905, lng: 78.7047, aliases: ["Trichy"] },
  { slug: "salem", name: "Salem", state: "tamil-nadu", country: "in", tier: "city", lat: 11.6643, lng: 78.146 },
  { slug: "tirunelveli", name: "Tirunelveli", state: "tamil-nadu", country: "in", tier: "city", lat: 8.7139, lng: 77.7567 },
  // Telangana / AP
  { slug: "hyderabad", name: "Hyderabad", state: "telangana", country: "in", tier: "metro", lat: 17.385, lng: 78.4867 },
  { slug: "warangal", name: "Warangal", state: "telangana", country: "in", tier: "city", lat: 17.9689, lng: 79.5941 },
  { slug: "vijayawada", name: "Vijayawada", state: "andhra-pradesh", country: "in", tier: "city", lat: 16.5062, lng: 80.648 },
  { slug: "visakhapatnam", name: "Visakhapatnam", state: "andhra-pradesh", country: "in", tier: "city", lat: 17.6868, lng: 83.2185, aliases: ["Vizag"] },
  { slug: "tirupati", name: "Tirupati", state: "andhra-pradesh", country: "in", tier: "city", lat: 13.6288, lng: 79.4192 },
  // Delhi NCR
  { slug: "delhi", name: "Delhi", state: "delhi", country: "in", tier: "metro", lat: 28.7041, lng: 77.1025, aliases: ["New Delhi"] },
  { slug: "noida", name: "Noida", state: "uttar-pradesh", country: "in", tier: "metro", lat: 28.5355, lng: 77.391 },
  { slug: "greater-noida", name: "Greater Noida", state: "uttar-pradesh", country: "in", tier: "city", lat: 28.4744, lng: 77.504 },
  { slug: "gurugram", name: "Gurugram", state: "haryana", country: "in", tier: "metro", lat: 28.4595, lng: 77.0266, aliases: ["Gurgaon"] },
  { slug: "ghaziabad", name: "Ghaziabad", state: "uttar-pradesh", country: "in", tier: "city", lat: 28.6692, lng: 77.4538 },
  { slug: "faridabad", name: "Faridabad", state: "haryana", country: "in", tier: "city", lat: 28.4089, lng: 77.3178 },
  // Haryana / Punjab
  { slug: "chandigarh", name: "Chandigarh", state: "chandigarh", country: "in", tier: "city", lat: 30.7333, lng: 76.7794 },
  { slug: "mohali", name: "Mohali", state: "punjab", country: "in", tier: "city", lat: 30.7046, lng: 76.7179 },
  { slug: "panchkula", name: "Panchkula", state: "haryana", country: "in", tier: "city", lat: 30.6942, lng: 76.8606 },
  { slug: "ludhiana", name: "Ludhiana", state: "punjab", country: "in", tier: "city", lat: 30.901, lng: 75.8573 },
  { slug: "amritsar", name: "Amritsar", state: "punjab", country: "in", tier: "city", lat: 31.634, lng: 74.8723 },
  { slug: "jalandhar", name: "Jalandhar", state: "punjab", country: "in", tier: "city", lat: 31.326, lng: 75.5762 },
  // Gujarat
  { slug: "ahmedabad", name: "Ahmedabad", state: "gujarat", country: "in", tier: "metro", lat: 23.0225, lng: 72.5714 },
  { slug: "surat", name: "Surat", state: "gujarat", country: "in", tier: "city", lat: 21.1702, lng: 72.8311 },
  { slug: "vadodara", name: "Vadodara", state: "gujarat", country: "in", tier: "city", lat: 22.3072, lng: 73.1812 },
  { slug: "rajkot", name: "Rajkot", state: "gujarat", country: "in", tier: "city", lat: 22.3039, lng: 70.8022 },
  { slug: "gandhinagar", name: "Gandhinagar", state: "gujarat", country: "in", tier: "city", lat: 23.2156, lng: 72.6369 },
  // Rajasthan
  { slug: "jaipur", name: "Jaipur", state: "rajasthan", country: "in", tier: "metro", lat: 26.9124, lng: 75.7873 },
  { slug: "jodhpur", name: "Jodhpur", state: "rajasthan", country: "in", tier: "city", lat: 26.2389, lng: 73.0243 },
  { slug: "udaipur", name: "Udaipur", state: "rajasthan", country: "in", tier: "city", lat: 24.5854, lng: 73.7125 },
  { slug: "kota", name: "Kota", state: "rajasthan", country: "in", tier: "city", lat: 25.2138, lng: 75.8648 },
  { slug: "ajmer", name: "Ajmer", state: "rajasthan", country: "in", tier: "city", lat: 26.4499, lng: 74.6399 },
  { slug: "bikaner", name: "Bikaner", state: "rajasthan", country: "in", tier: "city", lat: 28.0229, lng: 73.3119 },
  // UP
  { slug: "lucknow", name: "Lucknow", state: "uttar-pradesh", country: "in", tier: "metro", lat: 26.8467, lng: 80.9462 },
  { slug: "kanpur", name: "Kanpur", state: "uttar-pradesh", country: "in", tier: "city", lat: 26.4499, lng: 80.3319 },
  { slug: "varanasi", name: "Varanasi", state: "uttar-pradesh", country: "in", tier: "city", lat: 25.3176, lng: 82.9739, aliases: ["Banaras", "Kashi"] },
  { slug: "agra", name: "Agra", state: "uttar-pradesh", country: "in", tier: "city", lat: 27.1767, lng: 78.0081 },
  { slug: "allahabad", name: "Prayagraj", state: "uttar-pradesh", country: "in", tier: "city", lat: 25.4358, lng: 81.8463, aliases: ["Allahabad"] },
  { slug: "meerut", name: "Meerut", state: "uttar-pradesh", country: "in", tier: "city", lat: 28.9845, lng: 77.7064 },
  { slug: "bareilly", name: "Bareilly", state: "uttar-pradesh", country: "in", tier: "city", lat: 28.367, lng: 79.4304 },
  { slug: "aligarh", name: "Aligarh", state: "uttar-pradesh", country: "in", tier: "city", lat: 27.8974, lng: 78.088 },
  { slug: "moradabad", name: "Moradabad", state: "uttar-pradesh", country: "in", tier: "city", lat: 28.8389, lng: 78.7768 },
  { slug: "gorakhpur", name: "Gorakhpur", state: "uttar-pradesh", country: "in", tier: "city", lat: 26.7606, lng: 83.3732 },
  { slug: "ayodhya", name: "Ayodhya", state: "uttar-pradesh", country: "in", tier: "city", lat: 26.7922, lng: 82.1998 },
  // MP
  { slug: "bhopal", name: "Bhopal", state: "madhya-pradesh", country: "in", tier: "metro", lat: 23.2599, lng: 77.4126 },
  { slug: "indore", name: "Indore", state: "madhya-pradesh", country: "in", tier: "city", lat: 22.7196, lng: 75.8577 },
  { slug: "gwalior", name: "Gwalior", state: "madhya-pradesh", country: "in", tier: "city", lat: 26.2183, lng: 78.1828 },
  { slug: "jabalpur", name: "Jabalpur", state: "madhya-pradesh", country: "in", tier: "city", lat: 23.1815, lng: 79.9864 },
  { slug: "ujjain", name: "Ujjain", state: "madhya-pradesh", country: "in", tier: "city", lat: 23.1765, lng: 75.7885 },
  // West Bengal
  { slug: "kolkata", name: "Kolkata", state: "west-bengal", country: "in", tier: "metro", lat: 22.5726, lng: 88.3639, aliases: ["Calcutta"] },
  { slug: "howrah", name: "Howrah", state: "west-bengal", country: "in", tier: "city", lat: 22.5958, lng: 88.2636 },
  { slug: "durgapur", name: "Durgapur", state: "west-bengal", country: "in", tier: "city", lat: 23.5204, lng: 87.3119 },
  { slug: "siliguri", name: "Siliguri", state: "west-bengal", country: "in", tier: "city", lat: 26.7271, lng: 88.3953 },
  { slug: "asansol", name: "Asansol", state: "west-bengal", country: "in", tier: "city", lat: 23.6739, lng: 86.9524 },
  // Odisha / Chhattisgarh / Jharkhand
  { slug: "bhubaneswar", name: "Bhubaneswar", state: "odisha", country: "in", tier: "city", lat: 20.2961, lng: 85.8245 },
  { slug: "cuttack", name: "Cuttack", state: "odisha", country: "in", tier: "city", lat: 20.4625, lng: 85.8828 },
  { slug: "raipur", name: "Raipur", state: "chhattisgarh", country: "in", tier: "city", lat: 21.2514, lng: 81.6296 },
  { slug: "bilaspur", name: "Bilaspur", state: "chhattisgarh", country: "in", tier: "city", lat: 22.0796, lng: 82.1391 },
  { slug: "ranchi", name: "Ranchi", state: "jharkhand", country: "in", tier: "city", lat: 23.3441, lng: 85.3096 },
  { slug: "jamshedpur", name: "Jamshedpur", state: "jharkhand", country: "in", tier: "city", lat: 22.8046, lng: 86.2029 },
  { slug: "dhanbad", name: "Dhanbad", state: "jharkhand", country: "in", tier: "city", lat: 23.7957, lng: 86.4304 },
  // Kerala / NE / J&K / Himachal / Uttarakhand
  { slug: "kochi", name: "Kochi", state: "kerala", country: "in", tier: "city", lat: 9.9312, lng: 76.2673, aliases: ["Cochin", "Ernakulam"] },
  { slug: "thiruvananthapuram", name: "Thiruvananthapuram", state: "kerala", country: "in", tier: "city", lat: 8.5241, lng: 76.9366, aliases: ["Trivandrum"] },
  { slug: "kozhikode", name: "Kozhikode", state: "kerala", country: "in", tier: "city", lat: 11.2588, lng: 75.7804, aliases: ["Calicut"] },
  { slug: "thrissur", name: "Thrissur", state: "kerala", country: "in", tier: "city", lat: 10.5276, lng: 76.2144 },
  { slug: "guwahati", name: "Guwahati", state: "assam", country: "in", tier: "city", lat: 26.1445, lng: 91.7362 },
  { slug: "dibrugarh", name: "Dibrugarh", state: "assam", country: "in", tier: "city", lat: 27.4728, lng: 94.912 },
  { slug: "shillong", name: "Shillong", state: "meghalaya", country: "in", tier: "city", lat: 25.5788, lng: 91.8933 },
  { slug: "imphal", name: "Imphal", state: "manipur", country: "in", tier: "city", lat: 24.817, lng: 93.9368 },
  { slug: "agartala", name: "Agartala", state: "tripura", country: "in", tier: "city", lat: 23.8315, lng: 91.2868 },
  { slug: "itanagar", name: "Itanagar", state: "arunachal-pradesh", country: "in", tier: "city", lat: 27.0844, lng: 93.6053 },
  { slug: "gangtok", name: "Gangtok", state: "sikkim", country: "in", tier: "city", lat: 27.3314, lng: 88.6138 },
  { slug: "srinagar", name: "Srinagar", state: "jammu-kashmir", country: "in", tier: "city", lat: 34.0837, lng: 74.7973 },
  { slug: "jammu", name: "Jammu", state: "jammu-kashmir", country: "in", tier: "city", lat: 32.7266, lng: 74.857 },
  { slug: "shimla", name: "Shimla", state: "himachal-pradesh", country: "in", tier: "city", lat: 31.1048, lng: 77.1734 },
  { slug: "dharamshala", name: "Dharamshala", state: "himachal-pradesh", country: "in", tier: "city", lat: 32.219, lng: 76.3234 },
  { slug: "dehradun", name: "Dehradun", state: "uttarakhand", country: "in", tier: "city", lat: 30.3165, lng: 78.0322 },
  { slug: "haridwar", name: "Haridwar", state: "uttarakhand", country: "in", tier: "city", lat: 29.9457, lng: 78.1642 },
  { slug: "rishikesh", name: "Rishikesh", state: "uttarakhand", country: "in", tier: "city", lat: 30.0869, lng: 78.2676 },
  // Goa
  { slug: "panaji", name: "Panaji", state: "goa", country: "in", tier: "city", lat: 15.4909, lng: 73.8278, aliases: ["Panjim"] },
  { slug: "margao", name: "Margao", state: "goa", country: "in", tier: "city", lat: 15.2832, lng: 73.9862 },
];

// ─────────────────────────────────────────────────────────────
// 4. WORLD — NRI markets where Indian buyers look for property
// ─────────────────────────────────────────────────────────────

export const WORLD_CITIES: GeoEntry[] = [
  // UAE / Gulf
  { slug: "dubai", name: "Dubai", country: "ae", tier: "international", lat: 25.2048, lng: 55.2708 },
  { slug: "abu-dhabi", name: "Abu Dhabi", country: "ae", tier: "international", lat: 24.4539, lng: 54.3773 },
  { slug: "sharjah", name: "Sharjah", country: "ae", tier: "international", lat: 25.3463, lng: 55.4209 },
  { slug: "doha", name: "Doha", country: "qa", tier: "international", lat: 25.2854, lng: 51.531 },
  { slug: "riyadh", name: "Riyadh", country: "sa", tier: "international", lat: 24.7136, lng: 46.6753 },
  { slug: "jeddah", name: "Jeddah", country: "sa", tier: "international", lat: 21.4858, lng: 39.1925 },
  { slug: "muscat", name: "Muscat", country: "om", tier: "international", lat: 23.588, lng: 58.3829 },
  { slug: "kuwait-city", name: "Kuwait City", country: "kw", tier: "international", lat: 29.3759, lng: 47.9774 },
  { slug: "manama", name: "Manama", country: "bh", tier: "international", lat: 26.2235, lng: 50.5876 },
  // UK
  { slug: "london", name: "London", country: "gb", tier: "international", lat: 51.5074, lng: -0.1278 },
  { slug: "manchester", name: "Manchester", country: "gb", tier: "international", lat: 53.4808, lng: -2.2426 },
  { slug: "birmingham", name: "Birmingham", country: "gb", tier: "international", lat: 52.4862, lng: -1.8904 },
  { slug: "leicester", name: "Leicester", country: "gb", tier: "international", lat: 52.6369, lng: -1.1398 },
  // USA
  { slug: "new-york", name: "New York", country: "us", tier: "international", lat: 40.7128, lng: -74.006 },
  { slug: "san-francisco", name: "San Francisco", country: "us", tier: "international", lat: 37.7749, lng: -122.4194 },
  { slug: "san-jose", name: "San Jose", country: "us", tier: "international", lat: 37.3382, lng: -121.8863 },
  { slug: "houston", name: "Houston", country: "us", tier: "international", lat: 29.7604, lng: -95.3698 },
  { slug: "chicago", name: "Chicago", country: "us", tier: "international", lat: 41.8781, lng: -87.6298 },
  { slug: "dallas", name: "Dallas", country: "us", tier: "international", lat: 32.7767, lng: -96.797 },
  { slug: "seattle", name: "Seattle", country: "us", tier: "international", lat: 47.6062, lng: -122.3321 },
  { slug: "atlanta", name: "Atlanta", country: "us", tier: "international", lat: 33.749, lng: -84.388 },
  // Canada
  { slug: "toronto", name: "Toronto", country: "ca", tier: "international", lat: 43.6532, lng: -79.3832 },
  { slug: "vancouver", name: "Vancouver", country: "ca", tier: "international", lat: 49.2827, lng: -123.1207 },
  { slug: "calgary", name: "Calgary", country: "ca", tier: "international", lat: 51.0447, lng: -114.0719 },
  { slug: "montreal", name: "Montreal", country: "ca", tier: "international", lat: 45.5017, lng: -73.5673 },
  // Australia
  { slug: "sydney", name: "Sydney", country: "au", tier: "international", lat: -33.8688, lng: 151.2093 },
  { slug: "melbourne", name: "Melbourne", country: "au", tier: "international", lat: -37.8136, lng: 144.9631 },
  { slug: "brisbane", name: "Brisbane", country: "au", tier: "international", lat: -27.4698, lng: 153.0251 },
  { slug: "perth", name: "Perth", country: "au", tier: "international", lat: -31.9505, lng: 115.8605 },
  // SE Asia
  { slug: "singapore", name: "Singapore", country: "sg", tier: "international", lat: 1.3521, lng: 103.8198 },
  { slug: "kuala-lumpur", name: "Kuala Lumpur", country: "my", tier: "international", lat: 3.139, lng: 101.6869 },
  { slug: "bangkok", name: "Bangkok", country: "th", tier: "international", lat: 13.7563, lng: 100.5018 },
  { slug: "ho-chi-minh", name: "Ho Chi Minh City", country: "vn", tier: "international", lat: 10.8231, lng: 106.6297 },
  // Europe
  { slug: "berlin", name: "Berlin", country: "de", tier: "international", lat: 52.52, lng: 13.405 },
  { slug: "frankfurt", name: "Frankfurt", country: "de", tier: "international", lat: 50.1109, lng: 8.6821 },
  { slug: "munich", name: "Munich", country: "de", tier: "international", lat: 48.1351, lng: 11.582 },
  { slug: "amsterdam", name: "Amsterdam", country: "nl", tier: "international", lat: 52.3676, lng: 4.9041 },
  { slug: "paris", name: "Paris", country: "fr", tier: "international", lat: 48.8566, lng: 2.3522 },
  { slug: "dublin", name: "Dublin", country: "ie", tier: "international", lat: 53.3498, lng: -6.2603 },
  // Africa
  { slug: "nairobi", name: "Nairobi", country: "ke", tier: "international", lat: -1.2864, lng: 36.8172 },
  { slug: "johannesburg", name: "Johannesburg", country: "za", tier: "international", lat: -26.2041, lng: 28.0473 },
  // Other
  { slug: "auckland", name: "Auckland", country: "nz", tier: "international", lat: -36.8485, lng: 174.7633 },
  { slug: "tokyo", name: "Tokyo", country: "jp", tier: "international", lat: 35.6762, lng: 139.6503 },
];

// ─────────────────────────────────────────────────────────────
// Combined export — single source of truth for the generator
// ─────────────────────────────────────────────────────────────

export const ALL_GEO: GeoEntry[] = [
  ...PATNA_LOCALITIES,
  ...BIHAR_DISTRICTS,
  ...INDIA_CITIES,
  ...WORLD_CITIES,
];

export const GEO_BY_SLUG: Map<string, GeoEntry> = new Map(ALL_GEO.map((g) => [g.slug, g]));

/** Property kinds (matches Prisma PropertyKind enum spellings). */
export const PROPERTY_KINDS = [
  { slug: "plot", singular: "Plot", plural: "Plots", aliases: ["Land", "Parcel", "Site"] },
  { slug: "flat", singular: "Flat", plural: "Flats", aliases: ["Apartment", "Builder Floor"] },
  { slug: "house", singular: "House", plural: "Houses", aliases: ["Independent House", "Bungalow"] },
  { slug: "villa", singular: "Villa", plural: "Villas", aliases: ["Luxury Villa"] },
  { slug: "godown", singular: "Godown", plural: "Godowns", aliases: ["Warehouse", "Storage", "Industrial Shed"] },
  { slug: "shop", singular: "Shop", plural: "Shops", aliases: ["Retail Space", "Showroom"] },
  { slug: "office", singular: "Office", plural: "Offices", aliases: ["Office Space", "Commercial"] },
  { slug: "pg", singular: "PG", plural: "PGs", aliases: ["Paying Guest", "Hostel", "Room"] },
] as const;

export type PropertyKindSlug = (typeof PROPERTY_KINDS)[number]["slug"];

export const PROPERTY_INTENTS = [
  { slug: "buy", verb: "Buy", noun: "Sale", aliases: ["Purchase", "Invest"] },
  { slug: "rent", verb: "Rent", noun: "Rent", aliases: ["Lease", "Hire"] },
] as const;

export type PropertyIntentSlug = (typeof PROPERTY_INTENTS)[number]["slug"];

/** All possible (geo × kind × intent) combinations — used to drive
 *  the daily-100 generator. Cardinality: ALL_GEO.length × 8 × 2. */
export function totalCombinationCount(): number {
  return ALL_GEO.length * PROPERTY_KINDS.length * PROPERTY_INTENTS.length;
}

/**
 * SEO kind slug → Prisma PropertyKind enum (used when querying the live
 * Property table for actual listings backing the page).
 *
 * The SEO surface is intentionally wider than what sellers can list
 * (godown and PG searches drive real traffic even though we map them to
 * WAREHOUSE and FLAT respectively in the DB).
 */
export const KIND_TO_PRISMA: Record<PropertyKindSlug, "PLOT" | "FLAT" | "HOUSE" | "VILLA" | "SHOP" | "OFFICE" | "WAREHOUSE" | "AGRICULTURE"> = {
  plot: "PLOT",
  flat: "FLAT",
  house: "HOUSE",
  villa: "VILLA",
  godown: "WAREHOUSE",
  shop: "SHOP",
  office: "OFFICE",
  pg: "FLAT",
};

/** Map intent slug → Prisma ListingIntent. A user searching "buy" wants
 *  to see listings where the seller's intent is SELL. */
export const INTENT_TO_PRISMA: Record<PropertyIntentSlug, "SELL" | "RENT"> = {
  buy: "SELL",
  rent: "RENT",
};

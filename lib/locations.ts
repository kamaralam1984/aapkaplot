/** Searchable locations for autocomplete. Derived from mock data + India seed list. */

export interface LocationSuggestion {
  id: string;
  label: string;       // "Sodepur, Kolkata"
  type: "locality" | "city" | "state";
  city?: string;
  state?: string;
}

export const LOCATIONS: LocationSuggestion[] = [
  // Kolkata pockets
  { id: "loc-1",  label: "Sodepur, Kolkata",  type: "locality", city: "Kolkata", state: "West Bengal" },
  { id: "loc-2",  label: "New Town, Kolkata", type: "locality", city: "Kolkata", state: "West Bengal" },
  { id: "loc-3",  label: "Rajarhat, Kolkata", type: "locality", city: "Kolkata", state: "West Bengal" },
  { id: "loc-4",  label: "Salt Lake, Kolkata", type: "locality", city: "Kolkata", state: "West Bengal" },
  { id: "loc-5",  label: "Garia, Kolkata",     type: "locality", city: "Kolkata", state: "West Bengal" },
  { id: "loc-6",  label: "Belgachia, Kolkata", type: "locality", city: "Kolkata", state: "West Bengal" },
  { id: "loc-7",  label: "Uttarpara, Hooghly", type: "locality", city: "Hooghly", state: "West Bengal" },
  { id: "loc-8",  label: "Khardaha, Kolkata",  type: "locality", city: "Kolkata", state: "West Bengal" },

  // Major cities
  { id: "city-1",  label: "Kolkata, West Bengal",     type: "city", state: "West Bengal" },
  { id: "city-2",  label: "Howrah, West Bengal",       type: "city", state: "West Bengal" },
  { id: "city-3",  label: "Bengaluru, Karnataka",      type: "city", state: "Karnataka" },
  { id: "city-4",  label: "Mumbai, Maharashtra",       type: "city", state: "Maharashtra" },
  { id: "city-5",  label: "Pune, Maharashtra",         type: "city", state: "Maharashtra" },
  { id: "city-6",  label: "Hyderabad, Telangana",      type: "city", state: "Telangana" },
  { id: "city-7",  label: "Chennai, Tamil Nadu",       type: "city", state: "Tamil Nadu" },
  { id: "city-8",  label: "Delhi NCR",                  type: "city", state: "Delhi" },
  { id: "city-9",  label: "Gurugram, Haryana",         type: "city", state: "Haryana" },
  { id: "city-10", label: "Noida, Uttar Pradesh",      type: "city", state: "Uttar Pradesh" },
  { id: "city-11", label: "Ahmedabad, Gujarat",        type: "city", state: "Gujarat" },
  { id: "city-12", label: "Jaipur, Rajasthan",         type: "city", state: "Rajasthan" },
  { id: "city-13", label: "Kochi, Kerala",             type: "city", state: "Kerala" },
  { id: "city-14", label: "Lucknow, Uttar Pradesh",    type: "city", state: "Uttar Pradesh" },
  { id: "city-15", label: "Patna, Bihar",              type: "city", state: "Bihar" },
  { id: "city-16", label: "Bhubaneswar, Odisha",       type: "city", state: "Odisha" },
  { id: "city-17", label: "Indore, Madhya Pradesh",    type: "city", state: "Madhya Pradesh" },
  { id: "city-18", label: "Chandigarh",                type: "city", state: "Chandigarh" },
];

/** Substring search ranked: locality > city, prefix > contains. */
export function suggestLocations(query: string, limit = 8): LocationSuggestion[] {
  if (!query) return LOCATIONS.slice(0, limit);
  const q = query.toLowerCase().trim();
  return LOCATIONS
    .map((l) => {
      const lc = l.label.toLowerCase();
      let score = 0;
      if (lc.startsWith(q)) score += 100;
      else if (lc.includes(q)) score += 50;
      if (l.type === "locality") score += 5;
      return { l, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ l }) => l)
    .slice(0, limit);
}

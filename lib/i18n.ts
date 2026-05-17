"use client";

import { useEffect, useState } from "react";

export type Locale = "en" | "hi" | "bn" | "ta" | "te" | "mr";

type Dict = Record<string, string>;

const en: Dict = {
  "nav.buy":         "Buy",
  "nav.rent":        "Rent",
  "nav.sell":        "Sell",
  "nav.projects":    "Projects",
  "nav.commercial":  "Commercial",
  "nav.agriculture": "Agriculture Land",
  "nav.more":        "More",
  "nav.post":        "Post Property",
  "nav.signin":      "Sign In / Register",
  "hero.eyebrow":    "AI Powered Real Estate Platform",
  "hero.h1.1":       "Find Nearby Plots,",
  "hero.h1.2":       "Flats & Houses",
  "hero.h1.3":       "Instantly",
  "hero.sub":        "AI-powered search with live maps, satellite view & smart recommendations.",
  "hero.cta.explore": "Explore Nearby",
  "hero.cta.post":   "Post Property Free",
  "search.placeholder": "Search city, locality or property",
  "search.locate":   "Use My Location",
  "search.button":   "Search",
  "filters.budget":  "Budget",
  "filters.type":    "Property Type",
  "filters.bhk":     "BHK",
  "filters.more":    "More Filters",
  "footer.tagline":  "India's AI-powered real estate platform.",
  "card.save":       "Save",
  "card.compare":    "Compare",
  "card.preview":    "Preview",
  "card.verified":   "Verified",
  "card.callOwner":  "Call owner",
  "card.chatOwner":  "Chat owner",
  "common.cancel":   "Cancel",
  "common.continue": "Continue",
  "common.submit":   "Submit",
  "common.delete":   "Delete",
  "common.edit":     "Edit",
  "common.loading":  "Loading…",
};

const hi: Dict = {
  "nav.buy":         "खरीदें",
  "nav.rent":        "किराये पर",
  "nav.sell":        "बेचें",
  "nav.projects":    "प्रोजेक्ट्स",
  "nav.commercial":  "कमर्शियल",
  "nav.agriculture": "कृषि भूमि",
  "nav.more":        "और",
  "nav.post":        "प्रॉपर्टी पोस्ट करें",
  "nav.signin":      "साइन इन / रजिस्टर",
  "hero.eyebrow":    "AI संचालित रियल एस्टेट प्लेटफ़ॉर्म",
  "hero.h1.1":       "अपने पास के प्लॉट,",
  "hero.h1.2":       "फ्लैट और मकान",
  "hero.h1.3":       "तुरंत",
  "hero.sub":        "AI से लाइव मैप, सैटेलाइट व्यू और स्मार्ट सिफ़ारिशों के साथ खोजें।",
  "hero.cta.explore": "नज़दीक देखें",
  "hero.cta.post":   "मुफ़्त में पोस्ट करें",
  "search.placeholder": "शहर, इलाक़ा या प्रॉपर्टी खोजें",
  "search.locate":   "मेरी लोकेशन इस्तेमाल करें",
  "search.button":   "खोजें",
  "filters.budget":  "बजट",
  "filters.type":    "प्रॉपर्टी प्रकार",
  "filters.bhk":     "BHK",
  "filters.more":    "अधिक फ़िल्टर",
  "footer.tagline":  "भारत का AI-संचालित रियल एस्टेट प्लेटफ़ॉर्म।",
  "card.save":       "सेव",
  "card.compare":    "तुलना",
  "card.preview":    "प्रीव्यू",
  "card.verified":   "सत्यापित",
  "card.callOwner":  "मालिक को कॉल करें",
  "card.chatOwner":  "मालिक से चैट",
  "common.cancel":   "रद्द करें",
  "common.continue": "जारी रखें",
  "common.submit":   "सबमिट",
  "common.delete":   "हटाएँ",
  "common.edit":     "संपादित करें",
  "common.loading":  "लोड हो रहा है…",
};

const bn: Dict = {
  "nav.buy":         "কিনুন",
  "nav.rent":        "ভাড়া",
  "nav.sell":        "বিক্রি",
  "nav.projects":    "প্রকল্প",
  "nav.commercial":  "কমার্শিয়াল",
  "nav.agriculture": "কৃষি জমি",
  "nav.more":        "আরও",
  "nav.post":        "প্রপার্টি পোস্ট করুন",
  "nav.signin":      "সাইন ইন / রেজিস্টার",
  "hero.eyebrow":    "AI-চালিত রিয়েল এস্টেট প্ল্যাটফর্ম",
  "hero.h1.1":       "কাছাকাছি প্লট,",
  "hero.h1.2":       "ফ্ল্যাট ও বাড়ি",
  "hero.h1.3":       "এখনই",
  "hero.sub":        "AI চালিত অনুসন্ধান — লাইভ ম্যাপ, স্যাটেলাইট ভিউ এবং স্মার্ট সুপারিশ।",
  "hero.cta.explore": "কাছাকাছি দেখুন",
  "hero.cta.post":   "ফ্রিতে পোস্ট করুন",
  "search.placeholder": "শহর, এলাকা বা প্রপার্টি খুঁজুন",
  "search.locate":   "আমার লোকেশন ব্যবহার করুন",
  "search.button":   "অনুসন্ধান",
  "filters.budget":  "বাজেট",
  "filters.type":    "প্রপার্টির ধরন",
  "filters.bhk":     "BHK",
  "filters.more":    "আরও ফিল্টার",
  "footer.tagline":  "ভারতের AI-চালিত রিয়েল এস্টেট প্ল্যাটফর্ম।",
  "card.save":       "সেভ",
  "card.compare":    "তুলনা",
  "card.preview":    "প্রিভিউ",
  "card.verified":   "যাচাই করা",
  "card.callOwner":  "মালিকের সাথে কল",
  "card.chatOwner":  "মালিকের সাথে চ্যাট",
  "common.cancel":   "বাতিল",
  "common.continue": "চালিয়ে যান",
  "common.submit":   "জমা দিন",
  "common.delete":   "মুছুন",
  "common.edit":     "সম্পাদনা",
  "common.loading":  "লোড হচ্ছে…",
};

const DICTS: Record<Locale, Dict> = {
  en,
  hi,
  bn,
  ta: en, // fallback to English until translations land
  te: en,
  mr: en,
};

const STORAGE_KEY = "akp.lang.v1";

function readLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const v = localStorage.getItem(STORAGE_KEY) as Locale | null;
  return v && v in DICTS ? v : "en";
}

/** Synchronous getter — only safe in client components. */
export function t(key: string, locale?: Locale): string {
  const loc = locale ?? readLocale();
  return DICTS[loc]?.[key] ?? en[key] ?? key;
}

/** Reactive hook — re-renders when the user switches language. */
export function useT() {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    setLocale(readLocale());
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<Locale>).detail;
      if (detail) setLocale(detail);
    };
    window.addEventListener("akp:lang-change", onChange);
    window.addEventListener("storage", () => setLocale(readLocale()));
    return () => {
      window.removeEventListener("akp:lang-change", onChange);
    };
  }, []);

  return {
    locale,
    t: (key: string) => DICTS[locale]?.[key] ?? en[key] ?? key,
  };
}

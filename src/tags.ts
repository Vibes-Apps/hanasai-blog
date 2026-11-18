// Sabit etiket listesi (Ahmet, 2026-11-16). Sırası liste sayfasındaki buton sırasıdır; adlar sitede bu haliyle (İngilizce) görünür.
// slug adreste ve bilgi bloğunda kullanılır (/blog/tag/<slug>, tags: [<slug>]); label ekranda görünen ad.
// Yeni etiket buraya eklenir; CMS'teki seçenekler de buradan gelir (cms/config.ts). Yazı başına 2–4 etiket.

export const TAGS = [
  { slug: "ai-receptionist", label: "AI Receptionist", description: "Posts about AI receptionists: how they answer the phone for small hotels and what to expect from one." },
  { slug: "voice-ai", label: "Voice AI", description: "Posts about voice AI: how computer voices understand callers and speak with them on the phone." },
  { slug: "hotels-and-bbs", label: "Hotels & B&Bs", description: "Posts for owners of small hotels, B&Bs and inns in the UK about guest calls and running the front desk." },
  { slug: "other-industries", label: "Other Industries", description: "Posts about answering the phone with an AI receptionist in businesses other than hotels." },
  { slug: "pricing-and-costs", label: "Pricing & Costs", description: "Posts about what answering the phone costs: staff, answering services and AI receptionists." },
  { slug: "comparisons", label: "Comparisons", description: "Posts comparing AI receptionists and other ways of answering guest calls, with sources and dates." },
  { slug: "missed-calls", label: "Missed Calls", description: "Posts about missed calls at small hotels: when they happen and what they cost in bookings." },
  { slug: "legal-and-compliance", label: "Legal & Compliance", description: "Posts about UK rules that matter when a hotel's phone is answered by AI, such as data protection." },
  { slug: "integrations-and-pms", label: "Integrations & PMS", description: "Posts about connecting an AI receptionist to the systems a hotel already uses, such as its PMS." },
  { slug: "product-news", label: "Product News", description: "News about Hanas: new features, changes and what is coming next." },
] as const;

export type TagSlug = (typeof TAGS)[number]["slug"];
export const TAG_SLUGS = TAGS.map((t) => t.slug) as unknown as [TagSlug, ...TagSlug[]];
export const TAGS_MIN = 2;
export const TAGS_MAX = 4;

const BY_SLUG = new Map<string, (typeof TAGS)[number]>(TAGS.map((t) => [t.slug, t]));
export const tagLabel = (slug: string): string => BY_SLUG.get(slug)?.label ?? slug;
export const isTagSlug = (s: string): s is TagSlug => BY_SLUG.has(s);

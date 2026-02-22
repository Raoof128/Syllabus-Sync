// lib/map/budyariNgurraPOIs.ts
// Budyari Ngurra (Good Country) Walking Track Points of Interest
// 3km walking track with 15 POIs - June 2024

export interface BudyariPOI {
  id: string;
  order: number;
  title: string;
  description: string;
  category: "nature" | "culture" | "facility" | "art" | "history";
}

export const budyariNgurraPOIs: BudyariPOI[] = [
  {
    id: "remnant-vegetation",
    order: 1,
    title: "Remnant Native Vegetation",
    description:
      "This area of native vegetation is a remnant of the forest that used to cover much of the campus. It's classified as the Sydney Turpentine–Ironbark Forest and is protected as an endangered ecological community.",
    category: "nature",
  },
  {
    id: "mq-lake",
    order: 2,
    title: "Macquarie University Lake",
    description:
      "The picturesque lake, classified as a reserve, is home to reeds, water lilies and other aquatic plants, as well as waterbirds such as lapwings, ducks, dusky moorhens and ibis.",
    category: "nature",
  },
  {
    id: "art-gallery",
    order: 3,
    title: "Macquarie University Art Gallery",
    description:
      "The Art Gallery and Collection contains more than 2700 items across media such as painting, photography, drawing, ceramics, textiles and video.",
    category: "art",
  },
  {
    id: "discovery-centre",
    order: 4,
    title: "Macquarie University Natural Sciences Discovery Centre",
    description:
      "The collection features mostly Australian specimens, including skulls, skeletons, taxidermy mounts, coral, shells, antique microscopes and insects – as well as Minmi, the centre's resident ankylosaur.",
    category: "nature",
  },
  {
    id: "frank-mercer-garden",
    order: 5,
    title: "Frank Mercer Natural Sciences Garden",
    description:
      "The garden has a strong focus on flowering plants, gymnosperms such as cycads, and ferns.",
    category: "nature",
  },
  {
    id: "frank-the-bear",
    order: 6,
    title: "Frank The Bear",
    description:
      "Frank, the three-metre-tall Kodiak bear, began his life in Seattle Zoo before settling at Taronga Zoo. Frank came to Macquarie following his death in 1978, where he has been proudly displayed since.",
    category: "history",
  },
  {
    id: "bush-tucker-garden",
    order: 7,
    title: "Bush Tucker Garden",
    description:
      "Many of the plants – native to the Wallumattagal Country, North Ryde area – have strong connections with Indigenous cultural practices as food or medicine.",
    category: "culture",
  },
  {
    id: "mq-hospital",
    order: 8,
    title: "Macquarie University Hospital",
    description:
      "The hospital combines state-of-the-art technologies, visionary treatments and superb patient facilities with a commitment to high-quality care. Adjacent to the hospital are 32 specialist clinics.",
    category: "facility",
  },
  {
    id: "jim-rose-garden",
    order: 9,
    title: "Jim Rose Natural Sciences Garden",
    description:
      "The garden – divided into two sections – features plants significant to both the Northern and Southern hemispheres, as well as Devonian limestones that are home to unique marine fossils.",
    category: "nature",
  },
  {
    id: "central-courtyard",
    order: 10,
    title: "Central Courtyard",
    description:
      "The tree-lined Central Courtyard – the natural heart of the campus – is home to retail outlets offering food and beverages from across the globe, a teaching and study spaces, and a graduation hall.",
    category: "facility",
  },
  {
    id: "library",
    order: 11,
    title: "Library",
    description:
      "Situated at the entrance to the Library, the Lachlan and Elizabeth Macquarie Room is the original sitting parlour from the Macquarie family estate on the Isle of Mull in Scotland. It houses the historically significant Macquarie Chair and Macquarie Dish.",
    category: "history",
  },
  {
    id: "history-museum",
    order: 12,
    title: "Macquarie University History Museum",
    description:
      "Home to more than 18,000 objects, the museum explores world history from when Aboriginal peoples first lived on this land around 65,000 BCE through ancient Egypt, Greece and Rome to the 20th and 21st centuries.",
    category: "history",
  },
  {
    id: "sport-aquatic",
    order: 13,
    title: "Macquarie University Sport And Aquatic Centre",
    description:
      "Home to a state-of-the-art health club, heated indoor and outdoor swimming pools, group fitness studios, and martial arts and gymnastics spaces, the centre is open to everyone, every day.",
    category: "facility",
  },
  {
    id: "learning-circle",
    order: 14,
    title: "Learning Circle",
    description:
      "This sacred space provides a culturally safe place for Indigenous events and for yarns, meetings and bayala (conversations) around the business of life.",
    category: "culture",
  },
  {
    id: "sculpture-park",
    order: 15,
    title: "Sculpture Park",
    description:
      "Peppered across the campus are some 130 sandstone, limestone, concrete, steel, bronze, copper and ceramic sculptures crafted by Australian and international sculptors.",
    category: "art",
  },
];

// Helper functions
export const getBudyariPOIById = (id: string): BudyariPOI | undefined => {
  return budyariNgurraPOIs.find((poi) => poi.id === id);
};

export const getBudyariPOIsByCategory = (
  category: BudyariPOI["category"],
): BudyariPOI[] => {
  return budyariNgurraPOIs.filter((poi) => poi.category === category);
};

export const searchBudyariPOIs = (query: string): BudyariPOI[] => {
  const lowerQuery = query.toLowerCase();
  return budyariNgurraPOIs.filter(
    (poi) =>
      poi.title.toLowerCase().includes(lowerQuery) ||
      poi.description.toLowerCase().includes(lowerQuery),
  );
};

// Walking track info
export const BUDYARI_NGURRA_TRACK = {
  name: "Budyari Ngurra Walking Track",
  meaning: "Good Country",
  distance: "3km",
  poiCount: 15,
  description:
    "A 3-kilometre walking track that takes you through the campus, showcasing natural areas, cultural sites, and key facilities.",
};

export const POI_CATEGORY_LABELS: Record<BudyariPOI["category"], string> = {
  nature: "Nature & Environment",
  culture: "Indigenous Culture",
  facility: "Campus Facilities",
  art: "Art & Sculpture",
  history: "History & Heritage",
};

export const POI_CATEGORY_COLORS: Record<BudyariPOI["category"], string> = {
  nature: "bg-green-500",
  culture: "bg-amber-500",
  facility: "bg-blue-500",
  art: "bg-purple-500",
  history: "bg-orange-500",
};

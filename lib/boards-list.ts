import { categoryTree } from "./boards";

/** Flat board choices (homepage + two-level categories) for selects. */
export async function boardChoices() {
  const tree = await categoryTree();
  return [
    { slug: "home", label: "Homepage" },
    ...tree.flatMap((c) => [{ slug: c.slug, label: c.name }, ...c.children.map((k) => ({ slug: k.slug, label: `${c.name} › ${k.name}` }))]),
  ];
}

// Templates intentionally supply structure, never prewritten clinical findings.
export const templates = [
  {
    id: "general",
    label: "General radiology",
    sections: [
      "Clinical indication",
      "Technique",
      "Comparison",
      "Findings",
      "Impression",
    ],
  },
  {
    id: "chest",
    label: "Chest X-ray",
    sections: ["Clinical indication", "Comparison", "Findings", "Impression"],
  },
  {
    id: "ct",
    label: "CT report",
    sections: [
      "Clinical indication",
      "Technique",
      "Contrast",
      "Comparison",
      "Findings",
      "Impression",
    ],
  },
  {
    id: "mri",
    label: "MRI report",
    sections: [
      "Clinical indication",
      "Technique",
      "Comparison",
      "Findings",
      "Impression",
    ],
  },
];

export function templateDocument(id: string) {
  const template = templates.find((item) => item.id === id);
  return template
    ? {
        type: "doc",
        content: template.sections.flatMap((section) => [
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: section }],
          },
          { type: "paragraph" },
        ]),
      }
    : null;
}

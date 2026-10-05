# Reporting workspace

Mode: Operate. User request: build the custom OHIF extension based on `/tmp/codex-clipboard-t3tgwT.png`.

## Direction contract

THESIS: A report document with immediate access to study images. The supplied screenshot pins the visual direction and composition.

OWN-WORLD: White canvas, pale green-gray toolbar, dark text, fine gray-green borders, restrained green primary action, compact controls and Lucide line icons.

STORY: Identify the patient, select a structural template or type a report, format the document, preview it, and save the draft. Return to the image workspace without losing text or viewport state.

FIRST VIEWPORT: Compact horizontal header; patient/modality chips left and template/preview/save right. Formatting strip below. Two-column patient metadata inside a bordered document, followed by generous writing space. A small footer clarifies browser-local storage. On phones, controls wrap and patient metadata becomes one column.

FORM: User-pinned reference screenshot; no concept seed required. React/Tiptap implementation inside a registered OHIF layout extension and mode. No fabricated patient identity, author, clinical findings, or AI capability.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Boundaries

Backend reporting and AI endpoints are not provided. Draft persistence uses browser-local storage with explicit status. The screenshot is a design reference, not data to hardcode. Original observation packages and image tools remain available.

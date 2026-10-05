# Observation sidebar design

The report is part of the Observations sidebar and follows the installed OHIF theme. Images stay visible and interactive alongside it. The sidebar’s Observations and Report controls switch between notes and the report for the same selected study.

## Theme

Use the existing OHIF CSS custom properties from `platform/ui-next/src/tailwind.css` in the sibling viewer. Do not maintain a separate light palette for reporting.

| Report role | OHIF token |
| --- | --- |
| Workspace and document | `--background` |
| Toolbar, context chips, code and table headers | `--muted` |
| Main text | `--foreground` |
| Labels and placeholders | `--muted-foreground` |
| Borders and dividers | `--border` |
| Save action | `--primary`, `--primary-foreground` |
| Action hover | `--secondary` |
| Focus and active formatting | `--highlight` |
| Selected controls and hover surfaces | `--accent` |
| Table menu | `--popover` |
| Error background | `--destructive` |

The currently installed OHIF theme has charcoal surfaces and green accents. Tokens are consumed through scoped `--report-*` aliases, with fallbacks matching the installed viewer. Unsaved and error text use readable amber and light red. Inherit the viewer’s font; controls use compact type and 4px corners. Native selects use a dark color scheme.

## Layout and behavior

Keep the report inside the standard resizable OHIF sidebar. Actions and formatting tools wrap to the panel width even on desktop. Patient metadata uses a single column, and the report has a 250px minimum writing area. The sidebar scrolls as one region. OHIF’s mobile drawer supplies the surrounding responsive behavior.

Report editing, preview, templates, tables, local images, and browser-local drafts retain their behavior. The storage disclosure stays visible. Shortcuts for image tools pause only while the report has focus. Switching sidebar views preserves the mounted editor and undo history.

Printing uses a white page, dark text, neutral table backgrounds and borders, and hides viewer controls. User-authored text colors remain part of the report content.

## Verification

Source of truth: [reporting.css](extensions/reporting/src/reporting.css) and [observations.css](extensions/observations/src/observations.css). The browser smoke script captures the report beside visible images and checks formatting, save/reload, sidebar switching, preview, templates, table editing, and save failures. Review screenshots live under `.impeccable/review/`.

# Reporting extension

This extension adds a rich-text report workspace to OHIF 3.12.12. Its layout includes a patient/modality header, template selector, preview and Save Draft actions, formatting toolbar, single-column patient details, and a document editor. All surfaces and controls use OHIF’s dark theme tokens and inherited typography. Printed reports use a white page with dark text. It is embedded inside the Observations sidebar alongside the standard OHIF image viewports.

## Run

From `custom-ohif-viewer`, with the sibling viewer's dependencies installed:

```bash
npm run install:reporting
npm run link:viewer
npm run dev
```

Open `http://localhost:3006`, expand a study, and choose **Observation Viewer**, then select **Report** inside the **Observations** sidebar. Direct link:

```text
http://localhost:3006/observations?StudyInstanceUIDs=<StudyInstanceUID>
```

Orthanc is proxied from `http://localhost:8042`. Reporting is part of Observation Viewer; there is no separate Reporting Viewer mode. Images remain visible and interactive while writing a report. The development build must be restarted after adding packages to `pluginConfig.json`. The viewer's webpack resolver includes the standard `node_modules` fallback to find this extension's private editor dependencies. React, OHIF, and Lucide are reused from the installed viewer; do not install another React copy here.

## Functionality

- Patient name, ID, age, sex, and modality come from the selected study's DICOM metadata. Unavailable values display an em dash. Patient age is shown only when provided; it is not inferred from today's date.
- Paragraph and heading styles, font, size, color, bold, italic, underline, strike, code, lists, list indentation, alignment, table insertion/editing, local raster images, undo, and redo use Tiptap 3.
- Templates contain empty sections, not prewritten findings. Replacing nonempty content requires confirmation and can be undone.
- Preview makes the editor read-only. Print uses the document and patient details, excluding viewer chrome.
- The sidebar’s **Observations** and **Report** buttons switch between notes and the report. The report stays mounted to preserve edits and undo history. Image tools’ shortcuts are disabled only while focus is in the report, and re-enabled when focus returns to the images. Ctrl/Cmd+S saves the draft.
- Notes and reports share the Observations sidebar’s study selector. Unsaved drafts remain isolated by StudyInstanceUID in memory. A browser reload/close prompts if any draft is unsaved.

## Storage and integration boundary

**Save Draft currently stores the document only in this browser's localStorage.** It does not upload to Orthanc, a reporting database, or another user/device. The footer always identifies this scope. No AI service, report signing, or DICOM SR/PDF export is connected.

`src/reportRepository.ts` is the storage boundary. Replace its load/save implementation with an authenticated reporting API for shared persistence. Preserve study isolation and retain dirty state on save failure. The local format uses `ohif.report-draft.v1:<StudyInstanceUID>` and stores the editor's JSON document plus its save timestamp. Never put report contents in URLs or logs.

`reportedBy` defaults to unavailable. An integration can provide a display identity using `window.config.reporting.reportedBy`; this is a display value, not authentication. `Reported at` shows the last successful draft save time. A signed-report workflow should supply its own author and signing timestamp from the server.

Image uploads accept PNG/JPEG/WebP up to 1 MB. Images are embedded in the draft. External image URLs from pasted HTML are rejected. Storage errors leave the editor open and retain unsaved work; malformed saved documents are not silently overwritten.

## Verification

```bash
npm test
node scripts/reporting-smoke.cjs
```

The browser check defaults to `http://localhost:3006` (override with `REPORTING_TEST_ORIGIN`). It requires Google Chrome and a study in Orthanc. It uses a fresh browser context, modifies only that context's local drafts, and writes screenshots under ignored `.impeccable/review/`. It does not save anything to PACS.

For deployment, include the observation mode, both custom extensions and the reporting dependencies in the viewer build context or publish/install the packages. Local symlinks alone are not a portable Docker build.

References: [OHIF layouts](https://docs.ohif.org/platform/extensions/modules/layout-template/), [Tiptap React](https://tiptap.dev/docs/editor/getting-started/install/react).

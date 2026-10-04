# Custom OHIF components

This repository contains **only the custom observation extension and mode**. The complete viewer remains in the sibling `Radiologist-ohif-viewer` directory. There is no second OHIF application here.

```text
new/
├── Radiologist-ohif-viewer/      # The one complete OHIF application
└── custom-ohif-viewer/          # Only custom code (this repository)
    ├── extensions/observations/
    │   └── src/ObservationPanel.tsx
    ├── modes/observations/
    │   └── src/index.ts
    ├── config/observations.js
    └── scripts/link-viewer.cjs
```

`extensions/observations/src/ObservationPanel.tsx` is the custom React component. The extension registers that component with OHIF. The mode opens it beside OHIF's existing image viewports and tools.

## Use with the existing viewer

The link script registers both packages in the existing viewer and creates local symlinks. All third-party dependencies are reused from the existing viewer's `node_modules`; nothing is copied here. It also adds an optional `dev:observations` command to the viewer. Run it again after reinstalling viewer dependencies.

```bash
cd /home/kishan/Documents/ohif/new/custom-ohif-viewer
npm run link:viewer
npm run dev
```

Orthanc must be running at `http://localhost:8042`. Open `http://localhost:3006`, expand a study, and choose **Observation Viewer**, or use:

```text
http://localhost:3006/observations?StudyInstanceUIDs=<StudyInstanceUID>
```

Edit the custom source files in this repository; the existing viewer loads them through the links. This setup is for local development. A standalone Docker build of the viewer will need these packages included in its build context or published before using them.

## Submission

Users enter an observation and submit it to see **Observation recorded**. The current adapter is a dummy: it makes no database request and uses no localStorage or IndexedDB. Drafts and demo records disappear on page refresh.

When the database endpoint is supplied, replace the adapter in `extensions/observations/src/observationRepository.ts`. See [the extension documentation](extensions/observations/README.md) for the contract.

## Tests

After linking to the existing viewer's installed dependencies:

```bash
npm test
```

The tests cover submission, input validation, retries, duplicate submissions, per-study isolation, panel remounts, and empty states.

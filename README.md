# Custom OHIF components

This repository contains Observation Viewer with observation and reporting extensions. The complete viewer remains in the sibling `Radiologist-ohif-viewer` directory. There is no second OHIF application here.

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

### Reporting inside Observation Viewer

The screenshot-based report editor is in `extensions/reporting`, integrated into `modes/observations`. It includes rich-text formatting, templates, patient details, preview, print, and browser-local drafts. See [reporting setup and integration notes](extensions/reporting/README.md).

```bash
npm run install:reporting
npm run dev
```

Select **Observation Viewer** from the study list, or open `/observations?StudyInstanceUIDs=<StudyInstanceUID>`, open the **Observations** sidebar, and select **Report** inside it. The editor stays beside the images. Use **Observations** to return to notes; report drafts remain available. Restart a running viewer after changing registration.

### Observation Viewer

The link script registers the custom extension and mode packages in the existing viewer and creates local symlinks. Observation dependencies and shared React/OHIF packages are reused from the existing viewer's `node_modules`. Reporting editor dependencies are installed separately by `npm run install:reporting`. Use **`npm run dev` from this directory** to start the complete viewer with both observations and reporting at `http://localhost:3006`. The viewer’s `dev:observations` and `dev:reporting` commands are compatibility aliases for the same server; you do not run them separately. Run it again after reinstalling viewer dependencies.

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

## Existing OHIF modes

The same app retains OHIF’s built-in modes alongside **Observation Viewer**. `config/observations.js` uses `modes: []`, matching OHIF’s default configuration: the loader includes the default modes registered in the viewer’s `platform/app/pluginConfig.json`, including our custom mode.

Expand a study in the worklist to choose a viewer. Existing mode visibility and study compatibility rules still apply; specialized modes can be disabled or hidden for incompatible studies. Test/development modes remain disabled by default.

## Submission

Users enter an observation and submit it to see **Observation recorded**. The current adapter is a dummy: it makes no database request and uses no localStorage or IndexedDB. Drafts and demo records disappear on page refresh.

When the database endpoint is supplied, replace the adapter in `extensions/observations/src/observationRepository.ts`. See [the extension documentation](extensions/observations/README.md) for the contract.

## Tests

After linking to the existing viewer's installed dependencies:

```bash
npm test
```

The tests cover observation submission, input validation, retries, duplicate submissions, per-study isolation, panel remounts, and empty states, plus reporting draft persistence, reload recovery, corrupt storage, and save failures.

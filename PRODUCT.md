<!-- impeccable:product-schema 1 -->

# Product context

## Platform

web

The user requested a custom OHIF reporting extension matching the supplied screenshot at `/tmp/codex-clipboard-t3tgwT.png`.

The repository contains the reporting extension at `extensions/reporting` inside the Observation Viewer mode at `modes/observations`. The viewer opens on images and observations, with Observations and Report controls inside the Observations sidebar. There is no separate Reporting Viewer mode. The report editor occupies the sidebar, with images remaining visible and interactive. Notes and reports share the selected study.

Patient data comes from the selected study's DICOM metadata. Unavailable values display an em dash. Templates provide empty sections, not generated findings.

Drafts currently persist only in this browser's localStorage, with that scope disclosed in the interface. No backend reporting service, AI service, report signing, or DICOM SR/PDF export is connected. Configured reporter display text is not authentication.

Implementation and integration details are documented in [the reporting README](extensions/reporting/README.md). The report sidebar inherits OHIF’s dark theme as documented in [DESIGN.md](DESIGN.md); the specific surface direction is recorded in [the reporting brief](.impeccable/reporting-brief.md).

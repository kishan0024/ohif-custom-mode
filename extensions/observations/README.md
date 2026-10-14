# Observations extension

`@custom/extension-observations.panelModule.observations` registers the right-hand panel used by `@custom/mode-observations`.

The panel reads study UIDs from OHIF's `ImageViewerProvider`. With multiple studies open, users explicitly choose the target study. Drafts are scoped by UID during the page session; saved observations reload from the backend.

## Backend persistence

API implementation and the `report_observations` table live in the sibling
`Radiologist-report-backend` repository. Apply its `report.0008_observation`
migration before using the viewer. The viewer is only an authenticated API client.

`src/observationRepository.ts` calls `GET` and `POST /api/reports/observations/`
through the configured same-origin API proxy and existing main-app token handoff.
It passes the selected DICOM UID and the launch URL's report/study UUIDs. Existing
reports without a backend study link are supported via `reportId` alone.

The panel loads saved observations on mount, including all result pages, and
shows a retry action if history cannot be loaded. Successful database responses
supply the ID and timestamp shown in the history. Failed submissions preserve
the draft; there is no demo-success or browser-storage fallback. Draft text stays
in memory and does not survive a refresh.

Report-specific observations are scoped to that report revision and DICOM UID.
Study-only notes are separately scoped to their backend study and DICOM UID.

## UI direction

Operate mode: keep images central and the writing form visible in an initially open, resizable 360px right panel (280px minimum). Inherit the existing OHIF/MediScribe colors, typography, and side-panel layout. Reading order: purpose, target study, observation field, submit action, confirmation, recorded history. No animation or new visual identity is introduced.

Input is limited to 10,000 characters. Whitespace-only input is rejected. Submission is disabled while pending, and a failed request leaves the draft intact. An in-flight response belongs to its original study even if users switch studies. Text renders as text, never HTML.

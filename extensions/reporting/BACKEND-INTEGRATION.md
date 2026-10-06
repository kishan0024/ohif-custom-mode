# MediScribe report API integration

The Observation Viewer proxies `/api` to `http://localhost:8000` during `npm run dev:reporting` (port 3006). Override the server with `REPORTING_API_TARGET`. Orthanc continues to serve images through `/pacs/dicom-web`.

Reports load from the backend and Save Draft writes HTML with `status: "draft"`. Finalized reports are read-only. Missing credentials, study mappings, permissions, and failed requests are shown in the report editor. Local-only drafts remain untouched and are not automatically uploaded. Remove `reporting.apiBaseUrl` to restore browser-only persistence.

## Launch context and authentication

Open one DICOM study with its corresponding backend Study **UUID**:

```text
http://localhost:3006/observations?StudyInstanceUIDs=<dicom-uid>&studyId=<backend-study-uuid>
```

Optionally append `&reportId=<backend-report-uuid>` to select a report revision. The backend's display `study_id` and the patient's DICOM ID are not substitutes for the backend Study UUID. The current backend has no dedicated DICOM StudyInstanceUID field, so the launching application must supply the mapping. A report belonging to another backend study is rejected; the caller is responsible for the DICOM-to-backend mapping.

Supply authentication through `window.config.reporting.getAccessToken`, a function returning the current access token (or a promise). The development config reads the viewer origin's `sessionStorage['mediscribe.accessToken']`. For local testing, set this through browser developer tools using your own login session, then reload the viewer. Use the token issued after clinic selection where required. Never place tokens in URLs, committed configuration, or report contents. Storage from a frontend on another port is not automatically shared with the viewer. A frontend authentication handoff is still needed for seamless launch; no login or cross-origin message listener is added here. Reload the viewer when changing account or clinic to clear its in-memory reports.

For multi-study launches, supply `window.config.reporting.resolveStudy = uid => ({ studyId, reportId })` using the application's verified mapping. URL context is deliberately limited to a single matching UID.

## API behavior

- GET `/api/reports/?study_id=<uuid>` or GET `/api/reports/<reportId>/` loads a report.
- POST `/api/reports/session/start/` creates/reuses a draft when first saved.
- PATCH `/api/reports/<reportId>/update/` saves HTML while preserving draft status.
- Multiple report revisions require an explicit report ID. No report is signed or finalized by this integration.
- Before saving, status and `updated_at` are checked again. This detects earlier edits but is not an atomic concurrency guarantee; the backend would need conditional writes for that.

Templates, AI generation, observations persistence, and production hosting are separate integrations. Production must proxy `/api` to the backend as well. The existing Docker stack does not package the sibling custom extensions.

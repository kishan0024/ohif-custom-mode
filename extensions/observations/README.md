# Observations extension

`@custom/extension-observations.panelModule.observations` registers the right-hand panel used by `@custom/mode-observations`.

The panel reads study UIDs from OHIF's `ImageViewerProvider`. With multiple studies open, users explicitly choose the target study. Drafts and submitted demo observations are scoped by UID and survive closing/reopening the panel during the same page session.

## Submission adapter

`src/observationRepository.ts` is the API boundary. Its current adapter simulates a successful request without network access or persistent storage. `create()` receives:

```json
{
  "studyInstanceUID": "1.2.840...",
  "text": "Observation text"
}
```

It returns `{ id, studyInstanceUID, text, recordedAt }`. The timestamp is an ISO date string.

When the backend endpoint is supplied:

1. Replace `create()` with the authenticated HTTP request and map the response to `ObservationRecord`.
2. Set `isDemo` to `false` only after a real successful database response drives the confirmation.
3. Reject failed HTTP responses so the UI preserves the draft and offers retry. Never silently fall back to dummy success.
4. Add a retrieval method and loading/error states once the API contract for existing observations is known. The current history contains only submissions made in the current page session.

No endpoint, authentication scheme, or server persistence is assumed. No localStorage or IndexedDB fallback exists.

## UI direction

Operate mode: keep images central and the writing form visible in an initially open, resizable 360px right panel (280px minimum). Inherit the existing OHIF/MediScribe colors, typography, and side-panel layout. Reading order: purpose, demo notice, target study, observation field, submit action, confirmation, session history. No animation or new visual identity is introduced.

Input is limited to 10,000 characters. Whitespace-only input is rejected. Submission is disabled while pending, and a failed request leaves the draft intact. An in-flight response belongs to its original study even if users switch studies. Text renders as text, never HTML.

import React, { useState, useSyncExternalStore } from "react";
import { useImageViewer } from "@ohif/ui-next";
import { MAX_OBSERVATION_LENGTH, observationStore } from "./observationStore";
import "./observations.css";

export function StudyObservations({
  studyInstanceUID,
}: {
  studyInstanceUID: string;
}) {
  const state = useSyncExternalStore(observationStore.subscribe, () =>
    observationStore.getSnapshot(studyInstanceUID),
  );

  return (
    <>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void observationStore.submit(studyInstanceUID);
        }}
      >
        <label className="observations-label" htmlFor="observation-text">
          New observation
        </label>
        <textarea
          id="observation-text"
          value={state.draft}
          onChange={(event) =>
            observationStore.setDraft(studyInstanceUID, event.target.value)
          }
          onKeyDown={(event) => event.stopPropagation()}
          placeholder="Describe what you see in the images…"
          maxLength={MAX_OBSERVATION_LENGTH}
          disabled={state.submitting}
          aria-describedby="observation-hint observation-count observation-error"
          aria-invalid={Boolean(state.error)}
          rows={5}
        />
        <div className="observations-input-meta">
          <span id="observation-hint">For the selected study</span>
          <span id="observation-count">
            {state.draft.length.toLocaleString()} / 10,000
          </span>
        </div>
        <div id="observation-error" role="alert" className="observations-error">
          {state.error}
        </div>
        <button
          type="submit"
          disabled={state.submitting || !state.draft.trim()}
        >
          {state.submitting ? "Submitting…" : "Submit observation"}
        </button>
        <div
          className="observations-confirmation"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {state.confirmation && (
            <>
              <strong>{state.confirmation}</strong>
              {observationStore.isDemo && (
                <span>Demo submission only. Not saved to a database.</span>
              )}
            </>
          )}
        </div>
      </form>

      <section
        className="observations-history"
        aria-labelledby="observations-history-title"
      >
        <h3 id="observations-history-title">
          {observationStore.isDemo
            ? "Session observations"
            : "Recorded observations"}{" "}
          ({state.records.length})
        </h3>
        {state.records.length === 0 ? (
          <p className="observations-muted">
            No observations yet. Submitted observations will appear here.
          </p>
        ) : (
          <>
            <p className="observations-history-hint observations-muted">
              All entries for this study. Newest first.
            </p>
            <ol
              className="observations-list"
              aria-label="All observations for this study"
              tabIndex={0}
            >
              {state.records.map((record, index) => (
                <li key={record.id}>
                  <div className="observations-entry-heading">
                    <strong>Observation {state.records.length - index}</strong>
                    <time dateTime={record.recordedAt}>
                      {new Date(record.recordedAt).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "medium",
                      })}
                    </time>
                  </div>
                  <p>{record.text}</p>
                </li>
              ))}
            </ol>
          </>
        )}
      </section>
    </>
  );
}

export default function ObservationPanel({ ReportComponent, hotkeysManager }: {
  ReportComponent?: React.ComponentType<{ studyUID: string; hotkeysManager?: any }>;
  hotkeysManager?: any;
} = {}) {
  const [view, setView] = useState("observations");
  const [reportOpened, setReportOpened] = useState(false);
  const { StudyInstanceUIDs = [] } = useImageViewer() || {};
  const [chosenStudy, setChosenStudy] = useState("");
  const selectedStudy = StudyInstanceUIDs.includes(chosenStudy)
    ? chosenStudy
    : StudyInstanceUIDs[0];

  return (
    <div className="observations-sidebar">
      <div className="observations-panel observations-sidebar-context">
        <header>
          <h2>Observations</h2>
          <p className="observations-muted">Record your findings while reviewing the images.</p>
        </header>
        {!selectedStudy ? (
          <p className="observations-muted">Open a study to write an observation.</p>
        ) : StudyInstanceUIDs.length > 1 ? (
          <div className="observations-study">
            <label className="observations-label" htmlFor="observation-study">Study to record against</label>
            <select id="observation-study" value={selectedStudy}
              onChange={(event) => setChosenStudy(event.target.value)}>
              {StudyInstanceUIDs.map((uid, index) => (
                <option value={uid} key={uid}>Study {index + 1} · {uid}</option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      {selectedStudy && <>
        {ReportComponent && <div className="observations-view-switch" role="group" aria-label="Observations sidebar view">
          <button type="button" aria-pressed={view === "observations"} onClick={() => setView("observations")}>Observations</button>
          <button type="button" aria-pressed={view === "report"} onClick={() => { setReportOpened(true); setView("report"); }}>Report</button>
        </div>}
        {reportOpened && ReportComponent && <div hidden={view !== "report"} className="observations-report-container">
          <ReportComponent key={selectedStudy} studyUID={selectedStudy} hotkeysManager={hotkeysManager} />
        </div>}
        {view === "observations" && (
          <div className="observations-panel observations-sidebar-notes">
            {observationStore.isDemo && <p className="observations-demo-note">
              <strong>Demo mode</strong>
              Observations stay in this session only and clear on refresh. Database connection pending.
            </p>}
            <div className="observations-study">
              <span className="observations-label">Study UID</span>
              <p className="observations-study-uid">{selectedStudy}</p>
            </div>
            <StudyObservations key={selectedStudy} studyInstanceUID={selectedStudy} />
          </div>
        )}
      </>}
    </div>
  );
}

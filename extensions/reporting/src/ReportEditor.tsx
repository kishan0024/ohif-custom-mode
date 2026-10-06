import React, { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import { TableKit } from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Eye,
  Save,
  Check,
  Pencil,
  Printer,
  AlertCircle,
  X,
} from "lucide-react";
import EditorToolbar, { SelectControl } from "./EditorToolbar";
import {
  emptyDocument,
  getDraft,
  saveDraft,
  updateDraft,
  setRemoteDraft,
  rememberRemoteReport,
  type Draft,
} from "./reportRepository";
import { templates, templateDocument } from "./templates";
import type { StudyDetails } from "./useStudyDetails";
import "./reporting.css";
import { backendEnabled, loadBackendReport, startBackendReport, saveBackendReport } from "./backendReports";

type Props = {
  studyUID: string;
  patient: StudyDetails;
  reportedBy?: string;
};

export default function ReportEditor({
  studyUID,
  patient,
  reportedBy,
}: Props) {
  const [initial] = useState(() => {
    try {
      return { draft: getDraft(studyUID), error: "" };
    } catch (error) {
      return {
        draft: { content: emptyDocument, savedAt: null, dirty: false } as Draft,
        error:
          error instanceof SyntaxError
            ? "This browser’s saved draft could not be read. It has not been overwritten."
            : error instanceof Error
              ? error.message
              : "Browser storage is unavailable. Your draft could not be loaded.",
      };
    }
  });
  const [draft, setDraft] = useState(initial.draft);
  const [error, setError] = useState(initial.error);
  const remote = backendEnabled();
  const [loading, setLoading] = useState(remote && !initial.draft.loaded);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const blocked = Boolean(initial.error) || loading || loadFailed;
  const readOnly = remote && Boolean(draft.remoteReport && draft.remoteReport.status !== 'draft');
  const [preview, setPreview] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState("");
  const [templateId, setTemplateId] = useState("");
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false, heading: { levels: [1, 2] } }),
      TextStyleKit,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        defaultAlignment: "left",
      }),
      TableKit.configure({ table: { resizable: true } }),
      // Only local raster uploads; do not fetch external image URLs from pasted HTML.
      Image.extend({
        parseHTML() {
          return [
            {
              tag: "img[src]",
              getAttrs: (node) =>
                /^data:image\/(png|jpeg|webp);base64,/i.test(
                  (node as HTMLElement).getAttribute("src") || "",
                )
                  ? {}
                  : false,
            },
          ];
        },
      }).configure({ allowBase64: true }),
      Placeholder.configure({ placeholder: "Start typing your report…" }),
    ],
    content: initial.draft.content,
    editable: !blocked && !readOnly && Boolean(studyUID),
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": "Report body",
        "aria-multiline": "true",
        spellcheck: "true",
      },
    },
    onUpdate: ({ editor: current }) => {
      setDraft(updateDraft(studyUID, current.getJSON()));
      setError("");
    },
  });

  useEffect(() => {
    if (!remote || !editor || initial.draft.loaded) return;
    let cancelled = false;
    setLoading(true);
    loadBackendReport(studyUID).then(report => {
      if (cancelled) return;
      editor.commands.setContent(report?.report || emptyDocument, { emitUpdate: false });
      setDraft(setRemoteDraft(studyUID, editor.getJSON(), report));
      setError("");
    }).catch(error => {
      if (cancelled) return;
      setLoadFailed(true);
      setError(error.message);
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [editor, studyUID, remote]);

  useEffect(() => {
    editor?.setEditable(!preview && !blocked && !readOnly && !saving && Boolean(studyUID), false);
  }, [editor, preview, blocked, readOnly, saving, studyUID]);

  const save = async () => {
    if (!editor || blocked || readOnly || !studyUID || savingRef.current) return;
    savingRef.current = true;
    setSaving(true);
    editor.setEditable(false, false);
    try {
      if (remote) {
        let report = draft.remoteReport;
        if (!report) {
          report = await startBackendReport(studyUID, patient.modality);
          // Preserve the created session for retry if the subsequent PATCH fails.
          if (report.report.trim()) {
            setLoadFailed(true);
            throw new Error('An existing draft was found on the server. Reopen it before saving; copy your text first.');
          }
          setDraft(rememberRemoteReport(studyUID, report));
        }
        const saved = await saveBackendReport(studyUID, report, editor.getHTML());
        setDraft(setRemoteDraft(studyUID, editor.getJSON(), saved));
      } else {
        setDraft(saveDraft(studyUID, editor.getJSON()));
      }
      setError("");
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Draft could not be saved. Your work is still open.');
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  const applyTemplate = (id: string) => {
    const content = templateDocument(id);
    if (!content || !editor || blocked || readOnly || saving) return;
    editor.chain().focus().setContent(content).run();
    setTemplateId(id);
    setPendingTemplate("");
  };
  const savedDate = draft.savedAt
    ? new Intl.DateTimeFormat(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(draft.savedAt))
    : "—";
  const fields = [
    ["Patient age", patient.age],
    ["Patient gender", patient.sex],
    ["Patient ID", patient.patientID],
    ["Patient name", patient.name],
    ["Reported at", savedDate],
    ["Reported by", reportedBy || "—"],
  ];

  return (
    <section
      className={`report-workspace ${preview ? "report-is-preview" : ""}`}
      aria-label="Study report editor"
      onKeyDown={(event) => {
        event.stopPropagation();
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === "s"
        ) {
          event.preventDefault();
          save();
        }
      }}
    >
      <header className="report-header">
        <div className="report-context">
          <div className="report-context-tag" title={patient.name}>
            <span>Patient</span>
            <strong>{patient.name}</strong>
          </div>
          <div className="report-context-tag" title={patient.modality}>
            <span>Modality</span>
            <strong>{patient.modality}</strong>
          </div>
        </div>
        <div className="report-actions">
          {!preview && !blocked && !readOnly && !saving && (
            <SelectControl
              label="Report template"
              className="report-template-select"
              value={templateId}
              onChange={(id) => {
                if (!id) return;
                if (!editor?.isEmpty) setPendingTemplate(id);
                else applyTemplate(id);
              }}
            >
              <option value="">Select template…</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label}
                </option>
              ))}
            </SelectControl>
          )}
          <button
            className="report-button"
            onClick={() => setPreview(!preview)}
            disabled={!editor || blocked || saving}
          >
            {preview ? (
              <Pencil size={14} aria-hidden="true" />
            ) : (
              <Eye size={14} aria-hidden="true" />
            )}
            {preview ? "Edit report" : "Preview"}
          </button>
          {preview && (
            <button className="report-button" onClick={() => window.print()}>
              <Printer size={14} aria-hidden="true" />
              Print
            </button>
          )}
          <button
            className="report-button report-save"
            onClick={save}
            disabled={
              !editor ||
              !studyUID ||
              blocked || readOnly || saving ||
              (!draft.dirty && Boolean(draft.savedAt))
            }
          >
            {!draft.dirty && draft.savedAt ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <Save size={14} aria-hidden="true" />
            )}
            {saving ? "Saving…" : "Save Draft"}
          </button>
        </div>
      </header>

      <div className="report-main">
        {!preview && editor && !blocked && !readOnly && !saving && (
          <EditorToolbar editor={editor} onError={setError} />
        )}
        {preview && (
          <div className="report-preview-label">
            <Eye size={15} aria-hidden="true" />
            <span>Report preview</span>
            <span>Draft · not finalized</span>
          </div>
        )}
        {pendingTemplate && (
          <div className="report-confirm" role="alert">
            <div>
              <strong>
                Replace this report with{" "}
                {templates.find((item) => item.id === pendingTemplate)?.label}?
              </strong>
              <p>
                Your current text will be replaced. You can undo this change.
              </p>
            </div>
            <button
              className="report-button"
              onClick={() => setPendingTemplate("")}
            >
              Cancel
            </button>
            <button
              className="report-button report-save"
              onClick={() => applyTemplate(pendingTemplate)}
            >
              Use template
            </button>
          </div>
        )}
        {error && (
          <div className="report-error" role="alert">
            <AlertCircle size={17} aria-hidden="true" />
            <span>{error}</span>
            {!blocked && (
              <button aria-label="Dismiss message" onClick={() => setError("")}>
                <X size={16} />
              </button>
            )}
          </div>
        )}
        <div className="report-paper-scroll">
          <article className="report-paper" aria-label="Report document">
            <dl className="report-patient-details">
              {fields.map(([label, value]) => (
                <div key={label} className="report-patient-field">
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            {!studyUID ? (
              <p className="report-empty">Open a study to start a report.</p>
            ) : (
              <EditorContent editor={editor} className="report-content" />
            )}
          </article>
        </div>
        <footer className="report-footer">
          <span
            className={draft.dirty ? "report-unsaved" : ""}
            role="status"
            aria-live="polite"
          >
            {loading ? "Loading report…" : readOnly ? "Finalized report · read-only" : draft.dirty
              ? "Unsaved changes"
              : draft.savedAt
                ? (remote ? "Saved to MediScribe" : "Saved locally")
                : "New draft"}
          </span>
          <span>{remote ? "Reports are saved to MediScribe." : "Drafts are saved in this browser only."}</span>
        </footer>
      </div>
    </section>
  );
}

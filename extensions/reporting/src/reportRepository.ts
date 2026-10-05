import type { JSONContent } from "@tiptap/core";

export type Draft = {
  content: JSONContent;
  savedAt: string | null;
  dirty: boolean;
};
const drafts = new Map<string, Draft>();
const prefix = "ohif.report-draft.v1:";
export const emptyDocument: JSONContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function getDraft(studyUID: string): Draft {
  const cached = drafts.get(studyUID);
  if (cached) return cached;
  const raw = localStorage.getItem(prefix + studyUID);
  let draft: Draft = { content: emptyDocument, savedAt: null, dirty: false };
  if (raw) {
    const saved = JSON.parse(raw);
    if (
      saved.version !== 1 ||
      saved.content?.type !== "doc" ||
      !Array.isArray(saved.content.content) ||
      typeof saved.savedAt !== "string" ||
      Number.isNaN(Date.parse(saved.savedAt))
    ) {
      throw new Error(
        "This browser’s saved draft could not be read. It has not been overwritten.",
      );
    }
    draft = { content: saved.content, savedAt: saved.savedAt, dirty: false };
  }
  drafts.set(studyUID, draft);
  return draft;
}

export function updateDraft(studyUID: string, content: JSONContent): Draft {
  const previous = drafts.get(studyUID);
  const draft = { content, savedAt: previous?.savedAt || null, dirty: true };
  drafts.set(studyUID, draft);
  return draft;
}

// Replace this storage adapter with your authenticated report API when available.
// Do not clear dirty state until persistence succeeds.
export function saveDraft(studyUID: string, content: JSONContent): Draft {
  if (!studyUID) throw new Error("Open a study before saving a report.");
  const savedAt = new Date().toISOString();
  localStorage.setItem(
    prefix + studyUID,
    JSON.stringify({ version: 1, content, savedAt }),
  );
  const draft = { content, savedAt, dirty: false };
  drafts.set(studyUID, draft);
  return draft;
}

export function hasUnsavedDrafts() {
  return [...drafts.values()].some((draft) => draft.dirty);
}

export function clearSessionDrafts() {
  drafts.clear();
}

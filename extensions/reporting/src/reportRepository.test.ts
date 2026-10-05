import {
  clearSessionDrafts,
  emptyDocument,
  getDraft,
  hasUnsavedDrafts,
  saveDraft,
  updateDraft,
} from "./reportRepository";

const content = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [{ type: "text", text: "Study-specific report" }],
    },
  ],
};
beforeEach(() => {
  localStorage.clear();
  clearSessionDrafts();
  jest.restoreAllMocks();
});

it("keeps unsaved documents isolated between studies and across editor remounts", () => {
  updateDraft("study-a", content);
  expect(getDraft("study-a").content).toEqual(content);
  expect(getDraft("study-b").content).toEqual(emptyDocument);
  expect(hasUnsavedDrafts()).toBe(true);
});

it("restores a saved document after a fresh session", () => {
  updateDraft("study-a", content);
  const saved = saveDraft("study-a", content);
  expect(saved.dirty).toBe(false);
  expect(hasUnsavedDrafts()).toBe(false);
  clearSessionDrafts();
  expect(getDraft("study-a")).toEqual(saved);
  expect(getDraft("study-b").content).toEqual(emptyDocument);
});

it("retains unsaved work if storage rejects a save", () => {
  updateDraft("study-a", content);
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("Quota exceeded");
  });
  expect(() => saveDraft("study-a", content)).toThrow("Quota exceeded");
  expect(getDraft("study-a")).toMatchObject({
    content,
    dirty: true,
    savedAt: null,
  });
});

it("does not silently overwrite a corrupt saved draft", () => {
  localStorage.setItem("ohif.report-draft.v1:study-a", "{broken");
  expect(() => getDraft("study-a")).toThrow();
  expect(localStorage.getItem("ohif.report-draft.v1:study-a")).toBe("{broken");
});

it("rejects incompatible drafts and invalid timestamps", () => {
  localStorage.setItem(
    "ohif.report-draft.v1:study-a",
    JSON.stringify({ version: 1, content, savedAt: "bad-date" }),
  );
  expect(() => getDraft("study-a")).toThrow("could not be read");
});

it("tracks unsaved work in a different study after the active study is saved", () => {
  updateDraft("study-a", content);
  updateDraft("study-b", content);
  saveDraft("study-b", content);
  expect(hasUnsavedDrafts()).toBe(true);
});

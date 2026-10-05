import { hasUnsavedDrafts } from "./reportRepository";
export { default as ReportSidebar } from "./ReportSidebar";

const beforeUnload = (event: BeforeUnloadEvent) => {
  if (hasUnsavedDrafts()) {
    event.preventDefault();
    event.returnValue = "";
  }
};
export const id = "@custom/extension-reporting";
export default {
  id,
  // Keep protecting drafts even when OHIF closes or unmounts the sidebar.
  onModeEnter() { window.addEventListener("beforeunload", beforeUnload); },
  onModeExit() { window.removeEventListener("beforeunload", beforeUnload); },
};

import React, { useEffect } from "react";
import ReportEditor from "./ReportEditor";
import useStudyDetails from "./useStudyDetails";

export default function ReportSidebar({ studyUID, hotkeysManager }) {
  const patient = useStudyDetails(studyUID);
  useEffect(() => () => hotkeysManager?.enable(), [hotkeysManager]);

  return (
    <div className="report-sidebar"
      onFocus={() => hotkeysManager?.disable()}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) hotkeysManager?.enable();
      }}>
      <ReportEditor studyUID={studyUID} patient={patient}
        reportedBy={(window as any).config?.reporting?.reportedBy} />
    </div>
  );
}

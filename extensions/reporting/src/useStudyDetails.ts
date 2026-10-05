import { useEffect, useState } from "react";
import { DicomMetadataStore, utils } from "@ohif/core";

export type StudyDetails = {
  name: string;
  patientID: string;
  age: string;
  sex: string;
  modality: string;
};
const missing = "—";

export default function useStudyDetails(studyUID: string): StudyDetails {
  const read = () => {
    const study = studyUID ? DicomMetadataStore.getStudy(studyUID) : null;
    const series = study?.series || [];
    const instance = series.find((item) => item.instances?.length)
      ?.instances?.[0];
    const data = { ...study, ...instance };
    const age = String(data.PatientAge || "");
    const ageMatch = age.match(/^(\d+)([YMWD])$/);
    const units = { Y: "years", M: "months", W: "weeks", D: "days" };
    const modalities = [
      ...new Set(series.map((item) => item.Modality).filter(Boolean)),
    ].join(", ");
    return {
      name: data.PatientName ? utils.formatPN(data.PatientName) : missing,
      patientID: data.PatientID || missing,
      age: ageMatch
        ? `${Number(ageMatch[1])} ${units[ageMatch[2]]}`
        : age || missing,
      sex:
        { M: "Male", F: "Female", O: "Other" }[data.PatientSex] ||
        data.PatientSex ||
        missing,
      modality: modalities || data.Modality || missing,
    };
  };
  const [details, setDetails] = useState<StudyDetails>(read);
  useEffect(() => {
    const refresh = () => setDetails(read());
    const subscriptions = [
      DicomMetadataStore.EVENTS.SERIES_ADDED,
      DicomMetadataStore.EVENTS.INSTANCES_ADDED,
    ].map((event) => DicomMetadataStore.subscribe(event, refresh));
    refresh();
    return () =>
      subscriptions.forEach((subscription) => subscription.unsubscribe());
  }, [studyUID]);
  return details;
}

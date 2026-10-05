import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
  within,
} from "@testing-library/react";
import ObservationPanel from "./ObservationPanel";

let mockStudies = ["panel-study-a", "panel-study-b"];
let mockRecordId = 0;
jest.mock("@ohif/ui-next", () => ({
  useImageViewer: () => ({ StudyInstanceUIDs: mockStudies }),
}));
jest.mock("./observationRepository", () => ({
  observationRepository: {
    isDemo: true,
    create: jest.fn(async (input) => ({
      ...input,
      id: `demo-${++mockRecordId}`,
      recordedAt: "2026-01-01T12:00:00Z",
    })),
  },
}));

afterEach(cleanup);

test("submits, explains demo confirmation, preserves records across panel remount, and isolates studies", async () => {
  const { unmount } = render(<ObservationPanel />);
  expect((screen.getByRole("button") as HTMLButtonElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText("New observation"), {
    target: { value: "Synthetic test finding" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Submit observation" }));
  await waitFor(() =>
    expect(screen.getByRole("status").textContent).toContain(
      "Observation recorded",
    ),
  );
  expect(screen.getByRole("status").textContent).toContain(
    "Not saved to a database",
  );
  expect(
    (screen.getByLabelText("New observation") as HTMLTextAreaElement).value,
  ).toBe("");
  fireEvent.change(screen.getByLabelText("Study to record against"), {
    target: { value: "panel-study-b" },
  });
  expect(screen.queryByText("Synthetic test finding")).toBeNull();
  fireEvent.change(screen.getByLabelText("New observation"), {
    target: { value: "Draft B" },
  });
  fireEvent.change(screen.getByLabelText("Study to record against"), {
    target: { value: "panel-study-a" },
  });
  expect(screen.getByText("Synthetic test finding")).toBeTruthy();
  unmount();
  render(<ObservationPanel />);
  expect(screen.getByText("Synthetic test finding")).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Study to record against"), {
    target: { value: "panel-study-b" },
  });
  expect(
    (screen.getByLabelText("New observation") as HTMLTextAreaElement).value,
  ).toBe("Draft B");
});

test("shows an empty state without a study", () => {
  mockStudies = [];
  render(<ObservationPanel />);
  expect(
    screen.getByText("Open a study to write an observation."),
  ).toBeTruthy();
  expect(screen.queryByRole("textbox")).toBeNull();
});

test("lists every submitted observation newest first with a total and keeps earlier entries", async () => {
  mockStudies = ["multiple-observations-study"];
  render(<ObservationPanel />);
  for (const text of ["First finding", "Second finding", "Third finding"]) {
    fireEvent.change(screen.getByLabelText("New observation"), {
      target: { value: text },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit observation" }));
    await waitFor(() => expect(screen.getByText(text)).toBeTruthy());
  }
  expect(
    screen.getByRole("heading", { name: "Session observations (3)" }),
  ).toBeTruthy();
  const list = screen.getByRole("list", {
    name: "All observations for this study",
  });
  const entries = within(list).getAllByRole("listitem");
  expect(entries).toHaveLength(3);
  expect(entries.map((entry) => entry.querySelector("p")!.textContent)).toEqual(
    ["Third finding", "Second finding", "First finding"],
  );
  expect(within(entries[0]).getByText("Observation 3")).toBeTruthy();
  expect(within(entries[2]).getByText("Observation 1")).toBeTruthy();
  expect(
    within(list).getAllByText("Observation", { exact: false }),
  ).toHaveLength(3);
});


test("opens reports inside the sidebar, shares the selected study, and retains the mounted report", () => {
  mockStudies = ["sidebar-study-a", "sidebar-study-b"];
  const Report = ({ studyUID }) => <input aria-label="Sidebar report" defaultValue={studyUID} />;
  render(<ObservationPanel ReportComponent={Report} />);
  fireEvent.change(screen.getByLabelText("New observation"), { target: { value: "Keep my note" } });
  fireEvent.click(screen.getByRole("button", { name: "Report", exact: true }));
  const report = screen.getByLabelText("Sidebar report") as HTMLInputElement;
  expect(report.value).toBe("sidebar-study-a");
  expect(report.closest(".observations-sidebar")).toBeTruthy();
  fireEvent.change(report, { target: { value: "Keep my report" } });
  fireEvent.click(screen.getByRole("button", { name: "Observations", exact: true }));
  expect((screen.getByLabelText("New observation") as HTMLTextAreaElement).value).toBe("Keep my note");
  fireEvent.click(screen.getByRole("button", { name: "Report", exact: true }));
  expect(screen.getByLabelText("Sidebar report")).toBe(report);
  expect(report.value).toBe("Keep my report");
  fireEvent.change(screen.getByLabelText("Study to record against"), { target: { value: "sidebar-study-b" } });
  expect((screen.getByLabelText("Sidebar report") as HTMLInputElement).value).toBe("sidebar-study-b");
});

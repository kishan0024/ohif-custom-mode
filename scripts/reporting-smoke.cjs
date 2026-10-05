/* Run against the development viewer with a running Orthanc and at least one study. */
const { chromium, expect } = require("@playwright/test");
const fs = require("node:fs");
const path = require("node:path");

(async () => {
  const origin = process.env.REPORTING_TEST_ORIGIN || "http://localhost:3006";
  const out = path.resolve(__dirname, "../.impeccable/review");
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath: "/usr/bin/google-chrome",
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();
  const errors = [];
  const failedRequests = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("requestfailed", (request) =>
    failedRequests.push({
      url: request.url(),
      error: request.failure()?.errorText,
    }),
  );
  page.on("console", (message) => {
    if (message.type() === "error")
      console.log("BROWSER:", message.text().slice(0, 500));
  });
  try {
    const studiesResponse = await context.request.get(
      `${origin}/pacs/dicom-web/studies?limit=1`,
    );
    if (!studiesResponse.ok())
      throw new Error(
        `DICOM studies request failed: ${studiesResponse.status()}`,
      );
    const studies = await studiesResponse.json();
    const uid = studies[0]?.["0020000D"]?.Value?.[0];
    if (!uid)
      throw new Error("No study available in Orthanc for integration testing.");
    await page.goto(origin, { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.locator('[data-cy^="studyRow-"] [data-cy]').first().click({ timeout: 60000 });
    await expect(page.getByRole("button", { name: "Basic Viewer", exact: true }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Observation Viewer", exact: true }).first()).toBeVisible();
    const url = `${origin}/observations?StudyInstanceUIDs=${encodeURIComponent(uid)}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
    await expect(page.getByLabel("New observation")).toBeVisible({ timeout: 120000 });
    await page.getByRole("button", { name: "Report", exact: true }).click();
    const body = page.getByRole("textbox", { name: "Report body" });
    await expect(body).toBeVisible({ timeout: 120000 });
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 30000 });
    const loadedModeIds = await page.evaluate(() => window.modes);
    const plugins = JSON.parse(fs.readFileSync(path.resolve(__dirname,
      "../../Radiologist-ohif-viewer/platform/app/pluginConfig.json"), "utf8"));
    for (const mode of plugins.modes.filter(mode => mode.default !== false)) {
      expect(loadedModeIds).toContain(mode.packageName || mode);
    }
    expect(new Set(loadedModeIds).size).toBe(loadedModeIds.length);
    console.log("Registered default modes:", loadedModeIds.join(", "));
    const sidebarBounds = await page.locator(".report-sidebar").boundingBox();
    expect(sidebarBounds.width).toBeLessThan(600);
    expect(sidebarBounds.x).toBeGreaterThan(700);
    await expect(page.locator(".report-overlay,.report-launcher")).toHaveCount(0);
    await expect(page.locator(".report-context-tag").first()).not.toHaveText(
      "Patient—",
      { timeout: 30000 },
    );
    await expect(page.getByRole("status")).toHaveText("New draft");
    await page.screenshot({ path: `${out}/desktop.png`, fullPage: true });
    await page.setViewportSize({ width: 1299, height: 850 });
    await page.screenshot({ path: `${out}/user-1299.png`, fullPage: true });
    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth > innerWidth ||
        [
          ...document.querySelectorAll(
            ".report-header,.report-toolbar,.report-patient-details",
          ),
        ].some((element) => element.scrollWidth > element.clientWidth + 1),
    );
    expect(overflow).toBe(false);
    await page.setViewportSize({ width: 1440, height: 900 });

    await body.fill("Synthetic test report.");
    await body.press("Control+a");
    await page.getByRole("button", { name: "Bold", exact: true }).click();
    await expect(body.locator("strong")).toHaveText("Synthetic test report.");
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(body.locator("strong")).toHaveCount(0);
    await page.getByRole("button", { name: "Redo", exact: true }).click();
    await expect(body.locator("strong")).toHaveCount(1);
    await page.getByLabel("Font family").selectOption("Georgia");
    await page.getByLabel("Font size").selectOption("20px");
    await expect(body.locator('span[style*="font-size: 20px"]')).toHaveCount(1);
    await page.getByRole("button", { name: "Save Draft" }).click();
    await expect(page.getByRole("status")).toHaveText("Saved locally");
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Report", exact: true }).click();
    await expect(body).toHaveText("Synthetic test report.", { timeout: 60000 });

    await page.getByRole("button", { name: "Observations", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Report", exact: true }),
    ).toBeVisible();
    await expect(
      page.locator("canvas").first(),
    ).toBeVisible({ timeout: 30000 });
    await expect(page.getByLabel("New observation")).toBeVisible();
    await page.getByRole("button", { name: "Report", exact: true }).click();
    await expect(body).toHaveText("Synthetic test report.");

    await page.getByRole("button", { name: "Preview", exact: true }).click();
    await expect(body).toHaveAttribute("contenteditable", "false");
    await expect(
      page.getByRole("toolbar", { name: "Report formatting" }),
    ).toHaveCount(0);
    await expect(page.getByRole("status")).toHaveText("Saved locally");
    await page.getByRole("button", { name: "Edit report" }).click();
    await page.getByLabel("Report template").selectOption("chest");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(body).toHaveText("Synthetic test report.");
    await page.getByLabel("Report template").selectOption("chest");
    await page.getByRole("button", { name: "Use template" }).click();
    await expect(body.locator("h2")).toHaveText([
      "Clinical indication",
      "Comparison",
      "Findings",
      "Impression",
    ]);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(body).toHaveText("Synthetic test report.");
    await body.press("Control+End");
    await body.press("Enter");
    await page
      .getByRole("button", { name: "Insert table", exact: true })
      .click();
    await page
      .getByRole("button", { name: "2 × 2 table", exact: true })
      .click();
    await expect(body.locator("table")).toHaveCount(1);
    await page
      .getByRole("button", { name: "Table options", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Add row below", exact: true })
      .click();
    await expect(body.locator("tr")).toHaveCount(3);
    await page.getByRole("button", { name: "Save Draft" }).click();
    await page.screenshot({ path: `${out}/edited-report.png`, fullPage: true });
    await page.evaluate(() => {
      Storage.prototype.setItem = () => {
        throw new Error("Test storage failure");
      };
    });
    await body.press("Control+End");
    await page.keyboard.type("Unsaved test");
    await page.getByRole("button", { name: "Save Draft" }).click();
    await expect(page.getByRole("alert")).toContainText("Draft not saved");
    await expect(page.getByRole("status")).toHaveText("Unsaved changes");
    expect(errors).toEqual([]);
    // OHIF cancels in-flight frame requests during the intentional reload above.
    expect(failedRequests.filter(request => request.error !== "net::ERR_ABORTED")).toEqual([]);
    console.log(`Cancelled image requests during navigation: ${failedRequests.length}`);
    console.log(
      JSON.stringify({
        passed: true,
        checks: [
          "OHIF route and metadata",
          "all default mode registrations retained without duplicates",
          "responsive overflow",
          "bold/undo/redo",
          "font and size",
          "save/reload",
          "sidebar report with visible image viewport",
          "observations/report switching",
          "read-only preview",
          "template confirmation and undo",
          "table insert and row editing",
          "storage failure retains dirty work",
        ],
        screenshots: out,
      }),
    );
  } catch (error) {
    await page
      .screenshot({ path: `${out}/failure.png`, fullPage: true })
      .catch(() => {});
    console.error("PAGE ERRORS:", errors);
    throw error;
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

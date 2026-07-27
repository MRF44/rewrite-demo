"use client";

/* eslint-disable @next/next/no-img-element -- evidence screenshots are already optimized, immutable source artifacts */

import { useEffect, useMemo, useState } from "react";

type Classification = "Keep" | "Adapt" | "Remove" | "Review";
type EvidenceKind = "confirmed" | "inference";

type Evidence = {
  id: string;
  kind: EvidenceKind;
  label: string;
  path: string;
  lines: string;
  excerpt: string;
  explains: string;
};

type Decision = {
  id: string;
  title: string;
  summary: string;
  before: string;
  after: string;
  defaultStatus: Classification;
  evidence: string[];
};

const originalRewrite =
  "RevSync is planning-only for every supported country. It may estimate a user-controlled set-aside and schedule personal money check-ins, but it must not infer legal obligations, official deadlines, filings, forms, or tax payments without verified authority, current coverage, and user-specific applicability.";

const evidenceCatalog: Record<string, Evidence> = {
  beforeCadence: {
    id: "beforeCadence",
    kind: "confirmed",
    label: "US tax cadence",
    path: "Before/outputs/app.js",
    lines: "45–62",
    excerpt:
      'COUNTRY_TAX_CADENCES.US defines “us-estimated-tax-quarterly” with Apr 15, Jun 15, Sep 15, and Jan 15 due dates.',
    explains:
      "The Before version had dedicated official-style date logic for the United States.",
  },
  beforeSurface: {
    id: "beforeSurface",
    kind: "confirmed",
    label: "Obligation UI",
    path: "Before/outputs/index.html",
    lines: "54",
    excerpt:
      'The tax page contains “Your tax deadlines”, “Actual vs. estimated”, “Mark as paid”, and a tax-form map.',
    explains:
      "The previous product presented deadlines and payment-state actions, not just a savings plan.",
  },
  beforeTests: {
    id: "beforeTests",
    kind: "confirmed",
    label: "Payment contract",
    path: "Before/work/test-tax-periods.js",
    lines: "30–60",
    excerpt:
      "Tests require a stored payment amount, frozen estimate, applied rate, overdue status, and the configured US due-date months.",
    explains:
      "The obligation behavior was part of the tested product contract.",
  },
  capabilityAudit: {
    id: "capabilityAudit",
    kind: "confirmed",
    label: "Planning-only gate",
    path: "After/outputs/app.js",
    lines: "45–60",
    excerpt:
      'Every real country is assigned capability: “planning_only”; official logic, authority, coverage, and applicability are null or false.',
    explains:
      "The After version makes planning-only the explicit default for all 30 supported countries.",
  },
  languageRewrite: {
    id: "languageRewrite",
    kind: "confirmed",
    label: "Language rewrite",
    path: "After/outputs/app.js",
    lines: "795–805",
    excerpt:
      '“Your tax deadlines” becomes “Your next money check-in”; the copy explicitly says it is not an official tax deadline.',
    explains:
      "The product language now avoids a filing, deadline, payment-due, or confirmed-liability claim.",
  },
  planningFlow: {
    id: "planningFlow",
    kind: "confirmed",
    label: "Check-in flow",
    path: "After/outputs/app.js",
    lines: "1127–1194",
    excerpt:
      "The flow records savings entries, summarizes a planning period, and completes a check-in without creating a payment.",
    explains:
      "The behavioral replacement is a personal planning habit, not a renamed tax payment.",
  },
  planningMarkup: {
    id: "planningMarkup",
    kind: "confirmed",
    label: "Planning UI",
    path: "After/outputs/index.html",
    lines: "365–425, 659–673",
    excerpt:
      "The page adds a personal-schedule clarification, previous check-ins, and a Complete check-in modal.",
    explains:
      "The After interface exposes the new planning workflow.",
  },
  cadenceSettings: {
    id: "cadenceSettings",
    kind: "confirmed",
    label: "User cadence",
    path: "After/outputs/index.html",
    lines: "481–496",
    excerpt:
      "Settings add Monthly, Every three months, and Custom check-in cadence controls.",
    explains:
      "A user-selected rhythm replaces a fixed official schedule.",
  },
  migration: {
    id: "migration",
    kind: "confirmed",
    label: "Conservative migration",
    path: "After/outputs/app.js",
    lines: "139–226",
    excerpt:
      "Old payment-shaped records become legacy_user_record entries with needsReview: true; savings are preserved as savings_entry records.",
    explains:
      "Historical user data remains available without being re-certified as an official tax payment.",
  },
  invariantTests: {
    id: "invariantTests",
    kind: "confirmed",
    label: "30-country invariant",
    path: "After/work/test-planning-only.js",
    lines: "24–40, 138–148",
    excerpt:
      "Tests assert that all 30 countries stay planning-only, no official surface renders, and legacy entries are never promoted to payments.",
    explains:
      "The new boundary is enforced as a product invariant.",
  },
  unchangedCore: {
    id: "unchangedCore",
    kind: "confirmed",
    label: "Unchanged integration spec",
    path: "Before + After/PLATFORM_INTEGRATIONS.md",
    lines: "entire file",
    excerpt:
      "The two copies are byte-for-byte identical at 22,477 bytes. Package metadata, preview servers, CSV fixtures, and icons are also unchanged.",
    explains:
      "The rewrite did not replace the platform-income foundation.",
  },
  unresolvedPromise: {
    id: "unresolvedPromise",
    kind: "confirmed",
    label: "Open wording",
    path: "After/outputs/index.html",
    lines: "13, 31–35, 157–160",
    excerpt:
      'The After snapshot still says “Know what you owe” and keeps the “Tax set-aside” navigation label.',
    explains:
      "These surviving labels conflict with the stricter planning-only boundary and need a conscious product decision.",
  },
  centralInference: {
    id: "centralInference",
    kind: "inference",
    label: "Central decision",
    path: "Synthesis of both snapshots",
    lines: "not a historical record",
    excerpt:
      "The product moved from country-dependent obligation behavior to a universal planning-only contract.",
    explains:
      "This is a high-confidence interpretation of the code, copy, UI, migration, and tests—not a quoted roadmap entry.",
  },
};

const timeline = [
  {
    id: "old",
    number: "01",
    eyebrow: "Before snapshot",
    title: "Model obligations from country context",
    note: "Selected decision",
    kind: "inference" as EvidenceKind,
    selectedLabel: "Selected old decision",
    phase: "before",
    phaseLabel: "Before",
    statement:
      "Use a creator’s country and earnings to produce tax deadlines, payment states, and filing guidance where RevSync has a configured cadence.",
    consequenceLabel: "Observed consequence",
    consequence:
      "The US path rendered due dates, overdue states, “Mark as paid,” and platform tax-form guidance.",
    evidence: ["beforeCadence", "beforeSurface", "beforeTests", "centralInference"],
  },
  {
    id: "boundary",
    number: "02",
    eyebrow: "Rewrite boundary",
    title: "Require verified authority and applicability",
    note: "Dependency rule",
    kind: "confirmed" as EvidenceKind,
    selectedLabel: "Selected boundary",
    phase: "after",
    phaseLabel: "After",
    statement:
      "Render an official surface only when authority, tax-year coverage, current sources, and user-specific applicability are all verified.",
    consequenceLabel: "Product safeguard",
    consequence:
      "A country name, currency, or generic cadence can no longer activate official tax behavior.",
    evidence: ["capabilityAudit"],
  },
  {
    id: "rewrite",
    number: "03",
    eyebrow: "After snapshot",
    title: "Make every real country planning-only",
    note: "Central rewrite",
    kind: "confirmed" as EvidenceKind,
    selectedLabel: "Selected rewritten decision",
    phase: "after",
    phaseLabel: "After",
    statement:
      "Every selectable RevSync country uses planning_only capability until a complete verified-official module exists.",
    consequenceLabel: "Confirmed scope",
    consequence:
      "All 30 supported countries receive personal planning periods with no legal due-date field.",
    evidence: ["capabilityAudit", "invariantTests"],
  },
  {
    id: "experience",
    number: "04",
    eyebrow: "Downstream",
    title: "Replace payments with personal check-ins",
    note: "Experience change",
    kind: "confirmed" as EvidenceKind,
    selectedLabel: "Selected adapted decision",
    phase: "adapted",
    phaseLabel: "Adapt",
    statement:
      "Turn the tax page into a personal planning schedule with savings transfers, review dates, and completed check-ins.",
    consequenceLabel: "Flow change",
    consequence:
      "Completing a check-in records a review, never an official payment.",
    evidence: ["languageRewrite", "planningFlow", "planningMarkup"],
  },
  {
    id: "history",
    number: "05",
    eyebrow: "Migration",
    title: "Keep old records, withdraw their authority",
    note: "Data safeguard",
    kind: "confirmed" as EvidenceKind,
    selectedLabel: "Selected migration decision",
    phase: "migration",
    phaseLabel: "Migrate",
    statement:
      "Preserve payment-shaped history as reviewable user records without treating it as a verified tax payment.",
    consequenceLabel: "Migration behavior",
    consequence:
      "Amounts, estimates, savings, and timestamps survive while legal meaning is explicitly withdrawn.",
    evidence: ["migration", "invariantTests"],
  },
];

const decisions: Decision[] = [
  {
    id: "overview",
    title: "Creator-income overview",
    summary: "Total earned, reporting periods, source chart, and forecast.",
    before: "One calm view of creator income",
    after: "Same core overview and terminology",
    defaultStatus: "Keep",
    evidence: ["unchangedCore"],
  },
  {
    id: "sources",
    title: "Connected platforms",
    summary: "Sync state, CSV imports, history, alerts, and data controls.",
    before: "Platform-income foundation",
    after: "Preserved through the rewrite",
    defaultStatus: "Keep",
    evidence: ["unchangedCore"],
  },
  {
    id: "localization",
    title: "Localization and themes",
    summary: "English, Spanish, Portuguese, responsive light and dark views.",
    before: "Supported product system",
    after: "Preserved and tested in planning screens",
    defaultStatus: "Keep",
    evidence: ["invariantTests"],
  },
  {
    id: "estimate",
    title: "Set-aside estimate",
    summary: "The familiar percentage remains, but its meaning is narrowed.",
    before: "Tax rate and estimated obligation",
    after: "User-controlled planning percentage",
    defaultStatus: "Adapt",
    evidence: ["languageRewrite", "planningFlow"],
  },
  {
    id: "country",
    title: "Country context",
    summary: "Country still organizes records without creating legal claims.",
    before: "Could select official tax cadence",
    after: "Planning context only",
    defaultStatus: "Adapt",
    evidence: ["beforeCadence", "capabilityAudit"],
  },
  {
    id: "summary",
    title: "Printable summary",
    summary: "The export remains useful, with a safer purpose and disclaimer.",
    before: "Print tax summary",
    after: "Print planning summary",
    defaultStatus: "Adapt",
    evidence: ["languageRewrite"],
  },
  {
    id: "deadlines",
    title: "Official deadlines and payment actions",
    summary: "Due, overdue, Mark as paid, and Edit payment record.",
    before: "Prominent action model",
    after: "No official surface for any real country",
    defaultStatus: "Remove",
    evidence: ["beforeSurface", "beforeTests", "invariantTests"],
  },
  {
    id: "forms",
    title: "Tax-form map",
    summary: "Platform-specific 1099 guidance and filing implications.",
    before: "Visible for the US tax context",
    after: "Capability-gated off; absent from the page",
    defaultStatus: "Remove",
    evidence: ["beforeSurface", "capabilityAudit", "invariantTests"],
  },
  {
    id: "legacy",
    title: "Previously recorded payments",
    summary: "User history is valuable, but its legal meaning is not verified.",
    before: "Official-shaped payment records",
    after: "Legacy records, preserved and flagged for review",
    defaultStatus: "Review",
    evidence: ["migration", "invariantTests"],
  },
  {
    id: "promise",
    title: "Promise and navigation labels",
    summary: "“Know what you owe” and “Tax set-aside” remain in the After snapshot.",
    before: "Matched the obligation model",
    after: "Potentially conflicts with planning-only",
    defaultStatus: "Review",
    evidence: ["unresolvedPromise"],
  },
];

const statusOrder: Classification[] = ["Keep", "Adapt", "Remove", "Review"];

const statusDescriptions: Record<Classification, string> = {
  Keep: "Works without changing its meaning",
  Adapt: "Useful, but meaning or flow must change",
  Remove: "Conflicts with the rewritten decision",
  Review: "Evidence is incomplete or the product choice is unresolved",
};

const comparisonRows = {
  changed: [
    ["Primary promise", "Set aside with less second-guessing", "Plan with less second-guessing"],
    ["Schedule", "Your tax deadlines", "Your next money check-in"],
    ["State", "Paid · Overdue · Upcoming", "Reviewed · Review pending"],
    ["Action", "Mark as paid", "Complete check-in"],
    ["Evidence object", "Actual payment", "Savings moved + review completed"],
  ],
  preserved: [
    ["Overview", "Total earned", "Total earned"],
    ["Sources", "Connected platforms", "Connected platforms"],
    ["Reporting", "Month · Quarter · Year", "Month · Quarter · Year"],
    ["Ritual", "Monday digest", "Monday digest"],
    ["Controls", "Export · Logout · Delete", "Export · Logout · Delete"],
  ],
};

const fileImpact = [
  {
    group: "Changed",
    detail: "Product logic, interface, styling, and existing QA",
    files:
      "outputs/app.js · outputs/index.html · outputs/styles.css · test-ui.js · work/test-tax-periods.js",
  },
  {
    group: "Added",
    detail: "Planning invariants and contract coverage",
    files:
      "work/test-planning-only.js · work/test-localization-contract.js · work/test-final-critical.js · planning QA screenshots",
  },
  {
    group: "Unchanged",
    detail: "The platform-income foundation",
    files:
      "PLATFORM_INTEGRATIONS.md · package.json · preview servers · CSV fixtures · icons",
  },
];

function kindLabel(kind: EvidenceKind) {
  return kind === "confirmed" ? "Confirmed" : "Inference";
}

function initialAssignments() {
  return Object.fromEntries(
    decisions.map((decision) => [decision.id, decision.defaultStatus]),
  ) as Record<string, Classification>;
}

export default function Home() {
  const [activeTimeline, setActiveTimeline] = useState("old");
  const [rewriteText, setRewriteText] = useState(originalRewrite);
  const [assignments, setAssignments] =
    useState<Record<string, Classification>>(initialAssignments);
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const [comparison, setComparison] = useState<"changed" | "preserved">("changed");
  const [savedVersion, setSavedVersion] = useState(0);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let restoreTimer: number | undefined;
    try {
      const stored = localStorage.getItem("rewrite-revsync-session");
      if (!stored) return;
      const parsed = JSON.parse(stored) as {
        rewriteText?: string;
        assignments?: Record<string, Classification>;
        savedVersion?: number;
      };
      restoreTimer = window.setTimeout(() => {
        if (parsed.rewriteText) setRewriteText(parsed.rewriteText);
        if (parsed.assignments) {
          setAssignments({ ...initialAssignments(), ...parsed.assignments });
        }
        if (parsed.savedVersion) setSavedVersion(parsed.savedVersion);
      }, 0);
    } catch {
      // A corrupt local draft should never block the evidence workspace.
    }
    return () => {
      if (restoreTimer !== undefined) window.clearTimeout(restoreTimer);
    };
  }, []);

  useEffect(() => {
    if (!evidenceId) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setEvidenceId(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [evidenceId]);

  const grouped = useMemo(
    () =>
      Object.fromEntries(
        statusOrder.map((status) => [
          status,
          decisions.filter((decision) => assignments[decision.id] === status),
        ]),
      ) as Record<Classification, Decision[]>,
    [assignments],
  );

  const active = timeline.find((item) => item.id === activeTimeline) ?? timeline[0];
  const selectedEvidence = evidenceId ? evidenceCatalog[evidenceId] : null;

  function persistSession(
    nextAssignments = assignments,
    nextText = rewriteText,
    nextVersion = savedVersion,
  ) {
    localStorage.setItem(
      "rewrite-revsync-session",
      JSON.stringify({
        rewriteText: nextText,
        assignments: nextAssignments,
        savedVersion: nextVersion,
      }),
    );
  }

  function classify(id: string, status: Classification) {
    const next = { ...assignments, [id]: status };
    setAssignments(next);
    persistSession(next);
    setNotice(`${decisions.find((item) => item.id === id)?.title} → ${status}`);
    window.setTimeout(() => setNotice(""), 1800);
  }

  function saveRewrite() {
    const nextVersion = savedVersion + 1;
    setSavedVersion(nextVersion);
    persistSession(assignments, rewriteText, nextVersion);
    setNotice(`Rewrite v${nextVersion} saved to this browser`);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function resetDraft() {
    setRewriteText(originalRewrite);
    setAssignments(initialAssignments());
    setSavedVersion(0);
    localStorage.removeItem("rewrite-revsync-session");
    setNotice("Draft reset to the evidence-backed baseline");
    window.setTimeout(() => setNotice(""), 2200);
  }

  function openFirstEvidence(ids: string[]) {
    if (ids[0]) setEvidenceId(ids[0]);
  }

  function buildReport() {
    const section = (status: Classification) =>
      grouped[status]
        .map(
          (decision) =>
            `- ${decision.title}: ${decision.after} (${decision.evidence
              .map((id) => evidenceCatalog[id].path)
              .join("; ")})`,
        )
        .join("\n");
    return `# Rewrite report — RevSync

## Rewritten decision

${rewriteText}

## Confirmed scope

- Before contained configured US estimated-tax dates, payment records, overdue states, and tax-form guidance.
- After assigns every selectable country a planning_only capability and blocks official surfaces.
- Snapshot folders do not establish author, date, rationale, or an intermediate decision history.

## Preserved

${section("Keep")}

## Adapted

${section("Adapt")}

## Removed

${section("Remove")}

## Review

${section("Review")}

## Migrated

- payment-shaped taxLedger records → legacy_user_record entries with needsReview: true
- taxLogs quarter rows → planning_checkin records
- savings arrays → typed savings_entry records scoped to a planning period
- dueDate semantics → reviewDate semantics
- profile → adds timeZone, planningCadence, and planningCustomMonths

## Affected files and flows

- Changed: outputs/app.js, outputs/index.html, outputs/styles.css, test-ui.js, work/test-tax-periods.js
- Added: work/test-planning-only.js, work/test-localization-contract.js, work/test-final-critical.js
- Flows: profile load/migration, country selection, set-aside page, settings cadence, planning check-in, print summary, localization, and QA
`;
  }

  function downloadReport() {
    const blob = new Blob([buildReport()], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "revsync-rewrite-report.md";
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Report downloaded");
    window.setTimeout(() => setNotice(""), 1800);
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="Rewrite home">
          <span className="brand-glyph" aria-hidden="true">
            R/
          </span>
          <span>rewrite</span>
        </a>
        <div className="case-switcher" aria-label="Current case">
          <span className="case-dot" />
          <span>Case 01</span>
          <strong>RevSync</strong>
        </div>
        <div className="topbar-meta">
          <span>2 source snapshots</span>
          <span className="evidence-lock">Evidence locked</span>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="kicker">Product decision workspace</p>
          <h1>
            Change one decision.
            <br />
            See everything it <em>changes.</em>
          </h1>
          <p className="hero-intro">
            Rewrite turns a product pivot into a traceable plan. This case follows
            RevSync from tax-obligation behavior to planning-only software—without
            losing the parts users already rely on.
          </p>
        </div>
        <aside className="hero-summary" aria-label="Case summary">
          <span className="summary-index">01</span>
          <div>
            <p>Central rewrite</p>
            <strong>Obligation → planning</strong>
          </div>
          <div>
            <p>Evidence base</p>
            <strong>Before / After</strong>
          </div>
          <div>
            <p>History confidence</p>
            <strong>Snapshots only</strong>
          </div>
        </aside>
      </section>

      <section className="workspace" aria-label="Decision rewrite workspace">
        <aside className="timeline-panel">
          <div className="panel-heading">
            <p className="kicker">Decision timeline</p>
            <span>Evidence sequence</span>
          </div>
          <p className="timeline-caveat">
            No dates were invented. Order follows product dependencies visible in
            the two snapshots.
          </p>
          <nav className="timeline" aria-label="RevSync decision sequence">
            {timeline.map((item, index) => (
              <button
                className={`timeline-item ${
                  activeTimeline === item.id ? "is-active" : ""
                }`}
                key={item.id}
                onClick={() => setActiveTimeline(item.id)}
                aria-pressed={activeTimeline === item.id}
              >
                <span className="timeline-number">{item.number}</span>
                <span className="timeline-copy">
                  <small>{item.eyebrow}</small>
                  <strong>{item.title}</strong>
                  <span>{item.note}</span>
                </span>
                {index < timeline.length - 1 && (
                  <span className="timeline-line" aria-hidden="true" />
                )}
              </button>
            ))}
          </nav>
          <div className="timeline-legend">
            <span className="evidence-badge confirmed">Confirmed</span>
            <span className="evidence-badge inference">Inference</span>
          </div>
        </aside>

        <div className="editor-panel">
          <div className="editor-toolbar">
            <div>
              <span className="section-number">Decision {active.number}</span>
              <span className={`evidence-badge ${active.kind}`}>
                {kindLabel(active.kind)}
              </span>
            </div>
            <button
              className="evidence-link"
              onClick={() => openFirstEvidence(active.evidence)}
            >
              View source evidence
            </button>
          </div>

          <div className="selected-decision">
            <div className="selected-label">
              <span>{active.selectedLabel}</span>
              <span className={`phase-chip ${active.phase}`}>
                {active.phaseLabel}
              </span>
            </div>
            <blockquote>{active.statement}</blockquote>
            <p>
              <strong>{active.consequenceLabel}:</strong> {active.consequence}
            </p>
          </div>

          <label className="rewrite-field" htmlFor="rewriteDecision">
            <span>Rewrite the decision</span>
            <textarea
              id="rewriteDecision"
              value={rewriteText}
              onChange={(event) => setRewriteText(event.target.value)}
              rows={7}
            />
          </label>

          <div className="editor-actions">
            <div className="editor-status">
              <span className="status-light" />
              {savedVersion ? `Rewrite v${savedVersion} saved` : "Unsaved baseline"}
            </div>
            <button className="text-action" onClick={resetDraft}>
              Reset
            </button>
            <button className="primary-action" onClick={saveRewrite}>
              Save rewrite <span aria-hidden="true">↗</span>
            </button>
          </div>

          <div className="boundary-note">
            <span>Product boundary</span>
            <p>
              Official behavior can return later—but only behind verified authority,
              tax-year coverage, current sources, and user-specific applicability.
            </p>
          </div>
        </div>
      </section>

      <section className="decision-section" id="classify">
        <div className="section-heading-wide">
          <div>
            <p className="kicker">Downstream decisions</p>
            <h2>Classify what the rewrite touches.</h2>
          </div>
          <p>
            Defaults reflect the source evidence. Change any classification to see
            the final report update.
          </p>
        </div>

        <div className="classification-legend" aria-label="Classification meanings">
          {statusOrder.map((status) => (
            <div key={status}>
              <span className={`status-mark ${status.toLowerCase()}`} />
              <strong>{status}</strong>
              <span>{statusDescriptions[status]}</span>
            </div>
          ))}
        </div>

        <div className="decision-list">
          {decisions.map((decision, index) => (
            <article className="decision-row" key={decision.id}>
              <span className="decision-index">{String(index + 1).padStart(2, "0")}</span>
              <div className="decision-main">
                <div>
                  <h3>{decision.title}</h3>
                  <p>{decision.summary}</p>
                </div>
                <button
                  className="source-count"
                  onClick={() => openFirstEvidence(decision.evidence)}
                  aria-label={`Open evidence for ${decision.title}`}
                >
                  {decision.evidence.length} source
                  {decision.evidence.length === 1 ? "" : "s"}
                </button>
              </div>
              <div className="decision-transition">
                <span>{decision.before}</span>
                <span className="transition-arrow" aria-hidden="true">
                  →
                </span>
                <strong>{decision.after}</strong>
              </div>
              <div className="classification-control" role="group" aria-label={`Classify ${decision.title}`}>
                {statusOrder.map((status) => (
                  <button
                    key={status}
                    className={
                      assignments[decision.id] === status
                        ? `selected ${status.toLowerCase()}`
                        : ""
                    }
                    aria-pressed={assignments[decision.id] === status}
                    onClick={() => classify(decision.id, status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="comparison-section" id="compare">
        <div className="section-heading-wide">
          <div>
            <p className="kicker">Before vs After</p>
            <h2>Same calm product. Safer promise.</h2>
          </div>
          <div className="view-tabs" role="tablist" aria-label="Comparison view">
            <button
              role="tab"
              aria-selected={comparison === "changed"}
              className={comparison === "changed" ? "active" : ""}
              onClick={() => setComparison("changed")}
            >
              Changed surface
            </button>
            <button
              role="tab"
              aria-selected={comparison === "preserved"}
              className={comparison === "preserved" ? "active" : ""}
              onClick={() => setComparison("preserved")}
            >
              Preserved surface
            </button>
          </div>
        </div>

        <div className="visual-compare">
          <figure>
            <div className="image-label">
              <span>Before</span>
              <strong>
                {comparison === "changed"
                  ? "Obligation surface"
                  : "Creator-income overview"}
              </strong>
            </div>
            <div className="screenshot-frame">
              <img
                src={
                  comparison === "changed"
                    ? "/evidence/before-tax-obligations.png"
                    : "/evidence/before-overview.png"
                }
                alt={
                  comparison === "changed"
                    ? "RevSync Before tax page with deadlines, overdue states, and payment actions"
                    : "RevSync Before creator-income overview"
                }
              />
            </div>
            <figcaption>
              <span className="evidence-badge confirmed">Confirmed</span>
              <code>
                {comparison === "changed"
                  ? "Before/work/qa-screenshots/light-tax-actual-vs-estimated.png"
                  : "Before/outputs/qa-overview-light.png"}
              </code>
            </figcaption>
          </figure>

          <div className="compare-divider" aria-hidden="true">
            <span>→</span>
          </div>

          <figure>
            <div className="image-label">
              <span>After</span>
              <strong>
                {comparison === "changed"
                  ? "Planning-only surface"
                  : "Creator-income overview"}
              </strong>
            </div>
            <div className="screenshot-frame">
              <img
                src={
                  comparison === "changed"
                    ? "/evidence/after-planning-only.png"
                    : "/evidence/after-overview.png"
                }
                alt={
                  comparison === "changed"
                    ? "RevSync After planning page with personal check-in and savings transfer"
                    : "RevSync After creator-income overview"
                }
              />
            </div>
            <figcaption>
              <span className="evidence-badge confirmed">Confirmed</span>
              <code>
                {comparison === "changed"
                  ? "After/work/qa-screenshots/planning-en.png"
                  : "After/outputs/qa-overview-light.png"}
              </code>
            </figcaption>
          </figure>
        </div>

        <div className="comparison-table" role="table" aria-label="Before and After product language">
          <div className="comparison-table-head" role="row">
            <span role="columnheader">Decision</span>
            <span role="columnheader">Before</span>
            <span role="columnheader">After</span>
          </div>
          {comparisonRows[comparison].map(([label, before, after]) => (
            <div className="comparison-table-row" role="row" key={label}>
              <strong role="cell">{label}</strong>
              <span role="cell">{before}</span>
              <span role="cell">{after}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="report-section" id="report">
        <div className="report-heading">
          <div>
            <p className="kicker">Generated report</p>
            <h2>The rewrite, accounted for.</h2>
            <p>
              This report updates from your classifications. Migration stays
              separate because data can survive even when a feature does not.
            </p>
          </div>
          <button className="report-action" onClick={downloadReport}>
            Download report <span aria-hidden="true">↓</span>
          </button>
        </div>

        <div className="report-grid">
          {statusOrder.map((status) => (
            <article className={`report-column ${status.toLowerCase()}`} key={status}>
              <div className="report-column-heading">
                <span className={`status-mark ${status.toLowerCase()}`} />
                <h3>{status === "Keep" ? "Preserved" : status === "Adapt" ? "Adapted" : status === "Remove" ? "Removed" : "Review"}</h3>
                <strong>{grouped[status].length}</strong>
              </div>
              <ul>
                {grouped[status].map((decision) => (
                  <li key={decision.id}>{decision.title}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="migration-report">
          <div className="migration-title">
            <span className="migration-symbol" aria-hidden="true">
              ⇢
            </span>
            <div>
              <p className="kicker">Migrated data</p>
              <h3>Preserve the record. Remove the claim.</h3>
            </div>
          </div>
          <div className="migration-steps">
            <div>
              <span>Payment-shaped history</span>
              <strong>Legacy user record</strong>
              <small>Flagged needs review</small>
            </div>
            <div>
              <span>Tax periods</span>
              <strong>Planning check-ins</strong>
              <small>Country + boundaries retained</small>
            </div>
            <div>
              <span>Savings log</span>
              <strong>Savings entries</strong>
              <small>Amounts and timestamps retained</small>
            </div>
            <div>
              <span>Official due date</span>
              <strong>Review date</strong>
              <small>No legal deadline implied</small>
            </div>
          </div>
          <button className="evidence-link light" onClick={() => setEvidenceId("migration")}>
            Inspect migration evidence
          </button>
        </div>

        <div className="impact-report">
          <div className="impact-intro">
            <p className="kicker">Affected surface</p>
            <h3>Files, components, and flows</h3>
            <p>
              Only three product files changed, but the decision propagated through
              state loading, settings, the tax page, exports, localization, and QA.
            </p>
          </div>
          <div className="impact-files">
            {fileImpact.map((item) => (
              <div key={item.group}>
                <span>{item.group}</span>
                <strong>{item.detail}</strong>
                <code>{item.files}</code>
              </div>
            ))}
          </div>
        </div>

        <div className="unknowns">
          <span className="evidence-badge inference">Not in evidence</span>
          <p>
            The snapshots do not identify who made the decision, when it was made,
            why it was made, or whether the surviving “Know what you owe” and “Tax
            set-aside” labels are intentional. Rewrite leaves those questions open.
          </p>
        </div>
      </section>

      <footer className="footer">
        <div className="brand footer-brand">
          <span className="brand-glyph" aria-hidden="true">
            R/
          </span>
          <span>rewrite</span>
        </div>
        <p>Evidence-led product change, without invented history.</p>
        <a href="#top">Back to top ↑</a>
      </footer>

      {selectedEvidence && (
        <div
          className="evidence-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setEvidenceId(null);
          }}
        >
          <aside
            className="evidence-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="evidenceTitle"
          >
            <div className="drawer-topline">
              <span className={`evidence-badge ${selectedEvidence.kind}`}>
                {kindLabel(selectedEvidence.kind)}
              </span>
              <button onClick={() => setEvidenceId(null)} aria-label="Close evidence">
                ×
              </button>
            </div>
            <p className="kicker">Source evidence</p>
            <h2 id="evidenceTitle">{selectedEvidence.label}</h2>
            <div className="source-location">
              <code>{selectedEvidence.path}</code>
              <span>{selectedEvidence.lines}</span>
            </div>
            <blockquote>{selectedEvidence.excerpt}</blockquote>
            <div className="evidence-explains">
              <span>What this confirms</span>
              <p>{selectedEvidence.explains}</p>
            </div>
            <div className="drawer-related">
              <span>Related evidence</span>
              <div>
                {active.evidence
                  .filter((id) => id !== selectedEvidence.id)
                  .slice(0, 3)
                  .map((id) => (
                    <button key={id} onClick={() => setEvidenceId(id)}>
                      {evidenceCatalog[id].label}
                    </button>
                  ))}
              </div>
            </div>
          </aside>
        </div>
      )}

      <div className={`toast ${notice ? "is-visible" : ""}`} role="status" aria-live="polite">
        {notice}
      </div>
    </main>
  );
}

import html2pdf from "html2pdf.js";
import { ESCALE_LOGO_BASE64 } from "@/lib/escale-logo-b64";
import { formatBRL } from "@/lib/finance-utils";

// ============================================================
// CSV
// ============================================================
function csvEscape(v: any): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",;\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const lines = [headers.map(csvEscape).join(";")];
  rows.forEach((r) => lines.push(r.map(csvEscape).join(";")));
  const csv = "\uFEFF" + lines.join("\n"); // BOM for Excel
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================
// PDF — Escale brand
// ============================================================
export interface PdfSection {
  title?: string;
  subtitle?: string;
  /** KPI cards: label + value (already formatted) */
  kpis?: { label: string; value: string; accent?: string }[];
  /** Table with optional totals row at bottom */
  table?: {
    headers: string[];
    rows: (string | number)[][];
    /** index-aligned row alignments: 'left' | 'right' | 'center' */
    align?: ("left" | "right" | "center")[];
    /** highlight first N rows with subtle bg, e.g. group headers */
    totalsRow?: (string | number)[];
  };
  /** Free HTML block (use sparingly) */
  html?: string;
}

export interface PdfReportData {
  title: string;
  subtitle?: string;
  periodLabel?: string;
  generatedAt?: string;
  sections: PdfSection[];
  orientation?: "portrait" | "landscape";
}

const BRAND_PURPLE = "#7B2FF7";
const BRAND_BLUE = "#0000FF";

function renderHeader(d: PdfReportData) {
  const date = d.generatedAt || new Date().toLocaleString("pt-BR");
  return `
  <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:14px;border-bottom:2px solid ${BRAND_PURPLE};margin-bottom:18px;">
    <div style="display:flex;align-items:center;gap:12px;">
      <img src="data:image/png;base64,${ESCALE_LOGO_BASE64}" style="height:38px;width:auto;" />
      <div>
        <div style="font-size:18px;font-weight:800;color:#111;letter-spacing:-0.3px;">${d.title}</div>
        ${d.subtitle ? `<div style="font-size:10px;color:#666;margin-top:2px;">${d.subtitle}</div>` : ""}
      </div>
    </div>
    <div style="text-align:right;">
      ${d.periodLabel ? `<div style="font-size:10px;color:#111;font-weight:600;text-transform:capitalize;">${d.periodLabel}</div>` : ""}
      <div style="font-size:9px;color:#888;margin-top:2px;">Emitido em ${date}</div>
    </div>
  </div>`;
}

function renderFooter() {
  return `
  <div style="position:fixed;bottom:8mm;left:0;right:0;display:flex;justify-content:space-between;padding:0 12mm;font-size:8px;color:#999;">
    <span>Escale · Estrutura Comercial Estratégica</span>
    <span>escaleos.lovable.app</span>
  </div>`;
}

function renderKpis(kpis: PdfSection["kpis"]) {
  if (!kpis || !kpis.length) return "";
  return `
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;">
    ${kpis
      .map(
        (k) => `
      <div style="flex:1;min-width:120px;background:linear-gradient(135deg,#f8f5ff,#f0f3ff);border-radius:10px;padding:10px 12px;border:1px solid #ece8f8;">
        <div style="font-size:8px;color:#666;text-transform:uppercase;letter-spacing:0.6px;font-weight:600;">${k.label}</div>
        <div style="font-size:18px;font-weight:800;color:${k.accent || BRAND_PURPLE};line-height:1.2;margin-top:4px;">${k.value}</div>
      </div>`
      )
      .join("")}
  </div>`;
}

function renderTable(table: PdfSection["table"]) {
  if (!table) return "";
  const align = table.align || [];
  const headerCells = table.headers
    .map(
      (h, i) =>
        `<th style="text-align:${align[i] || "left"};padding:8px 10px;font-size:9px;background:${BRAND_PURPLE};color:#fff;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;">${h}</th>`
    )
    .join("");
  const bodyRows = table.rows
    .map(
      (r, idx) =>
        `<tr style="background:${idx % 2 === 0 ? "#fff" : "#faf8ff"};">
          ${r
            .map(
              (c, i) =>
                `<td style="padding:6px 10px;font-size:9px;color:#222;border-bottom:1px solid #eee;text-align:${align[i] || "left"};">${c ?? ""}</td>`
            )
            .join("")}
        </tr>`
    )
    .join("");
  const totals = table.totalsRow
    ? `<tr style="background:${BRAND_BLUE};color:#fff;font-weight:700;">
        ${table.totalsRow
          .map(
            (c, i) =>
              `<td style="padding:8px 10px;font-size:10px;text-align:${align[i] || "left"};">${c ?? ""}</td>`
          )
          .join("")}
      </tr>`
    : "";
  return `
  <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;margin-bottom:14px;">
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}${totals}</tbody>
  </table>`;
}

function renderSection(s: PdfSection) {
  return `
  <div class="section" style="margin-bottom:18px;page-break-inside:avoid;">
    ${s.title ? `<h2 style="font-size:13px;font-weight:700;color:${BRAND_PURPLE};margin:0 0 4px 0;">${s.title}</h2>` : ""}
    ${s.subtitle ? `<p style="font-size:10px;color:#666;margin:0 0 10px 0;">${s.subtitle}</p>` : ""}
    ${renderKpis(s.kpis)}
    ${renderTable(s.table)}
    ${s.html || ""}
  </div>`;
}

export async function generateBrandedPDF(d: PdfReportData) {
  const filename = `${d.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${new Date()
    .toISOString()
    .slice(0, 10)}.pdf`;

  const html = `
  <div style="font-family:'Montserrat','Helvetica Neue',Arial,sans-serif;color:#111;padding:0;">
    ${renderHeader(d)}
    ${d.sections.map(renderSection).join("")}
    ${renderFooter()}
  </div>`;

  const container = document.createElement("div");
  container.style.cssText = "position:fixed;left:-9999px;top:0;width:210mm;background:#fff;";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    await html2pdf()
      .from(container)
      .set({
        filename,
        margin: [12, 10, 18, 10], // mm: T R B L
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
        jsPDF: { unit: "mm", format: "a4", orientation: d.orientation || "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"] },
      })
      .save();
  } finally {
    document.body.removeChild(container);
  }
}

// ============================================================
// Helpers — turn raw finance data into export rows
// ============================================================
export const fmt = (n: number) => formatBRL(Number(n) || 0);
export const monthBR = (yyyymm: string) => {
  const [y, m] = yyyymm.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
};

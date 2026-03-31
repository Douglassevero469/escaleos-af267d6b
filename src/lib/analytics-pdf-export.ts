import html2pdf from "html2pdf.js";
import { ESCALE_LOGO_BASE64 } from "@/lib/escale-logo-b64";

interface KPIData {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}

interface ChartImageData {
  title: string;
  subtitle?: string;
  imageDataUrl: string;
}

interface RespondentRow {
  name: string;
  email: string;
  phone: string;
  status: string;
  date: string;
}

interface AnalyticsExportData {
  formName: string;
  periodLabel: string;
  exportDate: string;
  kpis: KPIData[];
  rates: KPIData[];
  respondents: RespondentRow[];
  chartImages: ChartImageData[];
  orientation?: "portrait" | "landscape";
}

// SVG icon paths for KPIs
const ICONS: Record<string, string> = {
  eye: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  click: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 9h.01"/><path d="M15 15h.01"/><path d="m12 2 1 9h9"/><path d="M12 22a10 10 0 1 1 0-20"/><path d="M22 12a10 10 0 0 0-10-10"/></svg>`,
  send: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`,
  logout: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  users: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  clock: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  percent: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`,
  trending: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
};

function buildPDFHtml(data: AnalyticsExportData): string {
  const logoSrc = `data:image/png;base64,${ESCALE_LOGO_BASE64}`;

  const kpiCards = data.kpis
    .map(
      (kpi) => `
    <div style="flex:1;min-width:120px;background:#f8f9fc;border-radius:10px;padding:16px 12px;text-align:center;border:1px solid #e8eaf0;">
      <div style="color:${kpi.color || '#0000FF'};margin-bottom:6px;display:flex;justify-content:center;">
        ${ICONS[kpi.icon] || ""}
      </div>
      <div style="font-size:24px;font-weight:700;color:#111;margin-bottom:2px;">${kpi.value}</div>
      <div style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">${kpi.label}</div>
    </div>
  `
    )
    .join("");

  const rateCards = data.rates
    .map(
      (rate) => `
    <div style="flex:1;min-width:100px;background:#f8f9fc;border-radius:10px;padding:14px 10px;text-align:center;border:1px solid #e8eaf0;">
      <div style="font-size:22px;font-weight:700;color:${rate.color || '#0000FF'};">${rate.value}</div>
      <div style="font-size:9px;color:#666;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">${rate.label}</div>
    </div>
  `
    )
    .join("");

  const respondentRows = data.respondents
    .slice(0, 15)
    .map(
      (r, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8f9fc"};">
      <td style="padding:8px 10px;font-size:9px;border-bottom:1px solid #eee;">${r.name}</td>
      <td style="padding:8px 10px;font-size:9px;border-bottom:1px solid #eee;">${r.email}</td>
      <td style="padding:8px 10px;font-size:9px;border-bottom:1px solid #eee;">${r.phone}</td>
      <td style="padding:8px 10px;font-size:9px;border-bottom:1px solid #eee;">
        <span style="background:${r.status === "complete" ? "#e8f5e9" : "#fff3e0"};color:${r.status === "complete" ? "#2e7d32" : "#e65100"};padding:2px 8px;border-radius:10px;font-size:8px;font-weight:600;">
          ${r.status === "complete" ? "Completo" : "Incompleto"}
        </span>
      </td>
      <td style="padding:8px 10px;font-size:9px;border-bottom:1px solid #eee;white-space:nowrap;">${r.date}</td>
    </tr>
  `
    )
    .join("");

  const chartSections = data.chartImages
    .map(
      (chart) => `
    <div style="page-break-inside:avoid;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:600;color:#111;margin-bottom:4px;">${chart.title}</div>
      ${chart.subtitle ? `<div style="font-size:9px;color:#888;margin-bottom:8px;">${chart.subtitle}</div>` : ""}
      <div style="border:1px solid #e8eaf0;border-radius:8px;overflow:hidden;background:#fff;">
        <img src="${chart.imageDataUrl}" style="width:100%;display:block;" />
      </div>
    </div>
  `
    )
    .join("");

  return `
  <div style="padding: 32px 36px 24px; min-height: 297mm; position: relative; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; color: #222; background: #fff;">
    
    <!-- HEADER -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;padding-bottom:16px;border-bottom:2px solid #0000FF;">
      <div style="display:flex;align-items:center;gap:14px;">
        <img src="${logoSrc}" style="height:32px;width:auto;" />
        <div>
          <div style="font-size:18px;font-weight:700;color:#111;">Relatório de Analytics</div>
          <div style="font-size:10px;color:#888;margin-top:2px;">${data.formName}</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:9px;color:#888;">Período: ${data.periodLabel}</div>
        <div style="font-size:9px;color:#888;">Exportado em: ${data.exportDate}</div>
      </div>
    </div>

    <!-- KPI SECTION -->
    <div style="margin-bottom:20px;">
      <div style="font-size:11px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">
        📊 Métricas Principais
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        ${kpiCards}
      </div>
    </div>

    <!-- RATES SECTION -->
    <div style="margin-bottom:24px;">
      <div style="font-size:11px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">
        📈 Taxas de Conversão
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        ${rateCards}
      </div>
    </div>

    <!-- CHARTS -->
    ${chartSections ? `
    <div style="margin-bottom:24px;">
      <div style="font-size:11px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px;">
        📉 Gráficos
      </div>
      ${chartSections}
    </div>
    ` : ""}

    <!-- RESPONDENTS TABLE -->
    ${data.respondents.length > 0 ? `
    <div style="page-break-inside:avoid;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">
        👥 Últimos Respondentes
      </div>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e8eaf0;border-radius:8px;overflow:hidden;">
        <thead>
          <tr style="background:#0000FF;">
            <th style="padding:10px;font-size:9px;color:#fff;text-align:left;font-weight:600;">Nome</th>
            <th style="padding:10px;font-size:9px;color:#fff;text-align:left;font-weight:600;">Email</th>
            <th style="padding:10px;font-size:9px;color:#fff;text-align:left;font-weight:600;">Telefone</th>
            <th style="padding:10px;font-size:9px;color:#fff;text-align:left;font-weight:600;">Status</th>
            <th style="padding:10px;font-size:9px;color:#fff;text-align:left;font-weight:600;">Data</th>
          </tr>
        </thead>
        <tbody>
          ${respondentRows}
        </tbody>
      </table>
    </div>
    ` : ""}

    <!-- FOOTER -->
    <div style="margin-top:40px;padding:12px 0;border-top:1px solid #e8eaf0;display:flex;align-items:center;justify-content:space-between;">
      <div style="display:flex;align-items:center;gap:8px;">
        <img src="${logoSrc}" style="height:16px;width:auto;opacity:0.6;" />
        <span style="font-size:8px;color:#999;">EscaleOS — Relatório gerado automaticamente</span>
      </div>
      <span style="font-size:8px;color:#999;">${data.exportDate}</span>
    </div>

  </div>`;
}

export async function exportAnalyticsPDF(data: AnalyticsExportData): Promise<void> {
  const html = buildPDFHtml(data);

  // Create off-screen container with fixed A4 width
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "794px";
  container.style.background = "#fff";
  container.innerHTML = html;
  document.body.appendChild(container);

  // Wait for images to load
  const images = container.querySelectorAll("img");
  await Promise.all(
    Array.from(images).map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) return resolve();
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );

  // Small delay for rendering
  await new Promise((r) => setTimeout(r, 200));

  try {
    const element = container.firstElementChild as HTMLElement;
    if (!element) throw new Error("No content to export");

    await html2pdf()
      .set({
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: `analytics-${data.formName.replace(/\s+/g, "-").toLowerCase()}-${data.exportDate.replace(/\//g, "-")}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
      } as any)
      .from(element)
      .save();
  } finally {
    document.body.removeChild(container);
  }
}

export async function captureChartAsImage(
  chartElement: HTMLElement
): Promise<string> {
  const html2canvas = (await import("html2canvas")).default;
  const canvas = await html2canvas(chartElement, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: "#ffffff",
  });
  return canvas.toDataURL("image/png");
}

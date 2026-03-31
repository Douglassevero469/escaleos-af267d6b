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

const ICONS: Record<string, string> = {
  eye: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  click: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 9h.01"/><path d="M15 15h.01"/><path d="m12 2 1 9h9"/><path d="M12 22a10 10 0 1 1 0-20"/><path d="M22 12a10 10 0 0 0-10-10"/></svg>`,
  send: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`,
  logout: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  users: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  clock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  percent: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>`,
  trending: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
};

function buildPDFHtml(data: AnalyticsExportData): string {
  const logoSrc = `data:image/png;base64,${ESCALE_LOGO_BASE64}`;
  const isLandscape = data.orientation === "landscape";

  const kpiCards = data.kpis
    .map(
      (kpi) => `
    <div style="flex:1;min-width:90px;background:#f8f9fc;border-radius:8px;padding:10px 8px;text-align:center;border:1px solid #eceef2;">
      <div style="color:${kpi.color || '#0000FF'};margin-bottom:4px;display:flex;justify-content:center;">
        ${ICONS[kpi.icon] || ""}
      </div>
      <div style="font-size:20px;font-weight:700;color:#111;line-height:1.2;">${kpi.value}</div>
      <div style="font-size:7.5px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">${kpi.label}</div>
    </div>`
    )
    .join("");

  const rateCards = data.rates
    .map(
      (rate) => `
    <div style="flex:1;min-width:80px;background:#f8f9fc;border-radius:8px;padding:10px 8px;text-align:center;border:1px solid #eceef2;">
      <div style="font-size:18px;font-weight:700;color:${rate.color || '#0000FF'};line-height:1.2;">${rate.value}</div>
      <div style="font-size:7.5px;color:#888;text-transform:uppercase;letter-spacing:0.5px;margin-top:2px;">${rate.label}</div>
    </div>`
    )
    .join("");

  const respondentRows = data.respondents
    .slice(0, 15)
    .map(
      (r, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8f9fc"};">
      <td style="padding:5px 8px;font-size:7.5px;border-bottom:1px solid #eee;word-break:break-word;">${r.name}</td>
      <td style="padding:5px 8px;font-size:7.5px;border-bottom:1px solid #eee;word-break:break-word;">${r.email}</td>
      <td style="padding:5px 8px;font-size:7.5px;border-bottom:1px solid #eee;white-space:nowrap;">${r.phone}</td>
      <td style="padding:5px 8px;font-size:7.5px;border-bottom:1px solid #eee;">
        <span style="background:${r.status === "complete" ? "#e8f5e9" : "#fff3e0"};color:${r.status === "complete" ? "#2e7d32" : "#e65100"};padding:1px 6px;border-radius:8px;font-size:7px;font-weight:600;">
          ${r.status === "complete" ? "Completo" : "Incompleto"}
        </span>
      </td>
      <td style="padding:5px 8px;font-size:7.5px;border-bottom:1px solid #eee;white-space:nowrap;">${r.date}</td>
    </tr>`
    )
    .join("");

  // Build charts in a 2-column grid with controlled sizing
  const chartPairs: string[] = [];
  const charts = data.chartImages;
  for (let i = 0; i < charts.length; i += 2) {
    const left = charts[i];
    const right = charts[i + 1];
    const imgMaxH = isLandscape ? "140px" : "120px";

    const chartCard = (chart: ChartImageData) => `
      <div style="flex:1;min-width:0;max-width:50%;">
        <div style="font-size:8px;font-weight:700;color:#333;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${chart.title}</div>
        ${chart.subtitle ? `<div style="font-size:6.5px;color:#999;margin-bottom:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${chart.subtitle}</div>` : ""}
        <div style="border:1px solid #eceef2;border-radius:6px;overflow:hidden;background:#fff;padding:4px;">
          <img src="${chart.imageDataUrl}" style="width:100%;height:${imgMaxH};object-fit:contain;display:block;" />
        </div>
      </div>`;

    const leftHtml = chartCard(left);
    const rightHtml = right
      ? chartCard(right)
      : `<div style="flex:1;min-width:0;max-width:50%;"></div>`;

    chartPairs.push(`
      <div style="display:flex;gap:10px;margin-bottom:10px;page-break-inside:avoid;">
        ${leftHtml}
        ${rightHtml}
      </div>`);
  }

  const sectionTitle = (emoji: string, label: string) =>
    `<div style="font-size:9px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;display:flex;align-items:center;gap:4px;">
      <span>${emoji}</span> ${label}
    </div>`;

  return `
  <div style="padding:24px 28px 16px;min-height:297mm;position:relative;font-family:'Inter','Helvetica Neue',Arial,sans-serif;color:#222;background:#fff;">
    
    <!-- HEADER -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;padding-bottom:10px;border-bottom:2px solid #0000FF;">
      <div style="display:flex;align-items:center;gap:10px;">
        <img src="${logoSrc}" style="height:26px;width:auto;" />
        <div>
          <div style="font-size:14px;font-weight:700;color:#111;line-height:1.2;">Relatório de Analytics</div>
          <div style="font-size:9px;color:#888;margin-top:1px;">${data.formName}</div>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:8px;color:#999;">Período: ${data.periodLabel}</div>
        <div style="font-size:8px;color:#999;">Exportado em: ${data.exportDate}</div>
      </div>
    </div>

    <!-- KPIs -->
    <div style="margin-bottom:14px;">
      ${sectionTitle("📊", "Métricas Principais")}
      <div style="display:flex;gap:8px;flex-wrap:wrap;">${kpiCards}</div>
    </div>

    <!-- RATES -->
    <div style="margin-bottom:16px;">
      ${sectionTitle("📈", "Taxas de Conversão")}
      <div style="display:flex;gap:8px;flex-wrap:wrap;">${rateCards}</div>
    </div>

    <!-- CHARTS (2-col grid) -->
    ${charts.length > 0 ? `
    <div style="margin-bottom:16px;">
      ${sectionTitle("📉", "Gráficos")}
      ${chartPairs.join("")}
    </div>` : ""}

    <!-- RESPONDENTS TABLE -->
    ${data.respondents.length > 0 ? `
    <div style="page-break-inside:avoid;margin-bottom:16px;">
      ${sectionTitle("👥", "Últimos Respondentes")}
      <table style="width:100%;border-collapse:collapse;border:1px solid #eceef2;border-radius:6px;overflow:hidden;">
        <thead>
          <tr style="background:#0000FF;">
            <th style="padding:6px 8px;font-size:7.5px;color:#fff;text-align:left;font-weight:600;">Nome</th>
            <th style="padding:6px 8px;font-size:7.5px;color:#fff;text-align:left;font-weight:600;">Email</th>
            <th style="padding:6px 8px;font-size:7.5px;color:#fff;text-align:left;font-weight:600;">Telefone</th>
            <th style="padding:6px 8px;font-size:7.5px;color:#fff;text-align:left;font-weight:600;">Status</th>
            <th style="padding:6px 8px;font-size:7.5px;color:#fff;text-align:left;font-weight:600;">Data</th>
          </tr>
        </thead>
        <tbody>${respondentRows}</tbody>
      </table>
    </div>` : ""}

    <!-- FOOTER -->
    <div style="margin-top:auto;padding:8px 0;border-top:1px solid #eceef2;display:flex;align-items:center;justify-content:space-between;position:absolute;bottom:16px;left:28px;right:28px;">
      <div style="display:flex;align-items:center;gap:6px;">
        <img src="${logoSrc}" style="height:14px;width:auto;opacity:0.5;" />
        <span style="font-size:7px;color:#bbb;">EscaleOS — Relatório gerado automaticamente</span>
      </div>
      <span style="font-size:7px;color:#bbb;">${data.exportDate}</span>
    </div>

  </div>`;
}

export async function exportAnalyticsPDF(data: AnalyticsExportData): Promise<void> {
  const html = buildPDFHtml(data);
  const orientation = data.orientation || "portrait";
  const containerWidth = orientation === "landscape" ? "1122px" : "794px";

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = containerWidth;
  container.style.background = "#fff";
  container.innerHTML = html;
  document.body.appendChild(container);

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

  await new Promise((r) => setTimeout(r, 200));

  try {
    const element = container.firstElementChild as HTMLElement;
    if (!element) throw new Error("No content to export");

    await html2pdf()
      .set({
        margin: [0, 0, 0, 0] as [number, number, number, number],
        filename: `analytics-${data.formName.replace(/\s+/g, "-").toLowerCase()}-${data.exportDate.replace(/\//g, "-")}.pdf`,
        image: { type: "jpeg" as const, quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm" as const, format: "a4" as const, orientation },
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

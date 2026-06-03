import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";

// ── CSV EXPORT ──
export function exportToCSV(data: Record<string, any>[], filename: string): void {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ── PDF EXPORT ──
export function exportToPDF(
  title: string,
  subtitle: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string
): void {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(30, 45, 61);
  doc.rect(0, 0, 210, 35, "F");

  // Logo text
  doc.setTextColor(224, 90, 43);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("GBV Monitor", 14, 15);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Ministry of Gender and Family Promotion — Government of Rwanda", 14, 22);

  // Title
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 30);

  // Subtitle and date
  doc.setFillColor(245, 247, 250);
  doc.rect(0, 35, 210, 12, "F");
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text(subtitle, 14, 43);
  doc.text(`Generated: ${new Date().toLocaleDateString("en-RW", { year: "numeric", month: "long", day: "numeric" })}`, 140, 43);

  // Table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 52,
    theme: "grid",
    headStyles: {
      fillColor: [31, 56, 100],
      textColor: 255,
      fontStyle: "bold",
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [50, 50, 50],
    },
    alternateRowStyles: {
      fillColor: [240, 244, 250],
    },
    styles: {
      cellPadding: 3,
      lineColor: [204, 204, 204],
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "CONFIDENTIAL — GBV & Child Abuse Monitoring System — MIGEPROF Rwanda",
      14,
      doc.internal.pageSize.height - 8
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width - 30,
      doc.internal.pageSize.height - 8
    );
  }

  doc.save(`${filename}.pdf`);
}

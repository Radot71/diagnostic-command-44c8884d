import jsPDF from 'jspdf';

export function generateReportPdf(params: {
  title: string;
  subtitle?: string;
  content: string;
  filename: string;
}): void {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(params.title, margin, 30);

  let y = 38;
  if (params.subtitle) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(params.subtitle, margin, y);
    doc.setTextColor(0, 0, 0);
    y += 8;
  }

  // Horizontal rule
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Content
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(params.content, maxWidth);

  for (const line of lines) {
    if (y > pageHeight - 25) {
      doc.addPage();
      y = margin;
    }
    // Bold section headers (lines starting with ## or uppercase + colon)
    if (line.startsWith('##') || line.startsWith('**')) {
      doc.setFont('helvetica', 'bold');
      doc.text(line.replace(/^#+\s*/, '').replace(/\*\*/g, ''), margin, y);
      doc.setFont('helvetica', 'normal');
    } else {
      doc.text(line, margin, y);
    }
    y += 5;
  }

  // Footer on each page
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      'DiagnosticOS — The selected report reflects the analytical scope surfaced at the chosen diagnostic tier.',
      margin,
      pageHeight - 10
    );
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 10);
    doc.setTextColor(0, 0, 0);
  }

  doc.save(params.filename);
}

export function generateDeckPdf(
  slides: Array<{ title: string; body: string }>,
  filename: string
): void {
  const doc = new jsPDF('l', 'mm', 'a4'); // Landscape for deck
  const margin = 25;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = pageWidth - margin * 2;

  slides.forEach((slide, index) => {
    if (index > 0) doc.addPage();

    // Slide title
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(slide.title, margin, 30);

    // Underline
    doc.setDrawColor(60, 60, 60);
    doc.line(margin, 35, margin + 80, 35);

    // Body
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(slide.body, maxWidth);
    let y = 45;
    for (const line of lines) {
      if (y > pageHeight - 20) break; // Don't overflow slide
      doc.text(line, margin, y);
      y += 6;
    }

    // Slide number
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(`Slide ${index + 1} of ${slides.length}`, pageWidth - margin - 30, pageHeight - 10);
    doc.setTextColor(0, 0, 0);
  });

  doc.save(filename);
}

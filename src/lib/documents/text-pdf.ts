const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const MARGIN = 54;
const FONT_SIZE = 10.5;
const LINE_HEIGHT = 14;
const MAX_CHARS = 88;

export function textToPdfBlob(title: string, text: string): Blob {
  const bytes = buildTextPdf(title, text);
  return new Blob([bytes], { type: "application/pdf" });
}

export function buildTextPdf(title: string, text: string): Uint8Array {
  const titleLines = wrapText(normalizePdfText(title.trim() || "357 Network Document"), 70);
  const bodyLines = text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .flatMap((line) => line.trim() ? wrapText(normalizePdfText(line), MAX_CHARS) : [""]);
  const linesPerPage = Math.floor((PAGE_HEIGHT - MARGIN * 2 - 34) / LINE_HEIGHT);
  const pages: string[][] = [];
  for (let index = 0; index < bodyLines.length || index === 0; index += linesPerPage) {
    pages.push(bodyLines.slice(index, index + linesPerPage));
  }

  const objects: string[] = [];
  const pageObjectIds: number[] = [];
  const contentObjectIds: number[] = [];
  const pageCount = pages.length;
  const fontId = 3 + pageCount * 2;

  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("");

  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const pageId = 3 + pageIndex * 2;
    const contentId = pageId + 1;
    pageObjectIds.push(pageId);
    contentObjectIds.push(contentId);
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    const stream = pageStream(titleLines, pages[pageIndex] ?? [], pageIndex + 1, pageCount);
    objects.push(`<< /Length ${byteLength(stream)} >>\nstream\n${stream}\nendstream`);
  }

  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageCount} >>`;
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  const header = "%PDF-1.4\n%357Network\n";
  const chunks: string[] = [header];
  const offsets: number[] = [0];
  let cursor = byteLength(header);
  for (let index = 0; index < objects.length; index += 1) {
    const objectText = `${index + 1} 0 obj\n${objects[index]}\nendobj\n`;
    offsets.push(cursor);
    chunks.push(objectText);
    cursor += byteLength(objectText);
  }

  const xrefOffset = cursor;
  const xref = [
    `xref\n0 ${objects.length + 1}\n`,
    "0000000000 65535 f \n",
    ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`),
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
  ].join("");
  chunks.push(xref);
  return new TextEncoder().encode(chunks.join(""));
}

function pageStream(titleLines: string[], lines: string[], page: number, total: number): string {
  const commands: string[] = ["BT", "/F1 15 Tf", `${MARGIN} ${PAGE_HEIGHT - MARGIN} Td`];
  titleLines.forEach((line, index) => {
    if (index > 0) commands.push("0 -18 Td");
    commands.push(`(${escapePdf(line)}) Tj`);
  });
  commands.push("/F1 10.5 Tf", `0 -${titleLines.length > 1 ? 28 : 32} Td`);
  lines.forEach((line, index) => {
    if (index > 0) commands.push(`0 -${LINE_HEIGHT} Td`);
    if (line) commands.push(`(${escapePdf(line)}) Tj`);
  });
  commands.push("ET");
  commands.push("BT", "/F1 8 Tf", `${PAGE_WIDTH - MARGIN - 72} ${MARGIN / 2} Td`, `(Page ${page} of ${total}) Tj`, "ET");
  return commands.join("\n");
}

function wrapText(value: string, maxChars: number): string[] {
  if (!value) return [""];
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (word.length > maxChars) {
      if (current) { lines.push(current); current = ""; }
      for (let index = 0; index < word.length; index += maxChars) lines.push(word.slice(index, index + maxChars));
      continue;
    }
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else current = candidate;
  }
  if (current || lines.length === 0) lines.push(current);
  return lines;
}

function normalizePdfText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[^\x20-\x7E]/g, "?");
}

function escapePdf(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

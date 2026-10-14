export const CSV_COLUMNS = [
  ["职位名称", "title"],
  ["公司名称", "company"],
  ["薪资", "salary"],
  ["工作地点", "location"],
  ["工作经验", "experience"],
  ["学历要求", "education"],
  ["职位描述", "description"],
  ["职位链接", "url"],
  ["首次收集时间", "collectedAt"],
  ["最后更新时间", "updatedAt"]
];

export function protectFormula(value) {
  const text = String(value ?? "");
  return /^[\u0000-\u0020]*[=+\-@]/u.test(text) || /^[\u0000-\u001f]/u.test(text)
    ? `'${text}`
    : text;
}

function csvCell(value) {
  return `"${protectFormula(value).replaceAll('"', '""')}"`;
}

export function serializeJobs(records) {
  const rows = [CSV_COLUMNS.map(([label]) => csvCell(label))];
  for (const record of records) {
    rows.push(CSV_COLUMNS.map(([, key]) => csvCell(record[key])));
  }
  return `\uFEFF${rows.map((row) => row.join(",")).join("\r\n")}\r\n`;
}

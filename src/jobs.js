export const REQUIRED_FIELDS = ["title", "company", "url"];

export function normalizeJobUrl(rawUrl) {
  let url;
  try {
    url = new URL(String(rawUrl ?? "").trim());
  } catch {
    throw new Error("职位链接不是有效的网址");
  }

  if (
    url.protocol !== "https:" ||
    !["www.zhipin.com", "zhipin.com"].includes(url.hostname) ||
    !/^\/job_detail\/[^/]+\.html$/i.test(url.pathname)
  ) {
    throw new Error("只支持 BOSS 直聘的独立职位详情页");
  }

  url.username = "";
  url.password = "";
  url.search = "";
  url.hash = "";
  url.hostname = "www.zhipin.com";
  return url.toString();
}

export function cleanText(value) {
  return String(value ?? "").replace(/\r\n?/g, "\n").trim();
}

export function validateJob(draft) {
  const job = {
    title: cleanText(draft.title),
    company: cleanText(draft.company),
    salary: cleanText(draft.salary),
    location: cleanText(draft.location),
    experience: cleanText(draft.experience),
    education: cleanText(draft.education),
    description: cleanText(draft.description),
    url: normalizeJobUrl(draft.url)
  };

  if (!job.title || !job.company) {
    throw new Error("请补全职位名称和公司名称后再保存");
  }
  return job;
}

export function formatLocalTimestamp(date = new Date()) {
  const pad = (value) => String(value).padStart(2, "0");
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  const hours = pad(Math.floor(Math.abs(offset) / 60));
  const minutes = pad(Math.abs(offset) % 60);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}${sign}${hours}:${minutes}`;
}

export function upsertJob(records, draft, now = new Date()) {
  const job = validateJob(draft);
  const index = records.findIndex((record) => record.url === job.url);
  const updatedAt = formatLocalTimestamp(now);
  const record = {
    ...job,
    collectedAt: index >= 0 ? records[index].collectedAt : updatedAt,
    updatedAt
  };
  const next = [...records];
  if (index >= 0) next[index] = record;
  else next.push(record);
  return { records: next, action: index >= 0 ? "updated" : "added" };
}

export function removeJob(records, url) {
  return records.filter((record) => record.url !== normalizeJobUrl(url));
}

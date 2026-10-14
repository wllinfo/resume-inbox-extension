import { extractCurrentJob } from "./extract.js";
import { normalizeJobUrl, removeJob, upsertJob } from "./jobs.js";
import { loadJobs, saveJobs } from "./storage.js";
import { serializeJobs } from "./csv.js";

const extractButton = document.querySelector("#extract-button");
const exportButton = document.querySelector("#export-button");
const previewForm = document.querySelector("#preview-form");
const saveButton = document.querySelector("#save-button");
const jobList = document.querySelector("#job-list");
const emptyMessage = document.querySelector("#empty-message");
const count = document.querySelector("#count");
const message = document.querySelector("#message");

let records = [];
let storageReady = false;

function setMessage(text, error = false) {
  message.textContent = text;
  message.classList.toggle("error", error);
}

function renderJobs() {
  count.textContent = String(records.length);
  exportButton.disabled = !storageReady || records.length === 0;
  emptyMessage.hidden = records.length > 0;
  jobList.replaceChildren();

  for (const record of [...records].reverse()) {
    const item = document.createElement("li");
    item.className = "job-item";
    const main = document.createElement("div");
    main.className = "job-main";
    const link = document.createElement("a");
    link.className = "job-title";
    link.textContent = record.title;
    link.href = normalizeJobUrl(record.url);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    const meta = document.createElement("p");
    meta.className = "job-meta";
    meta.textContent = [record.company, record.salary, record.location].filter(Boolean).join(" · ");
    const deleteButton = document.createElement("button");
    deleteButton.className = "delete";
    deleteButton.type = "button";
    deleteButton.textContent = "删除";
    deleteButton.setAttribute("aria-label", `删除 ${record.title}`);
    deleteButton.addEventListener("click", () => deleteRecord(record));
    main.append(link, meta);
    item.append(main, deleteButton);
    jobList.append(item);
  }
}

async function deleteRecord(record) {
  if (!confirm(`确定删除「${record.title}」吗？`)) return;
  try {
    const next = removeJob(records, record.url);
    await saveJobs(next);
    records = next;
    renderJobs();
    setMessage("岗位已删除");
  } catch (error) {
    setMessage(`删除失败：${error.message}`, true);
  }
}

async function extractCurrentTab() {
  extractButton.disabled = true;
  previewForm.hidden = true;
  setMessage("正在读取当前职位…");
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url) throw new Error("无法读取当前标签页");
    normalizeJobUrl(tab.url);
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractCurrentJob
    });
    const result = results?.[0]?.result;
    if (!result?.ok) throw new Error(result?.reason ?? "无法提取当前职位");
    for (const [key, value] of Object.entries(result.job)) {
      if (previewForm.elements.namedItem(key)) previewForm.elements.namedItem(key).value = value;
    }
    previewForm.hidden = false;
    const missing = ["title", "company"].filter((key) => !result.job[key]);
    setMessage(missing.length ? "部分必填字段未识别，请手动补全后保存" : "请核对字段，然后点击确认保存", missing.length > 0);
  } catch (error) {
    setMessage(error.message, true);
  } finally {
    extractButton.disabled = false;
  }
}

async function savePreview(event) {
  event.preventDefault();
  if (!storageReady) return;
  saveButton.disabled = true;
  try {
    const draft = Object.fromEntries(new FormData(previewForm));
    const result = upsertJob(records, draft);
    await saveJobs(result.records);
    records = result.records;
    previewForm.hidden = true;
    renderJobs();
    setMessage(result.action === "updated" ? "此职位已更新" : "职位已保存到本地");
  } catch (error) {
    setMessage(`保存失败：${error.message}`, true);
  } finally {
    saveButton.disabled = false;
  }
}

function exportCsv() {
  if (!storageReady || records.length === 0) return;
  try {
    const csv = serializeJobs(records);
    const blobUrl = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `岗位收集-${new Date().toLocaleDateString("sv-SE")}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    setMessage("已开始下载 CSV；浏览器可能会询问保存位置");
  } catch (error) {
    setMessage(`导出失败：${error.message}`, true);
  }
}

extractButton.addEventListener("click", extractCurrentTab);
previewForm.addEventListener("submit", savePreview);
exportButton.addEventListener("click", exportCsv);

try {
  records = await loadJobs();
  storageReady = true;
  renderJobs();
} catch (error) {
  extractButton.disabled = true;
  setMessage(`无法读取本地岗位：${error.message}`, true);
}

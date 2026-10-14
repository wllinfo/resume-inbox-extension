import test from "node:test";
import assert from "node:assert/strict";
import { extractCurrentJob } from "../src/extract.js";

function withMockPage(url, values, run) {
  const previousDocument = globalThis.document;
  const previousLocation = globalThis.location;
  const previousStyle = globalThis.getComputedStyle;
  globalThis.location = { href: url };
  globalThis.document = {
    querySelector: (selector) => {
      const value = values[selector];
      return value === undefined ? null : { innerText: value, hidden: false, closest: () => null };
    }
  };
  globalThis.getComputedStyle = () => ({ display: "block", visibility: "visible" });
  try {
    return run();
  } finally {
    globalThis.document = previousDocument;
    globalThis.location = previousLocation;
    globalThis.getComputedStyle = previousStyle;
  }
}

test("reads current detail area only", () => {
  const result = withMockPage("https://www.zhipin.com/job_detail/abc.html?source=search", {
    ".job-banner .info-primary h1": "产品经理20-30K",
    ".job-banner .salary": "20-30K",
    ".company-info h3 a": "示例公司",
    ".job-banner .text-city": "上海",
    ".job-banner .text-limit": "3-5年",
    ".job-banner .text-degree": "本科",
    ".job-detail-section .job-sec-text": "负责产品规划\n协调团队"
  }, extractCurrentJob);
  assert.equal(result.ok, true);
  assert.equal(result.job.title, "产品经理");
  assert.equal(result.job.company, "示例公司");
  assert.equal(result.job.description, "负责产品规划\n协调团队");
  assert.equal(result.job.url, "https://www.zhipin.com/job_detail/abc.html");
});

test("reads company link and experience from current BOSS detail markup", () => {
  const result = withMockPage("https://www.zhipin.com/job_detail/real.html", {
    ".job-banner .info-primary h1": "产品经理",
    ".job-banner .salary": "18-22K·14薪",
    '.sider-company .company-info a[ka="job-detail-company_custompage"]': "云畅",
    ".job-banner .text-city": "杭州",
    ".job-banner .text-experiece": "3-5年",
    ".job-banner .text-degree": "本科",
    ".job-detail-section .job-sec-text": "岗位职责"
  }, extractCurrentJob);
  assert.equal(result.ok, true);
  assert.equal(result.job.company, "云畅");
  assert.equal(result.job.experience, "3-5年");
});

test("rejects non-detail and unloaded pages", () => {
  const wrongPage = withMockPage("https://www.zhipin.com/web/geek/job", {}, extractCurrentJob);
  assert.equal(wrongPage.ok, false);
  const unloaded = withMockPage("https://www.zhipin.com/job_detail/abc.html", {}, extractCurrentJob);
  assert.equal(unloaded.ok, false);
});

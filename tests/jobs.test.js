import test from "node:test";
import assert from "node:assert/strict";
import { normalizeJobUrl, upsertJob, removeJob, validateJob } from "../src/jobs.js";

const draft = {
  title: "产品经理",
  company: "示例公司",
  salary: "20-30K",
  location: "上海",
  experience: "3-5年",
  education: "本科",
  description: "岗位描述",
  url: "https://www.zhipin.com/job_detail/abc123.html?from=search#detail"
};

test("only standalone BOSS job detail URLs are accepted", () => {
  assert.equal(normalizeJobUrl(draft.url), "https://www.zhipin.com/job_detail/abc123.html");
  assert.throws(() => normalizeJobUrl("https://evil.example/job_detail/abc123.html"));
  assert.throws(() => normalizeJobUrl("https://www.zhipin.com/web/geek/job"));
  assert.throws(() => normalizeJobUrl("javascript:alert(1)"));
});

test("required fields are enforced", () => {
  assert.throws(() => validateJob({ ...draft, company: " " }), /公司名称/);
  assert.equal(validateJob(draft).description, "岗位描述");
});

test("upsert updates duplicates and retains first collected time", () => {
  const first = upsertJob([], draft, new Date("2026-10-14T10:00:00+08:00"));
  assert.equal(first.action, "added");
  const second = upsertJob(first.records, { ...draft, salary: "25-35K" }, new Date("2026-10-15T10:00:00+08:00"));
  assert.equal(second.action, "updated");
  assert.equal(second.records.length, 1);
  assert.equal(second.records[0].salary, "25-35K");
  assert.equal(second.records[0].collectedAt, first.records[0].collectedAt);
  assert.notEqual(second.records[0].updatedAt, first.records[0].updatedAt);
  assert.equal(removeJob(second.records, draft.url).length, 0);
});

test("three distinct jobs stay three after a duplicate update", () => {
  let records = [];
  for (const id of ["a", "b", "c", "b"]) {
    records = upsertJob(records, { ...draft, url: `https://www.zhipin.com/job_detail/${id}.html` }).records;
  }
  assert.equal(records.length, 3);
});

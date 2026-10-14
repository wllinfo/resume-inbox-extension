import test from "node:test";
import assert from "node:assert/strict";
import { CSV_COLUMNS, protectFormula, serializeJobs } from "../src/csv.js";

test("CSV has BOM, fixed header, CRLF and escaped multiline text", () => {
  const output = serializeJobs([{
    title: '产品,"负责人"',
    company: "示例公司",
    salary: "20-30K",
    location: "上海",
    experience: "3-5年",
    education: "本科",
    description: "职责一\n职责二,协作",
    url: "https://www.zhipin.com/job_detail/abc.html",
    collectedAt: "2026-10-14T10:00:00+08:00",
    updatedAt: "2026-10-14T10:00:00+08:00"
  }]);
  assert.ok(output.startsWith("\uFEFF"));
  assert.ok(output.includes(CSV_COLUMNS.map(([label]) => `"${label}"`).join(",") + "\r\n"));
  assert.ok(output.includes('"产品,""负责人"""'));
  assert.ok(output.includes('"职责一\n职责二,协作"'));
  assert.ok(output.endsWith("\r\n"));
});

test("spreadsheet formula values are escaped", () => {
  for (const input of ["=1+1", "+SUM(A1)", "-1+2", "@cmd", " \t=HYPERLINK(1)", "\tformula"]) {
    assert.ok(protectFormula(input).startsWith("'"), input);
  }
  assert.equal(protectFormula("普通文本"), "普通文本");
});

test("empty collection produces only a header", () => {
  const output = serializeJobs([]);
  assert.equal(output.split("\r\n").length, 2);
});

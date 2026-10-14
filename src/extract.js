// This function is serialized by chrome.scripting.executeScript. Keep it self-contained.
export function extractCurrentJob() {
  const pageUrl = new URL(location.href);
  if (
    pageUrl.protocol !== "https:" ||
    !["www.zhipin.com", "zhipin.com"].includes(pageUrl.hostname) ||
    !/^\/job_detail\/[^/]+\.html$/i.test(pageUrl.pathname)
  ) {
    return { ok: false, reason: "请先打开 BOSS 直聘的独立职位详情页" };
  }

  function visible(node) {
    if (!node || node.hidden || node.closest?.('[hidden], [aria-hidden="true"]')) return false;
    if (typeof getComputedStyle === "function") {
      const style = getComputedStyle(node);
      if (style.display === "none" || style.visibility === "hidden") return false;
    }
    return true;
  }

  function read(node) {
    if (!visible(node)) return "";
    return String(node.innerText ?? node.textContent ?? "").replace(/\r\n?/g, "\n").trim();
  }

  function pick(selectors) {
    for (const selector of selectors) {
      const value = read(document.querySelector(selector));
      if (value) return value;
    }
    return "";
  }

  const title = pick([
    ".job-banner .info-primary h1",
    ".job-primary .info-primary h1",
    ".job-banner .name h1",
    ".job-banner h1",
    ".job-detail h1"
  ]);
  const company = pick([
    '.sider-company .company-info a[ka="job-detail-company_custompage"]',
    '.job-banner a[ka="job-detail-company_custompage"]',
    ".company-info .company-name",
    ".company-info h3 a",
    ".company-info h3",
    ".sider-company .company-name",
    ".job-banner .company-name"
  ]);
  const salary = pick([
    ".job-banner .salary",
    ".job-primary .salary",
    ".info-primary .salary"
  ]);
  const locationText = pick([
    ".job-banner .text-city",
    ".job-primary .text-city",
    ".info-primary .text-city",
    ".job-banner .job-location"
  ]);
  const experience = pick([
    ".job-banner .text-experiece",
    ".job-banner .text-limit",
    ".job-primary .text-experiece",
    ".job-primary .text-limit",
    ".info-primary .text-experiece",
    ".info-primary .text-limit"
  ]);
  const education = pick([
    ".job-banner .text-degree",
    ".job-primary .text-degree",
    ".info-primary .text-degree"
  ]);
  const description = pick([
    ".job-detail-section .job-sec-text",
    ".job-detail .job-sec-text",
    ".job-detail-section .text",
    ".job-detail .job-sec .text",
    ".job-description"
  ]);

  // The job title and company must come from job-specific areas, not the page title.
  if (!title && !company && !description) {
    return { ok: false, reason: "当前职位尚未加载完成，或页面结构已变化。请刷新后重试" };
  }

  pageUrl.search = "";
  pageUrl.hash = "";
  return {
    ok: true,
    job: {
      title: title.replace(/\s*\n\s*/g, " ").replace(salary, "").trim(),
      company,
      salary,
      location: locationText,
      experience,
      education,
      description,
      url: pageUrl.toString()
    }
  };
}

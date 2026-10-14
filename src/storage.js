const STORAGE_KEY = "jobCollection";
const SCHEMA_VERSION = 1;

export async function loadJobs() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const collection = result[STORAGE_KEY];
  if (collection === undefined) return [];
  if (collection.version !== SCHEMA_VERSION || !Array.isArray(collection.records)) {
    throw new Error("本地数据格式不兼容，请先备份或检查扩展版本");
  }
  return collection.records;
}

export async function saveJobs(records) {
  await chrome.storage.local.set({
    [STORAGE_KEY]: { version: SCHEMA_VERSION, records }
  });
}

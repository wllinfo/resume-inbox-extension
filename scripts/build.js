import { cp, mkdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("manifest.json", root), "utf8"));
if (manifest.manifest_version !== 3 || !manifest.action?.default_popup) {
  throw new Error("扩展配置缺少 Manifest V3 或弹窗入口");
}

const output = new URL("dist/", root);
await mkdir(new URL("src/", output), { recursive: true });
await cp(new URL("manifest.json", root), new URL("manifest.json", output));
for (const name of ["popup.html", "popup.css", "popup.js", "extract.js", "jobs.js", "storage.js", "csv.js"]) {
  await cp(new URL(`src/${name}`, root), new URL(`src/${name}`, output));
}
console.log(`已构建扩展：${join(fileURLToPath(root), "dist")}`);

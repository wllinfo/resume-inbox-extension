# 岗位收集箱

手动收集当前 BOSS 直聘职位详情页，并将岗位信息导出为 CSV。数据保存在浏览器本地，无服务器、爬虫、自动投递或 AI 托管。

## 开始使用

需要 Node.js 20 或更高版本。运行：

```sh
npm test
npm run lint
npm run build
```

在 Chrome 或 Edge 的扩展管理页面启用开发者模式，加载项目中的 `dist/` 目录。打开职位详情页，点击插件图标，提取并核对岗位，确认保存。收集完成后点击“导出 CSV”。

安装与验收细节见 `docs/manual-acceptance.md`；产品范围见 `SPEC.md`。

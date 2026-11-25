# 把任务坞发到 npm 与插件市场

现状：只以 `link:` 装在本机 profile，npm 上没有（`dsh-task-dock` 名字可用，registry 返回 404）。
下面是把 0.2.0 真正发出去的完整清单。带 `TODO` 的占位符请先替换。

## 0. 先补占位符

| 位置 | 需要换成 |
| --- | --- |
| `package.json` → `author` / `homepage` / `repository` / `bugs` | 你的名字与 GitHub 仓库地址 |
| `LICENSE` → `Copyright (c) 2026 …` | 版权持有人 |
| `market/dsh-task-dock.json` → `author` / `homepage` / `repository.url` | 同上，必须是 https 且仓库路径至少两段 |

`repository` 建议用 GitHub 仓库根（不是子目录）；如果仓库里插件在子目录，市场条目要加
`"repository": { "url": "...", "directory": "dsh-task-dock" }`。

## 1. 本地自检

```powershell
cd dsh-task-dock
node tools/build-client.mjs
node tools/test-dock.mjs          # 8 项渲染/注册用例
node --check lib/client.js
npm pack --dry-run                # 看会发出去哪些文件（应只有 lib/README/CHANGELOG/LICENSE/cordis.patch.yml/package.json）
```

`package.json` 里的 `prepublishOnly` 会在 `npm publish` 前自动重跑 build + test，构建产物不会忘。

## 2. 发布到 npm

```powershell
npm login                         # 有 2FA 的话 prepare
npm view dsh-task-dock version    # 现在应报 404
npm publish                       # 包里 publishConfig 已声明 public
npm view dsh-task-dock version    # 应打印 0.2.0
```

非 scoped 包默认 public，`publishConfig.access` 只是保险。
发完打 tag：`git tag v0.2.0 && git push --tags`。

## 3. 验证安装链

```powershell
dsh plugin --profile desktop add dsh-task-dock
```

装完刷新页面应看到底部横条；确认后可以：

```powershell
dsh plugin --profile desktop remove dsh-task-dock
```

（本机的 `link:` 版本不受影响，继续用工作区目录即可。）

## 4. 市场条目

DSH 插件市场不是自动抓 npm，而是一份 **format 1 的 JSON 索引**，由
`@deepseek-ai/dsh-plugin-market-index` 的 `parseMarketIndex` 校验后喂给市场页。
条目模板已放在 [`market/dsh-task-dock.json`](../dsh-task-dock/market/dsh-task-dock.json)。

校验命令（先把校验包装到临时目录）：

```powershell
npm i --no-save @deepseek-ai/dsh-plugin-market-index   # 会在插件目录生成 node_modules，验完删掉
node -e "const fs=require('fs');const{parseMarketIndex}=require('@deepseek-ai/dsh-plugin-market-index');const entry=JSON.parse(fs.readFileSync('market/dsh-task-dock.json','utf8'));parseMarketIndex({format:1,title:{en:'DSH market',zh:'DSH 市场'},plugins:[entry]},'https://example.com/index.json');console.log('ok')"
```

必须对齐的几条规则：

- `versions[].version` 是精确 SemVer，且**必须真的在 npm 上存在**；`publishTimestamp` 是**整数 Unix 秒**，取 `npm view dsh-task-dock time.0.2.0` 的时间。
- `source.type: "npm"` 不需要写 registry（用 npmjs 时）。
- `engines.dsh` 是 SemVer range，别写 `workspace:`；跨 DSH 大版本时补一条新版本记录。
- `homepage` 允许带 `#readme`；`repository.url` 必须是 https、无 query/fragment、路径 ≥ 2 段。
- `title` / `description` 若是对象，**必须含 `en`**（可加 `zh`）。
- 校验器只查**格式**，不查仓库是否真实存在：`https://github.com/TODO/...` 也能通过校验，
  所以 `TODO` 必须人工替换，别指望报错提醒。
- `publishTimestamp` 示例值 `1794441600` 是 2026-11-12 00:00 UTC；发布后务必换成 npm 实际时间。
- `category` / `labels` 只能引用索引全局 `metadata` 里已声明的 id——不确定就只写 `keywords`（自由文本）。

## 5. 提交

向市场索引仓库提 PR（或在 DSH 市场页的「提交插件」入口提交），附：npm 包名、仓库地址、一行说明、图标（可选，相对 URL 必须解析到 https 或索引同源）。
审过之后，用户在市场页点安装即可，安装参数是 `dsh-task-dock@0.2.0`。

## 6. 发布前最后一遍

- [ ] `package.json` 里没有 `TODO` 残留（`grep -R TODO .` 应只剩文档说明）
- [ ] `npm pack --dry-run` 只含 `lib/`（已构建的最新 `client.js`）+ 文档 + `cordis.patch.yml`
- [ ] `tools/test-dock.mjs` 全过，`node --check lib/client.js` 通过
- [ ] README 的安装命令与实际包名一致
- [ ] 市场条目 `version` / `publishTimestamp` 与 npm 实际发布时间一致
- [ ] 标签 `v0.2.0` 已推

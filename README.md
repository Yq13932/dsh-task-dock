# dsh-task-dock（任务坞）

在 DSH 工作区最下方嵌一条常驻任务横条。点开就能看到：

- **正在运行**：此刻还在跑的会话（等待你确认的会排在前面，并标出「待批准 / 待审计划 / 待回答」）
- **已完成 · 待验收**：刚跑完、但还没被你点开过的会话
- **已标记未读**：在会话菜单里点过「标为未读」、还没消掉的会话（红点与菜单项由本插件内置）

点任意一条 → 直接跳到那个会话（跨项目也能跳）。打开即算验收，它就从清单里消失。

## 数据从哪来

运行中/待验收用宿主算好的根级状态；未读标记由本插件自己维护，每秒比对一次 localStorage 只在变化时重渲染：

| 来源 | 用途 |
| --- | --- |
| `useSessions` | 会话列表（标题、更新时间、是否空白） |
| `useSessionStatus` | `running`（正在跑）、`completionUnread`（完成未读）、`pendingInteraction`（等待确认） |
| `useWorkspaces` | 项目名映射、归档会话过滤 |
| `localStorage['dsh.session-unread.v1']` | 内置的「手动标未读」集合；沿用旧插件的键，历史标记无缝接续 |
| `ctx.get('uiWorkspace').openSession(id)` | 跳转到会话 |

`completionUnread` 是 DSH 自己的「完成未读」标记：会话停止运行时置上，被切到主视图后清掉，
所以「已完成但还没点开过」不需要插件自己记账。

## 安装

从 npm（发布后）：

```powershell
dsh plugin --profile desktop add dsh-task-dock
```

本地开发用 link：

```powershell
dsh plugin --profile desktop add "link:C:/Users/ASUS/Desktop/AI/dsh任务文件夹/插件安装/dsh-task-dock"
```

装完刷新页面（Ctrl+R）。若底部没有出现横条，重启一次桌面端。

> 未读功能已内置。如果之前装过 `dsh-session-unread`，请卸掉它（`dsh plugin --profile desktop remove dsh-session-unread`），
> 否则会话菜单里会出现两个「标为未读」、行首出现两个红点。历史未读标记存在同一个 localStorage 键里，卸掉不会丢。

卸载：

```powershell
dsh plugin --profile desktop remove dsh-task-dock
```

## 开发

```
src/client-body.js        浏览器插件主体（React.createElement，不用 JSX）
src/client.css            样式（跟随主题 token）
tools/build-client.mjs    打包成 lib/client.js（DSH 的 window.__ModuleLoader__ 格式）
tools/test-dock.mjs       冒烟测试：bundle 注册、槽位注册、四种渲染路径
```

改完源码：

```powershell
node tools/build-client.mjs
node tools/test-dock.mjs
node --check lib/client.js
```

## 已知边界

- 「完成未读」是宿主内存里的状态，**重启桌面端会清空**；重启前没验收的任务不会留在清单里。
- 横条只列会话层面正在跑的任务；后台 shell 作业（jobs）不在其中，它们在会话头部的作业按钮里。
- 归档会话不显示（避免清单被旧会话塞满）。
- 未读标记是**本浏览器本地状态**（`localStorage`），刷新/重启都还在，但不跨设备同步。
- 未读分区只在未读插件/本插件的侧栏条目真的注册在槽位上时才出现；条目缺失时 `localStorage` 里的旧标记会被整块忽略，不占位、不计入横条。

/* dsh-task-dock · built by tools/build-client.mjs · 不要手改本文件 */
window.__ModuleLoader__.load({
  id: "dsh-task-dock",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;

/**
 * 任务坞 · 浏览器侧插件（由 tools/build-client.mjs 打包进 lib/client.js）
 *
 * 挂在 root 作用域的 shell.bottom 槽位上：占据三栏下方的一整行。
 * 数据全部来自宿主已提供的根级 hooks：
 *   useSessions      会话列表快照（byId / ids）
 *   useSessionStatus 每个会话的实时状态（running / completionUnread / pendingInteraction）
 *   useWorkspaces    项目（Workspace）列表与归档集合
 * 另有一份跨插件约定：dsh-session-unread 把「手动标未读」的会话 id 存进
 * localStorage['dsh.session-unread.v1']，任务坞读同一个键，把未读的会话也列出来。
 * 跳转走 ctx.get('uiWorkspace').openSession(id)。
 */

var CSS = "/* 任务坞：shell.bottom 里的一条常驻横条 + 弹出的任务清单 */\n.dtd-bar {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  box-sizing: border-box;\n  width: 100%;\n  height: 28px;\n  padding: 0 12px;\n  border: 0;\n  border-top: 0.5px solid var(--dsw-alias-border-l1);\n  background: var(--dsw-alias-bg-base);\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12px;\n  line-height: 18px;\n  text-align: left;\n  cursor: pointer;\n}\n.dtd-bar:hover,\n.dtd-bar[data-open='true'] {\n  background: var(--dsw-alias-fill-l1);\n}\n.dtd-bar-static {\n  cursor: default;\n}\n.dtd-bar-static:hover {\n  background: var(--dsw-alias-bg-base);\n}\n.dtd-bar-icon {\n  font-size: 12px;\n  color: var(--dsw-alias-label-tertiary);\n}\n.dtd-title {\n  font-weight: 600;\n  color: var(--dsw-alias-label-primary);\n}\n.dtd-quiet {\n  color: var(--dsw-alias-label-tertiary);\n}\n.dtd-stats {\n  display: inline-flex;\n  align-items: center;\n  gap: 12px;\n}\n.dtd-stat {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n}\n.dtd-spacer {\n  flex: 1;\n}\n.dtd-chev {\n  color: var(--dsw-alias-label-tertiary);\n  transition: transform 0.15s ease;\n}\n.dtd-chev-open {\n  transform: rotate(180deg);\n}\n.dtd-dot {\n  flex: none;\n  display: inline-block;\n  width: 6px;\n  height: 6px;\n  border-radius: 50%;\n  background: var(--dsw-alias-label-tertiary);\n}\n.dtd-dot-run {\n  background: var(--dsw-alias-state-business-primary, #4d6bfe);\n  animation: dtd-pulse 1.6s ease-in-out infinite;\n}\n.dtd-dot-done {\n  background: var(--dsw-alias-state-warn-label, #f0a020);\n}\n/* 侧栏会话行首的未读红点 + 会话菜单里的圆点 */\n.dtd-unread-dot {\n  display: inline-block;\n  flex: 0 0 auto;\n  width: 8px;\n  height: 8px;\n  margin-right: 6px;\n  vertical-align: middle;\n  border-radius: 50%;\n  background: #e5484d;\n}\n.dtd-menu-dot {\n  display: inline-block;\n  width: 10px;\n  height: 10px;\n  border-radius: 50%;\n  background: #e5484d;\n}\n.dtd-menu-fallback {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n.dtd-dot-unread {\n  background: #e5484d;\n}\n@keyframes dtd-pulse {\n  0%, 100% { opacity: 1; }\n  50% { opacity: 0.35; }\n}\n@media (prefers-reduced-motion: reduce) {\n  .dtd-dot-run { animation: none; }\n  .dtd-chev { transition: none; }\n}\n\n.dtd-backdrop {\n  position: fixed;\n  inset: 0;\n  z-index: 9998;\n  background: transparent;\n}\n.dtd-panel {\n  position: fixed;\n  right: 12px;\n  bottom: 38px;\n  z-index: 9999;\n  display: flex;\n  flex-direction: column;\n  width: min(480px, calc(100vw - 24px));\n  max-height: min(62vh, 540px);\n  overflow: hidden;\n  border: 0.5px solid var(--dsw-alias-border-l2);\n  border-radius: 10px;\n  background: var(--dsw-specific-menu, var(--dsw-alias-bg-base));\n  box-shadow: var(--dsw-elevation-prominent, 0 8px 24px rgba(0, 0, 0, 0.18));\n}\n.dtd-panel-head {\n  display: flex;\n  align-items: baseline;\n  gap: 8px;\n  padding: 10px 12px 8px;\n  border-bottom: 0.5px solid var(--dsw-alias-border-l1);\n}\n.dtd-panel-title {\n  font-size: 13px;\n  font-weight: 600;\n  color: var(--dsw-alias-label-primary);\n}\n.dtd-panel-sub {\n  flex: 1;\n  min-width: 0;\n  overflow: hidden;\n  font-size: 11px;\n  color: var(--dsw-alias-label-tertiary);\n  white-space: nowrap;\n  text-overflow: ellipsis;\n}\n.dtd-close {\n  flex: none;\n  width: 22px;\n  height: 22px;\n  padding: 0;\n  border: 0;\n  border-radius: 6px;\n  background: transparent;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 12px;\n  cursor: pointer;\n}\n.dtd-close:hover {\n  background: var(--dsw-alias-fill-l1);\n  color: var(--dsw-alias-label-primary);\n}\n.dtd-panel-body {\n  min-height: 0;\n  overflow: auto;\n  padding: 4px 6px 8px;\n}\n.dtd-section + .dtd-section {\n  margin-top: 2px;\n}\n.dtd-section-head {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  padding: 8px 8px 4px;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n.dtd-section-count {\n  padding: 0 5px;\n  border-radius: 8px;\n  background: var(--dsw-alias-fill-l2);\n  font-size: 10px;\n}\n.dtd-row {\n  display: flex;\n  align-items: flex-start;\n  gap: 8px;\n  box-sizing: border-box;\n  width: 100%;\n  padding: 7px 8px;\n  border: 0;\n  border-radius: 6px;\n  background: transparent;\n  color: inherit;\n  text-align: left;\n  cursor: pointer;\n}\n.dtd-row:hover,\n.dtd-row:focus-visible {\n  background: var(--dsw-alias-fill-l1);\n}\n.dtd-row .dtd-dot {\n  margin-top: 6px;\n}\n.dtd-row-main {\n  display: flex;\n  flex-direction: column;\n  gap: 2px;\n  flex: 1;\n  min-width: 0;\n}\n.dtd-row-title {\n  overflow: hidden;\n  color: var(--dsw-alias-label-primary);\n  font-size: 12.5px;\n  line-height: 17px;\n  white-space: nowrap;\n  text-overflow: ellipsis;\n}\n.dtd-row-meta {\n  overflow: hidden;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 15px;\n  white-space: nowrap;\n  text-overflow: ellipsis;\n}\n.dtd-row-go {\n  flex: none;\n  align-self: center;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  opacity: 0;\n}\n.dtd-row:hover .dtd-row-go,\n.dtd-row:focus-visible .dtd-row-go {\n  opacity: 1;\n}\n.dtd-empty {\n  padding: 28px 12px;\n  text-align: center;\n}\n.dtd-empty-title {\n  color: var(--dsw-alias-label-secondary);\n  font-size: 12.5px;\n}\n.dtd-empty-sub {\n  margin-top: 6px;\n  color: var(--dsw-alias-label-tertiary);\n  font-size: 11px;\n  line-height: 16px;\n}\n"

var STYLE_ID = 'dsh-task-dock/styles'
var NS = 'dsh-task-dock'
/** 与 dsh-session-unread 共用的 localStorage 键（值为会话 id 数组）。 */
var UNREAD_KEY = 'dsh.session-unread.v1'

/** apply() 时捕获的宿主服务，供组件点击时使用。 */
var runtime = { ctx: null }

function installStyles() {
  try {
    var existing = document.getElementById(STYLE_ID)
    if (!existing) {
      existing = document.createElement('style')
      existing.id = STYLE_ID
      ;(document.head || document.documentElement).appendChild(existing)
    }
    // 插件热重载时同一 id 的 <style> 还在，必须覆盖内容，否则跑的是旧样式。
    if (existing.textContent !== CSS) existing.textContent = CSS
  } catch (err) {}
}

function identity(value) {
  return value
}

function isSetLike(value) {
  return value && typeof value.has === 'function'
}

function toSet(value) {
  if (!value) return new Set()
  if (isSetLike(value)) return value
  if (Array.isArray(value)) return new Set(value)
  return new Set()
}

/** 读 dsh-session-unread 的未读集合；读不到就当空。 */
function readUnreadIds() {
  try {
    var raw = window.localStorage.getItem(UNREAD_KEY)
    var list = raw ? JSON.parse(raw) : []
    if (!Array.isArray(list)) return []
    var out = []
    for (var i = 0; i < list.length; i += 1) {
      if (typeof list[i] === 'string' && list[i] !== '') out.push(list[i])
    }
    return out
  } catch (err) {
    return []
  }
}

function sameIds(a, b) {
  if (a === b) return true
  if (!a || !b || a.length !== b.length) return false
  for (var i = 0; i < a.length; i += 1) if (a[i] !== b[i]) return false
  return true
}

/** dsh-session-unread 注册的槽位条目：只要有任意一条在，就算插件活着。 */
var UNREAD_PROBES = [
  { slot: 'sidebar.session.row.leading', id: 'session-unread-dot' },
  { slot: 'sidebar.workspaces.session.menu.item', id: 'session-unread-toggle' },
]

/**
 * dsh-session-unread 是否正在运行。
 * 判据是它的槽位注册还在不在——插件停用后条目会从槽位表里消失，
 * 而 localStorage 里的旧标记不会自己清掉，不能拿它当「插件活着」的证据。
 * 槽位表不可查（旧版宿主）时返回 true，保持原来的行为，不误伤未读。
 */
function unreadPluginActive() {
  var ctx = runtime.ctx
  var slots = ctx && ctx.slots
  if (!slots || typeof slots.entries !== 'function') return true
  try {
    for (var i = 0; i < UNREAD_PROBES.length; i += 1) {
      var probe = UNREAD_PROBES[i]
      var entries = slots.entries(probe.slot)
      if (!Array.isArray(entries)) continue
      for (var j = 0; j < entries.length; j += 1) {
        var id = entries[j] && entries[j].options ? entries[j].options.id : ''
        // 认插件前缀，这样双方以后微调 id 也不会被误判成「已停用」。
        if (typeof id === 'string' && (
          id === probe.id ||
          id.indexOf('session-unread') === 0 ||
          id.indexOf('task-dock-unread') === 0
        )) return true
      }
    }
    return false
  } catch (err) {
    return true
  }
}

function statusOf(statuses, id) {
  if (!statuses) return null
  try {
    if (typeof statuses.get === 'function') return statuses.get(id) || null
    return statuses[id] || null
  } catch (err) {
    return null
  }
}

/** 项目索引：sessionId → { id, name }。 */
function projectIndex(workspaces) {
  var index = new Map()
  var items = workspaces && Array.isArray(workspaces.items) ? workspaces.items : []
  for (var i = 0; i < items.length; i += 1) {
    var workspace = items[i]
    if (!workspace || !Array.isArray(workspace.sessionIds)) continue
    var name = ''
    if (typeof workspace.title === 'string' && workspace.title.trim() !== '') name = workspace.title.trim()
    else if (typeof workspace.path === 'string' && workspace.path !== '') {
      name = workspace.path.replace(/[\\/]+$/, '').split(/[\\/]/).pop() || ''
    }
    for (var j = 0; j < workspace.sessionIds.length; j += 1) {
      index.set(workspace.sessionIds[j], { id: workspace.workspaceId, name: name })
    }
  }
  return index
}

function pendingLabel(kind) {
  if (kind === 'approval') return '待批准'
  if (kind === 'plan-review') return '待审计划'
  if (kind === 'question') return '待回答'
  return '待处理'
}

/**
 * 纯函数：从三份快照里挑出「正在运行」和「已完成未查看」的会话。
 * @returns {{running: Array, done: Array}}
 */
function deriveTasks(sessions, statuses, workspaces, manualUnread) {
  var running = []
  var done = []
  var unread = []
  if (!sessions || !sessions.byId) return { running: running, done: done, unread: unread }
  var byId = sessions.byId
  var ids = Array.isArray(sessions.ids) ? sessions.ids : Object.keys(byId)
  var archived = toSet(workspaces && workspaces.archivedSessionIds)
  var projects = projectIndex(workspaces)
  var marked = toSet(manualUnread)

  for (var i = 0; i < ids.length; i += 1) {
    var id = ids[i]
    var session = byId[id]
    if (!session || session.blank === true) continue
    if (archived.has(id)) continue
    var status = statusOf(statuses, id)
    var isRunning = status ? status.running === true : session.running === true
    var completionUnread = status ? status.completionUnread === true : false
    var isMarked = marked.has(id)
    if (!isRunning && !completionUnread && !isMarked) continue
    var pending = status && status.pendingInteraction ? status.pendingInteraction : null
    var project = projects.get(id)
    var row = {
      id: id,
      title: (typeof session.title === 'string' && session.title.trim() !== '') ? session.title.trim() : '未命名会话',
      running: isRunning,
      unread: completionUnread,
      kind: isRunning ? 'run' : (completionUnread ? 'done' : 'unread'),
      pending: pending && pending.kind ? pendingLabel(pending.kind) : '',
      projectId: project ? project.id : '',
      projectName: project ? project.name : '',
      updatedAt: typeof session.updatedAt === 'number' ? session.updatedAt : 0,
    }
    if (isRunning) running.push(row)
    else if (completionUnread) done.push(row)
    else unread.push(row)
  }

  function byRecency(a, b) {
    return (b.updatedAt || 0) - (a.updatedAt || 0)
  }
  running.sort(function (a, b) {
    var ap = a.pending ? 1 : 0
    var bp = b.pending ? 1 : 0
    if (ap !== bp) return bp - ap
    return byRecency(a, b)
  })
  done.sort(byRecency)
  unread.sort(byRecency)
  return { running: running, done: done, unread: unread }
}

function timeAgo(ts) {
  if (!ts) return ''
  var diff = Date.now() - ts
  if (diff < 0) diff = 0
  var minute = 60000
  var hour = 60 * minute
  var day = 24 * hour
  if (diff < minute) return '刚刚'
  if (diff < hour) return Math.floor(diff / minute) + ' 分钟前'
  if (diff < day) return Math.floor(diff / hour) + ' 小时前'
  if (diff < 7 * day) return Math.floor(diff / day) + ' 天前'
  var date = new Date(ts)
  return (date.getMonth() + 1) + '月' + date.getDate() + '日'
}

function makeDock(React, ReactDOM) {
  var h = React.createElement
  var useState = React.useState
  var useMemo = React.useMemo
  var useEffect = React.useEffect

  function navigateTo(id) {
    var ctx = runtime.ctx
    try {
      var navigation = ctx && typeof ctx.get === 'function' ? ctx.get('uiWorkspace') : null
      if (navigation && typeof navigation.openSession === 'function') {
        navigation.openSession(id)
        return true
      }
    } catch (err) {}
    // 兜底：直接点侧栏里对应的会话行。
    try {
      var row = document.querySelector('[data-row-key="session:' + id + '"]')
      if (row) {
        row.click()
        return true
      }
    } catch (err2) {}
    try {
      console.warn('[dsh-task-dock] 跳转失败：找不到 uiWorkspace 服务，也没有对应的侧栏会话行', id)
    } catch (err3) {}
    return false
  }

  function TaskRow(props) {
    var task = props.task
    var meta = []
    if (task.projectName) meta.push(task.projectName)
    if (task.kind === 'run') meta.push(task.pending || '运行中')
    else if (task.kind === 'unread') meta.push('标为未读')
    else meta.push(task.updatedAt ? '完成于 ' + timeAgo(task.updatedAt) : '已完成')
    return h('button', {
      className: 'dtd-row',
      type: 'button',
      title: task.title + (task.projectName ? ' · ' + task.projectName : ''),
      onClick: function () { props.onOpen(task.id) },
    },
    h('span', { className: 'dtd-dot dtd-dot-' + (task.kind || 'done') }),
    h('span', { className: 'dtd-row-main' },
      h('span', { className: 'dtd-row-title' }, task.title),
      h('span', { className: 'dtd-row-meta' }, meta.join(' · ')),
    ),
    h('span', { className: 'dtd-row-go' }, '跳转 →'),
    )
  }

  function Section(props) {
    if (props.items.length === 0) return null
    return h('div', { className: 'dtd-section' },
      h('div', { className: 'dtd-section-head' },
        h('span', null, props.title),
        h('span', { className: 'dtd-section-count' }, props.items.length),
      ),
      props.items.map(function (task) {
        return h(TaskRow, { key: task.id, task: task, onOpen: props.onOpen })
      }),
    )
  }

  /** 读「未读插件是否在跑 + 未读集合」，两者任一变化就重渲染。 */
  function readBridge() {
    var on = unreadPluginActive()
    return { on: on, ids: on ? readUnreadIds() : [] }
  }

  function sameBridge(a, b) {
    return a.on === b.on && sameIds(a.ids, b.ids)
  }

  function useUnreadBridge() {
    var state = useState(readBridge)
    var value = state[0]
    var setValue = state[1]
    useEffect(function () {
      var timer = setInterval(function () {
        var next = readBridge()
        setValue(function (prev) { return sameBridge(prev, next) ? prev : next })
      }, 1000)
      return function () { clearInterval(timer) }
    }, [])
    return value
  }

  /**
   * 真正的坞：所有 hooks 无条件调用。
   * 由外层 Dock 在确认根级 hooks 存在后才挂载——这样「hooks 从有到无/从无到有」
   * 只会导致组件替换，而不会在一次渲染里改变 hook 数量（React 会直接报错）。
   */
  function RealDock(props) {
    var useSessions = props.useSessions
    var useSessionStatus = props.useSessionStatus
    var useWorkspaces = props.useWorkspaces

    var sessions = useSessions(identity)
    var statuses = useSessionStatus(identity)
    var workspaces = useWorkspaces(identity)

    var openState = useState(false)
    var open = openState[0]
    var setOpen = openState[1]

    var unread = useUnreadBridge()

    // 面板开着时每分钟刷新一次，让「完成于 X 分钟前」不会停在打开那一刻。
    var paint = useState(0)
    useEffect(function () {
      if (!open) return
      var timer = setInterval(function () {
        paint[1](function (n) { return n + 1 })
      }, 60000)
      return function () { clearInterval(timer) }
    }, [open])

    var tasks = useMemo(function () {
      return deriveTasks(sessions, statuses, workspaces, unread.ids)
    }, [sessions, statuses, workspaces, unread])

    var total = tasks.running.length + tasks.done.length + tasks.unread.length

    useEffect(function () {
      if (!open) return
      function onKey(event) {
        if (event.key === 'Escape') setOpen(false)
      }
      window.addEventListener('keydown', onKey)
      return function () { window.removeEventListener('keydown', onKey) }
    }, [open])

    function openTask(id) {
      setOpen(false)
      navigateTo(id)
    }

    var bar = h('button', {
      className: 'dtd-bar',
      type: 'button',
      'data-open': open ? 'true' : 'false',
      'aria-expanded': open ? 'true' : 'false',
      title: '任务坞：运行中、待验收与未读的任务',
      onClick: function () { setOpen(!open) },
    },
    h('span', { className: 'dtd-bar-icon' }, '▤'),
    h('span', { className: 'dtd-title' }, '任务'),
    total === 0
      ? h('span', { className: 'dtd-quiet' }, '暂无运行中、待验收或未读的任务')
      : h('span', { className: 'dtd-stats' },
        tasks.running.length > 0
          ? h('span', { className: 'dtd-stat' },
            h('span', { className: 'dtd-dot dtd-dot-run' }),
            h('span', null, tasks.running.length + ' 个运行中'))
          : null,
        tasks.done.length > 0
          ? h('span', { className: 'dtd-stat' },
            h('span', { className: 'dtd-dot dtd-dot-done' }),
            h('span', null, tasks.done.length + ' 个待验收'))
          : null,
        tasks.unread.length > 0
          ? h('span', { className: 'dtd-stat' },
            h('span', { className: 'dtd-dot dtd-dot-unread' }),
            h('span', null, tasks.unread.length + ' 条未读'))
          : null,
      ),
    h('span', { className: 'dtd-spacer' }),
    h('span', { className: 'dtd-chev' + (open ? ' dtd-chev-open' : '') }, '▴'),
    )

    var panel = null
    if (open && typeof document !== 'undefined') {
      panel = ReactDOM.createPortal(
        h(React.Fragment, null,
          h('div', { className: 'dtd-backdrop', onClick: function () { setOpen(false) } }),
          h('div', { className: 'dtd-panel', role: 'dialog', 'aria-label': '任务清单' },
            h('div', { className: 'dtd-panel-head' },
              h('span', { className: 'dtd-panel-title' }, '任务清单'),
              h('span', { className: 'dtd-panel-sub' }, '点一条就能跳过去；完成后第一次打开即算验收'),
              h('button', { className: 'dtd-close', type: 'button', 'aria-label': '关闭', onClick: function () { setOpen(false) } }, '✕'),
            ),
            h('div', { className: 'dtd-panel-body' },
              total === 0
                ? h('div', { className: 'dtd-empty' },
                  h('div', { className: 'dtd-empty-title' }, '眼下没有要验收的任务'),
                  h('div', { className: 'dtd-empty-sub' }, '正在运行、刚完成还没打开过、或被标为未读的会话，会自动出现在这里。'))
                : h(React.Fragment, null,
                  h(Section, { title: '正在运行', items: tasks.running, onOpen: openTask }),
                  h(Section, { title: '已完成 · 待验收', items: tasks.done, onOpen: openTask }),
                  h(Section, { title: '已标记未读', items: tasks.unread, onOpen: openTask }),
                ),
            ),
          ),
        ),
        document.body,
      )
    }

    return h(React.Fragment, null, bar, panel)
  }

  /** 根级 hooks 缺失时的降级条：把原因说出来，而不是假装「没有任务」。 */
  function MissingBar() {
    return h('div', {
      className: 'dtd-bar dtd-bar-static',
      title: '宿主没有把 useSessions / useSessionStatus / useWorkspaces 注入到 shell.bottom',
    },
    h('span', { className: 'dtd-bar-icon' }, '▤'),
    h('span', { className: 'dtd-title' }, '任务'),
    h('span', { className: 'dtd-quiet' }, '读不到会话数据（刷新页面；仍不行则 DSH 版本可能变了）'),
    )
  }

  /** 槽位入口：先确认三份根级 hooks 都在，再挂载带 hooks 的 RealDock。 */
  function Dock(props) {
    var ready = !!props &&
      typeof props.useSessions === 'function' &&
      typeof props.useSessionStatus === 'function' &&
      typeof props.useWorkspaces === 'function'
    return ready ? h(RealDock, props) : h(MissingBar, null)
  }

  return Dock
}

/* ---------- 手动未读：内置实现 ----------
 * 以前这块由 dsh-session-unread 提供，任务坞只是读它的 localStorage。
 * 现在收进同一个插件：同一把 localStorage 键、同样的槽位（行首红点 + 会话菜单项），
 * 装任务坞一个插件就同时有「未读标记」和「任务坞里的未读分区」。
 * 两者同时安装会出现两个菜单项/两个红点，二选一。
 */

var unreadSet = new Set(readUnreadIds())
var unreadListeners = new Set()
var unreadVersion = 0

function unreadWrite() {
  try {
    window.localStorage.setItem(UNREAD_KEY, JSON.stringify(Array.from(unreadSet)))
  } catch (err) {}
}

function unreadNotify() {
  unreadVersion += 1
  var listeners = Array.from(unreadListeners)
  for (var i = 0; i < listeners.length; i += 1) {
    try { listeners[i]() } catch (err) {}
  }
}

function unreadSubscribe(listener) {
  unreadListeners.add(listener)
  return function () { unreadListeners.delete(listener) }
}

function unreadGetVersion() {
  return unreadVersion
}

function isMarkedUnread(id) {
  return typeof id === 'string' && unreadSet.has(id)
}

function setMarkedUnread(id, on) {
  if (typeof id !== 'string' || id === '') return
  var had = unreadSet.has(id)
  if (on === had) return
  if (on) unreadSet.add(id)
  else unreadSet.delete(id)
  unreadWrite()
  unreadNotify()
}

/** 会话视图把当前会话 id 打在宿主元素上，用它判断「切进了哪条会话」。 */
function currentConversationId() {
  try {
    var el = document.querySelector('[data-conversation-session]')
    var id = el && el.getAttribute('data-conversation-session')
    return typeof id === 'string' ? id : ''
  } catch (err) {
    return ''
  }
}

/** 切进某条会话时自动清掉它的未读标记（和原插件的行为一致）。 */
function startUnreadWatcher(ctx) {
  if (typeof setInterval !== 'function' || typeof document === 'undefined') return
  var last = currentConversationId()
  function tick() {
    var current = currentConversationId()
    if (!current || current === last) return
    last = current
    if (isMarkedUnread(current)) setMarkedUnread(current, false)
  }
  var timer = setInterval(tick, 800)
  var observer = null
  try {
    if (typeof MutationObserver === 'function') {
      observer = new MutationObserver(tick)
      observer.observe(document.documentElement, {
        subtree: true,
        attributes: true,
        attributeFilter: ['data-conversation-session'],
      })
    }
  } catch (err) {
    observer = null
  }
  ctx.effect(function () {
    return function () {
      clearInterval(timer)
      if (observer) observer.disconnect()
    }
  }, 'dsh-task-dock: unread watcher')
}

/** 侧栏里的两个小部件：会话行首红点、会话菜单项。 */
function makeUnreadUI(React) {
  var h = React.createElement
  var useSyncExternalStore = React.useSyncExternalStore

  var primitives = {}
  try {
    primitives = require('@deepseek-ai/dsh-client-ui-primitives') || {}
  } catch (err) {
    primitives = {}
  }
  var MenuItemButton = typeof primitives.MenuItemButton === 'function'
    ? primitives.MenuItemButton
    : function FallbackMenuItem(props) {
      return h('button', {
        type: 'button',
        role: 'menuitem',
        className: 'dtd-menu-fallback',
        onClick: function () { if (props.onSelect) props.onSelect() },
      }, props.icon, props.children)
    }

  function useUnreadFlag(id) {
    useSyncExternalStore(unreadSubscribe, unreadGetVersion, function () { return 0 })
    return isMarkedUnread(id)
  }

  function UnreadDot(props) {
    var unread = useUnreadFlag(props && props.sessionId)
    if (!unread) return null
    return h('span', {
      className: 'dtd-unread-dot',
      'data-session-unread-dot': props.sessionId,
      title: '未读',
      'aria-label': '未读',
    })
  }

  /** 菜单项：能拿到菜单开合状态时顺手把菜单关掉。 */
  function UnreadMenuItemWithMenu(props) {
    var unread = useUnreadFlag(props.sessionId)
    var menuState = props.useMenuOpenState()
    var close = menuState && typeof menuState[1] === 'function' ? menuState[1] : function () {}
    return h(MenuItemButton, {
      icon: h('span', { className: 'dtd-menu-dot', 'aria-hidden': true }),
      onSelect: function () {
        close(false)
        setMarkedUnread(props.sessionId, !unread)
      },
    }, unread ? '标为已读' : '标为未读')
  }

  function UnreadMenuItemNoMenu(props) {
    var unread = useUnreadFlag(props.sessionId)
    return h(MenuItemButton, {
      icon: h('span', { className: 'dtd-menu-dot', 'aria-hidden': true }),
      onSelect: function () { setMarkedUnread(props.sessionId, !unread) },
    }, unread ? '标为已读' : '标为未读')
  }

  function UnreadMenuItem(props) {
    // 两个实现各自调用固定的 hooks；这里只做一次组件选择，不改变 hook 数量。
    return typeof props.useMenuOpenState === 'function'
      ? h(UnreadMenuItemWithMenu, props)
      : h(UnreadMenuItemNoMenu, props)
  }

  return { UnreadDot: UnreadDot, UnreadMenuItem: UnreadMenuItem }
}

function apply(ctx) {
  installStyles()
  runtime.ctx = ctx
  var React = require('react')
  var ReactDOM = require('react-dom')
  var Dock = makeDock(React, ReactDOM)
  var unreadUI = makeUnreadUI(React)
  ctx.effect(function () {
    return ctx.slots.inject('shell.bottom', function () {
      return ctx.slots.register({
        name: 'shell.bottom',
      }, Dock)
    })
  }, 'dsh-task-dock: bottom bar')
  ctx.effect(function () {
    return ctx.slots.inject('sidebar.workspaces.session.menu.item', function () {
      return ctx.slots.register({
        name: 'sidebar.workspaces.session.menu.item',
        id: 'task-dock-unread-toggle',
        order: 720,
      }, unreadUI.UnreadMenuItem)
    })
  }, 'dsh-task-dock: unread menu item')
  ctx.effect(function () {
    return ctx.slots.inject('sidebar.session.row.leading', function () {
      return ctx.slots.register({
        name: 'sidebar.session.row.leading',
        id: 'task-dock-unread-dot',
        order: 900,
      }, unreadUI.UnreadDot)
    })
  }, 'dsh-task-dock: unread dot')
  startUnreadWatcher(ctx)
}

module.exports.name = NS
module.exports.inject = ['slots']
module.exports.apply = apply


    return module.exports;
  }
});

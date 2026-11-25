// 任务坞冒烟测试：用最小 React 替身跑一遍 bundle 的注册与渲染。
// 用法：node tools/test-dock.mjs
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const bundlePath = path.join(root, 'lib/client.js')

let failures = 0
function check(name, fn) {
  try {
    fn()
    console.log('  ok   ' + name)
  } catch (error) {
    failures += 1
    console.log('  FAIL ' + name + '\n       ' + (error && error.stack || error))
  }
}
function assert(condition, message) {
  if (!condition) throw new Error(message)
}
function textOf(node) {
  if (node == null || node === false || node === true) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join(' ')
  if (node.props) return [node.props.children].flat(9).map(textOf).join(' ')
  return ''
}

function findRow(node, title) {
  if (node == null || typeof node !== 'object') return null
  if (Array.isArray(node)) {
    for (const child of node) {
      const hit = findRow(child, title)
      if (hit) return hit
    }
    return null
  }
  if (node.props && typeof node.props.title === 'string' && node.props.title.startsWith(title)) return node
  if (node.props) return findRow(node.props.children, title)
  return null
}

/* ---------- 最小 React 替身 ---------- */
let openInitial = false
let storageUnread = []
function createElement(type, props, ...children) {
  const next = Object.assign({}, props)
  if (children.length === 1) next.children = children[0]
  else if (children.length > 1) next.children = children
  return { type, props: next }
}
let hookCursor = 0
let hookStates = []
const React = {
  createElement,
  Fragment: Symbol('Fragment'),
  createContext: () => ({ Provider: 'Provider', Consumer: 'Consumer' }),
  useState(initial) {
    const index = hookCursor++
    if (!(index in hookStates)) hookStates[index] = typeof initial === 'function' ? initial() : initial
    return [index === 0 ? openInitial : hookStates[index], (value) => { hookStates[index] = value }]
  },
  useMemo(factory) { hookCursor++; return factory() },
  useEffect() { hookCursor++ },
  useRef(value) { hookCursor++; return { current: value } },
  useSyncExternalStore(subscribe, get) { hookCursor++; return get() },
}
const ReactDOM = { createPortal: (children) => children }

/** 递归渲染，钩子按组件挂载顺序分段。 */
function renderTree(node, state) {
  if (node == null || node === false || node === true) return null
  if (typeof node === 'string' || typeof node === 'number') return node
  if (Array.isArray(node)) return node.map((child) => renderTree(child, state))
  if (node.type === React.Fragment) return renderTree(node.props.children, state)
  if (typeof node.type === 'function') {
    hookCursor = 0
    hookStates = []
    const output = node.type(node.props)
    return renderTree(output, state)
  }
  const children = node.props ? node.props.children : undefined
  return {
    type: node.type,
    props: Object.assign({}, node.props, children === undefined ? {} : { children: renderTree(children, state) }),
  }
}

/* ---------- 载入 bundle ---------- */
const code = fs.readFileSync(bundlePath, 'utf8')
let registration = null
const sandbox = {
  console,
  __ModuleLoader__: { load: (value) => { registration = value } },
  Date,
  Symbol,
  Map,
  Set,
  JSON,
  Math,
  window: {
    addEventListener() {},
    removeEventListener() {},
    localStorage: { getItem: () => JSON.stringify(storageUnread), setItem() {} },
  },  document: {
    getElementById: () => null,
    createElement: () => ({ style: {}, dataset: {} }),
    querySelector: () => null,
    head: { appendChild() {} },
    body: {},
  },
  __ModuleLoader__: { load: (value) => { registration = value } },
}
sandbox.globalThis = sandbox
sandbox.window.__ModuleLoader__ = sandbox.__ModuleLoader__
sandbox.require = (id) => (id === 'react' ? React : ReactDOM)
vm.createContext(sandbox)
vm.runInContext(code, sandbox)

check('bundle 注册到 __ModuleLoader__', () => {
  assert(registration && registration.id === 'dsh-task-dock', '注册 id 不对')
  assert(typeof registration.factory === 'function', 'factory 缺失')
})

const plugin = registration.factory(sandbox.require)

check('导出 apply / inject', () => {
  assert(typeof plugin.apply === 'function', 'apply 缺失')
  assert(Array.isArray(plugin.inject) && plugin.inject.includes('slots'), 'inject 应包含 slots')
})

/* ---------- 假宿主 ctx ---------- */
let registered = null
const regs = {}
/** 假槽位表：模拟 dsh-session-unread 有没有注册进来。 */
let slotEntries = []
const ctx = {
  effect(fn) { const dispose = fn(); return dispose },
  get(name) {
    if (name === 'uiWorkspace') return { openSession(id) { ctx.opened = id } }
    return null
  },
  slots: {
    inject(name, fn) { return fn() },
    register(options, component) {
      regs[options.name] = { options, component }
      if (options.name === 'shell.bottom') registered = regs[options.name]
      return () => {}
    },
    entries(name) {
      return slotEntries
        .filter((entry) => entry.slot === name)
        .map((entry) => ({ options: { id: entry.id } }))
    },
  },
}
plugin.apply(ctx)

check('在 shell.bottom 注册组件', () => {
  assert(registered, '没有注册')
  assert(registered.options.name === 'shell.bottom', '槽位名不对')
  assert(typeof registered.component === 'function', '组件不是函数')
})

check('同时注册未读所需的两个侧栏槽位', () => {
  assert(regs['sidebar.session.row.leading'], '缺少行首红点槽位')
  assert(regs['sidebar.workspaces.session.menu.item'], '缺少会话菜单槽位')
  assert(typeof regs['sidebar.session.row.leading'].component === 'function', '红点不是组件')
  assert(typeof regs['sidebar.workspaces.session.menu.item'].component === 'function', '菜单项不是组件')
})

/* ---------- 数据夹具 ---------- */
const now = Date.now()
const sessions = {
  phase: 'ready',
  ids: ['run-1', 'done-1', 'idle-1', 'blank-1', 'arch-1'],
  byId: {
    'run-1': { id: 'run-1', title: '重构登录页', updatedAt: now - 60_000 },
    'done-1': { id: 'done-1', title: '导出周报', updatedAt: now - 300_000 },
    'idle-1': { id: 'idle-1', title: '随意的闲聊', updatedAt: now - 900_000 },
    'blank-1': { id: 'blank-1', title: '', blank: true, updatedAt: now - 100_000 },
    'arch-1': { id: 'arch-1', title: '旧实验', updatedAt: now - 200_000 },
  },
}
const statuses = new Map([
  ['run-1', { running: true, pendingInteraction: { kind: 'approval' }, completionUnread: false }],
  ['done-1', { running: false, completionUnread: true }],
  ['idle-1', { running: false, completionUnread: false }],
  ['arch-1', { running: false, completionUnread: true }],
])
const workspaces = {
  items: [
    { workspaceId: 'w1', title: '自用工具箱', path: 'C:/work/tools', sessionIds: ['run-1', 'done-1', 'idle-1', 'blank-1'] },
    { workspaceId: 'w2', title: '', path: 'D:/lab/scratch', sessionIds: ['arch-1'] },
  ],
  archivedSessionIds: ['arch-1'],
}
const props = {
  useSessions: (selector) => selector(sessions),
  useSessionStatus: (selector) => selector(statuses),
  useWorkspaces: (selector) => selector(workspaces),
}

function render(initialOpen) {
  openInitial = initialOpen
  const state = { hookSlots: {} }
  const element = createElement(registered.component, props)
  return { tree: renderTree(element, state), state }
}

check('空闲渲染：只统计 1 个运行中 + 1 个待验收', () => {
  const { tree } = render(false)
  const text = textOf(tree)
  assert(text.includes('1 个运行中'), '缺少运行中计数：' + text)
  assert(text.includes('1 个待验收'), '缺少待验收计数：' + text)
  assert(!text.includes('旧实验'), '归档会话不应出现')
  assert(!text.includes('随意的闲聊'), '普通空闲会话不应出现')
})

check('展开渲染：运行中置顶、待验收分区、项目名可见', () => {
  const { tree } = render(true)
  const text = textOf(tree)
  assert(text.includes('正在运行') && text.includes('已完成 · 待验收'), '缺少分区标题：' + text)
  assert(text.includes('重构登录页') && text.includes('待批准'), '运行中行缺信息：' + text)
  assert(text.includes('导出周报') && text.includes('自用工具箱'), '待验收行缺项目名：' + text)
})

check('未读联动：手动标未读的会话进入「已标记未读」并可跳转', () => {
  storageUnread = ['idle-1']
  slotEntries = [{ slot: 'sidebar.session.row.leading', id: 'session-unread-dot' }]
  const { tree } = render(true)
  const text = textOf(tree)
  assert(text.includes('1 条未读'), '横条未读计数缺失：' + text)
  assert(text.includes('已标记未读'), '缺少未读分区：' + text)
  assert(text.includes('随意的闲聊'), '未读会话没出现：' + text)
  const row = findRow(tree, '随意的闲聊')
  assert(row && typeof row.props.onClick === 'function', '未读行不可点击')
  row.props.onClick()
  assert(ctx.opened === 'idle-1', '点击未跳转到该会话，实际：' + ctx.opened)
  storageUnread = []
  slotEntries = []
})

check('dsh-session-unread 停用后，未读标记整块消失', () => {
  // localStorage 里仍留着旧标记，但槽位里没有它的注册——按停用处理。
  storageUnread = ['idle-1']
  slotEntries = []
  const { tree } = render(true)
  const text = textOf(tree)
  assert(!text.includes('已标记未读'), '未读分区仍然占位：' + text)
  assert(!text.includes('1 条未读'), '横条未读计数仍然占位')
  assert(!text.includes('随意的闲聊'), '停用后不应再列出未读会话')
  storageUnread = []
})

check('边界：归档的未读不出现，运行中的未读不重复列', () => {
  storageUnread = ['arch-1', 'run-1']
  slotEntries = [{ slot: 'sidebar.workspaces.session.menu.item', id: 'session-unread-toggle' }]
  const { tree } = render(true)
  const text = textOf(tree)
  assert(!text.includes('旧实验'), '归档会话的未读标记不应出现')
  const hits = (text.match(/重构登录页/g) || []).length
  assert(hits === 1, '同一会话只应出现一次，实际 ' + hits + ' 次')
  storageUnread = []
  slotEntries = []
})

check('空快照不崩', () => {
  openInitial = true
  const empty = { useSessions: (s) => s(null), useSessionStatus: (s) => s(null), useWorkspaces: (s) => s(null) }
  const state = { hookSlots: {} }
  const tree = renderTree(createElement(registered.component, empty), state)
  assert(textOf(tree).includes('眼下没有要验收的任务'), '空态文案缺失')
})

check('没有注入 hooks 也不崩', () => {
  const tree = renderTree(createElement(registered.component, {}), { hookSlots: {} })
  assert(textOf(tree).includes('读不到会话数据'), '缺省文案缺失')
})

if (failures > 0) {
  console.error('\n' + failures + ' 项失败')
  process.exit(1)
}
console.log('\n全部通过')

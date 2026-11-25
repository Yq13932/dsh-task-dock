// 把 src/client-body.js + src/client.css 打包成 DSH 浏览器插件 bundle。
// 用法：node tools/build-client.mjs
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')

const bodyTemplate = fs.readFileSync(path.join(root, 'src/client-body.js'), 'utf8')
const css = fs.readFileSync(path.join(root, 'src/client.css'), 'utf8')

const body = bodyTemplate.replace('__CSS__', JSON.stringify(css))

const bundle = `/* dsh-task-dock · built by tools/build-client.mjs · 不要手改本文件 */
window.__ModuleLoader__.load({
  id: "dsh-task-dock",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;

${body}

    return module.exports;
  }
});
`

const outDir = path.join(root, 'lib')
fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'client.js'), bundle)
console.log(`wrote lib/client.js (${Buffer.byteLength(bundle)} bytes)`)

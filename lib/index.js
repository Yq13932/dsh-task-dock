/**
 * Node 半边：任务坞的全部贡献都在浏览器侧（lib/client.js），
 * 这里只让插件在 Loader 里占一行，便于启用/停用与出现在插件列表。
 * @module dsh-task-dock
 */
/** Loader-visible no-op body; the browser half carries the feature. */
export function apply() {}

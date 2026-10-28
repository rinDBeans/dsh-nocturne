/**
 * dsh-nocturne —— 宿主半。
 *
 * 这个皮肤不需要宿主做任何事：纸、灯、辉光全在浏览器半（lib/client.js）里，
 * 配色靠 CSS 自定义属性覆盖，没有服务端状态，也没有设置命名空间。
 * 保留一个空插件，是为了让 cordis loader 有一个可装载的宿主条目。
 */
export const name = 'dsh-nocturne';

export function apply() {
  // 有意为空。
}

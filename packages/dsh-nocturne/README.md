# dsh-nocturne

把 [Typewriter Nocturne](https://github.com/Chaosnap/Typewriter-Nocturne)（MIT）的**纸、灯与墨**
搬进 DeepSeek Harness 的浏览器界面。不含拟物打字机。

不是换配色，是换渲染管线：一张 WebGL2 双通道着色器画出来的纸，盖在界面之上做 `multiply`，
所以每一行字都被同一盏灯照着。

## 装

```bash
node install.cjs --dry-run     # 看它要改哪些文件
node install.cjs               # 装进 desktop 档案（--profile web 可换）
# 重启 DSH
```

撤：

```bash
node install.cjs --revert
```

装之前会备份 `package.json`。只改两处：`dependencies` 里加 `file:` 依赖、
`dsh.profile.bundles` 里加本包名。装载条目由包自带的 `cordis.patch.yml` 提供。

## 用

右下角有一枚「缮写室」把手，点开就是面板：房间三选一、纸六选一、台灯开关、
灯强 / 光锥 / 柔边 / 颗粒 / 尘埃 / 纸纹深度六个滑杆、光标三态（墨迹 / 羽毛 / 原生）。
选择写进 `localStorage`，下次启动沿用。

面板与样张是同一个 `buildStudio()`，所以两处不会走样。控制台也还能用：

```js
__dshNocturne.use('cotton')        // onionskin | cotton | laid | linen | parchment | night
__dshNocturne.use('parchment', {intensity: 1.35, grain: 0.25})   // 上游的 cinematic 灯预设
__dshNocturne.theme('midnight-study')   // paper-and-ink | midnight-study | moonlit-poetry
__dshNocturne.lamp(false)          // 关灯，只剩环境光
__dshNocturne.off()                // 当场卸掉
```

选择写进 `localStorage`，下次启动沿用。

## 桌面版

桌面版每次启动端口随机，GUI 的 origin 跟着变，`localStorage` 会空。所以这个包带宿主半
（`lib/index.js`）：设置落盘到 `$DSH_HOME/cache/dsh-nocturne/settings.json`，
客户端启动时通过 `/dsh-nocturne/settings` 取回来，取不到才用本地缓存。
宿主半没装（例如只拷了浏览器半）时会静默退回缓存，不会报错。

## 与 dsh-claude-style 共存

默认「自动」：探测到 claude-style 在覆盖同一批 `--dsw-alias-*`，就让位成**只叠材质**——
保留它的配色与形状，只把纸与灯叠上去。想让它接管配色，缮写室里把「共存」切成「接管配色」。

## 原理

```
两个 canvas 直接挂在 <body> 下（不能包带 z-index 的容器，会把 mix-blend-mode 关进隔离栈）
  canvas[data-dn="paper"]  mix-blend-mode: multiply   ← albedo × irradiance
  canvas[data-dn="glow"]   mix-blend-mode: screen     ← 光池 / 尘埃 / 灯焰 / 光标辉光
配色走 --dsw-alias-* 覆盖，纸与墨的色值取自上游 papers.ts
```

灯挂在输入光标上（±30% 偏移），所以你打字时脚下那束光会跟着游走。

## 改

渲染核心**不在这个包里**。它由 `tools/build.mjs` 从 `sample/nocturne-desk.html` 抽取，
所以样张和宿主永远不会走样。改渲染请改样张，然后：

```bash
node tools/build.mjs
```

## 许可

MIT。上游 Typewriter Nocturne © Chaosnap（含 Vercel / Hyper 的原始版权声明）。
字体 EB Garamond、Cormorant Garamond、Courier Prime 为 SIL Open Font License 1.1。

# Nocturne · 纸、灯与墨

> 取代 `docs/design-plan.zh.md` §4.6 与 §6.2 里"用 SVG feTurbulence 近似纸纹、不复用 GLSL"的决定。
> 那一版出来的东西是一张静态贴图——没有光，所以不像纸。

---

## 1 · 为什么第一版不像

| | Typewriter-Nocturne | v1（`sample/p0-parchment.html`） |
| --- | --- | --- |
| 纸面 | WebGL2 双 pass：surface 出 albedo + 法线，light pass 算辐照度 | 一层 `feTurbulence` 灰噪声 |
| 光照 | 锥体灯 + 平方反比 + Lambert + `1−e^{−E·k}` 曝光 | 无 |
| 合成 | canvas 以 `mix-blend-mode: multiply` 盖在文字上 | 背景色直绘 |
| 暗角 | 着色器内的 `smoothstep` 渐晕 + CSS 的 `#vignette` | 无 |
| 结果 | 一张被灯照着的纸 | 一块米色 |

差别不在配色，在**渲染管线**。配色可以照抄，管线不能近似。

## 2 · 逐层移植对照

| 上游 | 本仓库 |
| --- | --- |
| `lib/nocturne/lighting/paper-light.ts` 的 SURFACE / LIGHT 两段 GLSL | `sample/nocturne-desk.html` 里同名两段，**未改一字**（唯一新增 `uPaper`，见 §4） |
| `app/nocturne/light-model.ts`（`irradiance` / `windowGobo` / `toneMap`） | 同名 JS 函数逐行移植 |
| `lib/nocturne/lighting/glow-layer.ts`（光池、尘埃、灯焰、光标辉光） | `GlowLayer` 类逐行移植 |
| `app/nocturne/papers.ts` 六张纸 + 墨色 + 16 色 ANSI | `PAPERS` 原样 |
| `app/nocturne/themes.ts` 三套主题 | `THEMES` 原样 |
| 字族 EB Garamond / Courier Prime / Cormorant（OFL） | `sample/fonts/` 本地化，25 个 woff2 共 792 KB |

渲染分三层，与上游一致：

```
#sheet  background: 纸色
  #text   ← 正文（DOM 里的字，不是 canvas）
  #paper  ← multiply：albedo × irradiance
  #glow   ← screen：光池 / 尘埃 / 灯焰
  #vignette
```

## 3 · 三个有意的改动（其余一律照搬）

### 3.1 纸纹按纸的物理尺寸缩放 —— `uPaper`

上游的噪声频率是按 ~660×620 的纸调的。同一组频率铺到 1200px 的纸上，斑块相对变小，
观感从"陈年纸的云斑"变成"麻点"。所以低频结构（云斑、纤维束、水渍、烧边）统一除以
`uPaper = √(W·H)/700`，**高频纸齿（`noise(p*1.9)`）、帘纹、麻纹、锈斑保持像素级**——
它们是真·物理尺寸，不该跟着画布放大。

### 3.2 灯座从"打字机小车"改挂"输入光标"

上游的灯装在小车上，随光标横向移动。去掉打字机后，若照搬，光锥会永远挤在左边缘
（正文界面的光标总在左）。改成：**灯座钉在纸心，只随光标偏移 ±30%**。
光锥仍是构图主体，但保留了"光跟着你写的地方走"的手感。

### 3.3 环境光下限 0.55 → 0.64

上游 `ambientFloor()` 保证墨/纸 ≥ 4.5:1。实测：这正好够等宽的终端字，
但衬线散文笔画细、字面小，同样的下限让正文发灰（实测 p3 亮度 70，上游同区域 45）。
下限抬到 0.64 后 p3 落到 52、纸面 p85 保持 125——差值从 55 提到 73，逼近上游的 79。
这是唯一一处"照抄会难看"的地方，理由如上，不是随手调的数字。

## 4 · 对齐验证

同一视口（`1440×900`）、同一张纸（parchment）、同一套灯预设（TN balanced：intensity 1、
spread 74°、reach 1、softness 0.65、film grain 0.1），与上游官方截图逐项比：

| 指标 | 上游 | 本实现 |
| --- | --- | --- |
| 纸面亮度 均值 | 112.5 | **117.2** |
| p50 | 114.7 | **113.9** |
| p95 | 177.8 | **177.8** |
| 峰值 | 215.2 | **212.2** |
| 正文墨/纸亮度差（p3 vs p85） | 79.2 | **73.0** |

逐像素一致做不到（上游那张截图里有 3D 打字机，构图也不同），但**色调分布已经落在同一个桶里**。
并排图见 `docs/previews/reference-vs-nocturne.png`。

> 顺带记一个坑：`mix-blend-mode` 的元素只要被包进一个带 `z-index` 的容器，就会被关进
> 隔离栈里与页面断开，multiply 退化成直接覆盖（实测三组对照：裸挂 `body` 正常合成，
> 包一层 fixed 容器后只剩源色）。所以两片 canvas 直接挂在 `document.body` 下。

## 4.5 · 六张纸 × 三个房间

上游的纸与主题是**正交**的：主题管桌子与灯，纸管纸与墨。所以不是一张纸，是 6 × 3 = 18 种组合。

| id | 名称 | 纸色 | 性格（决定它长什么样的 surface 参数） |
| --- | --- | --- | --- |
| `onionskin` | 葱皮纸 | #f2f1ea | **上游默认**。极薄极平，crinkle 仅 0.08 |
| `cotton` | 棉浆纸 | #eee6d5 | 毡压而非褶皱：cold-press 水彩纸那种圆润纸齿，纤维里还有零星长丝（felt 1.0） |
| `laid` | 帘纹纸 | #f1e9d6 | 横向帘线 4.2px + 纵向链线 96px |
| `linen` | 亚麻纸 | #ebe5d8 | 3.4px 交叉织纹 + 竹节（slub） |
| `parchment` | 羊皮纸 | #efdfbd | 云斑 mottle 1.0 + 做旧 0.75：狐斑、水渍、折痕、烧边 |
| `night` | 夜纸 | #1d1a20 | 暗纸浅墨，为夜间工作 |

| id | 房间 | 灯源 | 房间色 |
| --- | --- | --- | --- |
| `paper-and-ink` | Paper & Ink | 字锤小灯（carriage） | #241a14 |
| `midnight-study` | Midnight Study | 桌面台灯（desk-lamp，#ffb35c） | #140f0b |
| `moonlit-poetry` | Moonlit Poetry | 月窗（moonlight，#c9d4ff） | #0e0e1a |

样张底部两条切换条就是这六个纸与三个房间，深链一一对应：
`?paper=cotton&theme=moonlit-poetry`。

比对图：`docs/previews/papers-matrix.png`（整幅）+ `docs/previews/papers-texture.png`（1:1 纸纹）。

> 注：本仓库样张的默认纸是 **parchment**（跟随这个工作区的命名），上游默认是 **onionskin**。
> 想完全照上游，把 `SETTINGS.paper` 改成 `'onionskin'`。

### 顺带修掉的一个真 bug

做这张矩阵时发现的：月光的窗格我原先借用了台灯的 `softness`（0.65），算出来柔边 30px，
比窗格本身还宽——3×2 的方窗糊成一片白。上游的窗光是一组**独立参数**（窗格数列、斜度、柔边），
照搬过来后窗格立刻成形（见 `papers-matrix.png` 第三行）。

## 4.8 · 墨迹光标

上游的 `components/block-cursor.tsx` 是一块**洇进纸里的墨**：边缘软、边上稍深（墨积在那里）、
底下那个字用纸色反白；它躺在纸光之下，所以灯把它和字一起照亮。

| 上游 | 本仓库 |
| --- | --- |
| `SINK` / `SPREAD` / `FRESH` / `FRESH_HALO` 四组关键帧 | 原样（1700ms 呼吸 + 650ms 静置） |
| `.tn-ink-blot` 的 `border-radius: 22% 14% 18% 12% / 12% 20% 10% 18%`、双层内阴影、`blur(.3px)` | 原样 |
| 失焦只剩淡轮廓（`opacity .45` 描边） | 原样 |
| 暗纸取浅墨 | 原样 |

![墨迹光标（5×）](previews/ink-cursor.png)

### 兼容层（这一层是新写的）

上游的光标跟着 xterm 的 `CursorFrame` 走——那是一套现成的字格坐标。宿主这边没有，得自己量：

| 场景 | 处理 |
| --- | --- |
| `contenteditable`（DSH 编辑器的形态） | `Range.getClientRects()` 取末矩形；零尺寸时用节点包围盒兜底 |
| `input` / `textarea` | canvas 量前缀宽度 + `scrollLeft` |
| **字宽** | 按光标下那个字的实际字形量：中日韩 ~1em、拉丁 ~0.55em，墨块才不挤字 |
| **IME 合成中** | 立刻让位：墨块藏起、`caret-color` 还原，候选框位置不受影响 |
| **非折叠选区** | 让位（选了字就不该有块光标） |
| 量不出来 / 光标移出视口 | 让位并还原原生光标——宁可没有装饰，不能没有光标 |
| `prefers-reduced-motion` | 不呼吸、不溅墨 |
| **性能** | 量选区要强制回流，所以只在"确实动过"或每 250ms 兜底时才量；否则沿用上次位置 |
| 卸载 | 移除监听、清掉 `caret-color`，宿主恢复原样 |

开关：样张里它默认开着；插件里 `__dshNocturne.caret(false)` 关掉，宿主自己的光标立刻回来。

样张深链可以单看它：`?caret=继续写什么&caretAt=3`（把光标放到第 3 个字后面）。

## 4.9 · 缮写室 Studio

上游的 Studio 是一块悬在桌上的深色玻璃面板。这里用同一份 `buildStudio()` 生成——
**样张和插件调用的是同一个函数**，所以两处的面板不会长歪。

![缮写室](previews/studio-panel.png)

| 段 | 控件 | 落到哪个参数 |
| --- | --- | --- |
| 房间 | 三选一，色块是「房间色 → 光色」的斜切 | `SETTINGS.theme`（房间、灯源、装饰金、渐晕） |
| 纸 | 六选一，色块是纸色 | `SETTINGS.paper`（纸色、墨色、纸面参数） |
| 台灯 | 开关 | `SETTINGS.lamp` |
| 灯 | 灯强 / 光锥 / 柔边 / 胶片颗粒 / 光里尘埃 | 直接改 uniform，即时可见 |
| 纸纹深度 | 0–160% | 唯一需要重建 surface pass 的一项（会重算 albedo 与法线贴图） |
| 光标 | 墨迹 / 羽毛 / 原生 | `SETTINGS.cursorMode` |

![羽毛笔（8×）](previews/quill-cursor.png)

**羽毛笔也是移植的**，不是画的图：`quill-cursor.tsx` 里那套几何（笔脊三次贝塞尔、
羽枝 30 + 22 根按 `sin` 分布求宽、两道分叉的高斯凹陷、锥形笔脊、角质笔杆、鎏金笔箍与笔尖）
全部照搬，只在原点上画一支再整体右倾 35°。笔尖落在基线上，整支高 1.15 行。

插件里的样子（面板悬在纸光之上，不被灯压暗——上游也是如此，Studio 属于窗框不属于纸面）：

![插件里的缮写室](previews/dsh-plugin-studio.png)

样张深链：`?studio=1&cursor=quill&caret=继续写什么&caretAt=3`。

## 5 · 交付物

| 路径 | 是什么 |
| --- | --- |
| `sample/nocturne-desk.html` | 单文件样张：六张纸、灯开关、墨迹光标、深链参数。**这是渲染真源** |
| `sample/fonts/` | 本地化的 EB Garamond / Courier Prime / Cormorant（OFL） |
| `packages/dsh-nocturne/` | DSH 客户端插件。`lib/client.js` 由 `tools/build.mjs` **从样张抽取**核心代码生成 |
| `docs/previews/nocturne-*.png` | 三张纸的 headless 渲染 |
| `docs/previews/dsh-plugin-shell.png` | 插件在模拟 DSH 外壳里装载后的样子 |
| `docs/previews/ink-cursor.png` / `ink-cursor-dsh.png` | 墨迹光标：样张（input）与插件（contenteditable） |
| `docs/previews/studio-panel.png` | 缮写室面板（样张） |
| `docs/previews/quill-cursor.png` | 羽毛笔光标 8× |
| `docs/previews/dsh-plugin-studio.png` | 插件里的缮写室 |

样张深链：`?paper=cotton|laid|linen|onionskin|parchment|night&lamp=0&theme=midnight-study`。

## 6 · 安装插件

```bash
cd packages/dsh-nocturne
node install.cjs --dry-run      # 先看要改什么
node install.cjs                # 装进 desktop 档案
# 重启 DSH
node install.cjs --revert       # 撤掉
```

它只做两件可逆的事：把包拷进档案的 `node_modules`、在 `package.json` 里登记依赖与 bundle
（装载条目由包自带的 `cordis.patch.yml` 提供，与 dsh-dream-skin 同一套做法）。
**没有自动执行**：GUI 需要一次性令牌，本机拿不到，所以装完无法当场验证；
留给你一次 `--dry-run` + 一次重启，比替你赌一把更稳。

## 7 · 没做的

- **拟物打字机**（Three.js 模型、字锤、滑架、压纸杆）——按你的要求去掉。
- **敲击音效**、**拉绳开关**——上游有，本移植不做。
- **设置页**——插件目前没有 UI，改纸种走控制台：
  `window.__dshNocturne.use('cotton')` / `.lamp(false)`。持久化在 `localStorage`。

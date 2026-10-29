> ⚠️ **这份是 v1 方案，仅作决策留痕，不是当前需求或验收清单。**
> 其中 §4.6「用 SVG feTurbulence 近似纸纹」与 §6.2「不复用 GLSL」已被推翻；设置页、拟物件和终端范围也有后续调整。
> 现行实现见 [`docs/nocturne.md`](nocturne.md)，当前边界见 [`docs/requirements.md`](requirements.md)。
>
# dsh-scriptorium · 缮写室

> DSH 复古羊皮纸主题 · 整体设计方案 v1
> 日期：2026-10-28 · 目标宿主：DeepSeek Harness 0.2.1-rc.3（Desktop / Web 客户端插件）
> 上游灵感：[Chaosnap/Typewriter-Nocturne](https://github.com/Chaosnap/Typewriter-Nocturne)（MIT）

---

## 0. 一句话

把 DSH 的**聊天会话区**变成一张有厚度的羊皮纸，字落上去像墨；**侧栏、菜单、对话框只换配色、不贴纸**；**侧栏终端**改成纸上的打字稿配色并换等宽复古字；再用一个**独立的「缮写室」设置页**控制纸张、字体与六件拟物件。以 DSH 官方客户端插件的形式实现，**不 fork、不改 asar**。

---

## 1. 目标与非目标

### 目标

1. 会话区呈现为一张真实可感的羊皮纸：纸纹、纸边厚度、中心受光、四边渐晕。
2. 文字像墨落在纸上：衬线正文、暖黑墨色、蓝黑水彩选区、可选墨迹/羽毛笔光标。
3. 六件拟物件可用、可关：纸边光、纸夹滚动条、墨迹光标、蜡封强调、打字机落字动画、羽毛笔光标。
4. 外观完整贯通明暗两态：浅色是羊皮纸，暗色是**夜纸**（炭色纸 + 暖墨），不是「羊皮纸 + 黑色补丁」。
5. 有一个只属于本主题的设置页「缮写室」，三段式并有实时预览。
6. 终端与主界面同族：跟随当前纸色的 16 色 ANSI + 等宽复古字。
7. 全程守住可读性底线：正文与关键文字在各自纸面上的对比度不低于 4.5:1（详见 4.4 的实测数字与两条硬结论）。

### 非目标（明确不做，避免范围蔓延）

| 不做 | 原因 |
| --- | --- |
| 敲击音效 | 第二轮拟物清单中未勾选。留 WebAudio 挂点，留待将来以「默认关闭」形式加入 |
| 拉绳开关彩蛋 | 同上未勾选；趣味性高、实用性低 |
| Three.js 3D 打字机 / GLSL 光照 | TN 是 Electron + WebGL 桌面应用，DSH 是 DOM 应用，这部分无法迁移也无需迁移 |
| fork DSH 或修改 app.asar 内 dist | 每次 DSH 升级即失效；且 DSH 已提供 `ctx.theme` 与 `settings.section` 两条官方扩展点 |
| 重做 DSH 的布局与交互 | 本方案只改视觉与主题，不动信息架构 |

---

## 2. 事实基线（全部已核实）

这一节是本方案的证据基础。每条都在本机或公开仓库里核对过，不是推测。

### 2.1 主题机制：token 覆盖，不是改代码

- DSH 的配色权威是 `--dsw-*` 静态色阶 + `--dsw-alias-*` 语义别名，由 `dsh-client-ui-theme` 的 8 张样式表持有。
- 第三方主题的官方扩展点是**注册带别名 token 覆盖的主题 id**（`ctx.theme`），覆盖层折入当前快照。
- 组件 CSS 实际引用 **55 个** `--dsw-alias-*` token（证据：`docs/evidence/dsh-alias-tokens.txt`）。
- 你机器上已装的 `dsh-dream-skin` 只覆盖 **25 个** token 就成型了——说明部分覆盖可用，未覆盖的回落内置色板。

**含义**：羊皮纸 = 一张 token 覆盖表，不需要触碰任何 DSH 组件。

### 2.2 设置页扩展点：在装机版本上验证过

在实际运行的 0.2.1-rc.3 的 `dsh-client-ui-settings-general/lib/client.js` 里读到的 slot 声明：

```
settings.section     settings.general.item   settings.header     settings.action
settings.launcher    settings.onboarding     settings.trigger    settings.close
settings.open        remote.settings         sidebar.settings    sidebar.toggle.badge
```

**含义**：「新开一整页」走 `settings.section`，与「在通用分区加一行」是两条并行扩展点。你要的独立页是原生支持的，不必迁就。

### 2.3 插件装载：已有成熟路径

参考 `dsh-dream-skin`（本机 `~/.dsh/apps/dsh-tavern/tavern-plugin/packages/dsh-dream-skin`）：

- `package.json` 的 `dsh.bundle.patch` 指向一个 `cordis.patch.yml`，内容只是往 profile 里 insert 一个 loader 条目；
- `dsh.client.inject` 列出需要注入的客户端服务（本方案需要 `ui-theme`、`ui-settings`、`ui-settings-general`、`client-locale`、`client-runtime`）；
- `dsh.client.platform: web` + `immediately: true`；
- 构建产物为 `lib/index.js`（Host 半）+ `lib/client.js`（浏览器半）。

**含义**：装机路径不用发明，照抄即可；宿主 peer 依赖范围照 dream-skin 的 `>=0.1.0-rc.6 <0.3.0` 对齐。

### 2.4 终端：DSH 没有 TUI

- asar 内不存在任何 TUI / Ink 渲染包；终端是 Web GUI 的**侧栏终端**（`dsh-client-ui-sidebar-terminal`）。
- 它按**等宽字符网格**渲染：背景只能整块着色，纸纹贴图会被字符层覆盖；字号改变会触发整网格重排。
- DSH 已把终端字体与字号做成独立设置（10–20px，默认 13px）。

**含义**：终端这一面的「显示逻辑不同」是真实且不可绕过的，方案见第 9 节。

### 2.5 字体：DSH 已经给了三个档位

`--dsh-font-family-text` / `-code` / `-terminal` 三档自定义 font-family，用户输入逗号分隔列表，服务端规范化后持久化；正文 10–22px（默认 14）、代码 10–16px（默认 11）、终端 10–20px（默认 13）。

**含义**：本主题对字体的贡献 = 随包分发英文字族 + 在用户列表**之前**排入本主题的字体栈，而不是另造一套设置。

### 2.6 上游资产：MIT，但没有位图

- LICENSE = MIT（含 Vercel/Hyper 的原始版权声明），复用合法，保留声明即可。
- 上游仓库 296 个文件中**没有任何纸纹图片、字体文件、音频文件**：纸由 shader 程序化生成，音效由 WebAudio 合成，字体靠 npm/OFL 声明。
- 因此可复用的是**配方**（色值 + 纸面参数 + 算法），这恰好比贴图更适合 DOM 环境。

已提取的原始数据见 `docs/evidence/tn-papers.json`。

---

## 3. 设计决策记录

| # | 决策 | 理由 | 影响面 |
| --- | --- | --- | --- |
| D1 | 会话区做纸，全外壳**只跟随配色** | 纸纹铺满全屏会伤可读性并让界面躁；配色跟随可保视觉一致 | token 层覆盖 40–55 个；材质层只作用于会话容器 |
| D2 | 复用 TN 配方且**不计成本保原味** | 明确要求保留原资产的优越性 | 6 张纸参数、16 色 ANSI、墨/选区色值全部照搬；拟物件按 TN 手感重写 |
| D3 | 浅色羊皮纸 + **夜纸**暗色配对 | 羊皮纸天然浅色，只做浅色会让暗色用户看到零效果 | 两套 token 全量维护；夜纸层级靠色温而非明度分离（见 4.4） |
| D4 | **不做音效与拉绳** | 第二轮拟物清单未勾选 | 留挂点，不实现 |
| D5 | 六件拟物件：纸边光、纸夹滚动条、墨迹光标、蜡封、落字动画、羽毛笔 | 勾选集合 | P3 阶段实现，逐件可关 |
| D6 | 终端**配色跟随当前纸** + 等宽复古字 | 保持整体贯通；终端网格无法承载纸纹，配色是唯一有效通道 | 需要 16 色 ANSI 两套映射 + 对比度校验 |
| D7 | 中文回落系统字体栈 | 零授权风险、插件仅增重约 200–500KB | 中文观感依赖用户机器；栈里前置常见可免费商用的中文衬线/楷体候选 |
| D8 | 正文 EB Garamond，代码/终端 Courier Prime | 散文读感优先，代码保持打字机感，对比反而更像手稿 | 打包 2 个 woff2 字族（OFL，可随包分发） |
| D9 | 六张纸全发，默认停在 parchment | 六张的 surface 参数差异肉眼可辨 | 设置页纸种选择器需 6 个带纸样缩略的选项 |
| D10 | 设置页走 `settings.section` 独立成页 | 装机版本已声明该 slot（2.2） | 与「通用」分区解耦，不污染原生设置 |
| D11 | 设置页三段式 + 页内实时预览 | 纸纹强度、落字动画这类感受型参数盲调必然调错 | 需要内置一段样例会话 + 主题上下文注入 |
| D12 | 先出可点静态样张，再写插件 | 避免按错误审美做完整个插件 | P0 阶段交付单文件 HTML 样张 |
| D13 | 命名 dsh-scriptorium /「缮写室」 | 命名空间 `dsh-scriptorium:*` | 包名、设置键、界面标题统一 |
| D14 | 不 fork、不改 asar | 升级即失效，且官方扩展点已足够 | 插件形态，随 DSH 升级可维护 |

---

## 4. 视觉系统

### 4.1 六张纸（数值直接来自 TN）

| id | 名称 | 底色 | crinkle | felt | laid | linen | mottle | age |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| onionskin | 葱皮纸 | #f2f1ea | 0.08 | 0 | 0 | 0 | 0.04 | 0 |
| cotton | 棉浆纸 | #eee6d5 | 0.30 | 1.00 | 0 | 0 | 0.08 | 0 |
| laid | 帘纹纸 | #f1e9d6 | 0.22 | 0 | 1.00 | 0 | 0.18 | 0 |
| linen | 亚麻纸 | #ebe5d8 | 0.20 | 0 | 0 | 1.00 | 0.08 | 0 |
| **parchment** | **羊皮纸** | **#efdfbd** | **0.25** | **0** | **0** | **0** | **1.00** | **0.75** |
| night | 夜纸 | #1d1a20 | 0.30 | 0 | 0 | 0 | 0.10 | 0 |

纸面参数在 Web 端的落地方式见 6.2：不引入位图，用 SVG `feTurbulence` + 多层渐变把这六个数值编译成四层叠加背景。

### 4.2 墨

| 角色 | 浅色（羊皮纸系） | 暗色（夜纸） |
| --- | --- | --- |
| 主墨 ink | #2a2019 | #e6e1ea |
| 次级墨 inkMuted | #6b5f52 | #9a94a6 |
| 光标 | #3a2c20 | #e9e7ff |
| 选区 | rgba(52, 64, 112, 0.2) 蓝黑水彩 | rgba(196, 188, 255, 0.2) |

选区那个蓝黑水彩是这套主题品格的关键：不是灰色高亮，而是墨在纸上洇开的一层蓝。

### 4.3 层级推导规则

DSH 有 bg 五级、border 四级、label 三级的层级结构，必须成体系推导，不能逐格拍脑袋：

- **bg 层级 = 纸与光的距离**。`layer-1`（侧栏/面板）是纸的背光面，比 base 深一档；`layer-2`（卡片/代码块）更深一档；`layer-3/4`（菜单/浮层）反过来比 base 浅，因为浮层更靠近光源。
- **border 层级 = 同一种墨的四档透明度**。l1 0.10 → l2 0.16 → l3 0.24 → l4 0.32，全部取自主墨，因此描边永远与纸同温，不会出现冷灰线。
- **label 层级 = 墨的三档**。primary 用满墨，secondary 用 inkMuted，tertiary/dimmed 再向纸色方向衰减 30%。
- **强调色不是金色**。见 4.4：金色在浅纸上无法通过对比度，必须分「装饰金」与「文字金」两支。

### 4.4 对比度审计（实测，不是估计）

WCAG 相对亮度公式实测：

| 前景 | 背景 | 对比度 | 判定 |
| --- | --- | --- | --- |
| #2a2019 主墨 | #efdfbd 羊皮纸 | **12.10** | 通过 |
| #6b5f52 次级墨 | #efdfbd | **4.72** | 勉强通过 |
| #2f5277 蓝黑链接 | #efdfbd | **6.15** | 通过 |
| #9c3a2a 红 | #efdfbd | **5.23** | 通过 |
| #4c6b2f 绿 | #efdfbd | **4.62** | 勉强通过 |
| #8a6a1c 琥珀 | #efdfbd | **3.84** | 仅大字号可用 |
| #b08a4a 装饰金 | #efdfbd | **2.43** | **不通过** |
| #fffdf6 白字 | #b08a4a 金底 | **3.14** | **不通过** |
| #2a2019 主墨 | #b08a4a 金底 | **4.99** | 通过 |
| #e6e1ea 夜墨 | #1d1a20 夜纸 | **13.37** | 通过 |
| #9a94a6 夜次级 | #1d1a20 | **5.87** | 通过 |
| #c9a45c 夜金 | #1d1a20 | **7.33** | 通过 |

**硬结论一：金色必须拆成两支。**

- **装饰金 #b08a4a**：只用于蜡封、描边、图标、填充块——绝不承载文字。
- **文字金 #6f5420**（5.38:1，在 layer-2 #e6d5b0 上仍有 4.89:1）：用于需要金色语气的文字，例如强调链接、版本号、蜡封标签。
- **主按钮反相**：金底 #b08a4a 上必须用**墨字 #2a2019（4.99）**而不是白字（3.14）。这条会直接改变 DSH 默认的主按钮观感，是有意的。

**硬结论二：夜纸的层级不能靠明度区分。**

#1d1a20 与抽出的 #22202a 对比度仅 **1.07**，#17151a 与 base 仅 **1.05**——用户根本分不出层级。因此夜纸层级靠**色温**分离：base 偏暖紫（#1d1a20），侧栏/面板偏冷中性（#22202a），卡片更深更暗（#17151a），浮层更亮更冷（#262430 / #2b2936）。这是从 TN 的 Night 纸与 Midnight Study 主题里读出来的做法，不是发明。

### 4.5 排版

| 档位 | 字族 | 说明 |
| --- | --- | --- |
| 正文 / 界面 | EB Garamond → 系统衬线 → 中文宋体/楷体 | 中文回落链示例：Source Han Serif SC、Songti SC、SimSun、LXGW WenKai |
| 代码 | Courier Prime → IBM Plex Mono → 等宽回落 | 打字机字形，与衬线正文形成手稿对比 |
| 终端 | Courier Prime → IBM Plex Mono → monospace | 必须严格等宽；Nerd 图标走 Symbols Nerd Font 回落 |

- 字号沿用 DSH 三档（正文 10–22 / 代码 10–16 / 终端 10–20），本主题只提供默认值与字体栈，不另造刻度。
- 行高与字号必须成对（DSH 样式规范要求），正文行高取 1.7——衬线在大字号下需要比无衬线更松。
- 中文与拉丁混排时衬线字族的标点压迫感较强，中文段落需额外 0.02em 字距，属实现细节。

### 4.6 纸面材质（程序化）

四层叠加，全部可关：

1. **底色层**：纸的本色。
2. **纤维层**：SVG `feTurbulence`（fractalNoise，baseFrequency 由 crinkle 映射）作为 mask，叠一层极低透明度墨色，得到毛边与颗粒。
3. **帘纹/毡纹层**：laid → 单向重复细线；felt → 双向高频点阵；linen → 交叉细纹。三者互斥，由参数决定强度。
4. **受光层**：中心偏上的径向高光 + 四边内阴影（纸边厚度）+ 极淡的 age 斑驳（parchment 专有）。

**性能约定**：纤维层的 SVG 以 data URI 内联（不走网络、不占额外文件），且只在**会话容器**上生效，不铺到侧栏与菜单。

---

## 5. Token 映射表

下表是核心映射（浅色 / 暗色）。表外约 20 个 token 按 4.3 的规则生成，实现时逐条对账。

| token | 浅色（羊皮纸） | 暗色（夜纸） | 备注 |
| --- | --- | --- | --- |
| bg-base | #efdfbd | #1d1a20 | 纸本色 |
| bg-layer-1 | #e9d9b6 | #22202a | 侧栏/面板（背光面） |
| bg-layer-2 | #e6d5b0 | #17151a | 卡片/代码块 |
| bg-layer-3 | #f2e4c6 | #262430 | 菜单/浮层（近光） |
| bg-layer-4 | #f6ebd3 | #2b2936 | 高层浮层 |
| bg-module-platform | #e9d9b6 | #22202a | 与 layer-1 同 |
| bg-mask-1 | rgba(42,32,25,.32) | rgba(6,5,4,.55) | 模态遮罩保留深色半透明 |
| bg-document-selection | rgba(52,64,112,.20) | rgba(196,188,255,.20) | 水彩选区 |
| label-primary | #2a2019 | #e6e1ea | 主墨 |
| label-secondary | #6b5f52 | #9a94a6 | 次级墨 |
| label-tertiary | #8a7d6b | #6f7192 | 三级墨 |
| label-dimmed | #8a7d6b | #6f7192 | 同上 |
| label-caption | #8a7d6b | #9a94a6 | 说明文字 |
| label-primary-foreground | #f7efdd | #1d1a20 | 深底上的反白（纸色） |
| label-error | #9c3a2a | #d88a9a | 取自 ANSI |
| label-shimmer | rgba(42,32,25,.18) | rgba(230,225,234,.18) | 扫光 |
| link | #2f5277 | #8ea8e0 | 蓝黑墨水 |
| menu-icon | #6b5f52 | #9a94a6 | |
| border-l1 / l2 / l3 / l4 | 主墨 α .10 / .16 / .24 / .32 | 夜墨 α .08 / .12 / .18 / .26 | 同墨异透 |
| border-l2-darkmode-thin | — | 夜墨 α .10 | |
| brand-primary（装饰金） | #b08a4a | #c9a45c | 描边/图标/蜡封，不作文字 |
| brand-text（文字金） | #6f5420 | #c9a45c | 需要金色语气的文字 |
| button-primary-fill | #b08a4a | #c9a45c | 配合墨字使用 |
| button-primary-hover | #c9a45c | #d9b878 | |
| interactive-bg-hover | 主墨 α .06 | 夜墨 α .06 | |
| interactive-bg-active | 主墨 α .10 | 夜墨 α .10 | |
| button-ghost-active-fill | 装饰金 α .18 | 夜金 α .20 | |
| button-ghost-active-border | 装饰金 α .45 | 夜金 α .45 | |
| state-success-primary | #4c6b2f | #9cc3a4 | |
| state-warn-primary | #8a6a1c | #e2cf9a | 文字场景降为 #6f5420 |
| state-error-primary | #9c3a2a | #d88a9a | |
| state-business-primary | #2f5277 | #8ea8e0 | 焦点环颜色 |
| state-idle-primary | #8a7d6b | #6f7192 | |
| markdown-code-block | #e6d5b0 | #17151a | 纸上的沉色块 |
| markdown-code-block-banner | #e0cda6 | #121016 | |
| markdown-inline-code | #e0cda6 | #262430 | |
| code-diff-added | rgba(76,107,47,.16) | rgba(156,195,164,.14) | |
| code-diff-deleted | rgba(156,58,42,.14) | rgba(216,138,154,.14) | |
| scrollbar-bg-l2 | 主墨 α .14 | 夜墨 α .12 | 纸夹场景下被接管 |
| scrollbar-hover-l2 | 主墨 α .26 | 夜墨 α .22 | |
| switch-thumb | #f7efdd | #c9a45c | |
| tooltip-bg / toast-bg | #2b231c | #262430 | 反相深底 |
| toast-label | #f7efdd | #e6e1ea | |
| tooltip-key-bg | #3a2f27 | #2b2936 | |
| menu-group-header-fill | rgba(233,217,182,.94) | rgba(38,36,48,.94) | 94% 不透明是 DSH 菜单材质约定 |

---

## 6. 架构

### 6.1 包结构

```
dsh-scriptorium/
├─ package.json          # dsh.bundle.patch + dsh.client.inject（照 dream-skin 范式）
├─ cordis.patch.yml      # 仅 insert 一个 loader 条目
├─ lib/
│  ├─ index.js           # Host 半：设置命名空间 dsh-scriptorium、静态资源路由
│  └─ client.js          # 浏览器半：主题注册 + 设置页 + 拟物层
├─ src/
│  ├─ theme/tokens.ts     # 6 纸 × 明暗 → --dsw-alias-* 映射表
│  ├─ theme/paper.ts      # surface 参数 → CSS 背景栈编译
│  ├─ settings/ScriptoriumSection.tsx
│  ├─ ornaments/ScrollClip.tsx      # 纸夹滚动条
│  ├─ ornaments/InkCursor.tsx       # 墨迹光标
│  ├─ ornaments/QuillCursor.tsx     # 羽毛笔光标
│  ├─ ornaments/WaxSeal.tsx         # 蜡封
│  ├─ ornaments/TypeStrike.tsx      # 落字动画
│  └─ terminal/ansi.ts              # 16 色 → 终端配色
├─ assets/fonts/          # EB Garamond、Courier Prime（OFL，含 LICENSE）
└─ LICENSE                # MIT + 上游 Typewriter-Nocturne 版权声明
```

### 6.2 三层，职责互不越界

| 层 | 做什么 | 不做什么 | 落地手段 |
| --- | --- | --- | --- |
| **token 层** | 建立纸的配色体系 | 不写任何选择器、不写 !important | 通过 `ctx.theme` 注册带 `--dsw-alias-*` 覆盖的主题 id |
| **材质层** | 会话容器的纸纹/纸边光/渐晕 | 不碰侧栏、菜单、对话框的背景 | 插件自有样式表 + 作用于会话容器的局部自定义属性 |
| **拟物层** | 六件拟物件的渲染与动效 | 不改动 DSH 的数据流与交互语义 | React 组件挂到会话区容器；滚动条与光标以覆盖层实现，保留原生行为 |

这个分层同时也是**风险隔离**：任一层出问题可单独关闭（设置页里每层都有总开关）。

### 6.3 与 DSH 原生主题的关系

- DSH 的 light/dark 二元**保持不变**，我们的「纸」是叠加其上的皮肤。
- 浅色 → 六张浅纸（默认 parchment）；暗色 → night 纸。
- 用户切换明暗时纸色随之切换，不丢失纸种选择（浅色选 parchment 时，暗色自动用 night）。
- ID 命名：`dsh-scriptorium:<paperId>`，注册进 `ctx.theme`，同时提供 `light`/`dark` 颜色声明供 DSH 判断快照。

### 6.4 生命周期与持久化

`ctx.theme` 的第三方主题 id 是**进程内扩展，不跨越内置 settings schema 持久化**（官方已知限制）。因此：

- 主题选择、纸种、纸纹强度、字体栈、六件拟物件开关、落字动画档位，全部写进本插件自己的设置命名空间 `dsh-scriptorium`，由 Host settings API 落盘到 `$DSH_HOME/cordis.patch.yml` 的补丁层。
- 页面加载时由引导脚本在首帧前把纸色与字体写入文档，避免「先白后黄」的闪变（复用 DSH 的 pre-plugin palette 引导思路）。

---

## 7. 拟物组件规格

六件全部来自勾选，逐件可关。所有动效遵守 `prefers-reduced-motion`。

| # | 组件 | 行为 | 技术要点 | 风险 |
| --- | --- | --- | --- | --- |
| 1 | **纸边光** | 会话容器中心偏上受光，四边内阴影形成纸的厚度 | 两层 inset box-shadow + 一层径向渐变；强度 0–1 参数化 | 低。唯一默认必开的一件 |
| 2 | **纸夹滚动条** | Gem 纸夹随滚动滑动，惯性时倾斜，可拖拽 | 覆盖原生滚动条外观（保留原生滚动物理），SVG + transform 跟随 scrollTop；指针离开时淡出 | 中。要覆盖所有滚动容器；需保留键盘与触控板行为 |
| 3 | **墨迹光标** | 输入处是一团洇进纸里的墨；等待时下沉再涌起，每次击键重新洇开 | 覆盖层 div + radial-gradient + 呼吸动画；位置由 composer 的 caret 事件驱动 | 中。composer 是 DSH 自有的 Lexical 编辑器，需只读地跟随光标 |
| 4 | **蜡封** | 用于「已归档/已交付」等终态与提交确认，金蜡 + 字母纹 | 纯 CSS/SVG 绘制（径向渐变堆叠 + 不规则 border-radius），TN 的 seal.ts 提供思路 | 低。点缀品，滥用会变圣诞贴纸，仅限终态使用 |
| 5 | **落字动画** | 新字符落下时重（略下沉、略粗），随后沉降成印刷体 | 逐字符 class + 一次性 animation；对**流式输出**做时间窗批量（每 80ms） | 中。长文本 + 流式渲染有掉帧风险，必须有档位与关闭开关 |
| 6 | **羽毛笔光标** | 与墨迹光标二选一的替代形态，笔尖落在基线上 | SVG 笔 + 轻微摆动；只切换形态，不改变光标语义 | 低。与墨迹光标共用位置逻辑 |

**共同约束**：拟物层不得拦截键盘、不得改写输入内容、不得延迟提交——这是 TN 写在原则里的 Effects never touch your data，也必须是我们的底线。

---

## 8. 设置页「缮写室」

走 `settings.section`，在设置导航里自成一页，标题「缮写室 / Scriptorium」。

左侧三段，右侧固定实时预览（预览区是一段**真实渲染的样例会话**：一条用户气泡 + 一段含行内代码的回答 + 一个代码块 + 一行表格，覆盖最容易翻车的四类内容）。

### 第一段 · 纸

| 控件 | 类型 | 说明 |
| --- | --- | --- |
| 明暗 | 跟随系统 / 浅色 / 暗色 | 映射 DSH 的 appearance |
| 纸种 | 六选一，带纸样缩略 | onionskin / cotton / laid / linen / parchment / night |
| 纸纹强度 | 0–100 | 乘到 crinkle/felt/laid/linen/mottle 上 |
| 做旧程度 | 0–100 | 仅对 age>0 的纸生效 |
| 纸边光 | 开/关 + 强度 | 拟物件 1 |

### 第二段 · 字

| 控件 | 类型 | 说明 |
| --- | --- | --- |
| 正文字体 | 文本输入（逗号分隔） | 预填本主题栈，用户可覆写；清空回落内置 |
| 代码字体 | 文本输入 | 同上 |
| 终端字体 | 文本输入 | 同上 |
| 正文 / 代码 / 终端字号 | 步进器 | 沿用 DSH 既有范围与默认值 |

### 第三段 · 器物

| 控件 | 类型 |
| --- | --- |
| 纸夹滚动条 | 开/关（可切「半透明滑块」回退） |
| 光标形态 | 墨迹 / 羽毛笔 / 原生 |
| 蜡封强调 | 开/关 + 字母纹输入（默认 S） |
| 打字机落字 | 关 / 轻 / 标准 + 提示「长回复可能降帧」 |
| 全部还原默认 | 按钮 |

底部一行说明：本主题基于 Typewriter-Nocturne（MIT）的配色与纸面参数，字体为 OFL 授权。

---

## 9. 终端

终端是唯一无法贴纸的面，方案分三招：

1. **16 色 ANSI 跟随当前纸**：直接采用 TN 的 LIGHT_ANSI / NIGHT_ANSI 两套（见 `docs/evidence/tn-papers.json`）。羊皮纸下的终端是一张打字稿：暖黑字、砖红、橄榄绿、靛蓝。
2. **等宽复古字体**：Courier Prime 排在字体栈首位，Nerd 图标靠 Symbols Nerd Font 回落。字号沿用 DSH 的 10–20px，不另造刻度。
3. **容器纸边**：终端面板外圈用与主界面一致的描边与内阴影，让它看起来「压在同一张桌上」，但面板内部仍是纯色——不假装终端是一张纸。

**校验要求**：两套 ANSI 的 16 色在各自底纸上的对比度必须逐色实测并记录；低于 4.5:1 的颜色只允许出现在非文字用途（光标块、选区、边框）。

---

## 10. 与上游 Typewriter-Nocturne 的复用映射

| 上游资产 | 复用方式 | 说明 |
| --- | --- | --- |
| `app/nocturne/papers.ts`（6 纸参数 + 墨 + ANSI） | **数据照搬** | 已提取为 JSON 存证；本方案最大的价值来源 |
| `app/nocturne/themes.ts`（三主题 94 色） | 参考 + 取色 | 夜纸层级色温做法来源于此 |
| `lib/nocturne/theme-css.ts` | 移植思路 | 主题 → CSS 变量的编译方式 |
| `lib/nocturne/print/seal.ts` | **移植绘制逻辑** | 蜡封形状与渐变堆叠 |
| `typewriter/ink-layer.ts`、`block-cursor.tsx` | 移植手感 | 墨迹扩散与呼吸节奏的曲线 |
| `components/quill-cursor.tsx` | 移植绘制 | 羽毛笔形态 |
| `components/scroll-clip.tsx` | 移植物理 | 纸夹倾斜与滑动的缓动 |
| `typewriter/sound-engine.ts` | **不移植**（留挂点） | 音效未勾选 |
| `lighting/*`、`machine/*`（Three.js / GLSL） | 不复用 | DOM 环境无意义 |
| 字族选择（EB Garamond / Courier Prime / IBM Plex Mono / Cormorant） | 自行从上游 OFL 源打包 | 上游只留 license 声明，不随包字体文件 |

许可证义务：插件内保留 MIT 全文 + 上游版权行；字体目录内保留对应 OFL 全文。

---

## 11. 风险与对策

| # | 风险 | 严重度 | 对策 |
| --- | --- | --- | --- |
| R1 | 装饰金在浅纸上仅 2.43:1，误用为文字色会造成不可读 | 高 | 4.4 硬结论一：金拆两支；CI 加对比度断言，低于 4.5 的 token 构建失败 |
| R2 | 夜纸层级明度差仅 1.05–1.07，层级看不出来 | 高 | 靠色温分离（4.4 硬结论二）；实现后用截图对比验证四层可辨 |
| R3 | 落字动画在流式长回复上掉帧 | 中 | 时间窗批量（80ms）+ 三档强度 + 可关闭；1000 字符流式输出帧率作为验收项 |
| R4 | 纸夹滚动条接管原生滚动条，可能破坏触控板/键盘滚动与惯性 | 中 | 只覆盖视觉层，滚动仍由原生容器负责；提供半透明滑块回退 |
| R5 | 墨迹光标需跟随 Lexical composer 的 caret，接口可能不稳 | 中 | 只读跟随；失败自动降级为原生光标，不阻塞输入 |
| R6 | 第三方主题 id 不跨 settings schema 持久化 | 中 | 全部偏好写入本插件自有命名空间；启动时回放 |
| R7 | DSH 升级导致 slot 名或 token 名变化 | 中 | peer 依赖限定 0.2.x；token 缺失时回落内置色板而不报错；55 个 token 清单作为回归基线 |
| R8 | 中文字体回落不可控（各机器差异大） | 中 | 字体栈前置常见可商用中文衬线/楷体；设置页显示「当前实际生效字族」的探测结果 |
| R9 | 纸纹铺满导致长表格、diff 可读性下降 | 中 | 材质层只作用于会话容器且强度可调；代码块与表格内部用更平的 layer-2 底 |
| R10 | 与已装的 dsh-dream-skin 冲突（两套都在覆写 alias token） | 中 | 检测到同时启用时在设置页顶部提示，并允许一键禁用其一 |

---

## 12. 分期与里程碑

| 期 | 交付 | 验收形态 | 预估 |
| --- | --- | --- | --- |
| **P0 样张** ✅ 已交付 | 单文件 HTML：6 纸 × 明暗 + 真实会话片段 + 五件拟物演示（`sample/p0-parchment.html`） | 你在浏览器里点着看，逐项否决/通过 | 已完成 |
| **P1 骨架 + token 层** | 插件可装载；6 纸 + 夜纸；设置页三段式（无预览）；偏好持久化 | 装进 DSH，切换纸种整界面变色 | — |
| **P2 材质层** | 纸纹、纸边光、渐晕；代码块与表格的纸上呈现 | 会话区看起来像一张纸，且长表格不糊 | — |
| **P3 拟物层** | 六件拟物件全部可用可关 | 逐件开关演示；掉帧指标达标 | — |
| **P4 终端 + 打磨** | 16 色 ANSI 两套、等宽复古字、对比度审计、与 dream-skin 共存处理 | 全量验收清单通过 | — |

P0 是**唯一**必须你点头才能继续的检查点；P1 之后每一期都可以独立可用。

---

## 13. 验收标准（可判定）

1. **装载**：插件在 DSH 0.2.1-rc.3 中装载后，设置导航出现「缮写室」页，无报错。
2. **配色**：切换六张纸，`bg-base` 实测为对应纸色（取色器验证）；明暗切换时纸种选择不丢失。
3. **对比度**：脚本遍历全部被覆写 token，文字类 token 对其背景 ≥ 4.5:1，构建期断言通过。
4. **材质**：会话区可见纸纹与纸边光；侧栏与菜单**不出现**纸纹。
5. **拟物**：六件逐一可开可关；关闭后不残留布局位移。
6. **不伤功能**：拟物层开启时，键盘输入、粘贴、IME 中文输入、流式输出、停止生成全部正常；`prefers-reduced-motion` 下动效静默。
7. **性能**：1000 字符流式回复、落字=标准档，主线程无超过 50ms 的长任务。
8. **终端**：16 色在两套底纸上实测对比度记录完整；等宽网格在字号 10–20 之间切换不错位。
9. **可回滚**：设置页「全部还原默认」后，界面与未装插件时一致（截图对比）。
10. **许可**：仓库含 MIT 全文、上游版权行、字体 OFL 全文。

---

## 14. 证据文件

| 文件 | 内容 |
| --- | --- |
| `docs/evidence/tn-papers.json` | 上游 6 张纸的底色与 surface 参数、两套墨、两套 16 色 ANSI（MIT，附出处） |
| `docs/evidence/dsh-alias-tokens.txt` | 由装机版前端 bundle 提取的 55 个 `--dsw-alias-*` token |
| `_probe/webapp.css` | 从 app.asar 抽出的前端主样式表（分析用，可删） |
| `_probe/contrast.cjs` / `contrast2.cjs` | 4.4 节对比度实测脚本 |
| `sample/p0-parchment.html` | P0 静态样张：单文件、零外部依赖，支持 `?paper=<id>&dark=1&caret=quill` 深链 |
| `docs/previews/*.png` | 样张的 headless 渲染截图（羊皮纸浅色 / 夜纸暗色 / 棉浆纸） |

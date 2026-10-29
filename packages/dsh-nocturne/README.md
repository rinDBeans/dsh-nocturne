# dsh-nocturne

DeepSeek Harness 的 WebGL2 古典纸张与物理光影主题插件。

通过 WebGL2 双 Pass 着色器在独立层计算纤维微观肌理与环境漫射光照，并以 `multiply` 混合模式覆于正文之上；文字排版、输入与会话交互保持 DSH 原生处理。

## 特性

- **6 款纸张 × 3 组空间**：葱皮纸、棉浆纸、帘纹纸、亚麻纸、羊皮纸与夜纸，分别搭配 Paper & Ink、Midnight Study 和 Moonlit Poetry。
- **严谨的交互避让**：随动墨迹与羽毛笔光标在中文输入法（IME）合成或拖选时自动退回原生光标；纸夹滚动条完整保留浏览器原生滚动物理。
- **原生设置接入**：在 DSH 官方「设置 → 缮写室」中提供独立配置页，复用宿主 React，零额外运行时开销。
- **多端与共存友好**：支持桌面端本地配置持久化（解决端口随机导致的 `localStorage` 丢失）；可与 `claude-style` 等主题按需选择共存模式。
- **容灾与无障碍**：无 WebGL2 支持时平滑回退至静态纸色；动画粒子严格遵循系统的「减少动态效果」（`prefers-reduced-motion`）偏好。

## 安装

环境要求：DSH 0.2.x，Node.js 18+。

```bash
cd packages/dsh-nocturne

# 预检安装变更
node install.cjs --dry-run

# 执行安装
node install.cjs
```

安装完成后重启 DSH。

卸载：

```bash
node install.cjs --revert
```

## 配置与控制台 API

打开 **设置 → 缮写室** 即可调整全部外观，修改即时生效并自动持久化。

亦可在开发者控制台通过全局对象 `__dshNocturne` 快速调试：

```javascript
__dshNocturne.use('cotton');                                      // 切换纸张材质
__dshNocturne.use('parchment', { intensity: 1.35, grain: 0.25 }); // 调光照强度与颗粒
__dshNocturne.theme('midnight-study');                             // 切换环境光主题
__dshNocturne.lamp(false);                                         // 临时关灯
__dshNocturne.off();                                               // 暂时停用纸面渲染
```

桌面端配置自动存入 `$DSH_HOME/cache/dsh-nocturne/settings.json`，浏览器端以 `localStorage` 作为回退。

## 开发与构建

在仓库根目录下执行：

```bash
npm ci            # 安装开发依赖
npm run build     # 重新生成客户端、宿主脚本及离线样张
npm run check     # 产物一致性校验并执行完整回归测试
```

渲染核心位于 `src/core/`，设置页位于 `src/settings-page.js`。完整文档参见仓库根目录 `README.md` 与 `docs/`。

## 许可与鸣谢

- 遵循 [MIT License](../../LICENSE)。
- 纸张与光影配方移植自 [Typewriter Nocturne](https://github.com/Chaosnap/Typewriter-Nocturne)（MIT License，© Chaosnap）。
- 字体 EB Garamond、Cormorant Garamond 与 Courier Prime 遵循 SIL Open Font License 1.1。

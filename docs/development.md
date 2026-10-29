# 开发与验证

## 真源与生成物

渲染真源位于 packages/dsh-nocturne/src/core/：

- state.js：纸、房间与默认设置。
- math.js / light-model.js / shaders.js：数学、光照模型与 GLSL。
- paper-light.js / glow-layer.js：GPU 与辉光生命周期。
- ink-caret.js / quill.js / studio.js / scroll-clip.js：交互增强。
- adapter.js：DSH DOM、token、设置更新与诊断。
- settings-page.js / settings-page.css：官方设置槽中的原生独立页面；React 由宿主外部提供。
- settings-contract.js：浏览器与宿主共用的设置键和文档校验。
- host.js：宿主设置接口。

sample/nocturne-desk.template.html 与 sample/nocturne-desk.js 是样张真源。
以下三个文件均由构建生成，不要直接编辑：

    sample/nocturne-desk.html
    packages/dsh-nocturne/lib/client.js
    packages/dsh-nocturne/lib/index.js

## 本地命令

首次或依赖变更后：

    npm ci

重新生成：

    npm run build

检查产物漂移并运行全部测试：

    npm run check

单独运行测试：

    npm test

构建使用锁定版本的 esbuild，仅是开发依赖。运行时插件不需要 React、Three.js 或 esbuild。

## 测试结构

- Node 内置 test runner：安装/回滚、设置、样式、GPU 与宿主 HTTP。
- Playwright + 本机 Edge：生成包 API、material/off、GPU 丢失恢复、无 WebGL、低动态、滚动几何和 18 种离线组合。
- 没找到 Edge 时浏览器测试会跳过；可用 EDGE_PATH 指定 msedge.exe。
- CI 在 Windows 的 Node 20 / 24 上执行 npm run check。

浏览器用例同时检查 pageerror 与设置文档中的帧异常，避免帧壳把缺失依赖等错误吞掉后形成假阳性。

## 性能策略

- 环境颗粒与尘埃默认静态，设置页的“环境动效”用于显式开启连续动画。
- 空闲帧计算为 8fps，滚动和交互时恢复 30fps；页面隐藏时暂停。
- 全屏画布限制在约 200 万像素，DOM 文字仍按系统 DPR 渲染。
- 同尺寸 Glow resize 不重置画布；滚动布局测量按 66ms 节流，流式内容只设置脏标记。

## 诊断

昂贵诊断默认关闭。控制台需要完整信息时：

    __dshNocturne.diagnostics(true)
    __dshNocturne.diag()
    __dshNocturne.above()

diag() 本身始终按需采样；diagnostics(true) 才会开启 DOM 观察、卡顿记录和自动 GPU 采样。结束后：

    __dshNocturne.diagnostics(false)

## 安装与回滚

安装先写临时目录，再替换本插件目录并原子更新档案清单。--revert 只删除本插件的依赖登记、bundle 和目录，不恢复整份历史 package.json，因此不会抹掉其他插件的后续变化，也可重复执行。

## 宿主接口边界

当前仍使用已验证的回环设置接口，没有假定未验证的官方设置 API。写入要求 application/json，校验 Host、Origin、Sec-Fetch-Site 和设置文档 schema；失败时返回明确的 4xx/5xx，不把写盘失败报告为成功。

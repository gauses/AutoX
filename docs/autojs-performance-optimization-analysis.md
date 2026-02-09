# AutoJS 精简与性能优化分析

目标：在保证功能可用的前提下，尽量将**内存与 CPU 占用控制在设备资源的 5% 以内**。

---

## 一、当前资源消耗来源概览

### 1.1 应用启动阶段（未跑脚本时）

| 来源 | 类型 | 说明 |
|------|------|------|
| **AutoJs.initInstance()** | CPU/内存 | 创建 ScriptEngineService、ScriptEngineManager，注册广播、Activity 生命周期等，本身较轻。 |
| **Flurry / Bugly** | CPU/网络 | 统计与崩溃上报，可关闭或改为按需初始化。 |
| **ThemeColorManagerCompat** | 内存 | 主题色缓存，占用很小。 |
| **TimedTaskScheduler** | CPU | 定时任务检查，无任务时开销小。 |
| **DynamicBroadcastReceivers** | 内存 | 注册动态广播，占用一般。 |
| **ForegroundService** | CPU/内存 | 默认关闭（Pref），若开启会常驻前台。 |
| **AccessibilityService** | CPU/内存 | 若用户开启，会持续做节点树遍历与事件处理，是**后台 CPU 主要来源之一**。 |

结论：未跑脚本时，主要变量是**是否开启无障碍**和**是否开启前台服务**；其余启动项对 5% 目标影响相对较小。

---

### 1.2 首次执行脚本时（主要瓶颈）

每次执行脚本会：

1. **创建新引擎**：`LoopBasedJavaScriptEngine` + **完整 ScriptRuntime**
2. **ScriptRuntime 构造函数**中**立即创建**大量对象：
   - `GoogleMLKit gmlkit`（**ML Kit 多语言 OCR**，内存与首次推理 CPU 高）
   - `SimpleActionAutomator`、`UI`、`Dialogs`、`Device`、`Floaty`、`Files`、`Media`、`Plugins`、`Engines`、`Colors`、`SevenZip`（p7zip 等）
   - `Images`（内部 OpenCV 为懒加载，但对象本身会建）
   - `Sensors`、`Timers`、`Loopers`、`Threads`、`Events`、`AccessibilityBridge` 等
3. **Rhino 执行 init.js**：  
   `init.js` 会 **require 一批模块**，其中包括：
   - `'paddle'` → 加载 `__paddle__.js` → **`new com.stardust.autojs.runtime.api.Paddle()`**  
     → 触发 **paddleocr 相关类与 native 库**加载（即便 ScriptRuntime 里 Paddle 已注释，JS 侧仍会 new Paddle）
   - `'images'`、`'sensors'`、`'media'`、`'plugins'` 等
4. **依赖链**（autojs 模块）：
   - **paddleocr**：Paddle Lite OCR（so + 模型）
   - **OpenCV**（LocalRepo）：找图找色等
   - **tesseract4android**：Tesseract OCR
   - **ML Kit**：text-recognition + 多语言（中文、日文、韩文、Devanagari 等）
   - **term / p7zip / emulatorview**：Shell、压缩、终端
   - **Rhino**：脚本引擎本身

因此：**首次跑脚本**会同时牵扯到 **Rhino、ML Kit、Paddle（通过 init.js）、SevenZip、Shell、OpenCV（按需）** 等，内存和 CPU 峰值容易超标。

---

### 1.3 运行中与常驻

| 来源 | 说明 |
|------|------|
| **无障碍服务** | 若开启，会持续做界面树遍历与事件回调，CPU 占比可能明显。 |
| **脚本逻辑** | 循环、找图、OCR、HTTP 等会直接增加 CPU。 |
| **Compose UI** | MainActivity 使用 Compose，低端机上会有一定开销。 |
| **Glide / Coil** | 图片加载，主要在浏览/编辑脚本时使用。 |

---

## 二、精简与优化方向（控制内存/CPU 在约 5% 以内）

### 2.1 高优先级（建议优先做）

#### （1）脚本引擎初始化：模块懒加载，去掉“全量 require”

- **现状**：`init.js` 里对 `paddle`、`sensors`、`media`、`plugins`、`RootAutomator`、`http`、`storages` 等做统一 require，导致**首次执行脚本就加载 Paddle、ML Kit 等**。
- **做法**：
  - 将 **paddle**、**sensors**、**media**、**plugins**、**RootAutomator**、**http**、**storages** 从 init.js 的“启动必选模块列表”中移除。
  - 改为**按需加载**：仅在脚本第一次访问 `global.paddle` / `global.sensors` 等时再 `require('__paddle__')` 等（可在 `__globals__.js` 里用 getter 或占位对象 + 懒 require 实现）。
- **效果**：不用的脚本不再加载 Paddle、部分 ML Kit 使用路径，**显著降低首次执行内存和 CPU**，有利于把占用压到 5% 以内。

#### （2）ScriptRuntime：GoogleMLKit 懒创建

- **现状**：`ScriptRuntime` 构造函数里 `gmlkit = new GoogleMLKit()`，所有脚本一跑就带上 ML Kit。
- **做法**：改为懒加载，例如：
  - 用 `getGmlkit()` 或 `getImages()` 式的 getter，首次访问时才 `new GoogleMLKit()`；
  - 或保留字段但在构造函数中不 new，在第一次被 JS 访问时再初始化。
- **效果**：不做 OCR 的脚本不再触发 ML Kit 的类和 native 加载，**降低内存和首次 CPU**。

#### （3）Paddle / paddleocr：彻底按需加载

- **现状**：`__paddle__.js` 在 require 时执行 `new com.stardust.autojs.runtime.api.Paddle()`，且 init.js 当前把 `paddle` 列在必选模块里，导致首脚本就加载 paddleocr。
- **做法**：
  - 如上所述，**从 init.js 必选列表去掉 `paddle`**，仅在脚本使用 `paddle` 时再 require。
  - 若你方业务**完全不用 Paddle OCR**，可考虑从 autojs 的 `build.gradle.kts` 中去掉 `paddleocr` 依赖，并删除或精简 `__paddle__.js`，避免误拉 Paddle 相关 so 和模型。
- **效果**：不用 OCR 或只用 gmlkit 的脚本，**不再占用 Paddle 的内存和 CPU**。

#### （4）无障碍服务：按需启用 + 降低轮询频率

- **现状**：一旦开启，会持续做节点树遍历与事件处理，容易成为后台 CPU 大户。
- **做法**：
  - 保持**默认关闭**，仅当用户运行“需要无障碍”的脚本时再提示开启。
  - 若源码中有轮询或定时遍历界面树的逻辑，可增加**间隔/节流**或**仅在脚本调用 selector/click 等时再执行**，避免无谓 CPU。
- **效果**：未跑脚本或跑不需要无障碍的脚本时，**CPU 可控制在较低水平**。

#### （5）前台服务与后台行为

- **现状**：前台服务默认关闭（Pref），符合低占用目标。
- **建议**：保持默认关闭；若存在 WorkManager / Android Job 等后台任务，确保**不调度与当前业务无关的任务**，避免唤醒和后台 CPU。

---

### 2.2 中优先级（进一步压内存/CPU）

#### （6）OCR 依赖裁剪

- **ML Kit**：当前引入多语言（拉丁、中文、日、韩、Devanagari 等）。若业务只需中文或单一语言，可在 **build.gradle** 中只保留对应 `text-recognition-*` 依赖，减少 dex 与 so 体积，间接减轻加载和运行时的内存与 CPU。
- **Tesseract**：若不使用 Tesseract OCR，可从 autojs 依赖中**移除 tesseract4android**，避免加载对应 so 和资源。

#### （7）OpenCV / Images

- **现状**：OpenCV 在 `Images.initOpenCvIfNeeded()` 中懒加载，已较合理。
- **建议**：保持懒加载；若存在“预加载 OpenCV”的调用，可改为仅在真正使用找图/找色时再触发。

#### （8）引擎/运行时复用（可选）

- **现状**：每次执行新建引擎与 ScriptRuntime，执行完销毁，下次再建。
- **可选**：对“单任务串行执行”的场景，可**复用同一引擎/ScriptRuntime**（执行完只做清理，不 destroy），减少重复创建 Rhino、Runtime、require 模块的开销。需要做好隔离与状态清理，避免内存泄漏和状态串线。
- **效果**：第二次及以后的脚本启动更快，平均 CPU/内存峰值可能略降。

---

### 2.3 低优先级 / 长期

#### （9）ProGuard / R8

- **现状**：`minifyEnabled = false`。
- **建议**：在稳定测试后开启 **minifyEnabled true** 并配置 keep 规则，减小 APK 与部分运行时元数据，对“控制在 5% 以内”有辅助作用。

#### （10）Compose / UI

- 若主要运行场景是“无界面或简单 UI”，可考虑提供**极简入口**（如仅列表 + 运行按钮），减少 Compose 与 Material 依赖，对低端机更友好；改动较大，可作为长期优化。

#### （11）统计与调试

- **Flurry / Bugly**：在 release 或“低资源模式”下关闭或按需初始化，减少后台线程与网络，有利于把整体 CPU 控制在 5% 以内。

---

## 三、实施顺序建议（面向 5% 目标）

1. **init.js 模块懒加载**（去掉 paddle 等非必要模块的“启动 require”）  
   → 立即减少首次执行时的 Paddle、部分 ML Kit 路径加载。
2. **ScriptRuntime 中 gmlkit 改为懒创建**  
   → 不做 OCR 的脚本不再带 ML Kit 开销。
3. **Paddle 按需加载 + 可选移除 paddleocr 依赖**  
   → 进一步减少 native 与模型占用。
4. **无障碍默认关闭 + 减少无谓轮询**  
   → 控制后台 CPU。
5. 再按需做：OCR 依赖裁剪、Tesseract 移除、引擎复用、ProGuard 等。

---

## 四、预期效果（定性）

- **不做 OCR 的脚本**：通过懒加载与移除 Paddle/部分 ML Kit，首次执行和稳态的**内存与 CPU 有望明显下降**，更接近“不超过 5%”的目标。
- **只做简单 UI 自动化（点击、滑动）**：在无障碍按需开启且无多余轮询的前提下，**后台 CPU 可维持在较低水平**。
- **做 OCR / 找图**：OCR 与 OpenCV 仍会在使用时占用较多 CPU/内存，可通过“仅在使用时加载”和“单语言 ML Kit”把占用压到可接受范围，但 5% 需结合真机实测再微调。

建议在真机上用 Android Profiler 或 `dumpsys meminfo` / CPU 采样，在“未跑脚本”“首次跑简单脚本”“跑 OCR 脚本”三种场景下各测一轮，再根据数据微调上述项（例如是否完全移除 paddle、是否进一步砍 ML Kit 语言）。

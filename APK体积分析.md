# APK 体积分析与优化

当前 APK 约 **51MB**（已从约 73MB 通过单 ABI、R8、移除 sample/indices、仅保留中英文等优化降至 51MB）。以下说明主要来源与可继续优化空间。

---

## 一、已做过的减包（之前改动）

- 去掉 TBS → 少了一整套 X5 .so
- 去掉 7zip → 少约 2.5MB（libp7zip.so）
- 去掉 quickie/BarHopper → 少约 3.8MB（libbarhopper_v3.so）

这些已经生效，所以包体比「未删前」要小；剩下 73MB 主要来自下面几块。

---

## 二、当前体积的主要来源（估算）

| 类别 | 内容 | 大致占比/说明 |
|------|------|----------------|
| **1. 内置编辑器 (codeeditor)** | 构建时下载的 vscode-mobile `dist.zip`，解压到 `codeeditor/src/main/assets/codeeditor` | **约 15～30MB**。Monaco/VS Code 前端资源体积大，是单一大头。 |
| **2. 双 ABI 同时打进一个包** | `app/build.gradle.kts` 里 `splits.abi` 配置了 `isUniversalApk = true` | 会打**通用包**，同时包含 **arm64-v8a + armeabi-v7a** 的 .so，native 体积约翻倍。 |
| **3. 示例与资源 (assets)** | `app/src/main/assets/sample` 大量示例脚本；`indices/all_android_classes.json`（约 500KB）；PaddleOCR 示例里的 .nb 模型 | **数 MB**。示例多、模型文件大。 |
| **4. app/libs 里的 jar** | `dx.jar`、`rhino-1.7.14-jdk7.jar`、`oss-android-sdk-2.9.21.jar`、`RootShell-1.6.jar` 等 | **数 MB**。脚本引擎 + 构建/工具相关。 |
| **5. Native .so（当前仍包含）** | 终端：libjackpal-androidterm5、libjackpal-termexec2；CpuInfo：libnative-lib；Jetpack：graphics、image_processing 等 | **数 MB**，且因通用包而 x2。 |
| **6. 未开启压缩与混淆** | `isMinifyEnabled = false`、`isShrinkResources = false` | Dex 和资源未做 R8 压缩/混淆，体积偏大。 |
| **7. 多语言与依赖** | `res-i18n` 多语言；Compose、Ktor、Material 等依赖 | 资源与 dex 各数 MB。 |

综合起来：**编辑器资源 + 双 ABI 通用包 + 未 minify/shrink** 是 73MB 仍偏大的核心原因。

---

## 三、可做的减包手段（按优先级）

1. **只打单 ABI（推荐）**  
   - 若只面向 64 位设备：关闭通用包，只打 **arm64-v8a**，native 大约能少一半。  
   - 在 `app/build.gradle.kts` 的 `splits.abi` 里改为只 `include("arm64-v8a")`，并视需求设 `isUniversalApk = false`（或按需打多个 ABI 分包）。

2. **开启 R8 压缩与资源收缩**  
   - `isMinifyEnabled = true`、`isShrinkResources = true`，并配置 ProGuard/R8 规则。  
   - 能明显减小 dex 和未使用资源，需做一次完整回归测试。

3. **缩小或移除内置编辑器资源**  
   - 若不需要「VS Code 风格」的 codeeditor：可考虑移除或替换为更轻量的编辑界面，能减少约 15～30MB。  
   - 若必须保留：看上游 vscode-mobile 是否有 slim 构建或可按需加载资源。

4. **示例与 indices 瘦身或按需下载**（见下节详细说明）  
   - 从发布包中移除或移到「按需下载」：部分 sample、PaddleOCR 示例 .nb、`all_android_classes.json` 等。  
   - 可节省数 MB。

5. **按需保留 libs 与 native**  
   - 确认 RootShell、oss-android-sdk、终端相关 .so 等是否都必须打进主包；不需要的可改为按需加载或从主包移除。

---

## 四、小结

- **为什么还有 72.98 MB？**  
  主要是：**内置编辑器资源很大 + 通用包带双 ABI + 未做 minify/shrink**，再加上示例、多语言和依赖，累计到约 73MB。

- **想明显减包**：  
  优先做「只打 arm64-v8a」和「开启 R8 + 资源收缩」，再视需求动 codeeditor 和示例资源，一般能减到 50MB 以内甚至更低。

---

## 五、示例 / indices 瘦身或按需下载（详细说明）

### 5.1 它们是什么、占多少体积

| 资源 | 路径 | 用途 | 体积（约） |
|------|------|------|------------|
| **示例 (sample)** | `app/src/main/assets/sample/` | 文件管理里「示例」目录下的内置示例脚本，用户可浏览、运行、导入 | **约 4.1 MB** |
| **indices** | `app/src/main/assets/indices/` | 编辑器代码补全与「查找 Android 类」用的索引数据 | **约 550 KB** |

- **indices 明细**：  
  - `all.json`（约 47 KB）：Auto.js 内置 API 的模块/方法索引，供**函数键盘、代码补全**使用（`Modules.java` 从 assets 读取）。  
  - `all_android_classes.json`（约 505 KB）：Android 类名列表，供**编辑器里「查找 Android 类」**使用（`AndroidClassIndices.java` 从 assets 读取）。

- **sample 明细**：  
  - 大量分类示例（HTTP、OCR、悬浮窗、UI、多线程、7zip、Zip、PaddleOCR、TessractOCR、Web 扩展等）。  
  - 其中 **PaddleOCR 自定义模型示例** 下有 `.nb` 模型文件（如 `ch_ppocr_mobile_v2.0_*_opt.nb`），单类示例就占不少体积。  
  - 还有图片、rar、zip 等资源文件，合计约 4.1 MB。

### 5.2 示例 (sample) 的瘦身与按需下载

**瘦身（减少打进 APK 的内容）**

- **删减目录**：在 `app/src/main/assets/sample/` 下删除或精简不必要分类，例如：  
  - 已移除 7zip 功能后可删 `sample/7zip/`；  
  - 不需要 OCR 示例可删 `PaddleOCR/`、`TessractOCR/`、`GoogleMLKit/`；  
  - 不需要的示例类别（如 MQTT、WebX、复杂界面等）也可整目录删除。  
- **精简 PaddleOCR 示例**：若保留 PaddleOCR 示例，可只保留「使用默认模型」的示例，删除带 `models/*.nb` 的「自定义模型」示例，或只保留一个最小 .nb，显著减小体积。  
- **删资源文件**：示例里的 .png/.jpg/.rar/.zip 等若仅用于演示，可改为更小图或移除，按需保留。

**按需下载（不把完整 sample 打进 APK）**

- **思路**：APK 里不再包含 `assets/sample/`（或只保留一个「示例列表」的轻量描述文件）。  
- **流程**：  
  1. 首次进入「示例」或点击「下载示例」时，从服务器下载 sample 压缩包（或按分类下载）。  
  2. 解压到 `context.getFilesDir()/sample/`（即当前 `WorkspaceFileProvider` 里用的 `mSampleDir`）。  
  3. 当前逻辑是：若 `filesDir/sample` 下没有文件，会从 `assets/sample` 拷贝；改为按需下载后，改为从网络下载并解压到该目录即可。  
- **代码改动要点**：  
  - `WorkspaceFileProvider#listSamples()` 当前用 `mAssetManager.list(pathOfAsset)` 与 `mAssetManager.open(...)` 从 assets 拷贝到 `mSampleDir`；若改为按需下载，需在「无本地 sample 时」先走下载流程，再 list 本地 `mSampleDir`。  
  - 需提供下载 URL、简单进度与错误提示；可选「仅在有 WiFi 时下载」等策略。

### 5.3 indices 的瘦身与按需下载

**瘦身**

- **all_android_classes.json**：  
  - 当前是较大头的文件（约 505 KB），内容为 Android 类名列表。  
  - 瘦身：只保留常用包（如 `android.*`、`androidx.*` 部分子包）或仅保留编辑器里实际会用到的类，生成一份裁剪版 JSON，可显著减小体积。  
- **all.json**：  
  - 体积相对小（约 47 KB），主要为内置 API 索引，一般可保留；若需极致瘦身，可再按使用情况裁剪条目。

**按需下载**

- **思路**：APK 里不包含 `assets/indices/`（或只放一个占位/最小版本），在**首次使用编辑器补全或「查找 Android 类」**时再加载。  
- **实现方式一（本地按需）**：  
  - 首次进入编辑器或点击「查找 Android 类」时，若检测到本地（如 `filesDir/indices/`）没有索引文件，则从内置的轻量索引或网络下载 `all_android_classes.json`（及可选 `all.json`）到本地，再从本地文件加载。  
  - `AndroidClassIndices`、`Modules` 当前是从 `context.getAssets().open(...)` 读；可改为：若 assets 没有则读 `filesDir/indices/xxx.json`，若本地也没有则先触发下载再读。  
- **实现方式二（纯网络）**：  
  - 不打包 indices，首次需要时从 CDN/服务器下载到 `filesDir/indices/`，并缓存；后续使用本地缓存。  
- **注意**：若完全移除 assets 中的 indices，需处理「未下载完成或网络不可用」时的降级（例如不提供 Android 类搜索、或仅使用 all.json 的小体积内置 API 补全）。

### 5.4 小结

- **示例**：约 4.1 MB，通过删减目录/精简 PaddleOCR 与资源可瘦身；通过「首次进入示例时从网络下载并解压到 filesDir」可实现按需下载，进一步减小 APK。  
- **indices**：约 550 KB，通过裁剪 `all_android_classes.json`（只保留常用类）可瘦身；通过「不打包或只打包最小版，首次使用编辑器/查找类时从本地或网络写入 filesDir 再加载」可实现按需下载。  
- 若同时做「示例按需下载 + indices 瘦身或按需下载」，APK 可再减少约 4～5 MB，且不影响「联网后」的完整功能体验。

---

## 六、当前约 51MB 的主要来源与进一步优化空间

### 6.1 51MB 主要来自哪里（估算）

| 类别 | 内容 | 大致占比/说明 |
|------|------|----------------|
| **1. DEX（代码）** | 本工程 + 依赖（Compose、Ktor、RxJava、Material、autojs、apkbuilder、core.network 等） | **约 25～35 MB**。R8 已开，仍占大头。 |
| **2. autojs 模块 assets** | `autojs/src/main/assets/modules/`（含 npm 子目录，约 900+ 个 .js） | **约 3.3 MB**。脚本运行时/require 用。 |
| **3. app libs（jar）** | dx.jar、rhino-1.7.14-jdk7.jar、oss-android-sdk、RootShell 等 | **约 3～4 MB**（不含 sources）。 |
| **4. 资源 res** | drawable、layout、values（已仅保留 zh-rCN/zh-rTW） | **数 MB**。 |
| **5. 其他 assets** | app 下 editor 主题、js-beautify；autojs 下 init.js、web、binary 等 | **数百 KB～1 MB**。 |
| **6. Native .so** | 仅 arm64-v8a，4 个 .so（graphics、term、native-lib） | **很小**（几十 KB）。 |

综合：**DEX + autojs 模块 + app libs + 资源** 构成当前 51MB 的主体。

### 6.2 还有没有优化空间？

有，但每项都有功能或工程成本，需按需求取舍：

1. **autojs 模块瘦身（约 3.3 MB）**  
   - `autojs/assets/modules/` 内含大量 npm 包（lodash、axios、rxjs、cheerio 等）。  
   - 若脚本不用的模块可删：在 `modules/` 或 `modules/npm/` 下按需删除整目录，或提供「精简版」构建只拷贝必要 .js。  
   - 风险：脚本里 `require("xxx")` 若用到被删模块会报错，需和实际脚本用法对齐。

2. **app libs 按需保留**  
   - **rhino-1.7.14-jdk7-sources.jar**：若被打进 APK，应移除（源码不必进 release），只保留 `rhino-1.7.14-jdk7.jar`。  
   - **dx.jar**：apkbuilder 打包用；若不做「在手机端打包成 APK」可考虑移除 apkbuilder 依赖（改动大）。  
   - **oss-android-sdk**：仅上传 OSS 用；若功能不用可改为按需依赖或移除。  
   - **RootShell**：仅 root 相关功能用；不用可移除。

3. **依赖库再瘦身**  
   - 用 `./gradlew :app:dependencies` 看依赖树，去掉未使用的（如 android.issue.reporter、licensesdialog、部分 accompanist 等）。  
   - 能减 DEX/资源，通常每项几百 KB～1 MB，需回归测试。

4. **R8 规则再收紧**  
   - 在 `proguard-rules.pro` 里对不用的包加 `-dontwarn` 或 `-keep` 精简，避免保留过多未引用类。  
   - 可再减 DEX，幅度视当前保留情况而定。

5. **资源**  
   - 未用 drawable/layout 已由 `shrinkResources` 收缩；可再检查是否有大图可换矢量或压缩。

### 6.3 小结（51MB 还能减多少）

- **已做**：单 ABI、R8、资源收缩、移除 sample/indices、仅保留简体/繁体中文、移除 TBS/7zip/quickie/codeeditor 等，从约 73MB 降到约 51MB。  
- **可再做**：autojs 模块按需裁剪（约 3 MB）、确认 rhino-sources 未打进包、按需移除/替换 app libs 与无用依赖、收紧 R8。**合理预期再减 3～8 MB**，具体取决于你愿意砍掉哪些功能（如 apkbuilder、OSS、RootShell、部分 npm 模块等）。

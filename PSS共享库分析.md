# PSS 里「共享库 / 共享部分」具体分析

说明 PSS 中「共享」的含义、在 Android 里如何细分、以及本应用（AutoX）里实际对应哪些东西、如何观测。

---

## 1. PSS 里「共享」是什么意思

- **PSS（Proportional Set Size）** 对每一页物理内存按「有多少个进程共享这一页」做均摊：
  - 只有本进程用的页 → 整页算进本进程 PSS；
  - 被 N 个进程共享的页（如系统 .so、字体、ART）→ 本进程只算 **1/N 页**。
- 所以「共享库」在 PSS 里 = **被多个进程共享的那类内存**（主要是映射的 .so、.dex、.apk、.ttf、.oat/.art 等），按比例算进本进程的那一份，而不是「只有你能用的私有堆」。

**公式上**：  
某段映射的 PSS = 该段占用的物理页数 × (1 / 共享该段的进程数)。  
Total PSS = 所有映射的 PSS 之和。

---

## 2. Android 官方如何细分 PSS

`Debug.MemoryInfo`（`Debug.getMemoryInfo(memInfo)` 填进去）把本进程内存按三类 PSS 报告：

| 字段 | 含义 |
|------|------|
| **dalvikPss** | Dalvik/ART 的 **Java 堆** 的 PSS（不含其它 Dalvik 开销） |
| **nativePss** | **Native 堆**（JNI malloc 等）的 PSS |
| **otherPss** | **其余一切**：.so、.dex、.apk、.ttf、栈、图形、ashmem、未归类映射等 |

因此：

- **totalPss** ≈ dalvikPss + nativePss + otherPss（系统内部可能还有细分，但大致如此）。
- **「共享库 / 代码」主要落在 otherPss 里**，因为 .so、.dex、.apk 等都是以「映射文件」的形式存在，不属于单纯的 Java 堆或 Native 堆。

此外，API 还提供：

| 方法 / 统计项 | 含义 |
|---------------|------|
| **getTotalSwappablePss()** | 映射以下类型文件的 **总 PSS**：**.so, .jar, .apk, .ttf, .dex, .odex, .oat, .art** —— 可以近似看作「代码 + 共享库」占的 PSS。 |
| **getMemoryStat("summary.code")** (API 23+) | 静态代码和资源占用的内存（对应 dumpsys meminfo 的 Code）。 |
| **getMemoryStat("summary.system")** (API 23+) | 共享与系统内存（对应 dumpsys meminfo 的 System）。 |
| **getTotalSharedDirty() / getTotalSharedClean()** | 共享脏页 / 共享干净页（KB），与 PSS 不同维度，但可辅助理解「共享」占比。 |

所以：**要具体分析「共享库」占了多少，主要看 otherPss，更细一点看 getTotalSwappablePss() 或 getMemoryStat("summary.code") / ("summary.system")**。

---

## 3. 「共享库」里通常包含什么

- **系统库**：libc、libm、ART（libart.so）、V8/JS 引擎（若用）、图形/OpenGL 等。几乎所有进程都有，**应用无法删减**，只能通过少用相关能力间接少触发某些库的加载。
- **应用自己的 .so**：随 APK 打包的 jniLibs、或动态加载的 .so。**应用能控制**：不打包、不 load 就不会占这份 PSS。
- **Dex/OAT/ART**：classes.dex、.odex、.oat、.art 等。和代码量、方法数、预编译策略有关，**应用可通过减代码、减依赖、按需加载模块** 间接优化。
- **APK/JAR 映射**：APK 或 JAR 被 mmap 读入的部分（资源、代码），算在「可换页」的 PSS 里（getTotalSwappablePss 会包含）。
- **字体等**：.ttf 等也会被算进 getTotalSwappablePss。

总结：**PSS 里「共享」部分 ≈ otherPss 中的一大部分，其中「代码与库」≈ getTotalSwappablePss()**；系统库占比大且难减，应用能优化的是**自己带来的 .so 和 dex/apk 映射**。

---

## 4. 本应用（AutoX）里实际有哪些「共享库」

- **系统库**：所有进程共有（libc、ART、framework 等），无法移除。
- **应用自带 .so**：
  - **paddleocr 模块**（`paddleocr/src/main/jniLibs/`）：  
    - arm64-v8a / armeabi-v7a 下均有：`libNative.so`、`libpaddle_light_api_shared.so`、`libhiai.so`、`libhiai_ir.so`、`libhiai_ir_build.so`、`libc++_shared.so`。  
    - 一般在**首次使用 OCR 相关 API 时**被 `System.loadLibrary("Native")` 加载；若脚本从不调 OCR，理论上不会加载，但若模块被合进主 dex/类加载，有可能提前触发。
  - **native-lib**（CpuInfoDetector、NativeUtils 等）：  
    - 在 `System.loadLibrary("native-lib")` 时加载，具体何时调用取决于业务（如 CPU 检测、工具类调用）。  
    - 若在启动或监控页就调用了，会较早拉高 otherPss / getTotalSwappablePss。
- **Dex/APK**：主 APK、依赖的 jar/aar 中的 dex 与资源映射，随应用体积和类加载量变化。

所以：**本应用的「共享库」PSS = 系统库 + paddleocr 的 .so（若已加载）+ native-lib（若已加载）+ dex/apk 映射**。优化重点在「少加载、晚加载、按需加载」自己的 .so，以及控制 dex/代码量。

---

## 5. 如何在项目里观测「共享库」占比

当前 `App.logMemoryAndCpuSnapshot()` 只打了 **Java / Native / PSS 总值**，没有打出 otherPss 或 getTotalSwappablePss。若要**具体分析共享库**，可以：

- 在 `Debug.getMemoryInfo(memInfo)` 之后增加：
  - `memInfo.dalvikPss`、`memInfo.nativePss`、`memInfo.otherPss`（单位 KB）；
  - `memInfo.getTotalSwappablePss()`（.so/.dex/.apk 等映射的 PSS）；
  - 若 minSdk ≥ 23：`memInfo.getMemoryStat("summary.code")`、`memInfo.getMemoryStat("summary.system")`。
- 在监控页或日志里输出一行，例如：  
  `PSS: total=xxMB dalvik=xxMB native=xxMB other=xxMB swappable=xxMB`  
  这样就能直接看到 **otherPss（含共享库）和 swappable（代码+库）** 的数值，便于和「共享库」对应起来。

（可选）在低内存或 onTrimMemory 时打一份上述细分，方便对比「共享库」在压力下是否变化。

---

## 6. 小结

| 问题 | 结论 |
|------|------|
| PSS 里「共享」是什么 | 被多进程共享的物理页，按 1/进程数 均摊到本进程；主要是 .so、.dex、.apk 等映射。 |
| 在 Android 里对应哪个字段 | 主要看 **otherPss**；更细看 **getTotalSwappablePss()**（.so/.jar/.apk/.dex 等）。 |
| 本应用有哪些 | 系统库 + paddleocr 的 .so（按需加载）+ native-lib（按调用加载）+ dex/apk 映射。 |
| 能否优化 | 系统库难优化；应用可做：少/晚加载自己的 .so、减 dex 与依赖、多进程隔离大库。 |
| 如何观测 | 在内存快照中增加 otherPss、getTotalSwappablePss()、summary.code/system 的打印即可。 |

这样就能在「PSS 总值」之外，**具体分析 PSS 里的共享库（共享部分）** 并做有针对性的优化。

# PSS 内存指标说明

## 1. PSS 是什么

**PSS（Proportional Set Size）** 是 Android/Linux 里用来衡量「这个进程占了多少内存」的指标。

- 它会按**比例**算共享内存：很多进程共用的内存（例如系统库、so），只把「属于本进程的那一份」算进 PSS。
- 公式上可以理解为：**PSS ≈ 本进程独享的内存 + （共享内存 ÷ 共享该内存的进程数）**。

---

## 2. 项目里怎么拿到 PSS

项目里 **PSS 不是我们算的**，而是从系统读出来的。相关代码在 `app/src/main/java/org/autojs/autojs/App.kt`：

```kotlin
val memInfo = Debug.MemoryInfo()
Debug.getMemoryInfo(memInfo)
val totalPssKb = memInfo.totalPss
val totalPssMb = totalPssKb / 1024
```

- `Debug.getMemoryInfo(memInfo)` 会向系统查当前进程的内存信息，并填到 `memInfo` 里。
- `memInfo.totalPss` 就是系统已经算好的「本进程总 PSS」，单位 KB；我们只是除以 1024 得到 MB 再显示。

也就是说：**PSS 的计算规则在系统里，我们只负责读取和展示。**

---

## 3. 系统里 PSS 的计算规则（Android/Linux）

PSS 是在内核/框架层、按内存映射算出来的，大致规则是：

- 系统会看进程的每一段内存映射（来自 `/proc/<pid>/smaps` 或等价接口）。
- 对**每一页物理内存**：
  - 若该页**只被本进程使用** → 整页算进本进程的 PSS；
  - 若该页被 **N 个进程共享**（如 so、系统库）→ 本进程的 PSS 只算 **1/N 页**。
- **进程的 totalPss** = 所有映射的 PSS 之和（即：私有内存 + 共享内存按共享进程数均摊后的部分）。

用公式可以写成：

- 某一段映射的 PSS = 该段占用的物理页数 × (1 / 共享该段的进程数)
- **Total PSS** = Σ 每段映射的 PSS

所以：**PSS = 私有内存 + 共享内存的「按比例分摊部分」**，不是简单的 Java + Native。

---

## 4. 为什么不是简单的 Java + Native

- **Java**：当前进程的 Java/Kotlin 堆占用（`Runtime.getRuntime().totalMemory() - freeMemory()`）。
- **Native**：当前进程的本地堆占用（如 JNI、C/C++ 的 malloc，对应 `Debug.getNativeHeapAllocatedSize()`）。

**Java + Native 只包含「堆」**，不包含例如：

- 加载的 **so、系统库**（按比例算在 PSS 里）；
- **栈、线程、Dex/ART 元数据**；
- **GPU/图形相关**等。

所以：

- **Java + Native** ≈ 你这个 app 自己「申请」的堆内存，更偏「应用层视角」。
- **PSS** ≈ 系统认为「这个进程一共占了多少物理内存」，是系统做**杀进程、OOM、内存压力判断**时用的数，更接近「真实占用的总内存」。

---

## 5. 小结

| 指标 | 含义 | 谁算的 |
|------|------|--------|
| **Java** | 当前进程 Java 堆已用内存 | `Runtime.getRuntime().totalMemory() - freeMemory()` |
| **Native** | 当前进程本地堆分配 | `Debug.getNativeHeapAllocatedSize()` |
| **PSS** | 系统视角下本进程占用的物理内存（含堆、栈、库、图形等，共享按比例） | 系统根据 `/proc`/smaps 等算好，通过 `Debug.getMemoryInfo()` 的 `totalPss` 给出 |

想看系统底层具体怎么填 `totalPss`，可以查 Android 源码里的 `Debug.getMemoryInfo` / `MemoryInfo.getTotalPss()` 以及 Linux 的 `smaps` 里 PSS 的汇总方式。

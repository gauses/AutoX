package org.autojs.autojs

import android.annotation.SuppressLint
import android.app.ActivityManager
import android.content.ComponentCallbacks2
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.drawable.Drawable
import android.net.Uri
import android.os.Debug
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.util.Log
import android.view.View
import android.widget.ImageView
import androidx.core.content.ContextCompat
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import androidx.multidex.MultiDexApplication
import androidx.work.Configuration
import android.graphics.BitmapFactory
import android.graphics.drawable.BitmapDrawable
import com.stardust.app.GlobalAppContext
import com.stardust.autojs.core.ui.inflater.ImageLoader
import com.stardust.autojs.core.ui.inflater.util.Drawables
import com.stardust.theme.ThemeColor
import org.autojs.autojs.autojs.AutoJs
import org.autojs.autojs.autojs.key.GlobalKeyObserver
import org.autojs.autojs.external.receiver.DynamicBroadcastReceivers
import org.autojs.autojs.theme.ThemeColorManagerCompat
import org.autojs.autojs.model.explorer.Explorers
import org.autojs.autojs.timing.TimedTaskManager
import org.autojs.autojs.timing.TimedTaskScheduler
import org.autojs.autojs.tool.CrashHandler
import org.autojs.autojs.ui.error.ErrorReportActivity
import org.autojs.autojs.ui.floating.PerfOverlay
import org.autojs.autoxjs.BuildConfig
import org.autojs.autoxjs.CpuInfoDetector
import org.autojs.autoxjs.R
import java.lang.ref.WeakReference
import java.util.concurrent.Executors
import kotlin.jvm.Synchronized
import kotlin.jvm.Volatile

/**
 * Created by Stardust on 2017/1/27.
 */

class App : MultiDexApplication(), Configuration.Provider, ComponentCallbacks2 {

    override fun onConfigurationChanged(newConfig: android.content.res.Configuration) {
        super.onConfigurationChanged(newConfig)
    }

    /**
     * 必须重写且不能调用 super：App 已通过 registerComponentCallbacks(this) 把自己注册为回调，
     * 若此处不重写，会走到 Application.onTrimMemory() 再次 dispatch 到所有回调（含自身），形成无限递归导致栈溢出。
     * 只做本应用内存清理，不调用 super。
     */
    override fun onTrimMemory(level: Int) {
        // 不调用 super，避免重入 dispatchTrimMemory
    }

    override fun onLowMemory() {
        // 同上，不调用 super
    }

    lateinit var dynamicBroadcastReceivers: DynamicBroadcastReceivers
        private set

    override fun onCreate() {
        super.onCreate()

        GlobalAppContext.set(
            this, com.stardust.app.BuildConfig.generate(BuildConfig::class.java)
        )
        instance = WeakReference(this)
        registerComponentCallbacks(this)
        setUpCrashHandler()
        // 内存监控：默认只打 logcat，不显示浮窗；开启时仅启动监控线程，浮窗需用户在加号下拉里打开
        Handler(Looper.getMainLooper()).post {
            if (Pref.isMemoryMonitoringEnabled()) {
                startMemoryMonitoring()
            }
        }
        init()


    }

    @Volatile
    private var memoryMonitoringRunning = false

    @Synchronized
    fun startMemoryMonitoring() {
        if (memoryMonitoringRunning) return
        memoryMonitoringRunning = true
        Thread {
            while (memoryMonitoringRunning) {
                try {
                    val (fullLine, floatLine) = logMemoryAndCpuSnapshot()
                    Log.i("AUTOX_PERF", fullLine)
                    PerfOverlay.appendLine(floatLine)
                } catch (e: Exception) {
                    Log.w("AUTOX_PERF", "monitor error", e)
                }
                var slept = 0
                while (memoryMonitoringRunning && slept < 2000) {
                    Thread.sleep(200)
                    slept += 200
                }
            }
        }.apply { isDaemon = true; name = "AUTOX_PERF_MONITOR"; start() }
    }

    @Synchronized
    fun stopMemoryMonitoring() {
        memoryMonitoringRunning = false
    }

    /** 由右上角加号下拉「内存监控」开关调用：写入用户偏好并立即开启/关闭浮窗与监控 */
    fun setMemoryMonitoringEnabledByUser(context: Context, enabled: Boolean) {
        Pref.setMemoryMonitoringUserSet(true)
        Pref.setMemoryMonitoringEnabled(enabled)
        Handler(Looper.getMainLooper()).post {
            if (enabled) {
                PerfOverlay.show(context)
                startMemoryMonitoring()
            } else {
                stopMemoryMonitoring()
                PerfOverlay.hide(context)
            }
        }
    }

    private fun setUpCrashHandler() {
        val crashHandler = CrashHandler(ErrorReportActivity::class.java)
        Thread.setDefaultUncaughtExceptionHandler(crashHandler)
    }

    private fun init() {
        ThemeColorManagerCompat.init(
            this,
            ThemeColor(
                ContextCompat.getColor(this, R.color.colorPrimary),
                ContextCompat.getColor(this, R.color.colorPrimaryDark),
                ContextCompat.getColor(this, R.color.colorAccent)
            )
        )
        AutoJs.initInstance(this)
        if (Pref.isRunningVolumeControlEnabled()) {
            GlobalKeyObserver.init()
        }
        setupDrawableImageLoader()
        TimedTaskScheduler.init(this)
        initDynamicBroadcastReceivers()
    }


    @SuppressLint("CheckResult")
    private fun initDynamicBroadcastReceivers() {
        dynamicBroadcastReceivers = DynamicBroadcastReceivers(this)
        val localActions = ArrayList<String>()
        val actions = ArrayList<String>()
        TimedTaskManager.allIntentTasks
            .filter { task -> task.action != null }
            .doOnComplete {
                if (localActions.isNotEmpty()) {
                    dynamicBroadcastReceivers.register(localActions, true)
                }
                if (actions.isNotEmpty()) {
                    dynamicBroadcastReceivers.register(actions, false)
                }
                @Suppress("DEPRECATION")
                LocalBroadcastManager.getInstance(applicationContext).sendBroadcast(
                    Intent(
                        DynamicBroadcastReceivers.ACTION_STARTUP
                    )
                )
            }
            .subscribe({
                if (it.isLocal) {
                    it.action?.let { it1 -> localActions.add(it1) }
                } else {
                    it.action?.let { it1 -> actions.add(it1) }
                }
            }, { it.printStackTrace() })


    }

    /** Glide 已移除：使用 BitmapFactory 仅支持 file/content，降低内存占用。 */
    private fun setupDrawableImageLoader() {
        val ctx = applicationContext
        val mainHandler = Handler(Looper.getMainLooper())
        val executor = Executors.newSingleThreadExecutor()
        fun decodeUri(uri: Uri): Bitmap? = when (uri.scheme) {
            "file" -> uri.path?.let { BitmapFactory.decodeFile(it) }
            "content" -> runCatching { ctx.contentResolver.openInputStream(uri)?.use { BitmapFactory.decodeStream(it) } }.getOrNull()
            else -> null
        }
        Drawables.setDefaultImageLoader(object : ImageLoader {
            override fun loadInto(imageView: ImageView, uri: Uri) {
                executor.execute {
                    val bmp = decodeUri(uri) ?: return@execute
                    mainHandler.post { imageView.setImageBitmap(bmp) }
                }
            }
            override fun loadIntoBackground(view: View, uri: Uri) {
                executor.execute {
                    val bmp = decodeUri(uri) ?: return@execute
                    mainHandler.post { view.background = BitmapDrawable(ctx.resources, bmp) }
                }
            }
            override fun load(view: View, uri: Uri): Drawable = throw UnsupportedOperationException()
            override fun load(view: View, uri: Uri, drawableCallback: ImageLoader.DrawableCallback) {
                executor.execute {
                    val bmp = decodeUri(uri)
                    mainHandler.post { drawableCallback.onLoaded(bmp?.let { BitmapDrawable(ctx.resources, it) }) }
                }
            }
            override fun load(view: View, uri: Uri, bitmapCallback: ImageLoader.BitmapCallback) {
                executor.execute {
                    val bmp = decodeUri(uri)
                    mainHandler.post { bitmapCallback.onLoaded(bmp) }
                }
            }
        })
    }

    override val workManagerConfiguration = Configuration.Builder()
        .setMinimumLoggingLevel(android.util.Log.INFO)
        .build()

    companion object {
        private const val TAG = "App"
        private lateinit var instance: WeakReference<App>

        val app: App
            get() = instance.get()!!

        @Volatile
        private var lastCpuTimeJiffies: Long = -1
        @Volatile
        private var lastUptimeSec: Double = -1.0

        /** 要监测内存占比的其他应用：包名 -> 浮窗显示名 */
        private val OTHER_APP_PACKAGES = mapOf(
            "com.zhiliaoapp.musically" to "TikTok",
            "com.facebook.katana" to "Facebook",
            "com.facebook.lite" to "FB Lite",
            "com.instagram.android" to "Instagram"
        )

        /**
         * 获取指定其他应用的内存占比，返回一行供浮窗显示；无数据或失败返回 null。
         * 先尝试 getRunningAppProcesses + getProcessMemoryInfo；Android 8+ 上多仅本应用，再回退到 dumpsys meminfo。
         */
        @JvmStatic
        fun getOtherAppsMemorySnapshot(context: Context): String? {
            val am = context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager ?: return null
            val sysMem = ActivityManager.MemoryInfo()
            am.getMemoryInfo(sysMem)
            if (sysMem.totalMem <= 0) return null
            val totalKb = sysMem.totalMem / 1024
            val results = mutableMapOf<String, Double>()
            try {
                val processes = am.runningAppProcesses
                if (!processes.isNullOrEmpty()) {
                    val pidsByPkg = mutableMapOf<String, MutableList<Int>>()
                    for (proc in processes) {
                        val pkg = proc.processName
                        val displayName = OTHER_APP_PACKAGES[pkg] ?: continue
                        pidsByPkg.getOrPut(displayName) { mutableListOf() }.add(proc.pid)
                    }
                    for ((displayName, pids) in pidsByPkg) {
                        val infos = am.getProcessMemoryInfo(pids.toIntArray()) ?: continue
                        var totalPssKb = 0
                        for (info in infos) totalPssKb += info.totalPss
                        if (totalPssKb > 0) {
                            results[displayName] = totalPssKb * 100.0 / totalKb
                        }
                    }
                }
                for ((pkg, displayName) in OTHER_APP_PACKAGES) {
                    if (displayName in results) continue
                    val pssKb = getPssKbByDumpsys(pkg) ?: continue
                    if (pssKb > 0) results[displayName] = pssKb * 100.0 / totalKb
                }
            } catch (e: Exception) {
                Log.w(TAG, "getOtherAppsMemorySnapshot: ${e.message}")
                return null
            }
            if (results.isEmpty()) return null
            return "[外] " + results.entries.joinToString(" | ") { "${it.key}: ${String.format("%.2f", it.value)}%" }
        }

        /** 通过 dumpsys meminfo <pkg> 解析该包总 PSS(kB)，失败返回 null。 */
        @JvmStatic
        private fun getPssKbByDumpsys(packageName: String): Int? {
            return try {
                val p = Runtime.getRuntime().exec(arrayOf("dumpsys", "meminfo", packageName))
                val out = p.inputStream.bufferedReader().readText()
                p.destroy()
                val totalRegex = Regex("Total\\s+PSS:\\s+(\\d+)")
                totalRegex.find(out)?.groupValues?.get(1)?.toIntOrNull()
                    ?: Regex("TOTAL\\s+(\\d+)").find(out)?.groupValues?.get(1)?.toIntOrNull()
            } catch (e: Exception) {
                null
            }
        }

        /**
         * 打一次内存+CPU 快照，返回 (logcat 全行, 浮窗简行)。KPI：尽量 &lt;5%。
         */
        @JvmStatic
        fun logMemoryAndCpuSnapshot(): Pair<String, String> {
            val runtime = Runtime.getRuntime()
            val javaUsed = (runtime.totalMemory() - runtime.freeMemory()) / 1024 / 1024
            val nativeUsed = Debug.getNativeHeapAllocatedSize() / 1024 / 1024
            val memInfo = Debug.MemoryInfo()
            Debug.getMemoryInfo(memInfo)
            val totalPssKb = memInfo.totalPss
            val totalPssMb = totalPssKb / 1024
            val dalvikPssMb = memInfo.dalvikPss / 1024
            val nativePssMb = memInfo.nativePss / 1024
            val otherPssMb = memInfo.otherPss / 1024
            val swappableKb = if (android.os.Build.VERSION.SDK_INT >= 19) memInfo.getTotalSwappablePss() else 0
            val swappableMb = swappableKb / 1024
            val cpuRawPct = getProcessCpuUsagePercentRaw()
            val numCores = runtime.availableProcessors()

            var totalMemMb: Long? = null
            var memRatioPct = "-"
            try {
                val ctx = instance.get()?.applicationContext
                if (ctx != null) {
                    val am = ctx.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
                    val sysMem = ActivityManager.MemoryInfo()
                    am?.getMemoryInfo(sysMem)
                    if (am != null && sysMem.totalMem > 0) {
                        totalMemMb = sysMem.totalMem / (1024 * 1024)
                        memRatioPct = String.format("%.2f", totalPssKb * 100.0 / (sysMem.totalMem / 1024))
                    }
                }
            } catch (e: Exception) {
                totalMemMb = null
                memRatioPct = "-"
            }

            val cpuRatioPct = if (cpuRawPct != null && numCores > 0) {
                String.format("%.2f", cpuRawPct / numCores)
            } else "-"

            val totalMemStr = if (totalMemMb != null) "${totalMemMb}MB" else "-"
            val pssDetail = "dalvikPss: ${dalvikPssMb}MB nativePss: ${nativePssMb}MB otherPss: ${otherPssMb}MB swappable(.so/dex等): ${swappableMb}MB"
            val fullLine = "Java: ${javaUsed}MB | Native: ${nativeUsed}MB | PSS: ${totalPssMb}MB | $pssDetail | 总内存: $totalMemStr | 内存占比: ${memRatioPct}% | CPU占比: ${cpuRatioPct}%"
            val floatLine = "内存占比: ${memRatioPct}% | CPU占比: ${cpuRatioPct}%"
            memRatioPct.toDoubleOrNull()?.let { ratio ->
                if (ratio >= 4.0) {
                    Log.w("AUTOX_PERF", "内存占比接近 5% KPI，当前: ${memRatioPct}%")
                }
            }
            return Pair(fullLine, floatLine)
        }

        /** 返回本进程 CPU 占用（单核等价 0~100），无数据时返回 null */
        @JvmStatic
        private fun getProcessCpuUsagePercentRaw(): Double? {
            return try {
                val statLine = java.io.File("/proc/self/stat").readText()
                val closeParen = statLine.indexOf(')')
                if (closeParen < 0) return null
                val afterParen = statLine.substring(closeParen + 1).trim().split(Regex("\\s+"))
                if (afterParen.size < 13) return null
                val utime = afterParen[11].toLong()
                val stime = afterParen[12].toLong()
                val totalJiffies = utime + stime
                val elapsedSec = SystemClock.elapsedRealtime() / 1000.0
                val prevElapsed = lastUptimeSec
                val prevJiffies = lastCpuTimeJiffies
                lastCpuTimeJiffies = totalJiffies
                lastUptimeSec = elapsedSec
                if (prevElapsed >= 0 && prevJiffies >= 0) {
                    val deltaSec = elapsedSec - prevElapsed
                    if (deltaSec >= 0.5) {
                        val deltaJiffies = totalJiffies - prevJiffies
                        return (deltaJiffies / (deltaSec * 100)).coerceIn(0.0, 100.0)
                    }
                }
                null
            } catch (e: Exception) {
                Log.w("AUTOX_PERF", "CPU read failed: ${e.message}")
                null
            }
        }
    }
}

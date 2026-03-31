package org.autojs.autojs

import android.annotation.SuppressLint
import android.content.ComponentCallbacks2
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.drawable.Drawable
import android.net.Uri
import android.os.Handler
import android.os.Looper
import android.view.View
import android.widget.ImageView
import androidx.core.content.ContextCompat
import androidx.localbroadcastmanager.content.LocalBroadcastManager
import androidx.multidex.MultiDexApplication
import androidx.work.Configuration
import android.graphics.BitmapFactory
import android.graphics.drawable.BitmapDrawable
import android.util.Log
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
import org.autojs.autojs.tool.AutoEnableAccessibility
import org.autojs.autojs.tool.CrashHandler
import org.autojs.autojs.tool.ManageExternalStorage
import org.autojs.autojs.ui.error.ErrorReportActivity
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

    lateinit var dynamicBroadcastReceivers: DynamicBroadcastReceivers
        private set





    override fun onCreate() {
        super.onCreate()
        Log.e(TAG, "onCreate enter, package=${packageName}")

        GlobalAppContext.set(
            this, com.stardust.app.BuildConfig.generate(BuildConfig::class.java)
        )
        instance = WeakReference(this)
        setUpCrashHandler()
        ManageExternalStorage.grantManageExternalStorage(this)
        init()
        Log.e(TAG, "before AutoEnableAccessibility.enableAccessibility")
        AutoEnableAccessibility.enableAccessibility(this)
        Log.e(TAG, "after AutoEnableAccessibility.enableAccessibility")



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
        private const val TAG = "AppInitTrace"
        private lateinit var instance: WeakReference<App>

        val app: App
            get() = instance.get()!!
    }
}

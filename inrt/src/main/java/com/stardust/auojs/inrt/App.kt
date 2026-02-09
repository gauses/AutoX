package com.stardust.auojs.inrt

import android.app.Application
import android.app.Notification
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.Build.VERSION
import android.util.Log
import android.view.View
import android.widget.ImageView
import androidx.core.app.NotificationCompat
import androidx.preference.PreferenceManager
import com.fanjun.keeplive.KeepLive
import com.fanjun.keeplive.config.ForegroundNotification
import com.linsh.utilseverywhere.Utils
import com.stardust.app.GlobalAppContext
import com.stardust.auojs.inrt.autojs.AutoJs
import com.stardust.auojs.inrt.autojs.GlobalKeyObserver
import com.stardust.auojs.inrt.pluginclient.AutoXKeepLiveService
import com.stardust.autojs.core.ui.inflater.ImageLoader
import com.stardust.autojs.core.ui.inflater.util.Drawables
import com.stardust.autojs.execution.ScriptExecuteActivity
import org.autojs.autoxjs.inrt.BuildConfig
import org.autojs.autoxjs.inrt.R
import java.util.concurrent.Executors


/**
 * Created by Stardust on 2017/7/1.
 */

class App : Application() {

    var TAG = "inrt.application";
    override fun onCreate() {
        super.onCreate()
        GlobalAppContext.set(
            this, com.stardust.app.BuildConfig.generate(BuildConfig::class.java)
        )
        Utils.init(this);
        AutoJs.initInstance(this)
        GlobalKeyObserver.init()
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
                    mainHandler.post { bmp?.let { drawableCallback.onLoaded(BitmapDrawable(ctx.resources, it)) } }
                }
            }
            override fun load(view: View, uri: Uri, bitmapCallback: ImageLoader.BitmapCallback) {
                executor.execute {
                    val bmp = decodeUri(uri)
                    mainHandler.post { bitmapCallback.onLoaded(bmp) }
                }
            }
        })

        //启动保活服务
        KeepLive.useSilenceMusice = false;
        val sharedPreferences =
            PreferenceManager.getDefaultSharedPreferences(this)
        val keepRunningWithForegroundService = sharedPreferences.getBoolean(
            getString(R.string.key_keep_running_with_foreground_service),
            false
        )
        if (keepRunningWithForegroundService) {
            val foregroundNotification = ForegroundNotification(
                GlobalAppContext.appName + "正在运行中",
                "点击打开【" + GlobalAppContext.appName + "】",
                R.mipmap.ic_launcher
            )  //定义前台服务的通知点击事件
            { context, _ ->
                Log.d(TAG, "foregroundNotificationClick: ");
                val splashActivityintent = Intent(context, ScriptExecuteActivity::class.java)
                splashActivityintent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context!!.startActivity(splashActivityintent)
            }
            KeepLive.startWork(
                this,
                KeepLive.RunMode.ENERGY,
                foregroundNotification,
                AutoXKeepLiveService()
            );
        }

        if (BuildConfig.isMarket) {
            showNotification(this);
        }
    }

    private fun showNotification(context: Context) {
        val intent = Intent(context, SplashActivity::class.java)
        val pi =
            PendingIntent.getActivity(context, 0, intent, PendingIntent.FLAG_UPDATE_CURRENT)
        val manager: NotificationManager =
            context.getSystemService(NOTIFICATION_SERVICE) as NotificationManager
        val notification = NotificationCompat.Builder(context, TAG)
            .setWhen(System.currentTimeMillis())
            .setOngoing(true)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle(GlobalAppContext.appName + "保持运行中")
            .setContentText("点击打开【" + GlobalAppContext.appName + "】")
            .setDefaults(NotificationCompat.FLAG_ONGOING_EVENT)
            .setPriority(
                if (VERSION.SDK_INT >= Build.VERSION_CODES.O) NotificationManager.IMPORTANCE_HIGH
                else NotificationCompat.PRIORITY_MAX
            )
            .setCategory(Notification.FLAG_ONGOING_EVENT.toString())
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setContentIntent(pi)
            .build()
        manager.notify(null, 0, notification)
    }

}

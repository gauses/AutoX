package org.autojs.autojs.ui.floating

import android.content.Context
import android.graphics.Color
import android.graphics.PixelFormat
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.widget.HorizontalScrollView
import android.os.Handler
import android.os.Looper
import android.util.DisplayMetrics
import android.util.TypedValue
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import kotlin.jvm.Volatile

/**
 * 性能监控悬浮窗：默认右下角、可拖动到任意位置，可滚动查看内存/CPU 占比历史。
 * 拆成两个窗口：仅标题条接收触摸（用于拖动），内容区 FLAG_NOT_TOUCHABLE 让触摸穿透，
 * 避免挡住下层应用（如 TikTok 点赞/评论）。
 */
object PerfOverlay {

    private const val MAX_LINES = 200
    private const val FLAG_NOT_FOCUSABLE = 0x00000020
    private const val FLAG_NOT_TOUCHABLE = 0x00000010

    private var windowManager: WindowManager? = null
    private var handleParams: WindowManager.LayoutParams? = null
    private var handleView: View? = null
    private var contentParams: WindowManager.LayoutParams? = null
    private var contentView: View? = null
    @Volatile
    private var logTextView: TextView? = null
    @Volatile
    private var scrollView: ScrollView? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    private fun getWindowType(): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_SYSTEM_ALERT
        }
    }

    /**
     * 在主线程调用：在右下角显示悬浮窗，可拖动到任意位置。
     */
    @JvmStatic
    fun show(context: Context) {
        mainHandler.post {
            if (handleView != null) return@post
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
                !android.provider.Settings.canDrawOverlays(context)
            ) {
                Toast.makeText(context, "需要开启「显示在其他应用上层」权限才能显示内存浮窗", Toast.LENGTH_LONG).show()
                return@post
            }
            val wm = context.applicationContext.getSystemService(Context.WINDOW_SERVICE) as? WindowManager
                ?: return@post
            val metrics = DisplayMetrics()
            wm.defaultDisplay.getRealMetrics(metrics)
            val contentHeight = (metrics.heightPixels * 0.26f).toInt().coerceAtLeast(180)
            val dp8 = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 8f, context.resources.displayMetrics).toInt()
            val dp12 = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 12f, context.resources.displayMetrics).toInt()
            val dp4 = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 4f, context.resources.displayMetrics).toInt()
            val handleHeightDp = 36
            val handleHeightPx = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, handleHeightDp.toFloat(), context.resources.displayMetrics).toInt()

            val roundedBg = GradientDrawable().apply {
                setColor(0xEE1E1E1E.toInt())
                cornerRadius = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 10f, context.resources.displayMetrics)
                setStroke(dp4, 0xFF4CAF50.toInt())
            }

            // 窗口1：仅标题条，可触摸，用于拖动
            val titleBar = TextView(context).apply {
                text = " 内存 / CPU 监控 "
                setTextColor(0xFFE8F5E9.toInt())
                setBackgroundColor(0xFF2E7D32.toInt())
                setPadding(dp12, dp8, dp12, dp8)
                textSize = 13f
                minimumHeight = handleHeightPx
            }

            val textView = TextView(context).apply {
                setTextColor(0xFFE0E0E0.toInt())
                setPadding(dp12, dp8, dp12, dp8)
                textSize = 9f
                setSingleLine(false)
                setHorizontallyScrolling(true)
                setTypeface(android.graphics.Typeface.MONOSPACE)
            }
            val horizontalScroll = HorizontalScrollView(context).apply {
                addView(textView, ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ))
            }
            val scroll = ScrollView(context).apply {
                addView(horizontalScroll, ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.WRAP_CONTENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT
                ))
            }
            val handleParams = WindowManager.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                handleHeightPx,
                getWindowType(),
                FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.BOTTOM or Gravity.END
                x = 0
                y = 0
            }
            val contentContainer = LinearLayout(context).apply {
                orientation = LinearLayout.VERTICAL
                background = roundedBg
                addView(scroll, LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.MATCH_PARENT))
            }
            val contentParams = WindowManager.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                contentHeight,
                getWindowType(),
                FLAG_NOT_FOCUSABLE or FLAG_NOT_TOUCHABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT
            ).apply {
                gravity = Gravity.BOTTOM or Gravity.END
                x = 0
                y = handleHeightPx
            }
            var lastRawX = 0f
            var lastRawY = 0f
            var lastParamsX = 0
            var lastParamsY = 0
            titleBar.setOnTouchListener { _, event ->
                val hp = handleParams
                val cp = contentParams
                when (event.action) {
                    MotionEvent.ACTION_DOWN -> {
                        lastRawX = event.rawX
                        lastRawY = event.rawY
                        lastParamsX = hp.x
                        lastParamsY = hp.y
                    }
                    MotionEvent.ACTION_MOVE -> {
                        val dx = event.rawX - lastRawX
                        val dy = event.rawY - lastRawY
                        val newX = (lastParamsX - dx.toInt()).coerceIn(-metrics.widthPixels + 100, metrics.widthPixels - 100)
                        val newY = (lastParamsY - dy.toInt()).coerceIn(-metrics.heightPixels + 100, metrics.heightPixels - 100)
                        hp.x = newX
                        hp.y = newY
                        cp.x = newX
                        cp.y = newY + handleHeightPx
                        windowManager?.updateViewLayout(handleView, hp)
                        windowManager?.updateViewLayout(contentView, cp)
                        lastRawX = event.rawX
                        lastRawY = event.rawY
                        lastParamsX = hp.x
                        lastParamsY = hp.y
                    }
                }
                false
            }
            try {
                wm.addView(titleBar, handleParams)
                wm.addView(contentContainer, contentParams)
                windowManager = wm
                this.handleParams = handleParams
                handleView = titleBar
                this.contentParams = contentParams
                contentView = contentContainer
                logTextView = textView
                scrollView = scroll
                textView.text = "内存占比: 0.00% | CPU占比: 0.00%\n"
            } catch (e: Exception) {
                handleView = null
                contentView = null
                logTextView = null
                scrollView = null
            }
        }
    }

    /** 对每行中「内存占比: X.XX%」仅当 X.XX > 3 时标红 */
    private fun applyMemRatioRed(fullText: String): SpannableStringBuilder {
        val builder = SpannableStringBuilder()
        val lines = fullText.split("\n")
        val redSpan = ForegroundColorSpan(Color.RED)
        val regex = Regex("内存占比:\\s*([\\d.]+)%")
        for (i in lines.indices) {
            val line = lines[i]
            val startInBuilder = builder.length
            builder.append(line)
            regex.find(line)?.let { match ->
                val value = match.groupValues.getOrNull(1)?.toDoubleOrNull() ?: 0.0
                if (value > 3.0) {
                    builder.setSpan(redSpan, startInBuilder + match.range.first, startInBuilder + match.range.last + 1, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
                }
            }
            if (i < lines.size - 1) builder.append("\n")
        }
        return builder
    }

    /**
     * 可从任意线程调用：追加一行并滚动到底部，保留最近 MAX_LINES 行；每行不换行，内存占比标红。
     */
    @JvmStatic
    fun appendLine(line: String) {
        val tv = logTextView ?: return
        val sv = scrollView ?: return
        mainHandler.post {
            val current = tv.text?.toString() ?: ""
            val newText = if (current.isEmpty()) line else "$current\n$line"
            val lines = newText.split("\n")
            val trimmed = if (lines.size > MAX_LINES) {
                lines.takeLast(MAX_LINES).joinToString("\n")
            } else newText
            tv.text = applyMemRatioRed(trimmed)
            sv.post { sv.fullScroll(View.FOCUS_DOWN) }
        }
    }

    @JvmStatic
    fun hide(context: Context) {
        mainHandler.post {
            val wm = windowManager ?: return@post
            try {
                contentView?.let { wm.removeView(it) }
                handleView?.let { wm.removeView(it) }
            } catch (_: Exception) { }
            windowManager = null
            handleParams = null
            handleView = null
            contentParams = null
            contentView = null
            logTextView = null
            scrollView = null
        }
    }

    @JvmStatic
    fun isShowing(): Boolean = handleView != null
}

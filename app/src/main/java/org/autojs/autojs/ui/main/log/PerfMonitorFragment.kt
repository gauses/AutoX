package org.autojs.autojs.ui.main.log

import android.app.AlertDialog
import android.graphics.Color
import android.graphics.Typeface
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.SpannableStringBuilder
import android.text.Spanned
import android.text.style.ForegroundColorSpan
import android.util.TypedValue
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.fragment.app.Fragment
import org.autojs.autojs.App
import org.autojs.autojs.ui.widget.fillMaxSize
import org.autojs.autoxjs.R

/**
 * 主界面「文档」位：展示内存/CPU 监控信息，滚动打印，自动滚到底部。
 */
class PerfMonitorFragment : Fragment() {

    companion object {
        private const val MAX_LINES = 500
        private const val INTERVAL_MS = 2000L
    }

    private val mainHandler = Handler(Looper.getMainLooper())
    private var scrollView: ScrollView? = null
    private var textView: TextView? = null
    private var samplingRunnable: Runnable? = null
    private var isSampling = false

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        val context = requireContext()
        val dp16 = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, 16f, context.resources.displayMetrics).toInt()
        val frame = FrameLayout(context)
        val scroll = ScrollView(context).apply {
            fillMaxSize()
        }
        val tv = TextView(context).apply {
            setTextColor(0xFF2E7D32.toInt()) // 浅绿，与截图一致
            setPadding(24, 16, 24, 16)
            textSize = 12f
            typeface = Typeface.MONOSPACE
            setBackgroundColor(0xFFFFFFFF.toInt())
        }
        scroll.addView(tv, ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT))
        scrollView = scroll
        textView = tv
        frame.addView(scroll, FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))
        val stopBtn = Button(context).apply {
            text = context.getString(R.string.text_stop_monitor)
            setOnClickListener { stopSampling(showDialog = true) }
        }
        val btnParams = FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT).apply {
            gravity = Gravity.BOTTOM or Gravity.END
            setMargins(0, 0, dp16, dp16)
        }
        frame.addView(stopBtn, btnParams)
        return frame
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        startSampling()
    }

    override fun onResume() {
        super.onResume()
        startSampling()
    }

    override fun onPause() {
        super.onPause()
        // 不在此处 stopSampling，以便切到其他 tab 或后台执行任务时仍持续采样；回到本页时能看到这段时间的监控日志
    }

    override fun onDestroyView() {
        stopSampling(showDialog = false)
        scrollView = null
        textView = null
        super.onDestroyView()
    }

    private fun startSampling() {
        if (isSampling) return
        isSampling = true
        samplingRunnable = object : Runnable {
            override fun run() {
                if (!isSampling) return
                Thread {
                    try {
                        val (fullLine, _) = App.logMemoryAndCpuSnapshot()
                        mainHandler.post {
                            appendLine(fullLine)
                            samplingRunnable?.let { if (isSampling) mainHandler.postDelayed(it, INTERVAL_MS) }
                        }
                    } catch (e: Exception) {
                        mainHandler.post {
                            samplingRunnable?.let { if (isSampling) mainHandler.postDelayed(it, INTERVAL_MS) }
                        }
                    }
                }.start()
            }
        }
        mainHandler.postDelayed(samplingRunnable!!, INTERVAL_MS)
    }

    private fun stopSampling(showDialog: Boolean = false) {
        isSampling = false
        samplingRunnable?.let { mainHandler.removeCallbacks(it) }
        samplingRunnable = null
        if (showDialog) showMemoryOver5PercentDialogIfNeeded()
    }

    private val memRatioRegex = Regex("内存占比:\\s*([\\d.]+)%")

    /** 监控结束后：若有内存占比超过 5% 的条目则弹窗列出；否则弹窗提示本次没有超过 5%。 */
    private fun showMemoryOver5PercentDialogIfNeeded() {
        mainHandler.post {
            val tv = textView ?: return@post
            val fullText = tv.text?.toString() ?: ""
            val lines = fullText.split("\n").filter { it.isNotBlank() }
            val over5Lines = lines.filter { line ->
                memRatioRegex.find(line)?.groupValues?.getOrNull(1)?.toDoubleOrNull()?.let { it > 5.0 } ?: false
            }
            val context = context ?: return@post
            val title = if (over5Lines.isEmpty()) {
                context.getString(R.string.text_perf_no_over_5_title)
            } else {
                context.getString(R.string.text_perf_over_5_title)
            }
            val message = if (over5Lines.isEmpty()) {
                context.getString(R.string.text_perf_no_over_5_message)
            } else {
                over5Lines.joinToString("\n")
            }
            AlertDialog.Builder(context)
                .setTitle(title)
                .setMessage(message)
                .setPositiveButton(android.R.string.ok, null)
                .show()
        }
    }

    private val defaultTextColor = 0xFF2E7D32.toInt() // 浅绿
    private val redSpan = ForegroundColorSpan(Color.RED)
    private val defaultSpan = ForegroundColorSpan(defaultTextColor)

    /** 内存占比超过 5% 的那一行整行标红 */
    private fun applyMemRatioRed(fullText: String): SpannableStringBuilder {
        val builder = SpannableStringBuilder()
        val lines = fullText.split("\n")
        val regex = Regex("内存占比:\\s*([\\d.]+)%")
        for (i in lines.indices) {
            val line = lines[i]
            val startInBuilder = builder.length
            builder.append(line)
            val value = regex.find(line)?.groupValues?.getOrNull(1)?.toDoubleOrNull() ?: 0.0
            val span = if (value > 5.0) redSpan else defaultSpan
            builder.setSpan(span, startInBuilder, startInBuilder + line.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
            if (i < lines.size - 1) builder.append("\n")
        }
        return builder
    }

    private fun appendLine(line: String) {
        val tv = textView ?: return
        val sv = scrollView ?: return
        val current = tv.text?.toString() ?: ""
        val newText = if (current.isEmpty()) line else "$current\n$line"
        val lines = newText.split("\n")
        val trimmed = if (lines.size > MAX_LINES) {
            lines.takeLast(MAX_LINES).joinToString("\n")
        } else newText
        tv.text = applyMemRatioRed(trimmed)
        sv.post { sv.fullScroll(View.FOCUS_DOWN) }
    }

    /** 供 TopBar 清除按钮调用 */
    fun clearLog() {
        mainHandler.post {
            textView?.text = ""
        }
    }
}

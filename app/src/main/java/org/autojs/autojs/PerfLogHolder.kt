package org.autojs.autojs

/**
 * 全局持有本次运行的内存监控日志，供脚本结束后上传前写入 nest_result_rpa.txt。
 * 由 PerfMonitorFragment 在 appendLine/clearLog 时更新。
 */
object PerfLogHolder {
    private const val MAX_LINES = 500

    @Volatile
    private var fullText: String = ""

    fun appendLine(line: String) {
        fullText = if (fullText.isEmpty()) line else "$fullText\n$line"
        val lines = fullText.split("\n")
        if (lines.size > MAX_LINES) {
            fullText = lines.takeLast(MAX_LINES).joinToString("\n")
        }
    }

    fun clear() {
        fullText = ""
    }

    /** 获取当前快照（不清空），供上传前写入 nest_result_rpa.txt */
    fun getSnapshot(): String = fullText
}

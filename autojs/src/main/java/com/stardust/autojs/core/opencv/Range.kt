package com.stardust.autojs.core.opencv

/**
 * 桩：替代 org.opencv.core.Range，OpenCV 已移除以降低内存。
 */
data class Range(val start: Int, val end: Int)

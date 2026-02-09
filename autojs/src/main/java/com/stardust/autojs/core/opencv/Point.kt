package com.stardust.autojs.core.opencv

/**
 * 桩：替代 org.opencv.core.Point，OpenCV 已移除以降低内存。
 */
data class Point(var x: Double = 0.0, var y: Double = 0.0)

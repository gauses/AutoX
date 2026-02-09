package com.stardust.autojs.core.opencv

/**
 * 桩：替代 org.opencv.core.Rect，OpenCV 已移除以降低内存。
 */
data class Rect(val x: Double, val y: Double, val width: Double, val height: Double) {
    constructor(x: Int, y: Int, width: Int, height: Int) : this(x.toDouble(), y.toDouble(), width.toDouble(), height.toDouble())
}

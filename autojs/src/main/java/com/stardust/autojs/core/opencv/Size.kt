package com.stardust.autojs.core.opencv

/**
 * 桩：替代 org.opencv.core.Size，OpenCV 已移除以降低内存。
 */
data class Size(val width: Double, val height: Double) {
    constructor(width: Int, height: Int) : this(width.toDouble(), height.toDouble())
}

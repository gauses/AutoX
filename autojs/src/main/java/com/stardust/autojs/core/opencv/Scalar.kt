package com.stardust.autojs.core.opencv

/**
 * 桩：替代 org.opencv.core.Scalar，OpenCV 已移除以降低内存。
 */
data class Scalar(val value: DoubleArray = doubleArrayOf(0.0)) {
    constructor(v0: Double, v1: Double = 0.0, v2: Double = 0.0, v3: Double = 0.0) : this(doubleArrayOf(v0, v1, v2, v3))
}

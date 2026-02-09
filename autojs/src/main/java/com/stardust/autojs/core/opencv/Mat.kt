package com.stardust.autojs.core.opencv

import com.stardust.util.ResourceMonitor

/**
 * 桩：替代 org.opencv.core.Mat，OpenCV 已移除以降低内存。所有操作无效。
 */
class Mat : ResourceMonitor.Resource {
    private var released = false
    private val resourceId = sResourceId.incrementAndGet()

    companion object {
        private val sResourceId = java.util.concurrent.atomic.AtomicInteger(0)
    }

    constructor()
    constructor(addr: Long)  // 兼容调用，忽略
    constructor(rows: Int, cols: Int, type: Int)
    constructor(mat: Mat?, roi: Rect?)
    constructor(mat: Mat?, rowRange: Range?, colRange: Range?)
    constructor(size: Size?, type: Int)
    constructor(rows: Int, cols: Int, type: Int, s: Scalar)
    constructor(size: Size?, type: Int, s: Scalar)

    init {
        ResourceMonitor.onOpen(this)
    }

    fun cols(): Int = 0
    fun rows(): Int = 0
    fun width(): Int = 0
    fun height(): Int = 0
    fun type(): Int = 0
    fun get(row: Int, col: Int): DoubleArray = doubleArrayOf(0.0, 0.0, 0.0, 0.0)
    fun clone(): Mat = Mat()
    fun release() {
        if (released) return
        released = true
        ResourceMonitor.onClose(this)
    }
    override fun getResourceId(): Int = resourceId
}

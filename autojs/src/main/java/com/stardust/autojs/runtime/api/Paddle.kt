package com.stardust.autojs.runtime.api

import com.stardust.autojs.core.image.ImageWrapper

/**
 * OCR 已关闭以降低内存占用；调用 ocr/ocrText 返回空结果。
 * 若需恢复 OCR，请重新接入 paddleocr 依赖并还原原实现。
 */
class Paddle {

    /** 桩结果，供脚本侧 result.map(e => e.words) 使用 */
    data class OcrResult(val words: String)

    @JvmOverloads
    fun ocr(
        image: ImageWrapper,
        cpuThreadNum: Int = Runtime.getRuntime().availableProcessors(),
        useSlim: Boolean = true
    ): List<OcrResult> = emptyList()

    fun ocr(
        image: ImageWrapper,
        cpuThreadNum: Int,
        myModelPath: String
    ): List<OcrResult> = emptyList()

    fun ocr(image: ImageWrapper, useSlim: Boolean): List<OcrResult> = emptyList()

    fun ocr(image: ImageWrapper, myModelPath: String): List<OcrResult> = emptyList()
}

package com.stardust.autojs.runtime.api

import com.stardust.autojs.core.image.ImageWrapper
import com.stardust.autojs.core.mlkit.GoogleMLKitOcrResult

/**
 * OCR 已关闭以降低内存占用；ocr 返回 null，ocrText 返回空字符串。
 * 若需恢复 OCR，请重新接入 ML Kit 依赖并还原原实现。
 */
class GoogleMLKit {

    fun ocr(imageWrapper: ImageWrapper, language: String): GoogleMLKitOcrResult? = null

    fun ocrText(imageWrapper: ImageWrapper, language: String): String = ""
}

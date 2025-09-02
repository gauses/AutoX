package org.autojs.autojs.alioss

import android.content.Context
import android.net.ConnectivityManager
import android.util.Log
import com.alibaba.sdk.android.oss.ClientConfiguration
import com.alibaba.sdk.android.oss.ClientException
import com.alibaba.sdk.android.oss.OSS
import com.alibaba.sdk.android.oss.OSSClient
import com.alibaba.sdk.android.oss.ServiceException
import com.alibaba.sdk.android.oss.callback.OSSCompletedCallback
import com.alibaba.sdk.android.oss.callback.OSSProgressCallback
import com.alibaba.sdk.android.oss.common.OSSLog
import com.alibaba.sdk.android.oss.common.auth.OSSStsTokenCredentialProvider
import com.alibaba.sdk.android.oss.internal.OSSAsyncTask
import com.alibaba.sdk.android.oss.model.PutObjectRequest
import com.alibaba.sdk.android.oss.model.PutObjectResult
import com.stardust.autojs.runtime.ScriptRuntime.getApplicationContext
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject
import java.io.File


//说明文档：https://github.com/aliyun/aliyun-oss-android-sdk/blob/master/README-CN.md

object AliOSSUtils {


    data class STSCredentials(
        val accessKeyId: String,
        val accessKeySecret: String,
        val securityToken: String
    )

    fun getOSSSTSKey(XToken: String): STSCredentials? {
        val client = OkHttpClient()
        val maxRetries = 3 // 最大重试次数
        var retryCount = 0

        val request = Request.Builder()
            .url("https://cloud.nestbrowser.com/cm/v1/sts")
            .get()
            .addHeader("X-Token", XToken)
            .build()

        while (retryCount < maxRetries) {
            try {
                client.newCall(request).execute().use { response ->
                    val responseBody = response.body?.string()
                    if (responseBody != null) {
                        try {
                            val json = JSONObject(responseBody)
                            val data = json.optJSONObject("data")
                            val credentials = data?.optJSONObject("credentials")
                            
                            if (credentials != null &&
                                credentials.has("accessKeyId") &&
                                credentials.has("accessKeySecret") &&
                                credentials.has("securityToken")
                            ) {
                                return STSCredentials(
                                    accessKeyId = credentials.getString("accessKeyId"),
                                    accessKeySecret = credentials.getString("accessKeySecret"),
                                    securityToken = credentials.getString("securityToken")
                                )
                            } else {
                                Log.w("AliOSSUtils", "第${retryCount + 1}次请求未获取到完整参数，准备重试")
                                retryCount++
                                if (retryCount < maxRetries) {
                                    Thread.sleep(1000) // 等待1秒后重试
                                }
                            }
                        } catch (e: Exception) {
                            Log.e("AliOSSUtils", "第${retryCount + 1}次解析响应失败", e)
                            retryCount++
                            if (retryCount < maxRetries) {
                                Thread.sleep(1000) // 等待1秒后重试
                            }
                        }
                    } else {
                        Log.w("AliOSSUtils", "第${retryCount + 1}次请求响应为空，准备重试")
                        retryCount++
                        if (retryCount < maxRetries) {
                            Thread.sleep(1000) // 等待1秒后重试
                        }
                    }
                }
            } catch (e: Exception) {
                Log.e("AliOSSUtils", "第${retryCount + 1}次请求失败", e)
                retryCount++
                if (retryCount < maxRetries) {
                    Thread.sleep(1000) // 等待1秒后重试
                }
            }
        }

        Log.e("AliOSSUtils", "在${maxRetries}次尝试后仍未获取到STS凭证")
        return null
    }



    //初始化
    fun initOSS(XToken: String): OSS? {
        val endpoint = "http://oss-accelerate.aliyuncs.com"
        
        // 获取STS凭证
        val credentials = getOSSSTSKey(XToken)
        if (credentials == null) {
            Log.e("AliOSSUtils", "初始化OSS失败：无法获取STS凭证")
            return null
        }

        // 使用获取到的凭证创建Provider
        val credentialProvider = OSSStsTokenCredentialProvider(
            credentials.accessKeyId,
            credentials.accessKeySecret,
            credentials.securityToken
        )

        // 配置OSS客户端
        val conf = ClientConfiguration().apply {
            connectionTimeout = 30 * 1000 // 连接超时增加到30秒
            socketTimeout = 30 * 1000 // socket超时增加到30秒
            maxConcurrentRequest = 5 // 最大并发请求数，默认5个
            maxErrorRetry = 3 // 失败后最大重试次数增加到3次
            isHttpDnsEnable = true // 启用HTTPDNS
        }
        
        // 开启日志
        OSSLog.enableLog() //这个开启会支持写入手机sd卡中的一份日志文件位置在SDCard_path\OSSLog\logs.csv

        return try {
            OSSClient(getApplicationContext(), endpoint, credentialProvider, conf).also {
                Log.d("AliOSSUtils", "OSS客户端初始化成功")
            }
        } catch (e: Exception) {
            Log.e("AliOSSUtils", "OSS客户端初始化失败", e)
            null
        }
    }


    private fun isNetworkAvailable(): Boolean {
        val connectivityManager = getApplicationContext().getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        val networkInfo = connectivityManager.activeNetworkInfo
        return networkInfo != null && networkInfo.isConnected
    }

    private fun checkFileValidity(file: File): Boolean {
        if (!file.exists() || !file.isFile) {
            Log.e("AliOSSUtils", "文件不存在")
            return false
        }

        if (!file.canRead()) {
            Log.e("AliOSSUtils", "文件无法读取")
            return false
        }

        val fileSize = file.length()
        if (fileSize == 0L) {
            Log.e("AliOSSUtils", "文件大小为0")
            return false
        }

        // 设置最大文件大小限制（50MB）
        val maxFileSize = 50 * 1024 * 1024L
        if (fileSize > maxFileSize) {
            Log.e("AliOSSUtils", "文件过大：${fileSize / 1024 / 1024}MB，超过限制：${maxFileSize / 1024 / 1024}MB")
            return false
        }

        return true
    }

    fun upload(XToken: String, ossFilePath: String, filePath: String): Boolean {
        Log.d("AliOSSUtils", "开始上传文件:")
        Log.d("AliOSSUtils", "XToken: $XToken")
        Log.d("AliOSSUtils", "OSS路径: $ossFilePath")
        Log.d("AliOSSUtils", "本地文件: $filePath")

        // 检查网络状态
        if (!isNetworkAvailable()) {
            Log.e("AliOSSUtils", "网络不可用")
            return false
        }

        // 检查文件
        val file = File(filePath)
        if (!checkFileValidity(file)) {
            return false
        }

        val maxRetries = 5 // 增加最大重试次数
        var retryCount = 0
        var baseWaitTime = 3000L // 基础等待时间（3秒）

        while (retryCount < maxRetries) {
            try {
                // 初始化OSS客户端
                val oss = initOSS(XToken) ?: run {
                    Log.e("AliOSSUtils", "第${retryCount + 1}次尝试：OSS客户端初始化失败")
                    retryCount++
                    if (retryCount < maxRetries) {
                        // 使用指数退避策略计算等待时间
                        val waitTime = baseWaitTime * (1 shl (retryCount - 1)) // 3秒, 6秒, 12秒...
                        Log.d("AliOSSUtils", "等待${waitTime/1000}秒后重试...")
                        Thread.sleep(waitTime)
                    }
                    return@run null
                }

                // 重新检查网络状态
                if (!isNetworkAvailable()) {
                    Log.e("AliOSSUtils", "网络连接已断开，等待重试")
                    retryCount++
                    if (retryCount < maxRetries) {
                        val waitTime = baseWaitTime * (1 shl (retryCount - 1))
                        Thread.sleep(waitTime)
                        continue
                    }
                    return false
                }

                if (oss == null) continue

                // 记录上传开始时间
                val startTime = System.currentTimeMillis()
                var lastProgressUpdate = 0L
                var lastProgress = 0

                // 构造上传请求
                val put = PutObjectRequest("oss-nest-sg", ossFilePath, filePath).apply {
                    // 设置进度回调
                    progressCallback = OSSProgressCallback { _, currentSize, totalSize ->
                        val currentTime = System.currentTimeMillis()
                        val progress = (currentSize * 100.0 / totalSize).toInt()
                        
                        // 每秒最多更新一次进度，或进度变化超过5%时更新
                        if (currentTime - lastProgressUpdate >= 1000 || progress - lastProgress >= 5) {
                            // 计算上传速度
                            val speed = if (currentTime > startTime) {
                                val elapsedSeconds = (currentTime - startTime) / 1000.0
                                val bytesPerSecond = currentSize / elapsedSeconds
                                String.format("%.2f KB/s", bytesPerSecond / 1024)
                            } else "计算中..."

                            // 估算剩余时间
                            val remainingTime = if (progress > 0) {
                                val totalTime = (currentTime - startTime) * 100 / progress
                                val remaining = totalTime - (currentTime - startTime)
                                String.format("%.1f秒", remaining / 1000.0)
                            } else "计算中..."

                            Log.d("AliOSSUtils", "第${retryCount + 1}次尝试：文件 $filePath\n" +
                                    "上传进度: $progress% | 速度: $speed | 预计剩余时间: $remainingTime")
                            
                            lastProgressUpdate = currentTime
                            lastProgress = progress
                        }
                    }
                }

                var uploadSuccess = false
                var uploadError: String? = null

                // 执行上传
                val task = oss.asyncPutObject(put,
                    object : OSSCompletedCallback<PutObjectRequest?, PutObjectResult?> {
                        override fun onSuccess(request: PutObjectRequest?, result: PutObjectResult?) {
                            val duration = (System.currentTimeMillis() - startTime) / 1000.0
                            Log.i("AliOSSUtils", "第${retryCount + 1}次尝试：文件 $filePath 上传成功" +
                                    "\n总耗时：${String.format("%.1f秒", duration)}")
                            uploadSuccess = true
                        }

                        override fun onFailure(
                            request: PutObjectRequest?,
                            clientExcepion: ClientException?,
                            serviceException: ServiceException?
                        ) {
                            val errorMsg = when {
                                clientExcepion != null -> {
                                    when {
                                        clientExcepion.message?.contains("timeout") == true -> 
                                            "网络超时，将重试"
                                        clientExcepion.message?.contains("Network") == true -> 
                                            "网络异常，将重试"
                                        else -> "客户端异常：${clientExcepion.message}"
                                    }
                                }
                                serviceException != null -> {
                                    when (serviceException.errorCode) {
                                        "InvalidAccessKeyId" -> "AccessKey无效，请检查配置"
                                        "SignatureDoesNotMatch" -> "签名不匹配，请检查配置"
                                        "NoSuchBucket" -> "Bucket不存在，请检查配置"
                                        else -> "服务端异常：[${serviceException.errorCode}] ${serviceException.rawMessage}"
                                    }
                                }
                                else -> "未知错误"
                            }
                            Log.e("AliOSSUtils", "第${retryCount + 1}次尝试失败：$errorMsg")
                            uploadError = errorMsg
                        }
                    })

                // 等待上传完成
                task.waitUntilFinished()

                if (uploadSuccess) {
                    return true
                } else {
                    Log.e("AliOSSUtils", "第${retryCount + 1}次尝试：文件上传失败：${uploadError ?: "未知错误"}")
                    retryCount++
                    if (retryCount < maxRetries) {
                        Log.d("AliOSSUtils", "等待3秒后重试...")
                        Thread.sleep(3000)
                    }
                }

            } catch (e: Exception) {
                Log.e("AliOSSUtils", "第${retryCount + 1}次尝试：文件上传过程发生异常", e)
                retryCount++
                if (retryCount < maxRetries) {
                    Log.d("AliOSSUtils", "等待3秒后重试...")
                    Thread.sleep(3000)
                }
            }
        }

        Log.e("AliOSSUtils", "在${maxRetries}次尝试后，文件上传仍然失败")
        return false
    }


}
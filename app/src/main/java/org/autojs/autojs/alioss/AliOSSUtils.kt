package org.autojs.autojs.alioss

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
            connectionTimeout = 15 * 1000 // 连接超时，默认15秒
            socketTimeout = 15 * 1000 // socket超时，默认15秒
            maxConcurrentRequest = 5 // 最大并发请求数，默认5个
            maxErrorRetry = 2 // 失败后最大重试次数，默认2次
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


    fun upload(XToken: String, ossFilePath: String, filePath: String): Boolean {
        Log.d("AliOSSUtils", "开始上传文件:")
        Log.d("AliOSSUtils", "XToken: $XToken")
        Log.d("AliOSSUtils", "OSS路径: $ossFilePath")
        Log.d("AliOSSUtils", "本地文件: $filePath")

        // 检查文件是否存在
        val file = File(filePath)
        if (!file.exists() || !file.isFile) {
            Log.e("AliOSSUtils", "上传失败：文件不存在 - $filePath")
            return false
        }

        // 初始化OSS客户端
        val oss = initOSS(XToken) ?: run {
            Log.e("AliOSSUtils", "上传失败：OSS客户端初始化失败")
            return false
        }

        try {
            // 构造上传请求
            val put = PutObjectRequest("oss-nest-sg", ossFilePath, filePath).apply {
                // 设置进度回调
                progressCallback = OSSProgressCallback { _, currentSize, totalSize ->
                    val progress = (currentSize * 100.0 / totalSize).toInt()
                    Log.d("AliOSSUtils", "文件 $filePath 上传进度: $progress%")
                }
            }

            var uploadSuccess = false
            var uploadError: String? = null

            // 执行上传
            val task = oss.asyncPutObject(put,
                object : OSSCompletedCallback<PutObjectRequest?, PutObjectResult?> {
                    override fun onSuccess(request: PutObjectRequest?, result: PutObjectResult?) {
                        Log.i("AliOSSUtils", "文件 $filePath 上传成功")
                        uploadSuccess = true
                    }

                    override fun onFailure(
                        request: PutObjectRequest?,
                        clientExcepion: ClientException?,
                        serviceException: ServiceException?
                    ) {
                        uploadError = when {
                            clientExcepion != null -> {
                                Log.e("AliOSSUtils", "客户端异常", clientExcepion)
                                "客户端异常：${clientExcepion.message}"
                            }
                            serviceException != null -> {
                                Log.e("AliOSSUtils", "服务端异常：${serviceException.rawMessage}")
                                "服务端异常：[${serviceException.errorCode}] ${serviceException.rawMessage}"
                            }
                            else -> "未知错误"
                        }
                    }
                })

            // 等待上传完成
            task.waitUntilFinished()

            return if (uploadSuccess) {
                true
            } else {
                Log.e("AliOSSUtils", "文件上传失败：${uploadError ?: "未知错误"}")
                false
            }

        } catch (e: Exception) {
            Log.e("AliOSSUtils", "文件上传过程发生异常", e)
            return false
        }


    }


}
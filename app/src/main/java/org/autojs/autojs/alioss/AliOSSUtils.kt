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
    fun initOSS(): OSS{
        val endpoint = "http://oss-cn-hangzhou.aliyuncs.com"
        val credentialProvider = OSSStsTokenCredentialProvider(
            "STS.NXnBDELYopSAZxxCJUz6LVVWA",
            "H6D9r2VWBFnqUWD5iLSWCMtkdNqvwGVGhGvsSkandwGR",
            "CAISmAN1q6Ft5B2yfSjIr5vbCf7xoYZOx5GqWF7Jp0oAdrlguZP8ozz2IHhMenJhA+kYsfQzlWlY7Pgalqp6U4cdreZimzMrvPpt6gqET9frdKXXhOV2QfTHdEGXDxnkpoCwB8zyUNLafNq0dlnAjVUd6LDmdDKkLTvHVJqSksxfc8gwVAu1ZiY8A7UwHAZ5r9IAPnb8LOukNgWQ4lDdF011oAFx+1gdqa202Z+b8QGMzg+4mOgOvMH3L4O4KtJje4tyVs+x1fB7M7Hd1zRdrFoou659l/5D4iyV/IPfUV5K+FCAPvHIt8ZgaxN0Y7A+ErJJ6ePgkud1/c6rztymlkkWYLEECHmCGtD4m/GpQr35aowLEp/gIGnI39y1MZ34jhgpe3pzNnkRI4J/cS4qUEJzGm2Lc//9pgjQBx2qTq+ey6c7yoZv11z4Vk4t6r510txzuAZv2f9UBytAX3Z+Vmzx4K6gHwcF9d8zsjxx4VHviLx66MKO80SbHUZ7pXo05MbFXOjt0diwTWzWv3+l+Gq0jeUu2wx5VQqfI9oagAEZFA3Uij62rTGNmD2pYH3H2YVPlGdlK8/pqr38huw77VOjq2+gplxPWMVOX264H4S/FkiASVCgHCtBhMT2QTR5jYryQ2KUBFPJDhewhm+emIisc/JLPPFcr2Y9mBveHBcWyAU3R5jhDt81rrHdW3Ws2o5WNFO7sfIaSg63kYBUhSAA"
        )

        //该配置类如果不设置，会有默认配置，具体可看该类
        val conf = ClientConfiguration()
        conf.connectionTimeout = 15 * 1000 // 连接超时，默认15秒
        conf.socketTimeout = 15 * 1000 // socket超时，默认15秒
        conf.maxConcurrentRequest = 5 // 最大并发请求数，默认5个
        conf.maxErrorRetry = 2 // 失败后最大重试次数，默认2次
        OSSLog.enableLog() //这个开启会支持写入手机sd卡中的一份日志文件位置在SDCard_path\OSSLog\logs.csv

        val oss: OSS = OSSClient(getApplicationContext(), endpoint, credentialProvider, conf)

        return oss

    }


    fun upload(fileName: String, filePath: String){

        // 构造上传请求
        val put = PutObjectRequest("oss-nest-sg", fileName, filePath)
        // 异步上传时可以设置进度回调
        put.progressCallback =
            OSSProgressCallback { request, currentSize, totalSize ->
                Log.d(
                    "PutObject",
                    "currentSize: $currentSize totalSize: $totalSize"
                )
            }

        val oss = initOSS()
        val task: OSSAsyncTask<*> = oss.asyncPutObject(
            put,
            object : OSSCompletedCallback<PutObjectRequest?, PutObjectResult?> {
                override fun onSuccess(request: PutObjectRequest?, result: PutObjectResult?) {
                    Log.d("PutObject", "UploadSuccess")
                }

                override fun onFailure(
                    request: PutObjectRequest?,
                    clientExcepion: ClientException,
                    serviceException: ServiceException
                ) {
                    // 请求异常
                    if (clientExcepion != null) {
                        // 本地异常如网络异常等
                        clientExcepion.printStackTrace()
                    }
                    if (serviceException != null) {
                        // 服务异常
                        Log.e("ErrorCode", serviceException.errorCode)
                        Log.e("RequestId", serviceException.requestId)
                        Log.e("HostId", serviceException.hostId)
                        Log.e("RawMessage", serviceException.rawMessage)
                    }
                }
            })


    }


}
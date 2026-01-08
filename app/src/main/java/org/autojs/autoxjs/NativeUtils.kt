package org.autojs.autoxjs

import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

object NativeUtils {
    private const val TAG = "NativeUtils"
    
    init {
        System.loadLibrary("native-lib")
    }

    /**
     * 关闭容器
     * @param baseUrl API基础URL，默认为 "http://172.17.0.1:3001"
     * @param connectTimeout 连接超时时间（毫秒），默认3000
     * @param readTimeout 读取超时时间（毫秒），默认3000
     * @return 包含容器ID、请求URL和响应信息的字符串
     */
    suspend fun shutdownContainer(
        baseUrl: String = "http://172.17.0.1:3001",
        connectTimeout: Int = 3000,
        readTimeout: Int = 3000
    ): String = withContext(Dispatchers.IO) {
        try {
            Log.d(TAG, "Processing shutdown...")
            
            val containerId = CpuInfoDetector.getContainerId()
            
            if (containerId < 0) {
                return@withContext "Error: Failed to get container ID (returned: $containerId)"
            }

            
            val url = "$baseUrl/api/1_0/stop/$containerId"
            Log.d(TAG, "Request URL: $url")
            
            val connection = java.net.URL(url).openConnection() as java.net.HttpURLConnection
            connection.connectTimeout = connectTimeout
            connection.readTimeout = readTimeout
            connection.requestMethod = "GET"
            
            val responseCode = connection.responseCode
            val responseMsg = connection.responseMessage
            
            val result = "Container ID: $containerId\nRequest: $url\nResponse: $responseCode $responseMsg"
            Log.d(TAG, "Shutdown result: $result")
            
            result
        } catch (e: Exception) {
            val errorMsg = "Error shutdown: ${e.message}"
            Log.e(TAG, errorMsg, e)
            errorMsg
        }
    }

    /**
     * 关闭容器（带回调的版本，用于非协程环境）
     * @param baseUrl API基础URL，默认为 "http://172.17.0.1:3001"
     * @param connectTimeout 连接超时时间（毫秒），默认3000
     * @param readTimeout 读取超时时间（毫秒），默认3000
     * @param callback 结果回调
     */
    fun shutdownContainerAsync(
        baseUrl: String = "http://172.17.0.1:3001",
        connectTimeout: Int = 3000,
        readTimeout: Int = 3000,
        callback: (String) -> Unit
    ) {
        CoroutineScope(Dispatchers.IO).launch {
            val result = shutdownContainer(baseUrl, connectTimeout, readTimeout)
            callback(result)
        }
    }
}

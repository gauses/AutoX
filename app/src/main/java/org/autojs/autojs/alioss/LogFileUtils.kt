package org.autojs.autojs.alioss

import android.content.Context
import android.os.Environment
import android.util.Log
import com.stardust.app.GlobalAppContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import org.autojs.autojs.PerfLogHolder
import org.json.JSONObject
import java.io.File
import java.io.IOException
import java.text.SimpleDateFormat
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Date
import java.util.Locale
import java.util.UUID
import java.util.concurrent.TimeUnit

object LogFileUtils {

    //获取SD卡的截图根目录 ： /sdcard/Download/log/"
    private fun getScreenCaptureDirectory(): File? {
        // 检查外部存储是否可用
        if (Environment.getExternalStorageState() == Environment.MEDIA_MOUNTED) {
            // 获取外部存储的公共下载目录下的log文件夹
            val downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            val logDir = File(downloadDir, "log")
            if (!logDir.exists()) {
                logDir.mkdirs()
            }
            return logDir
        }
        return null
    }

    // 内存占比正则，与 PerfMonitorFragment 一致
    private val memRatioRegex = Regex("内存占比:\\s*([\\d.]+)%")

    /** 上传前：将内存监控结果追加到会上传到 report_oss_path 的本地 txt 文件末尾（最后一行为内存结果）。不写 nest_result_rpa.txt。 */
    private fun appendMemMonitorResultToReportFiles() {
        val logDir = getScreenCaptureDirectory() ?: return
        val perfSnapshot = PerfLogHolder.getSnapshot()
        val lines = perfSnapshot.split("\n").filter { it.isNotBlank() }
        val hasOver5 = lines.any { line ->
            memRatioRegex.find(line)?.groupValues?.getOrNull(1)?.toDoubleOrNull()?.let { it > 5.0 } ?: false
        }
        val lineToAppend = if (hasOver5) {
            lines.joinToString("\n")
        } else {
            "执行完成脚本文件，内存监控占比始终控制在5%以下"
        }
        val reportTxtFiles = logDir.listFiles()?.filter { f ->
            f.isFile && getMimeType(f) == "text/plain" && f.name != "nest_result_rpa.txt"
        } ?: emptyList()
        for (file in reportTxtFiles) {
            try {
                val existing = if (file.exists()) file.readText() else ""
                val newContent = if (existing.endsWith("\n")) existing + lineToAppend else existing + "\n" + lineToAppend
                file.writeText(newContent)
                Log.d("LogFileUtils", "已追加内存监控结果到报告文件末尾: ${file.name} (hasOver5=$hasOver5)")
            } catch (e: Exception) {
                Log.e("LogFileUtils", "追加内存监控结果到 ${file.name} 失败", e)
            }
        }
    }

    // 获取文件的MIME类型
    private fun getMimeType(file: File): String {
        val extension = file.extension.lowercase()
        return when (extension) {
            "jpg", "jpeg" -> "image/jpeg"
            "png" -> "image/png"
            "txt", "log" -> "text/plain"
            else -> "application/octet-stream"
        }
    }

    // 将文件转换为Base64字符串
    private fun fileToBase64(file: File): String {
        return android.util.Base64.encodeToString(
            file.readBytes(),
            android.util.Base64.NO_WRAP
        )
    }

    // 获取log目录下的所有文件
    private fun getAllLogFiles(): List<File> {
        val logDir = getScreenCaptureDirectory()
        val files = mutableListOf<File>()
        
        Log.d("ScriptExecutionGlobal", "开始扫描日志目录: ${logDir?.absolutePath}")
        
        logDir?.let { dir ->
            if (dir.exists() && dir.isDirectory) {
                dir.listFiles()?.forEach { file ->
                    if (file.isFile) {
                        val fileSizeInBytes = file.length()
                        // 检查文件大小，限制在10MB以内
                        if (fileSizeInBytes <= 10 * 1024 * 1024) { // 10MB in bytes
                            val sizeStr = when {
                                fileSizeInBytes < 1024 -> "${fileSizeInBytes}B"
                                fileSizeInBytes < 1024 * 1024 -> String.format("%.2fKB", fileSizeInBytes / 1024.0)
                                else -> String.format("%.2fMB", fileSizeInBytes / (1024.0 * 1024.0))
                            }
                            Log.d("ScriptExecutionGlobal", "发现文件: ${file.name} ($sizeStr)")
                            files.add(file)
                        } else {
                            Log.w("ScriptExecutionGlobal", "文件过大，跳过: ${file.name} (${String.format("%.2fMB", fileSizeInBytes / (1024.0 * 1024.0))})")
                        }
                    }
                }
            } else {
                Log.w("ScriptExecutionGlobal", "目录不存在或不是目录: ${dir.absolutePath}")
            }
        }
        
        Log.d("ScriptExecutionGlobal", "扫描完成，共发现 ${files.size} 个文件")
        return files
    }


    fun getTaskDate(): String {
        val date = Date()
        val formatter = SimpleDateFormat("yyyyMM", Locale.getDefault())
        val formattedDate = formatter.format(date)
        return formattedDate
    }

    //上传服务器，告诉服务器可以下拉日志
    //taskSeconds : 本次任务执行的时间，秒
    fun uploadLogFileToServer(result: String, taskSeconds: Double) {

        var doJsResult = result //可能执行出现异常，但是走到onSuccess，因为在js脚本里面将异常进行了处理
        Log.d("ScriptExecutionGlobal", "uploadLogFileToServer start ======================= ")

        var nestScript = readJsonFromFile(GlobalAppContext.get().applicationContext, "net_script_name")
        Log.d("ScriptExecutionGlobal", "uploadLogFileToServer net_script_json =  $nestScript")

//        2025-09-01 14:55:13.342  5261-5355  ScriptExecutionGlobal   org.autojs.autoxjs                   D  uploadLogFileToServer start =======================
//        {"task_uuid":"d3678581-029b-48ca-b598-78c23018ba63","account_uuid":"192.168.1.108:12002",
//        "rpa_uuid":"TIKTOK_GUANZHU","rpa_name":"","success":"running","rpa_type":"NEST_RPA_CM_SCRIPTS","msg":"",
//        "report":"","screenshot":"","remark":"","xToken":"THAQJHAWTEYNLCWFDWIGQIMFLPPBSDMKAMXLLHMUWOEFWIZPFUIXNBUQRBFDHSYC"}

        var nestScriptJson= JSONObject(nestScript)
        // 获取基本参数
        val task_id = nestScriptJson.optString("task_id")
        val env_id = nestScriptJson.optString("env_id")
        val account_id = nestScriptJson.optString("account_id")
        val xToken = nestScriptJson.optString("xToken")

        if (task_id.isEmpty() || env_id.isEmpty() || account_id.isEmpty()) {
            Log.e("LogFileUtils", "上报跳过: task_id/env_id/account_id 为空 (task_id=$task_id, env_id=$env_id, account_id=$account_id)，不执行上报任务")
            return
        }

        // 上传前最后一步：将内存监控结果追加到会上传到 report_oss_path 的本地 txt 文件末尾
        appendMemMonitorResultToReportFiles()

        // 生成OSS路径
        val uuid = UUID.randomUUID().toString()
        var oss_date = getTaskDate()
        val report_oss_path = "template-store/rpa-report/$oss_date/$uuid.txt"
        val screenshot_oss_path = "template-store/rpa-report/$oss_date/$uuid.png"
        
        // 记录生成的路径
        Log.d("LogFileUtils", "生成上传路径:")
        Log.d("LogFileUtils", "UUID: $uuid")
        Log.d("LogFileUtils", "报告路径: $report_oss_path")
        Log.d("LogFileUtils", "截图路径: $screenshot_oss_path")


        var txtUploadSuccess = false
        var pngUploadSuccess = false

        // 获取所有日志文件
        val logFiles = getAllLogFiles()
        
        // 先检查是否有所需的文件类型
        var hasTxtFile = false
        var hasPngFile = false
        logFiles.forEach { file ->
            when (getMimeType(file)) {
                "text/plain" -> hasTxtFile = true
                "image/png" -> hasPngFile = true
            }
        }

        // 记录上传状态
        var uploadInProgress = false
        var uploadError = false
        var errorMsg = ""

        // 开始上传可用的文件
        uploadInProgress = true
            Log.d("LogFileUtils", "开始上传文件，将等待上传完成后再执行上报...")
            
            // 开始上传文件
            logFiles.forEach { file ->
                try {
                    when (getMimeType(file)) {
                        "text/plain" -> {
                            // 等待文本文件上传完成

                            // 跳过 nest_result_rpa.txt 文件
                            if (file.name == "nest_result_rpa.txt") {
                                Log.d("ScriptExecutionGlobal", "跳过文件: ${file.name}")
                                return@forEach
                            }

                            for (attempt in 1..3) { // 最多尝试3次
                                Log.d("LogFileUtils", "正在上传文本文件，第${attempt}次尝试")

                                if (AliOSSUtils.upload(xToken, report_oss_path, file.path)) {
                                    txtUploadSuccess = true
                                    Log.d("LogFileUtils", "文本文件 ${file.name} 上传成功")
                                    break
                                } else {
                                    if (attempt < 3) {
                                        Log.e("LogFileUtils", "文本文件 ${file.name} 上传失败，3秒后重试...")
                                        Thread.sleep(3000)
                                    } else {
                                        Log.e("LogFileUtils", "文本文件 ${file.name} 上传失败，已达到最大重试次数")
                                        uploadError = true
                                        errorMsg = "文本文件上传失败，已重试3次"
                                    }
                                }
                            }
                        }
                        "image/png" -> {
                            // 等待图片文件上传完成
                            for (attempt in 1..3) { // 最多尝试3次
                                Log.d("LogFileUtils", "正在上传图片文件，第${attempt}次尝试")
//                                if (AliOSSUtils.upload(xToken, "template-store/rpa-report/$task_id.png", file.path)) {
                                if (AliOSSUtils.upload(xToken, screenshot_oss_path, file.path)) {
                                    pngUploadSuccess = true
                                    Log.d("LogFileUtils", "图片文件 ${file.name} 上传成功")
                                    break
                                } else {
                                    if (attempt < 3) {
                                        Log.e("LogFileUtils", "图片文件 ${file.name} 上传失败，3秒后重试...")
                                        Thread.sleep(3000)
                                    } else {
                                        Log.e("LogFileUtils", "图片文件 ${file.name} 上传失败，已达到最大重试次数")
                                        uploadError = true
                                        errorMsg = "图片文件上传失败，已重试3次"
                                    }
                                }
                            }
                        }
                    }
                } catch (e: Exception) {
                    Log.e("ScriptExecutionGlobal", "处理文件失败: ${file.name}", e)
                    uploadError = true
                    errorMsg = "文件处理异常：${e.message}"
                }
            }
            uploadInProgress = false
            Log.d("LogFileUtils", "文件上传流程已完成，准备执行上报...")


        // 确保上传流程完全结束后再继续
        if (uploadInProgress) {
            Log.d("LogFileUtils", "等待上传完成...")
            while (uploadInProgress) {
                Thread.sleep(1000)
            }
        }

        Log.d("LogFileUtils", "开始执行上报任务...")

        val taskId = nestScriptJson.optString("task_id").trim()
        val envId = nestScriptJson.optString("env_id").trim()
        val accountId = nestScriptJson.optString("account_id").trim()
        if (taskId.isEmpty() || envId.isEmpty() || accountId.isEmpty()) {
            Log.e("LogFileUtils", "上报跳过: task_id/env_id/account_id 为空 (task_id=$taskId, env_id=$envId, account_id=$accountId)，不执行上报任务")
            return
        }

        var reportJson = JSONObject()
        reportJson.put("task_id", taskId)
        reportJson.put("env_id", envId)
        reportJson.put("account_id", accountId)
        reportJson.put("report_id", nestScriptJson.optString("report_id"))

        reportJson.put("report", report_oss_path) //上传oss的执行记录txt地址
        reportJson.put("screenshot", screenshot_oss_path)//上传oss的截图记录txt地址

        reportJson.put("taskSeconds", taskSeconds)//任务执行的总时长，单位：秒


        // 读取 nest_result_rpa.txt 的内容
        try {
            val logDir = getScreenCaptureDirectory()
            if (logDir != null) {
                // 先列出目录下所有文件
                Log.d("LogFileUtils", "=== 目录内容检查 ===")
                Log.d("LogFileUtils", "检查目录: ${logDir.absolutePath}")
                logDir.listFiles()?.forEach { file ->
                    Log.d("LogFileUtils", "发现文件: ${file.name} (${file.length()} bytes)")
                }
                Log.d("LogFileUtils", "==================")

                val targetJsonFile = File(logDir, "nest_result_rpa.txt")
                Log.d("LogFileUtils", "=== 目标文件状态检查 ===")
                Log.d("LogFileUtils", "文件完整路径: ${targetJsonFile.absolutePath}")
                Log.d("LogFileUtils", "文件是否存在: ${targetJsonFile.exists()}")
                Log.d("LogFileUtils", "是否是文件: ${targetJsonFile.isFile}")
                Log.d("LogFileUtils", "父目录是否存在: ${targetJsonFile.parentFile?.exists()}")
                Log.d("LogFileUtils", "父目录是否可读: ${targetJsonFile.parentFile?.canRead()}")
                Log.d("LogFileUtils", "文件是否可读: ${targetJsonFile.canRead()}")
                Log.d("LogFileUtils", "文件大小: ${if (targetJsonFile.exists()) targetJsonFile.length() else 0} bytes")
                Log.d("LogFileUtils", "==================")

                if (targetJsonFile.exists() && targetJsonFile.isFile) {
                    val jsonContent = targetJsonFile.readText()
                    Log.d("LogFileUtils", "nest_result_rpa.txt内容: $jsonContent")
                    
                    // 解析JSON内容并添加fail_msg字段
                    try {
                        val contentJson = JSONObject(jsonContent)
                        Log.d("LogFileUtils", "添加fail_msg后的内容: $contentJson")
                        var fail_msg = contentJson.optString("fail_msg")
                        if (fail_msg.contains("Exception", false)){
                            doJsResult = "fail"
                        }
                        reportJson.put("msg", contentJson)
                    } catch (e: Exception) {
                        Log.e("LogFileUtils", "JSON解析失败，使用原始内容", e)
                        reportJson.put("msg", jsonContent)
                    }
                } else {
                    Log.w("LogFileUtils", "nest_result_rpa.txt文件不存在，使用空消息")
                    reportJson.put("msg", "")
                }
            } else {
                Log.w("LogFileUtils", "日志目录不存在，使用空消息")
                reportJson.put("msg", "")
            }
        } catch (e: Exception) {
            Log.e("LogFileUtils", "nest_result_rpa.txt失败", e)
            reportJson.put("msg", "")
        }

        reportJson.put("success", doJsResult)


        // 构建请求体
        val requestBody = RequestBody.create("application/json; charset=utf-8".toMediaType(), reportJson.toString())
        val request: Request = Request.Builder()
            .url("https://res.nestbrowser.com/cm/v1/tk-report")
            .method("POST", requestBody)
            .addHeader("X-Token", nestScriptJson.get("xToken").toString())
            .addHeader("Content-Type", "application/json")
            .build()

        // 打印完整的请求信息
        Log.d("LogFileUtils", "\n=== 请求信息 ===")
        Log.d("LogFileUtils", "URL: ${request.url}")
        Log.d("LogFileUtils", "Method: ${request.method}")
        Log.d("LogFileUtils", "Headers:")
        request.headers.forEach { header ->
            Log.d("LogFileUtils", "  ${header.first}: ${header.second}")
        }
        Log.d("LogFileUtils", "Request Body:")
        Log.d("LogFileUtils", reportJson.toString(2)) // 使用缩进格式化JSON
        Log.d("LogFileUtils", "==================\n")

        val client = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

        // 添加重试机制
        val maxRetries = 5
        var currentRetry = 0
        var lastError: Exception? = null

        while (currentRetry < maxRetries) {
            try {
                client.newCall(request).execute().use { response ->
                    // 打印完整的响应信息
                    Log.d("LogFileUtils", "\n=== 第${currentRetry + 1}次尝试响应信息 ===")
                    Log.d("LogFileUtils", "Status Code: ${response.code}")
                    Log.d("LogFileUtils", "Headers:")
                    response.headers.forEach { header ->
                        Log.d("LogFileUtils", "  ${header.first}: ${header.second}")
                    }
                    
                    // 读取响应体
                    val responseBody = response.body?.string()
                    Log.d("LogFileUtils", "Response Body:")
                    
                    if (responseBody != null) {
                        try {
                            // 尝试格式化JSON响应
                            val responseJson = JSONObject(responseBody)
                            Log.d("LogFileUtils", responseJson.toString(2))
                            
                            // 检查响应状态
                            if (response.isSuccessful && responseJson.optBoolean("success", false)) {
                                Log.d("LogFileUtils", "上报成功")
                                return // 成功则直接返回
                            } else {
                                throw IOException("上报失败: ${responseJson.optString("msg", "未知错误")}")
                            }
                        } catch (e: Exception) {
                            Log.e("LogFileUtils", "响应解析失败", e)
                            throw e
                        }
                    } else {
                        throw IOException("空响应")
                    }
                }
            } catch (e: Exception) {
                lastError = e
                currentRetry++
                
                if (currentRetry < maxRetries) {
                    val waitTime = 3000L * (currentRetry) // 3秒, 6秒, 9秒
                    Log.e("LogFileUtils", "第${currentRetry}次上报失败，${waitTime/1000}秒后重试: ${e.message}")
                    Thread.sleep(waitTime)
                } else {
                    Log.e("LogFileUtils", "上报失败，已达到最大重试次数", e)
                }
            }
        }

        // 如果所有重试都失败了，抛出最后一个错误
        lastError?.let {
            Log.e("LogFileUtils", "所有重试都失败了，最后的错误: ${it.message}")
        }

    }


    //adb启动时候，传递的json文件放在本地
    fun writeJsonToFile(context: Context, fileName: String, jsonData: String) {
        val cacheDir = context.cacheDir
        val file = File(cacheDir, fileName)

        try {
            file.writeText(jsonData)
        } catch (e: IOException) {
            e.printStackTrace()
        }
    }

    fun readJsonFromFile(context: Context, fileName: String): String? {
        val cacheDir = context.cacheDir
        val file = File(cacheDir, fileName)

        return try {
            file.readText()
        } catch (e: IOException) {
            e.printStackTrace()
            null
        }
    }




}
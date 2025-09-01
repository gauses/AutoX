package org.autojs.autojs.alioss

import android.content.Context
import android.os.Environment
import android.util.Log
import com.stardust.app.GlobalAppContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import org.json.JSONObject
import java.io.File
import java.io.IOException

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

    //上传服务器，告诉服务器可以下拉日志
    fun uploadLogFileToServer(result: String) {
        Log.d("ScriptExecutionGlobal", "uploadLogFileToServer start ======================= ")

        var nestScript = readJsonFromFile(GlobalAppContext.get().applicationContext, "net_script_name")
        Log.d("ScriptExecutionGlobal", "uploadLogFileToServer net_script_json =  $nestScript")

//        2025-09-01 14:55:13.342  5261-5355  ScriptExecutionGlobal   org.autojs.autoxjs                   D  uploadLogFileToServer start =======================
//        {"task_uuid":"d3678581-029b-48ca-b598-78c23018ba63","account_uuid":"192.168.1.108:12002",
//        "rpa_uuid":"TIKTOK_GUANZHU","rpa_name":"","success":"running","rpa_type":"NEST_RPA_CM_SCRIPTS","msg":"",
//        "report":"","screenshot":"","remark":"","xToken":"THAQJHAWTEYNLCWFDWIGQIMFLPPBSDMKAMXLLHMUWOEFWIZPFUIXNBUQRBFDHSYC"}

        var nestScriptJson= JSONObject(nestScript)
        // 获取所有日志文件
        val logFiles = getAllLogFiles()
        val fileList = JSONObject()
        logFiles.forEach { file ->
            try {
                val fileInfo = JSONObject()
                val mimeType = getMimeType(file)


                // 根据文件类型处理
                if (mimeType.startsWith("text/")) {
                    // 文本文件直接读取内容
                    fileInfo.put("content", file.readText())
                } else {
                    // 图片等二进制文件转为Base64
                    fileInfo.put("content", fileToBase64(file))
                    AliOSSUtils.upload("task_uuid", file.path)
                }
                
                fileInfo.put("mime_type", mimeType)
                fileInfo.put("size", file.length())
                fileInfo.put("last_modified", file.lastModified())
                
                fileList.put(file.name, fileInfo)
            } catch (e: Exception) {
                Log.e("ScriptExecutionGlobal", "处理文件失败: ${file.name}", e)
            }
        }


        var reportJson = JSONObject()
        reportJson.put("task_uuid", nestScriptJson.get("task_uuid").toString())
        reportJson.put("success", "ok")
        reportJson.put("msg", "执行成功")

        val request: Request = Request.Builder()
            .url("https://cloud.nestbrowser.com/cm/v1/rpa-report")
            .method("POST", RequestBody.create("application/json; charset=utf-8".toMediaType(), reportJson.toString()))
            .addHeader("X-Token", nestScriptJson.get("xToken").toString())
            .addHeader("Content-Type", "application/json")
            .build()

        // 打印请求 Headers
        println("Request Headers:")
        request.headers.forEach { header ->
            println("${header.first}: ${header.second}")
        }

        val client = OkHttpClient.Builder()
            .build()
        client.newCall(request).execute().use { response ->
            // 打印响应 Headers
            println("\nuploadLogFileToServer Response Headers:")
            response.headers.forEach { header ->
                println("${header.first}: ${header.second}")
            }

            // 打印响应体
            println("\nuploadLogFileToServer Response Body:")
            println(response.body?.string())
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
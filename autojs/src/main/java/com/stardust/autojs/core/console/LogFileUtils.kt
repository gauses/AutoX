package com.stardust.autojs.core.console

import android.content.Context
import android.os.Environment
import android.util.Log
import com.stardust.app.GlobalAppContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody
import org.json.JSONObject
import java.io.File
import java.io.FileWriter
import java.io.IOException
import okhttp3.logging.HttpLoggingInterceptor
import okhttp3.logging.HttpLoggingInterceptor.Logger

object LogFileUtils {

    //保证Java层和JS代码两边的日志文件一致
    var taskLogFileName = "nest_task_log.txt"

    //获取SD卡的根目录
    private fun getDownloadDirectory(): File? {
        // 检查外部存储是否可用
        if (Environment.getExternalStorageState() == Environment.MEDIA_MOUNTED) {
            // 获取外部存储的公共下载目录
            val downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
            return downloadDir
        }
        return null
    }

    //创建本次任务日志文件的文件名
    fun initLogFileName(){
        // 创建文件
        val file = File(getDownloadDirectory(), taskLogFileName)

        try {
            // 使用FileWriter写入内容到文件
            FileWriter(file).use { writer ->
                writer.write("自动化任务开始...")
            }
            println("文件创建成功: $file")
        } catch (e: Exception) {
            e.printStackTrace()
            println("文件创建失败: ${e.message}")
        }
    }


    fun appendToLogFileWithTimestamp(content: String) {
        try {
            val file = File(getDownloadDirectory(), taskLogFileName)

            // 使用FileWriter以追加模式写入内容到文件
            FileWriter(file, true).use { writer ->
                writer.write("\n$content")
            }
            println("内容追加成功: $file")
        } catch (e: Exception) {
            e.printStackTrace()
            println("内容追加失败: ${e.message}")
        }
    }


    fun jsonObjectToRequestBody(jsonObject: JSONObject): RequestBody {
        val mediaType = "application/json; charset=utf-8".toMediaType() // 设置媒体类型
        return RequestBody.create(mediaType, jsonObject.toString()) // 创建 RequestBody
    }

    //上传服务器，告诉服务器可以下拉日志
    fun uploadLogFileToServer(result: String) {
        println("uploadLogFileToServer start.")


        var net_script_json = readJsonFromFile(GlobalAppContext.get().applicationContext , "net_script_name")

        if (net_script_json == null) return

        val logInterceptor = HttpLoggingInterceptor().apply {
            setLevel(HttpLoggingInterceptor.Level.BASIC) // 也可以使用 Level.HEADERS 或 Level.BODY
        }


        val client = OkHttpClient.Builder()
            .addInterceptor(logInterceptor)
            .build()

        val json = JSONObject(net_script_json)
        json.put("success", result)


        println("uploadLogFileToServer json = $json")


        val request: Request = Request.Builder()
            .url("https://nestbrowser.com/api/v1/rpa-report")
            .method("POST", RequestBody.create("application/json; charset=utf-8".toMediaType(), json.toString()))
            .addHeader("X-Token", json.getString("token"))
            .addHeader("Content-Type", "application/json")
            .build()

        // 打印请求 Headers
        println("Request Headers:")
        request.headers.forEach { header ->
            println("${header.first}: ${header.second}")
        }

        // 发送请求
        client.newCall(request).execute().use { response ->

            // 打印响应 Headers
            println("\nuploadLogFileToServer Response Headers:")
            response.headers.forEach { header ->
                println("${header.first}: ${header.second}")
            }

            // 打印响应体（可选）
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
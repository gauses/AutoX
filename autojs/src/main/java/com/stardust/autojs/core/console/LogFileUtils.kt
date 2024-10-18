package com.stardust.autojs.core.console

import android.os.Environment
import android.widget.Toast
import java.io.File
import java.io.FileWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

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
        // 获取当前时间戳
//        val timestamp = System.currentTimeMillis()

        // 格式化时间戳为日期字符串
//        val dateFormat = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault())
//        taskLogFileName = "nest_${dateFormat.format(Date(timestamp))}.txt"



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




    //上传服务器
    fun uploadLogFileToServer(){
        println("uploadLogFileToServer start.")


    }

}
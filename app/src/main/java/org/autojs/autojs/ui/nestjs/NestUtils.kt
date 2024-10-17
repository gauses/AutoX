package org.autojs.autojs.ui.nestjs

import android.content.Context
import android.os.Environment
import android.util.Log
import java.io.File
import java.io.FileWriter
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

//Nest相关的工具类
object NestUtils {


    var taskLogFileName = ""


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

    fun writeFileToSd(context: Context, log: String){
        getDownloadDirectory()?.let {
            Log.d("sb", "download path=$it")
            java.io.File("$it/writeFileToSd.txt").writeText(log)
        }?:{
            Log.e("sb", "external path=null")
        }
    }


    //通过adb传输的script name，拼接路径
    fun appendNameToScript(context: Context,  scriptName: String): File? {
        var scriptFilePath: File? = null
        getDownloadDirectory()?.let {
            scriptFilePath = java.io.File("$it/$scriptName.js")
            return scriptFilePath
        } ?: {
            Log.e("sb", "external path=null")
        }
        return scriptFilePath

    }




}
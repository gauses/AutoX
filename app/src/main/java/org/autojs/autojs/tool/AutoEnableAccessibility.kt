package org.autojs.autojs.tool

import android.content.Context
import android.provider.Settings
import android.text.TextUtils
import android.util.Log

object AutoEnableAccessibility {

    private const val TAG = "AutoEnableAccessibility"


    fun enableAccessibility(context: Context) {

        Log.i(TAG, "enableAccessibility start")
        Log.i(TAG, "context.packageName=${context.packageName}")


        // 1. 定义你的服务完整路径：包名/类名
        val servicePath = "org.autojs.autoxjs/com.stardust.autojs.core.accessibility.AccessibilityService"
        Log.i(TAG, "target servicePath=$servicePath")

        try {
            // 2. 获取当前已经开启的服务列表
            Log.i(TAG, "reading Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES ...")
            // getString 在部分 ROM 上可能为 null，不能赋给非空 String
            val enabledServices: String = Settings.Secure.getString(
                context.contentResolver,
                Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            ).orEmpty()
            Log.i(TAG, "current enabledServices=$enabledServices")

            // 3. 检查你的服务是否已经在列表里
            val isEnabledServicesEmpty = TextUtils.isEmpty(enabledServices)
            val containsService = !isEnabledServicesEmpty && enabledServices.contains(servicePath)
            Log.i(
                TAG,
                "isEnabledServicesEmpty=$isEnabledServicesEmpty, containsTargetService=$containsService"
            )
            if (isEnabledServicesEmpty || !containsService) {
                val newEnabledServices = if (TextUtils.isEmpty(enabledServices))
                    servicePath
                else
                    "$enabledServices:$servicePath"
                Log.i(TAG, "service not found, writing newEnabledServices=$newEnabledServices")


                // 4. 将你的服务添加到已开启列表
                val putEnabledServicesResult = Settings.Secure.putString(
                    context.contentResolver,
                    Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
                    newEnabledServices
                )
                Log.i(
                    TAG,
                    "put ENABLED_ACCESSIBILITY_SERVICES result=$putEnabledServicesResult"
                )

                val verifyEnabledServices = Settings.Secure.getString(
                    context.contentResolver,
                    Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
                ).orEmpty()
                Log.i(TAG, "verify enabledServices after write=$verifyEnabledServices")
            } else {
                Log.i(TAG, "target service already enabled, skip putString")
            }

            // 5. 确保无障碍服务的总开关是打开的
            Log.i(TAG, "writing Settings.Secure.ACCESSIBILITY_ENABLED=1 ...")
            val putAccessibilityEnabledResult = Settings.Secure.putInt(
                context.contentResolver,
                Settings.Secure.ACCESSIBILITY_ENABLED,
                1
            )
            Log.i(TAG, "put ACCESSIBILITY_ENABLED result=$putAccessibilityEnabledResult")
            val verifyAccessibilityEnabled = Settings.Secure.getInt(
                context.contentResolver,
                Settings.Secure.ACCESSIBILITY_ENABLED,
                0
            )
            Log.i(TAG, "verify ACCESSIBILITY_ENABLED after write=$verifyAccessibilityEnabled")
            Log.i(TAG, "enableAccessibility done")
        } catch (e: Exception) {
            Log.e(TAG, "enableAccessibility failed: ${e.message}", e)
            e.printStackTrace()
        }


    }
}
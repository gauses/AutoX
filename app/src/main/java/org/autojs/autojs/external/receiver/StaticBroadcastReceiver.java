package org.autojs.autojs.external.receiver;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;

import org.autojs.autojs.external.ScriptIntents;
import org.autojs.autojs.ui.log.LogActivityKt;
import org.json.JSONObject;

import java.net.URLDecoder;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

public class StaticBroadcastReceiver extends BaseBroadcastReceiver {


//    @Override
//    public void onReceive(Context context, Intent intent) {
//        super.onReceive(context, intent);
//
//
//
//
//        String BOOT_COMPLETED_SCRIPT_NAME = "launch_weixin";
//
//        Log.i("StaticBroadcastReceiver", "Intent ACTION = " + intent.getAction());
//        //初始化保存日志到本地的文件
////        LogFileUtils.initLogFileName();
//
//
//        JSONObject json = JSONObject(URLDecoder.decode(it, "UTF-8"));
//        Log.d("sb", "MainActivity script json = $json");
//        LogFileUtils.writeJsonToFile(this , "net_script_name", json.toString());
//
//        String scriptFilePath = NestUtils.appendNameToScript(this, json.getString("automation_id")); ////net_script_name是JSON
//
//        Log.d("sb", "MainActivity script scriptFilePath = $scriptFilePath");
//        ScriptIntents.handleIntent(this, intent.setData(Uri.parse(scriptFilePath?.path)));
//        LogActivityKt.start(context);
//
//
//    }

    static final List<String> ACTIONS = new ArrayList<>(Arrays.asList(
            "android.intent.action.BOOT_COMPLETED",
            "android.intent.action.QUICKBOOT_POWERON",
            "android.intent.action.TIME_SET",
            "android.intent.action.TIMEZONE_CHANGED",
            "android.intent.action.PACKAGE_ADDED",
            "android.intent.action.PACKAGE_CHANGED",
            "android.intent.action.PACKAGE_DATA_CLEARED",
            "android.intent.action.PACKAGE_REMOVED",
            "android.intent.action.PACKAGE_RESTARTED",
            "android.intent.action.UID_REMOVED",
            "android.intent.action.ACTION_POWER_CONNECTED",
            "android.intent.action.ACTION_POWER_DISCONNECTED",
            "android.intent.action.ACTION_SHUTDOWN",
            "android.intent.action.DATE_CHANGED",
            "android.intent.action.DREAMING_STARTED",
            "android.intent.action.DREAMING_STOPPED",
            "android.intent.action.HEADSET_PLUG",
            "android.intent.action.INPUT_METHOD_CHANGED",
            "android.intent.action.LOCALE_CHANGED",
            "android.intent.action.MEDIA_BUTTON",
            "android.intent.action.MEDIA_CHECKING",
            "android.intent.action.MEDIA_MOUNTED",
            "android.intent.action.PACKAGE_FIRST_LAUNCH",
            "android.intent.action.PROVIDER_CHANGED",
            "android.intent.action.WALLPAPER_CHANGED",
            "android.intent.action.USER_UNLOCKED",
            "android.intent.action.USER_PRESENT",
            "android.net.conn.CONNECTIVITY_CHANGE"
    ));

    static final List<String> PACKAGE_ACTIONS = new ArrayList<>(Arrays.asList(
            "android.intent.action.PACKAGE_ADDED",
            "android.intent.action.PACKAGE_CHANGED",
            "android.intent.action.PACKAGE_DATA_CLEARED",
            "android.intent.action.PACKAGE_REMOVED",
            "android.intent.action.PACKAGE_RESTARTED"
    ));

}

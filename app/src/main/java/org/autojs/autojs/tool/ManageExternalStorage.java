package org.autojs.autojs.tool;

import android.content.Context;

import java.io.IOException;

public class ManageExternalStorage {

    public static void grantManageExternalStorage(Context context) {
        try {
            // 设备内执行，不要带 adb shell；在电脑上才用 adb shell …
            // appops set org.autojs.autoxjs MANAGE_EXTERNAL_STORAGE allow
            Runtime.getRuntime().exec(new String[]{
                    "sh", "-c",
                    "appops set org.autojs.autoxjs MANAGE_EXTERNAL_STORAGE allow"
            });
            // pm grant org.autojs.autoxjs android.permission.READ_EXTERNAL_STORAGE
            Runtime.getRuntime().exec(new String[]{
                    "sh", "-c",
                    "pm grant org.autojs.autoxjs android.permission.READ_EXTERNAL_STORAGE"
            });
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}

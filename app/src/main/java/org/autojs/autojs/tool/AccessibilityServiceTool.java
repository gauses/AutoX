package org.autojs.autojs.tool;

import android.content.ActivityNotFoundException;
import android.content.Context;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;

import com.stardust.app.GlobalAppContext;
import org.autojs.autojs.Pref;
import org.autojs.autoxjs.R;

import com.stardust.autojs.core.accessibility.AccessibilityService;
import com.stardust.autojs.core.util.ProcessShell;
import com.stardust.view.accessibility.AccessibilityServiceUtils;

import java.util.Locale;

/**
 * Created by Stardust on 2017/1/26.
 */

public class AccessibilityServiceTool {

    private static final Class<AccessibilityService> sAccessibilityServiceClass = AccessibilityService.class;
    private static final String TAG = "AccessibilityServiceTool";

    public static void enableAccessibilityService() {
        if (Pref.shouldEnableAccessibilityServiceByRoot()) {
            if (!enableAccessibilityServiceByRoot(sAccessibilityServiceClass)) {
                goToAccessibilitySetting();
            }
        } else {
            goToAccessibilitySetting();
        }
    }

    public static void goToAccessibilitySetting() {
        Context context = GlobalAppContext.get();
        if (Pref.isFirstGoToAccessibilitySetting()) {
            GlobalAppContext.toast(context.getString(R.string.text_please_choose) + context.getString(R.string.app_name));
        }
        try {
            AccessibilityServiceUtils.INSTANCE.goToAccessibilitySetting(context);
        } catch (ActivityNotFoundException e) {
            GlobalAppContext.toast(context.getString(R.string.go_to_accessibility_settings) + context.getString(R.string.app_name));
        }
    }

    private static final String cmd = "enabled=$(settings get secure enabled_accessibility_services)\n" +
            "pkg=%s\n" +
            "if [[ $enabled == *$pkg* ]]\n" +
            "then\n" +
            "echo already_enabled\n" +
            "else\n" +
            "enabled=$pkg:$enabled\n" +
            "settings put secure enabled_accessibility_services $enabled\n" +
            "fi\n" +
            "settings put secure accessibility_enabled 1";

    public static boolean enableAccessibilityServiceByRoot(Class<? extends android.accessibilityservice.AccessibilityService> accessibilityService) {
        String serviceName = GlobalAppContext.get().getPackageName() + "/" + accessibilityService.getName();
        // 1) 优先使用 Settings.Secure API（系统签名/系统权限场景通常更稳）
        if (enableAccessibilityServiceBySecureApi(serviceName, accessibilityService)) {
            return true;
        }
        // 2) API 失败时再走 shell 兜底，避免影响后续流程
        try {
            return TextUtils.isEmpty(ProcessShell.execCommand(String.format(Locale.getDefault(), cmd, serviceName), true).error);
        } catch (Exception e) {
            Log.w(TAG, "enableAccessibilityServiceByRoot: shell fallback failed", e);
            return false;
        }
    }

    private static boolean enableAccessibilityServiceBySecureApi(
            String serviceName,
            Class<? extends android.accessibilityservice.AccessibilityService> accessibilityService
    ) {
        Context context = GlobalAppContext.get();
        try {
            String enabled = Settings.Secure.getString(
                    context.getContentResolver(),
                    Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
            );
            if (enabled == null) {
                enabled = "";
            }

            String updated;
            if (enabled.contains(serviceName)) {
                updated = enabled;
            } else if (TextUtils.isEmpty(enabled)) {
                updated = serviceName;
            } else {
                updated = serviceName + ":" + enabled;
            }

            Settings.Secure.putString(
                    context.getContentResolver(),
                    Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES,
                    updated
            );
            Settings.Secure.putInt(
                    context.getContentResolver(),
                    Settings.Secure.ACCESSIBILITY_ENABLED,
                    1
            );

            // 校验是否真的生效（避免 put 返回成功但系统拒绝）
            return AccessibilityServiceUtils.INSTANCE.isAccessibilityServiceEnabled(context, accessibilityService);
        } catch (Throwable t) {
            Log.w(TAG, "enableAccessibilityServiceBySecureApi failed", t);
            return false;
        }
    }

    public static boolean enableAccessibilityServiceByRootAndWaitFor(long timeOut) {
        if (enableAccessibilityServiceByRoot(sAccessibilityServiceClass)) {
            return AccessibilityService.Companion.waitForEnabled(timeOut);
        }
        return false;
    }

    public static void enableAccessibilityServiceByRootIfNeeded() {
        if (AccessibilityService.Companion.getInstance() == null)
            if (Pref.shouldEnableAccessibilityServiceByRoot()) {
                AccessibilityServiceTool.enableAccessibilityServiceByRoot(sAccessibilityServiceClass);
            }
    }

    public static boolean isAccessibilityServiceEnabled(Context context) {
        return AccessibilityServiceUtils.INSTANCE.isAccessibilityServiceEnabled(context, sAccessibilityServiceClass);
    }
}

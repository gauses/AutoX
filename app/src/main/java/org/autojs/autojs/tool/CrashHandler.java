package org.autojs.autojs.tool;

import android.content.Intent;
import android.os.Build;
import android.os.Looper;
import android.util.Log;

import com.stardust.app.GlobalAppContext;

import org.autojs.autoxjs.BuildConfig;
import org.mozilla.javascript.RhinoException;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.lang.Thread.UncaughtExceptionHandler;

import com.stardust.view.accessibility.AccessibilityService;

/**
 * 全局未捕获异常处理，Flurry/Bugly 已移除以降低依赖与后台流量。
 */
public class CrashHandler implements UncaughtExceptionHandler {

    private static final String TAG = "CrashHandler";
    private static int crashCount = 0;
    private static long firstCrashMillis = 0;
    private final Class<?> mErrorReportClass;
    private final UncaughtExceptionHandler mSystemHandler;

    public CrashHandler(Class<?> errorReportClass) {
        this.mErrorReportClass = errorReportClass;
        mSystemHandler = Thread.getDefaultUncaughtExceptionHandler();
    }

    @Override
    public void uncaughtException(Thread thread, Throwable ex) {
        Log.e(TAG, "Uncaught Exception", ex);
        if (thread != Looper.getMainLooper().getThread()) {
            if (!(ex instanceof RhinoException)) {
                Log.w(TAG, "Non-main thread crash, no error report UI", ex);
            }
            if (mSystemHandler != null) {
                mSystemHandler.uncaughtException(thread, ex);
            }
            return;
        }
        AccessibilityService service = AccessibilityService.Companion.getInstance();
        if (service != null && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            Log.d(TAG, "disable service: " + service);
            service.disableSelf();
        } else {
            Log.d(TAG, "cannot disable service: " + service);
        }
        if (BuildConfig.DEBUG) {
            if (mSystemHandler != null) {
                mSystemHandler.uncaughtException(thread, ex);
            }
        } else {
            if (!crashTooManyTimes()) {
                String msg = ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName();
                String detail = getStackTrace(ex);
                startErrorReportActivity(msg, detail);
            }
            if (mSystemHandler != null) {
                mSystemHandler.uncaughtException(thread, ex);
            }
        }
    }

    private static String getStackTrace(Throwable ex) {
        StringWriter sw = new StringWriter();
        ex.printStackTrace(new PrintWriter(sw));
        return sw.toString();
    }

    private void startErrorReportActivity(String msg, String detail) {
        try {
            Intent intent = new Intent(GlobalAppContext.get(), mErrorReportClass);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
            intent.putExtra("message", msg);
            intent.putExtra("error", detail);
            GlobalAppContext.get().startActivity(intent);
        } catch (Throwable t) {
            Log.e(TAG, "startErrorReportActivity failed", t);
        }
    }

    private boolean crashTooManyTimes() {
        if (crashIntervalTooLong()) {
            resetCrashCount();
            return false;
        }
        crashCount++;
        return crashCount >= 5;
    }

    private void resetCrashCount() {
        firstCrashMillis = System.currentTimeMillis();
        crashCount = 0;
    }

    private boolean crashIntervalTooLong() {
        return System.currentTimeMillis() - firstCrashMillis > 3000;
    }
}

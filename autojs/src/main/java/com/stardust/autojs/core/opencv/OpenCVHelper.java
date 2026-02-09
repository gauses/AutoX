package com.stardust.autojs.core.opencv;

import android.content.Context;

import androidx.annotation.Nullable;

/**
 * 桩：OpenCV 已移除以降低内存。不再加载 native OpenCV，初始化恒为“已就绪”。
 */
public class OpenCVHelper {

    public interface InitializeCallback {
        void onInitFinish();
    }

    private static final String LOG_TAG = "OpenCVHelper";
    private static final boolean sInitialized = true;

    public static MatOfPoint newMatOfPoint(Mat mat) {
        return new MatOfPoint(mat);
    }

    public static void release(@Nullable MatOfPoint mat) {
        if (mat == null) return;
        mat.release();
    }

    public static void release(@Nullable Mat mat) {
        if (mat == null) return;
        mat.release();
    }

    public static boolean isInitialized() {
        return sInitialized;
    }

    public static void initIfNeeded(Context context, InitializeCallback callback) {
        if (callback != null) {
            callback.onInitFinish();
        }
    }
}

package com.stardust.autojs.core.opencv;

import com.stardust.util.ResourceMonitor;

import java.util.concurrent.atomic.AtomicInteger;

/**
 * 桩：替代 org.opencv.core.MatOfPoint，OpenCV 已移除以降低内存。不依赖 OpenCV。
 */
public class MatOfPoint implements ResourceMonitor.Resource {

    private static final AtomicInteger sResourceId = new AtomicInteger();
    private volatile boolean mReleased = false;
    private final int mResourceId = sResourceId.incrementAndGet();
    private final Point[] mPoints;

    public MatOfPoint() {
        mPoints = new Point[0];
        ResourceMonitor.onOpen(this);
    }

    public MatOfPoint(long addr) {
        mPoints = new Point[0];
        ResourceMonitor.onOpen(this);
    }

    public MatOfPoint(Mat m) {
        mPoints = new Point[0];
        ResourceMonitor.onOpen(this);
    }

    public MatOfPoint(Point... a) {
        mPoints = a != null ? a : new Point[0];
        ResourceMonitor.onOpen(this);
    }

    /** 返回桩点数组，无 OpenCV 时恒为空或占位。 */
    public Point[] toArray() {
        return mPoints;
    }

    public void release() {
        if (mReleased) return;
        mReleased = true;
        ResourceMonitor.onClose(this);
    }

    @Override
    protected void finalize() throws Throwable {
        if (!mReleased) {
            ResourceMonitor.onFinalize(this);
            mReleased = true;
        }
        super.finalize();
    }

    @Override
    public int getResourceId() {
        return mResourceId;
    }
}

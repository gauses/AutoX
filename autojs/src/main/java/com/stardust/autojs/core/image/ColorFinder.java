package com.stardust.autojs.core.image;

import android.graphics.Color;
import android.os.Build;
import androidx.annotation.RequiresApi;

import com.stardust.autojs.core.opencv.Mat;
import com.stardust.autojs.core.opencv.MatOfPoint;
import com.stardust.autojs.core.opencv.OpenCVHelper;
import com.stardust.autojs.core.opencv.Point;
import com.stardust.autojs.core.opencv.Rect;
import com.stardust.autojs.core.opencv.Scalar;
import com.stardust.util.ScreenMetrics;

/**
 * Created by Stardust on 2017/5/18.
 */

@RequiresApi(api = Build.VERSION_CODES.KITKAT)
public class ColorFinder {

    private ScreenMetrics mScreenMetrics;

    public ColorFinder(ScreenMetrics screenMetrics) {
        mScreenMetrics = screenMetrics;
    }

    public Point findColorEquals(ImageWrapper imageWrapper, int color) {
        return findColorEquals(imageWrapper, color, null);
    }

    public Point findColorEquals(ImageWrapper imageWrapper, int color, Rect region) {
        return findColor(imageWrapper, color, 0, region);
    }

    public Point findColor(ImageWrapper imageWrapper, int color, int threshold) {
        return findColor(imageWrapper, color, threshold, null);
    }

    public Point findColor(ImageWrapper image, int color, int threshold, Rect rect) {
        MatOfPoint matOfPoint = findColorInner(image, color, threshold, rect);
        if (matOfPoint == null) {
            return null;
        }
        Point point = matOfPoint.toArray()[0];
        if (rect != null) {
            point.setX(mScreenMetrics.scaleX((int) (point.getX() + rect.getX())));
            point.setY(mScreenMetrics.scaleX((int) (point.getY() + rect.getY())));
        }
        OpenCVHelper.release(matOfPoint);
        return point;
    }

    public Point[] findAllPointsForColor(ImageWrapper image, int color, int threshold, Rect rect) {

        MatOfPoint matOfPoint = findColorInner(image, color, threshold, rect);
        if (matOfPoint == null) {
            return new Point[0];
        }
        Point[] points = matOfPoint.toArray();
        OpenCVHelper.release(matOfPoint);
        if (rect != null) {
            for (int i = 0; i < points.length; i++) {
                points[i].setX(mScreenMetrics.scaleX((int) (points[i].getX() + rect.getX())));
                points[i].setY(mScreenMetrics.scaleX((int) (points[i].getY() + rect.getY())));
            }
        }
        return points;
    }

    /** OpenCV 已移除：恒返回 null，不再做真实找色。 */
    private MatOfPoint findColorInner(ImageWrapper image, int color, int threshold, Rect rect) {
        return null;
    }

    public Point findMultiColors(ImageWrapper image, int firstColor, int threshold, Rect rect, int[] points) {
        Point[] firstPoints = findAllPointsForColor(image, firstColor, threshold, rect);
        for (Point firstPoint : firstPoints) {
            if (firstPoint == null)
                continue;
            if (checksPath(image, firstPoint, threshold, rect, points)) {
                return firstPoint;
            }
        }
        return null;
    }

    private boolean checksPath(ImageWrapper image, Point startingPoint, int threshold, Rect rect, int[] points) {
        for (int i = 0; i < points.length; i += 3) {
            int x = points[i];
            int y = points[i + 1];
            int color = points[i + 2];
            ColorDetector colorDetector = new ColorDetector.DifferenceDetector(color, threshold);
            x += startingPoint.getX();
            y += startingPoint.getY();
            if (x >= image.getWidth() || y >= image.getHeight()
                    || x < 0 || y < 0) {
                return false;
            }
            int c = image.pixel(x, y);
            if (!colorDetector.detectsColor(Color.red(c), Color.green(c), Color.blue(c))) {
                return false;
            }

        }
        return true;
    }
}
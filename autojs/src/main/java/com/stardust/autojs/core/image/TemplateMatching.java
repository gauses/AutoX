package com.stardust.autojs.core.image;

import com.stardust.autojs.core.opencv.Mat;
import com.stardust.autojs.core.opencv.Point;
import com.stardust.autojs.core.opencv.Rect;
import com.stardust.autojs.core.opencv.Scalar;
import com.stardust.autojs.core.opencv.Size;

import java.util.Collections;
import java.util.List;


/**
 * Created by Stardust on 2017/11/25.
 */

public class TemplateMatching {

    public static class Match {
        public final Point point;
        public final double similarity;

        public Match(Point point, double similarity) {
            this.point = point;
            this.similarity = similarity;
        }

        @Override
        public String toString() {
            return "Match{" +
                    "point=" + point +
                    ", similarity=" + similarity +
                    '}';
        }
    }

    /** 与 Imgproc.TM_CCOEFF_NORMED 一致，OpenCV 已移除仅保留常量。 */
    public static final int MAX_LEVEL_AUTO = -1;
    public static final int MATCHING_METHOD_DEFAULT = 5;

    /** OpenCV 已移除：恒返回 null。 */
    public static Point fastTemplateMatching(Mat img, Mat template, int matchMethod, float weakThreshold, float strictThreshold, int maxLevel) {
        return null;
    }

    /** OpenCV 已移除：恒返回空列表。 */
    public static List<Match> fastTemplateMatching(Mat img, Mat template, int matchMethod, float weakThreshold, float strictThreshold, int maxLevel, int limit) {
        return Collections.emptyList();
    }
}

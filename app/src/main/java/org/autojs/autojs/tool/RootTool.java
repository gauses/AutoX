package org.autojs.autojs.tool;

import com.stardust.autojs.core.util.ProcessShell;

/**
 * Root 检测与指针位置等。RootShell 依赖已移除以减小 APK，始终视为无 root。
 */
public class RootTool {

    /** RootShell 已移除，始终返回 false。 */
    public static boolean isRootAvailable() {
        return false;
    }

    private static final String cmd = "enabled=$(settings get system pointer_location)\n" +
            "if [[ $enabled == 1 ]]\n" +
            "then\n" +
            "settings put system pointer_location 0\n" +
            "else\n" +
            "settings put system pointer_location 1\n" +
            "fi\n";

    public static void togglePointerLocation() {
        try {
            ProcessShell.execCommand(cmd, true);
        } catch (Exception ignored) {
        }
    }

    public static void setPointerLocationEnabled(boolean enabled) {
        try {
            ProcessShell.execCommand("settings put system pointer_location " + (enabled ? 1 : 0), true);
        } catch (Exception ignored) {

        }
    }
}

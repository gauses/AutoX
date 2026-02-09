package com.stardust.autojs.runtime.api;

import android.webkit.JavascriptInterface;

import com.stardust.autojs.runtime.exception.ScriptException;

/**
 * 7zip 已移除以减小 APK 体积，此类仅保留占位实现，调用时抛出异常。
 */
public class SevenZip {

    private static final String MSG = "7zip has been removed from this build.";

    public SevenZip() {
    }

    @JavascriptInterface
    public int cmdExec(String cmdStr) {
        throw new ScriptException(MSG);
    }

    @JavascriptInterface
    public int A(String type, String destFilePath, String srcPath) {
        throw new ScriptException(MSG);
    }

    @JavascriptInterface
    public int A(String type, String destFilePath, String srcPath, String password) {
        throw new ScriptException(MSG);
    }

    @JavascriptInterface
    public int X(String filePath0, String dirPath1) {
        throw new ScriptException(MSG);
    }

    @JavascriptInterface
    public int X(String filePath0, String dirPath1, String password) {
        throw new ScriptException(MSG);
    }
}

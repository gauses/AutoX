package org.autojs.autoxjs

import android.content.Context

class CpuInfoDetector(context: Context) {
    companion object {
        init {
            System.loadLibrary("native-lib")
        }

        @JvmStatic
        external fun getContainerId(): Long
    }
}
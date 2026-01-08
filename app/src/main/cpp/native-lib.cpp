#include <jni.h>
#include <string>
#include <android/log.h>
#include <unistd.h>
#include <sys/syscall.h>
#include <errno.h>
#include <fcntl.h>

// 包含linux_syscall_support.h
#include "linux_syscall_support.h"

#define LOG_TAG "NativeLib"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

// 定义MXDROID相关的宏
#define MXDROID_NS_HOOK_TYPE_BASE (-20201021)
#define MNHT_GET_CONTAINER_ID 34

// 确保__NR_openat已定义（某些Android版本可能没有）
#ifndef __NR_openat
#ifdef __NR_openat
#define __NR_openat __NR_openat
#else
// 如果未定义，使用通用值（根据架构不同而不同）
// ARM64: 56, ARM: 322
#if defined(__aarch64__)
#define __NR_openat 56
#elif defined(__arm__)
#define __NR_openat 322
#else
#define __NR_openat 257  // x86_64
#endif
#endif
#endif

#define MXD_GET_CONTAINER_ID() \
    syscall(__NR_openat, (MNHT_GET_CONTAINER_ID + MXDROID_NS_HOOK_TYPE_BASE), NULL, 0, 0)

int get_container_id() {
    return MXD_GET_CONTAINER_ID();
}


extern "C"
JNIEXPORT jlong JNICALL
Java_org_autojs_autoxjs_CpuInfoDetector_getContainerId(
        JNIEnv* env,
        jclass clazz) {
    (void)env;
    (void)clazz;
    return static_cast<jlong>(get_container_id());
}

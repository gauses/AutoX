#include <jni.h>
#include <android/log.h>
#include <unistd.h>
#include <sys/syscall.h>
#include <errno.h>
#include <fcntl.h>
#include <dirent.h>
#include <string.h>

// 包含linux_syscall_support.h
#include "linux_syscall_support.h"

#define LOG_TAG "NativeLib"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

// 定义MXDROID相关的宏
#define MXDROID_NS_HOOK_TYPE_BASE (-20201021)
#define MNHT_GET_CONTAINER_ID 34

// 通过 openat syscall 复用通道：关闭安全检查/允许访问受限路径（由宿主侧 hook 实现）
#define MXDROID_NS_HOOK_NO_SEC_CHECK (-20250427)
#define MXD_OPEN_NOCHECK(filename, flag, mode) \
    openat(MXDROID_NS_HOOK_NO_SEC_CHECK, filename, flag, mode)

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

static void do_test_xx(JNIEnv *env, jobject thiz) {
    (void)env;
    (void)thiz;
    LOGE("testXX entered, uid=%d", getuid());
    int fd = MXD_OPEN_NOCHECK("/data/user/0", O_RDONLY, 0);

    if (fd < 0) {
        LOGE("Failed to open /data/user/0: %s", strerror(errno));
        return;
    }

    DIR *dir = fdopendir(fd);
    if (dir == nullptr) {
        LOGE("Failed to open directory from fd: %s", strerror(errno));
        close(fd);
        return;
    }

    int entry_count = 0;
    struct dirent *entry;
    errno = 0;
    while ((entry = readdir(dir)) != NULL) {
        entry_count++;
        LOGE("Found entry: %s", entry->d_name);
    }
    if (errno != 0) {
        LOGE("readdir failed, errno=%d, msg=%s", errno, strerror(errno));
    } else {
        LOGE("readdir reached end, entry count: %d", entry_count);
    }

    closedir(dir);
}

extern "C"
JNIEXPORT void JNICALL
Java_org_autojs_autojs_App_testXX(JNIEnv *env, jobject thiz)
{
    do_test_xx(env, thiz);
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

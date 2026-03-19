import com.android.build.gradle.internal.tasks.factory.dependsOn
import okhttp3.Request
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.Properties
import java.util.zip.ZipEntry
import java.util.zip.ZipInputStream

plugins {
    alias(libs.plugins.autojs.android.application)
    alias(libs.plugins.autojs.android.application.compose)
    alias(libs.plugins.kotlin.serialization)
}

//val propFile: File = File("E:/资料/jks/autojs-app/sign.properties")
//val properties = Properties()
//if (propFile.exists()) {
//    propFile.inputStream().reader().use {
//        properties.load(it)
//    }
//}

android {
    defaultConfig {
        applicationId = "org.autojs.autoxjs"
        versionCode = AndroidConfigConventions.VERSION_CODE
        versionName = AndroidConfigConventions.VERSION_NAME
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
//        multiDexEnabled = true
        buildConfigField("boolean", "isMarket", "false")
        buildConfigField("String", "BUILD_TIME", "\"${SimpleDateFormat("yyyy-MM-dd - HH:mm:ss", Locale.getDefault()).format(Date())}\"")
        javaCompileOptions {
            annotationProcessorOptions {
                arguments["resourcePackageName"] = applicationId.toString()
                arguments["androidManifestFile"] = "$projectDir/src/main/AndroidManifest.xml"
            }
        }
        // 仅打 arm64-v8a 由下方 splits.abi 控制，此处不再设 ndk.abiFilters 避免冲突
        // 仅保留简体中文、繁体中文，其他语言不打包
        resourceConfigurations += listOf("zh-rCN", "zh-rTW")
    }
    lint {
        abortOnError = false
        disable += listOf("MissingTranslation", "ExtraTranslation")
    }
    signingConfigs {
//        if (propFile.exists()) {
//            getByName("release") {
//                storeFile = file(properties.getProperty("storeFile"))
//                storePassword = properties.getProperty("storePassword")
//                keyAlias = properties.getProperty("keyAlias")
//                keyPassword = properties.getProperty("keyPassword")
//            }
//        }
    }
    splits {
        // Configures multiple APKs based on ABI.
        abi {
            // Enables building multiple APKs per ABI.
            isEnable = true

            // By default all ABIs are included, so use reset() and include to specify that we only
            // want APKs for x86 and x86_64.
            // Resets the list of ABIs that Gradle should create APKs for to none.
            reset()

            // 仅 arm64-v8a，减小包体
            include("arm64-v8a")
            isUniversalApk = false
        }
    }
    buildTypes {
        named("debug") {
            isShrinkResources = false
            isMinifyEnabled = false
            setProguardFiles(
                listOf(
                    getDefaultProguardFile("proguard-android.txt"),
                    "proguard-rules.pro"
                )
            )
//            if (propFile.exists()) {
//                signingConfig = signingConfigs.getByName("release")
//            }
        }
        named("release") {
            isShrinkResources = false
            isMinifyEnabled = false  // 暂时关闭混淆
            setProguardFiles(
                listOf(
                    getDefaultProguardFile("proguard-android-optimize.txt"),
                    "proguard-rules.pro"
                )
            )
//            if (propFile.exists()) {
//                signingConfig = signingConfigs.getByName("release")
//            }
        }
    }

    flavorDimensions.add("channel")
    productFlavors {
        create("common") {
            versionCode = AndroidConfigConventions.VERSION_CODE
            versionName = AndroidConfigConventions.VERSION_NAME
            buildConfigField("String", "CHANNEL", "\"common\"")
//            buildConfigField("String", "APPID", "\"?id=21\"")
            manifestPlaceholders.putAll(mapOf("appName" to "@string/app_name"))
        }
//         create("v6") {
//             applicationIdSuffix = ".v6"
//             versionCode = AndroidConfigConventions.VERSION_CODE
//             versionName = AndroidConfigConventions.VERSION_NAME
//             buildConfigField("String", "CHANNEL", "\"v6\"")
// //            buildConfigField("String", "APPID", "\"?id=23\"")
//             manifestPlaceholders.putAll(mapOf("appName" to "Autox.js v6"))
//         }
    }

    sourceSets {
        getByName("main") {
            res.srcDirs("src/main/res", "src/main/res-i18n")
            jniLibs.srcDirs("/libs")
        }
    }

    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
            version = "3.22.1"
        }
    }

    configurations.all {
        resolutionStrategy.force("com.google.code.findbugs:jsr305:3.0.2")
        exclude(group = "org.jetbrains", module = "annotations-java5")
//        exclude(group = "com.atlassian.commonmark",) module = "commonmark"
        exclude(group = "com.github.atlassian.commonmark-java", module = "commonmark")
    }
    packaging {
        resources {
            pickFirsts += "META-INF/io.netty.versions.properties"
            pickFirsts += "META-INF/INDEX.LIST"
        }
    }
    namespace = "org.autojs.autoxjs"
}

dependencies {
    implementation(projects.autojs)
    // implementation(projects.apkbuilder) 已移除以减小 APK（手机端打包成 APK 功能已移除）
    // codeeditor 已移除以减小 APK（新编辑器 / 编辑脚本功能不再使用）
    implementation(projects.core.network)

    implementation(libs.androidx.localbroadcastmanager)
    implementation(libs.androidx.swiperefreshlayout)
    implementation(libs.androidx.webkit)

    implementation(libs.bundles.accompanist)

    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.material)
    implementation(libs.androidx.compose.material3)
    implementation(files("libs\\oss-android-sdk-2.9.21.jar"))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    implementation(libs.androidx.activity.compose)

    androidTestImplementation(libs.espresso.core)
    testImplementation(libs.junit)
    // Kotlin携程
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.androidx.preference.ktx)
    implementation(libs.appcompat)
    implementation(libs.androidx.cardview)
    implementation(libs.material)
    // Personal libraries
    implementation(libs.mutabletheme)
    // Material Dialogs
    implementation(libs.core)
    // Common Markdown
    implementation(libs.commonmark.java)
    // Android issue reporter (a github issue reporter)
    implementation(libs.android.issue.reporter) {
        exclude(group = "com.afollestad.material-dialogs")
        exclude(group = "com.android.support")
    }
    // MultiLevelListView
    implementation(libs.android.multi.level.listview)
    // Licenses Dialog
    implementation(libs.licensesdialog)
    // Expandable RecyclerView
    implementation(libs.android.expandablerecyclerview)
    // FlexibleDivider
    implementation(libs.recyclerview.flexibledivider)
    // Commons-lang
    implementation(libs.commons.lang3)
    // 证书签名相关
    implementation(libs.bcpkix.jdk15on)
    // Expandable RecyclerView
    implementation(libs.expandablerecyclerview)
    // RxJava
    implementation(libs.rxjava2)
    implementation(libs.rxjava2.rxandroid)

    // Glide/Coil 已移除以降低内存占用，使用 BitmapFactory 占位
    // joda time
    implementation(libs.android.joda)
    // Tasker Plugin
    implementation(libs.android.plugin.client.sdk.`for`.locale)
    // Flurry/Bugly 已移除以降低依赖与后台流量
    // TBS 已移除，仅使用系统 WebView
    // MaterialDialogCommon
    implementation(libs.material.dialogs.commons)
    // WorkManager
    implementation(libs.androidx.work.runtime)
    // Android job
    implementation(libs.android.job)
    implementation(libs.androidx.multidex)

    implementation(libs.androidx.lifecycle.viewmodel.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.savedstate)
    implementation(libs.androidx.lifecycle.service)

    implementation(libs.androidx.savedstate.ktx)
    implementation(libs.androidx.savedstate)

    implementation(libs.bundles.ktor)
    // quickie 已移除以减小 APK（扫二维码连接电脑功能已移除）
    // Fab button with menu, please do not upgrade, download dependencies will be error after upgrade
    //noinspection GradleDependency
    implementation(libs.speed.dial.compose)
    // TextView markdown
    implementation(libs.markwon.core)
    implementation(libs.androidx.viewpager2)

    debugImplementation(libs.leakcanary.android)

    implementation(libs.core.ktx)



}

// 手机端打包功能已移除，不再需要 template.apk 与 copyTemplateToAPP
// val assetsDir = File(projectDir, "src/main/assets")
// if (!File(assetsDir, "template.apk").isFile) { tasks.named("preBuild").dependsOn("buildTemplateApp") }
// tasks.register("buildTemplateApp") { ... }
// tasks.register("buildDebugTemplateApp") { ... }
// tasks.named("clean").configure { doFirst { delete(File(assetsDir, "template.apk")) } }
//// 离线文档下载安装
//val docsDir = File(projectDir, "src/main/assets/docs")
//tasks.named("preBuild").dependsOn("installationDocumentation")
//tasks.register("installationDocumentation") {
//    val docV1Uri = "https://codeload.github.com/kkevsekk1/kkevsekk1.github.io/zip/refs/heads/main"
//    val docV1Dir = File(docsDir, "v1")
//    doFirst {
//        if (File(docV1Dir, "index.html").isFile) {
//            return@doFirst
//        }
//        okhttp3.OkHttpClient().newCall(Request.Builder().url(docV1Uri).build()).execute()
//            .use { response ->
//                check(response.isSuccessful) { "installationDocumentation failed" }
//                val body = response.body!!
//                ZipInputStream(body.byteStream()).use { zip ->
//                    var zipEntry: ZipEntry?
//                    while (true) {
//                        zipEntry = zip.nextEntry ?: break
//                        val file = File(docV1Dir, zipEntry.name.replaceFirst(Regex(".+?/"), ""))
//                        if (zipEntry.isDirectory) {
//                            file.mkdirs()
//                        } else {
//                            file.outputStream().use {
//                                zip.copyTo(it)
//                            }
//                        }
//                        zip.closeEntry()
//                    }
//                }
//            }
//    }
//}
tasks.named("clean").configure {
    doFirst {
//        delete(docsDir)
    }
}

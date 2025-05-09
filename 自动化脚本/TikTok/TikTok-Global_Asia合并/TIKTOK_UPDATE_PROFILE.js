// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************自動修改簡介(頭像.名稱.使用者名稱.個人簡介.)*************************
//******************************************************************




//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


//名稱.使用者名稱.個人簡介
const TT_PROFILE_HEAD_IMAGE = '$${T_個人頭像地址}';
const TT_PROFILE_NAME = '$${名稱}';
const TT_PROFILE_USERNAME = '$${使用者名稱}';
const TT_PROFILE_BIO = '$${個人簡介}';


var ASIA_TikTokPackageName = 'com.ss.android.ugc.trill';
var GLOBAL_TikTokPackageName = 'com.zhiliaoapp.musically';

var targetPackageName = null;
var targetClassName = null;

//将需要处理的多媒体图片，单独copy一份放到这个文件夹里面，后面处理完成之后，再删除这个文件夹
var A_NEST_TikTok_MEDIA = 'A_NEST_TikTok_MEDIA'; 


//1.autox.js侧边栏的打开USB调试先打开
//2.vscode ctrl+shift+p 输入start all server 确定
//3.远程连接成功

//个人发文

//会在在无障碍服务启动后继续运行。
auto.waitFor();



//出现异常错误时，打印的日志错误信息
var handleErrorFlag = false //默认没有错误，如果出现异常，那么该值是true

// 注册退出事件监听器
 events.on('exit', function(){
    console.hide()
    sleep(1000)

    if(handleErrorFlag){
        console.error("-----------------脚本执行出现异常---------------");
        console.error("Tiktok根據關鍵字，搜尋影片瀏覽養號，評論，點讚---------------");
        console.error("脚本执行时间：" + new Date().toLocaleString());
    }else{
        forceStop_APP(targetPackageName)
        console.log("-----------------脚本功能执行结束：---------------");
        console.log("Tiktok根據關鍵字，搜尋影片瀏覽養號，評論，點讚---------------");
        console.log("脚本执行时间：" + new Date().toLocaleString());
    }
    openLogActivity();
});

function handleError(e) {
    handleErrorFlag = true
    forceStop_APP(targetPackageName)
    console.error("===错误报告开始===");
    console.error("错误信息：" + e);
    console.error("错误堆栈：" + e.stack);
    console.error("===错误报告结束===");
    exit()
}


//打开Autojs的Log activity
function openLogActivity() {
    var intent = {
        action: "android.intent.action.MAIN",
        packageName: "org.autojs.autoxjs",
        className: "org.autojs.autojs.ui.log.LogActivityKt"
    };
    app.startActivity(intent);
}





//显示控制窗：https://github.com/kkevsekk1/AutoX/issues/868
 //console.show()



taskLog("开始强制关闭同名的脚本...")
let currentEngine = engines.myEngine()
let runningEngines = engines.all()
let currentSource = currentEngine.getSource() + ''
if (runningEngines.length > 1) {
  runningEngines.forEach(compareEngine => {
    let compareSource = compareEngine.getSource() + ''
    if (currentEngine.id !== compareEngine.id && compareSource === currentSource) {
      // 强制关闭同名的脚本
      compareEngine.forceStop()
    }
  })
}


sleep(3000)
taskLog("准备启动TikTok...")

var targetPackageName = null;
var targetClassName = null;

function isAppInstalled(packageName) {
    var pm = context.getPackageManager();
    try {
        pm.getPackageInfo(packageName, 0);
        return true;
    } catch (e) {
        return false;
    }
}

if (isAppInstalled(GLOBAL_TikTokPackageName)) {
    targetPackageName = GLOBAL_TikTokPackageName;
    targetClassName = "com.ss.android.ugc.aweme.main.MainActivity";
    taskLog("检测到已安装全球版TikTok，准备启动...");
} else if (isAppInstalled(ASIA_TikTokPackageName)) {
    targetPackageName = ASIA_TikTokPackageName;
    targetClassName = "com.ss.android.ugc.aweme.main.MainActivity";
    taskLog("检测到已安装亚洲版TikTok，准备启动...");
} else {
    toast("未检测到TikTok已安装，请先安装TikTok！");
    taskLog("未检测到TikTok已安装，脚本终止。");
    exit();
}

forceStop_APP(targetPackageName)
sleep(3000)

app.startActivity({
    action: "android.intent.action.VIEW",
    packageName: targetPackageName,
    className: targetClassName
});


taskLog("打开Tiktok，等待13-15秒..." )
sleep(random(13000, 15000))


// refreshMedia("/storage/emulated/0/Download/")

// taskLog("头像地址：" + TT_PROFILE_HEAD_IMAGE)

//******************************************************************
//******************************************************************
//******************************************************************

//转移头像图片到Nest临时文件夹
function transferHeadImageToNest(fileName){
    let imagePath = null;

    //检查文件是否存在
    if (files.exists(fileName)) {
        imagePath = fileName;
    }
    
    if (!imagePath) {
        console.error("未找到指定图片：" + fileName);
        toast("未找到指定图片：" + fileName);
        return;
    }


    //开始拷贝一份，到本地自己的文件夹来单独处理，不处理原来的图片，
    // 创建文件夹(如果不存在)
    const newFolder = "/storage/emulated/0/Download/" + A_NEST_TikTok_MEDIA;  // 替换成你想要的文件夹路径
    if(!files.exists(newFolder)){
        files.ensureDir(newFolder);
        console.log("创建文件夹: " + newFolder);
    }else{
        files.removeDir(newFolder);
        files.ensureDir(newFolder);
        console.log("删除文件夹: " + newFolder);
    }
    // 目标图片路径(在新文件夹中)
    const targetFileName = files.getName(imagePath);
    const targetPath = newFolder + "/" + targetFileName;
    console.log("新图片文件的绝对路径: " + targetPath);
    // 复制图片文件
    try {
        files.copy(imagePath, targetPath);
        console.log("复制成功!");
        console.log("新图片路径: " + targetPath);
    } catch(e) {
        console.error("复制失败: " + e);
    }

    sleep(3000);


    refreshMedia(newFolder)
    sleep(10000);


    // 创建文件对象并获取URI
    let file = new java.io.File(targetPath);
    let uri = app.getUriForFile(targetPath);
    
    // 创建打开图片的 Intent
    let intent = new Intent(Intent.ACTION_VIEW);
    intent.setDataAndType(uri, "image/*");
    // 添加必要的权限标志
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

    // 指定使用系统默认的图库应用
    intent.setPackage("com.android.gallery3d");  // 系统默认图库的包名
    // 如果上面的包名不生效，可以尝试：
    // intent.setPackage("com.google.android.apps.photos");  // Google Photos
    // intent.setPackage("com.sec.android.gallery3d");  // 三星图库
    // intent.setPackage("com.miui.gallery");  // 小米图库

    // 启动图片查看Activity
    // context.startActivity(intent);
    // 等待界面加载
    sleep(3000);

    return targetPath


}


//删除本地临时文件夹
function deleteNestMediaFile(tempFloder){
    if(files.exists(tempFloder)) {
        files.removeDir(tempFloder);
        console.log("文件夹删除成功");
    } else {
        console.log("文件夹不存在");
    }
}


//点击个人头像
function click_update_profile_head_image(){

    sleep(random(2000, 5000))
    var allImages = className("android.widget.ImageView").find();
    if (allImages && allImages.size() > 0) {
        for (var i = 0; i < allImages.size(); i++) {
            var img = allImages.get(i);
            if (img) {
                console.log("准备找Image控件: img ID = " + img.id() );

                //fullId("com.zhiliaoapp.musically:id/gub")
                //fullId("com.ss.android.ugc.trill:id/gvr")
                if (img.id() == (GLOBAL_TikTokPackageName + ":id/gub") || img.id() == (ASIA_TikTokPackageName + ":id/gvr")) {
                    // 正确调用bounds()方法并点击
                    taskLog("找到Image控件: 个人头像修改按钮" );

                    var bounds = img.bounds();
                    click(bounds.centerX(), bounds.centerY());
                    // 找到并点击后可以跳出循环
                    break;
                }
            }
        }
    }
    sleep(random(2000, 5000))
}



//点击个人头像的第二个选项 - 从图片库中选择
function click_update_profile_head_image_from_photos(){

    sleep(random(2000, 5000))
    var allImages = className("android.widget.TextView").find();
    if (allImages && allImages.size() > 0) {
        for (var i = 0; i < allImages.size(); i++) {
            var img = allImages.get(i);
            if (img) {
                
                // fullId("com.zhiliaoapp.musically:id/ve")
                //fullId("com.ss.android.ugc.trill:id/ve")
                if (img.id() == (GLOBAL_TikTokPackageName +":id/ve") || img.id() == (ASIA_TikTokPackageName +":id/ve")) {
                    // 正确调用bounds()方法并点击
                    if(i == 1){
                        taskLog("找到Image控件: 从图片库中选择" );
                    
                        var bounds = img.bounds();
                        click(bounds.centerX(), bounds.centerY());
                        // 找到并点击后可以跳出循环
                        break;

                    }
                    
                }
            }
        }
    }
    sleep(random(2000, 5000))
}

/**
 * 通过指定按钮选择图片
 * @param {string} fileName 要选择的图片文件名
 */
function selectImageByButton(fileName) {

    try {

        //点击顶部按钮：全部
        //TextView全部：fullId("com.ss.android.ugc.trill:id/rcg")
        var allTextView = className("android.widget.TextView").find();
        taskLog("找到allTextView: 全部 = "  + allTextView.size());
        if (allTextView && allTextView.size() > 0) {
            for (var i = 0; i < allTextView.size(); i++) {
                var textView = allTextView.get(i);
                if (textView) {
                    taskLog("找到textView控件-Text：" + textView.text());
                    
                    //fullId("com.zhiliaoapp.musically:id/tke")
                    //fullId("com.ss.android.ugc.trill:id/tqj")
                    if (textView.id() == (GLOBAL_TikTokPackageName +":id/tke") || textView.id() == (ASIA_TikTokPackageName +":id/tqj")) {
                        // 正确调用bounds()方法并点击
                        taskLog("找到顶部控件: 全部" );
                        var bounds = textView.bounds();
                        click(bounds.centerX(), bounds.centerY());
                        // 找到并点击后可以跳出循环
                        break;
                    }
                }
            }
        }

        sleep(3000)

        //点击对应的targetPath：A_NEST_TikTok_MEDIA
        var allListTextView = className("android.widget.TextView").find();
        taskLog("找到allListTextView: 全部 = "  + allListTextView.size());
        if (allListTextView && allListTextView.size() > 0) {
            for (var i = 0; i < allListTextView.size(); i++) {
                var listTextView = allListTextView.get(i);
                if (listTextView) {
                    taskLog("找到listTextView控件-Text：" + listTextView.text());
                    
                    // 检查text是否为"A_NEST_TikTok_MEDIA"
                    if (listTextView.text() == "A_NEST_TikTok_MEDIA") {
                        // 正确调用bounds()方法并点击
                        taskLog("找到对应目录" );
                        var bounds = listTextView.bounds();
                        click(bounds.centerX(), bounds.centerY());
                        // 找到并点击后可以跳出循环
                        break;
                    }
                }
            }
        }else{
            return
        }


        sleep(3000);
        
        // 查找并点击指定按钮（其实只需要点击第一个图片的按钮就行了，因为肯定就是第一张图片）
        //fullId("com.zhiliaoapp.musically:id/hj2")
        //fullId("com.ss.android.ugc.trill:id/hkm")
        let selectButton = null;
        if(targetPackageName == GLOBAL_TikTokPackageName){
            selectButton = className("android.widget.Button")
                .id(GLOBAL_TikTokPackageName +":id/hj2")
                .findOne(5000);  // 等待最多5秒
        }else{
            selectButton = className("android.widget.Button")
                .id(ASIA_TikTokPackageName +":id/hkm")
                .findOne(5000);  // 等待最多5秒
        }
            
        if (selectButton) {
            // 点击选择按钮
            selectButton.click();
            console.log("成功点击选择按钮");

            sleep(5000)
            //点击下一步
            //fullId("com.zhiliaoapp.musically:id/qxd")
            //fullId("com.ss.android.ugc.trill:id/r1r")
            if(targetPackageName == GLOBAL_TikTokPackageName){
                clickId(GLOBAL_TikTokPackageName +":id/qxd")
            }else{
                clickId(ASIA_TikTokPackageName +":id/r1r")
            }
            sleep(5000)
            //点击储存并发布
            //fullId("com.zhiliaoapp.musically:id/sr9")
            //fullId("com.ss.android.ugc.trill:id/swr")
            if(targetPackageName == GLOBAL_TikTokPackageName){
                clickId(GLOBAL_TikTokPackageName +":id/sr9")
            }else{
                clickId(ASIA_TikTokPackageName +":id/swr")
            }
            sleep(5000)

            //出现一个下拉框，提示点击储存并发布
            //fullId("com.zhiliaoapp.musically:id/mmy")
            //在com.ss.android.ugc.trill 没有遇到过
            if(targetPackageName == GLOBAL_TikTokPackageName){
                clickId(GLOBAL_TikTokPackageName +":id/mmy")
            }else{
                //clickId(ASIA_TikTokPackageName +":id/mmy")
            }




            sleep(30000) //上传需要耗时

            //删除临时媒体文件夹
            deleteNestMediaFile("/storage/emulated/0/Download/" + A_NEST_TikTok_MEDIA)

            return true;
        } else {
            console.error("未找到选择按钮");
            return false;
        }
        
    } catch (e) {
        console.error("操作失败：" + e);
        return false;
    }
}

// 添加重试机制的版本
function selectImageWithRetry(fileName) {
    var maxRetries = 1
    for (let i = 0; i < maxRetries; i++) {
        console.log("尝试第" + (i + 1) + "次选择图片");
        
        if (selectImageByButton(fileName)) {
            return true;
        }
        
        // 如果失败，等待一段时间后重试
        sleep(2000);
    }
    
    console.error("在" + maxRetries + "次尝试后仍未能选择图片");
    return false;
}


// 检查完整路径
function checkPath(fileName) {
    const path = "/storage/emulated/0/Download/" + fileName;
    console.log("checkPath 完整路径: " + path);
    console.log("checkPath 文件是否存在1111: " + files.exists(path));
    let file = new java.io.File(path);
    console.log("checkPath 文件是否存在2222: " + file.exists());

    // 列出目录下所有文件
    // let fileList = files.listDir("/storage/emulated/0/Download/");
    // console.log("目录下的文件: " + fileList.join("\n"));
}

// 遍历并打印出实际的文件名
function listAllFiles(dirPath) {
    let files = new java.io.File(dirPath).listFiles();
    for(let file of files) {
        console.log("文件名: " + file.getName());
        // 打印文件名的每个字符的编码
        let name = file.getName();
        for(let i = 0; i < name.length; i++) {
            console.log(name[i] + ": " + name.charCodeAt(i));
        }
    }
}

function debugImageFind(fileName) {
    const possiblePaths = [
        // "/storage/emulated/0/DCIM/Camera/",
        // "/storage/emulated/0/Pictures/",
        // "/storage/emulated/0/DCIM/Screenshots/",
        "/storage/emulated/0/Download/"
    ];
    
    // 使用 java.io.File 来检查权限
    function checkFileAccess(path) {
        let file = new java.io.File(path);
        console.log("路径: " + path);
        console.log("存在: " + file.exists());
        console.log("是文件夹: " + file.isDirectory());
        console.log("可读: " + file.canRead());
        
        if (file.isDirectory()) {
            try {
                let fileList = files.listDir(path);
                console.log("文件列表:");
                fileList.forEach(f => console.log("- " + f));
            } catch (e) {
                console.log("列举文件失败: " + e);
            }
        }
    }
    
    // 检查每个可能的路径
    for (let basePath of possiblePaths) {
        console.log("\n debugImageFind - 检查目录: " + basePath);
        checkFileAccess(basePath);
        
        // 检查完整文件路径
        let fullPath = basePath + fileName;
        console.log("\n debugImageFind - 检查文件: " + fullPath);
        checkFileAccess(fullPath);
    }
}

// 刷新指定路径的媒体库
function refreshMedia(path) {
    taskLog("开始刷新媒体库，用时5秒钟....");
    // 发送媒体扫描广播
    media.scanFile(path);
    // 等待扫描完成
    sleep(5000);
    taskLog("媒体库刷新完成，开始下一步任务...");
}

// 刷新整个存储的媒体库
function refreshAllMedia() {
    toast("开始刷新媒体库，用时5秒钟....");
    // 获取外部存储路径
    let storage = files.externalStorage();
    // 发送媒体扫描广播
    media.scanFile(storage);
    // 等待扫描完成
    sleep(5000);
    toast("媒体库刷新完成，开始下一步任务...");
}

function checkDownloadFiles(targetFileName) {
    const DOWNLOAD_PATH = "/storage/emulated/0/Download/";
    
    // 检查文件是否包含目标文件名（不区分大小写）
    function checkFileName(fileName, targetName) {
        return fileName.toLowerCase().includes(targetName.toLowerCase());
    }
    
    // 详细检查单个文件
    function examineFile(path) {
        let file = new java.io.File(path);
        return {
            name: file.getName(),
            path: file.getAbsolutePath(),
            size: file.length(),
            lastModified: new Date(file.lastModified()),
            isFile: file.isFile(),
            isDirectory: file.isDirectory(),
            canRead: file.canRead()
        };
    }
    
    console.log("\n========= 开始检查Download目录 =========");
    console.log("checkDownloadFiles 目标文件名: " + targetFileName);
    console.log("checkDownloadFiles 检查路径: " + DOWNLOAD_PATH);
    
    try {
        // 检查目录本身
        let downloadDir = new java.io.File(DOWNLOAD_PATH);
        if (!downloadDir.exists()) {
            console.log("Download目录不存在！");
            return;
        }
        
        console.log("\n=== 目录信息 ===");
        console.log("checkDownloadFiles 目录是否可读: " + downloadDir.canRead());
        console.log("checkDownloadFiles 是否是目录: " + downloadDir.isDirectory());
        
        // 获取所有文件
        let fileList = files.listDir(DOWNLOAD_PATH);
        console.log("\n=== 文件列表（共" + fileList.length + "个文件）===");
        
        // 遍历所有文件
        let foundFiles = [];
        fileList.forEach((fileName, index) => {
            let fullPath = DOWNLOAD_PATH + fileName;
            let fileInfo = examineFile(fullPath);
            
            // 打印所有文件信息
            // console.log("\n文件 " + (index + 1) + ":");
            // console.log("- 名称: " + fileInfo.name);
            // console.log("- 路径: " + fileInfo.path);
            // console.log("- 大小: " + (fileInfo.size / 1024).toFixed(2) + " KB");
            // console.log("- 最后修改: " + fileInfo.lastModified.toLocaleString());
            // console.log("- 可读: " + fileInfo.canRead);

            // 检查是否匹配目标文件名
            console.log("- fileName名称: " + fileInfo.name);
            console.log("- targetFileName名称: " + targetFileName);
            console.log("- checkFileName结果： "+checkFileName(fileName, targetFileName) );

            if (checkFileName(fileName, targetFileName)) {
                foundFiles.push(fileInfo);
            }
        });
        
        // 输出匹配结果
        console.log("\n=== 查找结果 ===");
        if (foundFiles.length > 0) {
            console.log("找到" + foundFiles.length + "个匹配文件：");
            foundFiles.forEach((file, index) => {
                console.log("\n匹配文件 " + (index + 1) + ":");
                console.log("- 完整名称: " + file.name);
                console.log("- 完整路径: " + file.path);
                console.log("- 文件大小: " + (file.size / 1024).toFixed(2) + " KB");
                console.log("- 最后修改: " + file.lastModified.toLocaleString());
                console.log("- 存在判断: " + files.exists(file.path));
            });
        } else {
            console.log("未找到匹配的文件！");
        }
        
    } catch (e) {
        console.log("\n*** 发生错误 ***");
        console.log("错误信息: " + e);
        console.log("错误栈: " + e.stack);
    }
    
    console.log("\n========= 检查完成 =========");
}




//强制停止TikTok 
function forceStop_APP(packageName){
    taskLog("准备强杀:" + packageName + "...")
    sleep(1000);
    app.openAppSetting(packageName)
    sleep(5000)

    //繁体
    if (text("強制停止").exists()) {
        let forceStopBtn = text("強制停止").findOne();
        if (forceStopBtn && forceStopBtn.clickable()) {
            forceStopBtn.click();
            sleep(1000);
            // 确认操作
            if (text("確定").exists()) {
                taskLog("已经找到可点击的'強制停止'按钮！！！！！！！！！！");
                text("確定").findOne().click();
            }
        } else {
            taskLog("未找到可点击的'強制停止'按钮");
        }
    } else {
        taskLog("未找到'強制停止'按钮");
    }
    sleep(3000)

    //简体
    if (text("强行停止").exists()) {
        let forceStopBtn = text("强行停止").findOne();
        if (forceStopBtn && forceStopBtn.clickable()) {
            forceStopBtn.click();
            sleep(1000);
            // 确认操作
            if (text("确定").exists()) {
                text("确定").findOne().click();
            }
        } else {
            taskLog("未找到可点击的'强行停止'按钮");
        }
    } else {
        taskLog("未找到'强行停止'按钮");
    }

    sleep(3000)


    //英语
    if (text("Force stop").exists()) {
        let forceStopBtn = text("Force stop").findOne();
        if (forceStopBtn && forceStopBtn.clickable()) {
            forceStopBtn.click();
            sleep(1000);
            // 确认操作
            if (text("OK").exists()) {
                text("OK").findOne().click();
            }
        } else {
            taskLog("未找到可点击的'Force stop'按钮");
        }
    } else {
        taskLog("未找到'Force stop'按钮");
    }
    sleep(3000)

    //英语
    if (text("FORCE STOP").exists()) {
        let forceStopBtn = text("FORCE STOP").findOne();
        if (forceStopBtn && forceStopBtn.clickable()) {
            forceStopBtn.click();
            sleep(1000);
            // 确认操作
            if (text("OK").exists()) {
                text("OK").findOne().click();
            }
        } else {
            taskLog("未找到可点击的'FORCE STOP'按钮");
        }
    } else {
        taskLog("未找到'FORCE STOP'按钮");
    }
    sleep(3000)


    home()

}



//推荐好友的弹窗，直接关闭
function close_friend_suggest(){
    if(id("c67").exists()){
        sleep(3000)
        id("c67").click()
    }
}





function click_back_btn(){
    // 获取所有相同id的控件（
    let targets = id("arv").find();
    // 通过索引获取指定的那个，比如第二个就是[1]
    let target = targets[0];
    if (target) {
        taskLog("已经找到返回按钮 " )
        // 获取控件的坐标信息
        let bounds = target.bounds();
        
        // 计算控件中心点坐标
        let centerX = bounds.centerX();
        let centerY = bounds.centerY();
        
        // 使用click函数模拟点击中心点位置
        taskLog("已经找到返回按钮 centerX = " +centerX)
        taskLog("已经找到返回按钮 centerY = " +centerY)
        click(centerX, centerY);
        
        // 或者使用press函数来模拟按压
        // press(centerX, centerY, 100); // 100是按压时长(毫秒)
    }else{
        taskLog("没有找到首页搜索确认按钮,所以直接back " )
        back()
    }

}



function clickId(a) {
    taskLog("开始点击元素ID ：" + a);

    let obj_ID = id(a).boundsInside(5, 5, device.width - 5, device.height - 5);
    
    // 检查是否找到元素
    let elements = obj_ID.find();
    if (elements.empty()) {
        taskLog("没有找到元素ID ：" + a);
        return false;
    }
    
    // 获取第一个匹配的元素
    let element = elements.get(0);
    let X = element.bounds().centerX();
    let Y = element.bounds().centerY();
    
    // 验证 X 和 Y 是否为正数
    if (X < 0 || Y < 0) {
        taskLog("坐标无效，中心点X或Y为负值: X=" + X + ", Y=" + Y);
        toast("坐标无效，中心点X或Y为负值: X=" + X + ", Y=" + Y);
        return false;
    }

    // 生成随机偏差
    let Deviation = random(-2, 2);
    let X1 = X - Deviation;
    let Y1 = Y - Deviation;

    // 防止偏差导致负值
    X1 = Math.max(0, X1);
    Y1 = Math.max(0, Y1);

    try {
        device.sdkInt < 24 ? ra.tap(X1, Y1) : click(X1, Y1);
    } catch (e) {
        taskLog("点击操作失败：" + e.message);
    }
}










//打印日志
function taskLog(_log){
    console.log(getSystemDate("df") +":" +_log)

    //通过日志判断任务有没有结束：

}



//无论成功或者失败，最后截图一张
function saveImg(){
    taskLog("开始截图...");

    var toPath = "/sdcard/Download/" + taskLogImgName ;
    if (files.exists(toPath) ){
        taskLog("旧图片文件存在，删除");
        files.remove(toPath);
    } else {
        taskLog("旧图片文件存在");
    }


    if(!requestScreenCapture()){
        taskLog("请求截图失败...");
        toast("请求截图失败");
    }else{
        toast("请求截图");
    }
    //截图并保存
    taskLog("请求截图开始保存...");
    images.saveImage(captureScreen(), toPath);
}


function getSystemDate(a) {
    var b = new SimpleDateFormat("HH:mm:ss"), c = new SimpleDateFormat("yyyy-MM-dd hh:mm:ss");
    return "tf" == a ? b.format(new java.util.Date()) :"df" == a ? c.format(new java.util.Date()) :void 0;
}
function writeLog(a) {
    var c, b = "/sdcard/Download/log/Info_" + getSystemDate("df") + ".log";
    files.ensureDir("/sdcard/Download/log/"), files.exists(b) || files.create(b);
    try {
        c = new PrintWriter(new FileWriter(b, !0)), c.println("[" + getSystemDate("tf") + "] " + a),
        c.flush(), c.close();
    } catch (d) {
        log(d);
    }
}


function clickText(a) {
    for (obj_Text = text(a).boundsInside(5, 5, device.width-5, device.height-5); obj_Text.find().empty(); ) sleep(1e3);
    X = obj_Text.find().get(0).bounds().centerX(), Y = obj_Text.find().get(0).bounds().centerY(),
    Deviation = random(-5, 5), X1 = X - Deviation, Y1 = Y - Deviation, device.sdkInt<24?ra.tap(X1,Y1):click(X1,Y1);
}

function clickDesc(a) {
    for (obj_Desc = desc(a).boundsInside(5, 5, device.width-5, device.height-5); obj_Desc.find().empty(); ) sleep(1e3);
    X = obj_Desc.find().get(0).bounds().centerX(), Y = obj_Desc.find().get(0).bounds().centerY(),
    Deviation = random(-5, 5), X1 = X - Deviation, Y1 = Y - Deviation, device.sdkInt<24?ra.tap(X1,Y1):click(X1,Y1);
}

//========================================================================================================================


//结束当前任务
function stopCurrentTask(){
    saveImg()

    sleep(3000)
//    //将task的截图上报
//    var res = http.postMultipart(url, {
//        taskId: "xxxxxxxxxxx",
//        file: open("/sdcard/Download/" + taskLogImgName)
//    });
//    log(res.body.string());

    console.hide()

}


//通过Button的Text
function find_btn_Text_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US){

    //是否找到该TextView，找到：true / 未找到：false
    var findText_result = false
    var loopCount  = 0

     while (true) {
         taskLog(findText_ZH_CN + " - 循环寻找执行：" + (++loopCount));
         // 检查计数器是否达到3
         if (loopCount >= 3) {
             // 打印一条消息并退出循环
             taskLog("循环已执行3次，即将退出循环。");

             //不能抛出异常，因为可能Facebook记忆功能，自动跳转到输入页面
//                 throw new Error(findText_ZH_CN +"按钮没有找到");
            break;
         }

         // 查找控件
         var button1 = className("android.widget.Button").text(findText_ZH_CN).findOne(1000);
         var button2 = className("android.widget.Button").text(findText_ZH_TW).findOne(1000);
         var button3 = className("android.widget.Button").text(findText_EN_US).findOne(1000);

         if (button1) {
             taskLog("找到" + findText_ZH_CN);
             taskLog("找到button1 = " + button1.clickable() );
            //  clickText(findText_ZH_CN)
            //  click(button1.bounds().centerX(), button1.bounds().centerY())

             var X1 = button1.bounds().centerX();
             var Y1 = button1.bounds().centerY();
             
             // 验证 X 和 Y 是否为正数
             if (X1 >= 0 && Y1 >= 0) {
                click(X1, Y1)
                findText_result = true
             }else{
                taskLog("坐标无效，中心点X或Y为负值: X=" + X1 + ", Y=" + Y1);
             }
             break; // 跳出循环
         }else if(button2){
             taskLog("找到" + findText_ZH_TW);
             taskLog("找到button2 = " + button2.clickable() );

            //  clickText(findText_ZH_TW)
            var X2 = button2.bounds().centerX();
            var Y2 = button2.bounds().centerY();
            
            // 验证 X 和 Y 是否为正数
            if (X2 >= 0 && Y2 >= 0) {
               click(X2, Y2)
               findText_result = true
            }else{
               taskLog("坐标无效，中心点X或Y为负值: X=" + X2 + ", Y=" + Y2);
            }
             break; // 跳出循环
         }else if(button3){
             taskLog("找到" + findText_EN_US);
            //  clickText(findText_EN_US)
            var X3 = button3.bounds().centerX();
            var Y3 = button3.bounds().centerY();
            taskLog("找到button3 X= " + X3);
            taskLog("找到button3 Y= " + Y3);

            // 验证 X 和 Y 是否为正数
            if (X3 >= 0 && Y3 >= 0) {
               click(X3, Y3)
               findText_result = true
            }else{
               taskLog("坐标无效，中心点X或Y为负值: X=" + X3 + ", Y=" + Y3);
            }
             break; // 跳出循环
         }
         sleep(4000)

     }

     return findText_result
}



//通过Button的Desc
function find_btn_desc_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US){

        var loopCount  = 0

         while (true) {
             taskLog(findText_ZH_CN + " - 循环寻找执行：" + (++loopCount));
             // 检查计数器是否达到3
             if (loopCount >= 3) {
                 // 打印一条消息并退出循环
                 taskLog("循环已执行3次，即将退出循环。");

                 //不能抛出异常，因为可能Facebook记忆功能，自动跳转到输入页面
//                 throw new Error(findText_ZH_CN +"按钮没有找到");
                break;
             }


             // 查找控件
            //  var button1 = className("android.widget.Button").desc(findText_ZH_CN).findOne(1000);
            //  var button2 = className("android.widget.Button").desc(findText_ZH_TW).findOne(1000);
            //  var button3 = className("android.widget.Button").desc(findText_EN_US).findOne(1000);
            var button1 = desc(findText_ZH_CN).findOne(1000);
            var button2 = desc(findText_ZH_TW).findOne(1000);
            var button3 = desc(findText_EN_US).findOne(1000);


             if (button1) {
                 taskLog("找到" + findText_ZH_CN);
                 taskLog("找到button1 = " + button1.clickable() );
                 if(button1.clickable()) {
                    button1.click()
                    break; // 跳出循环
                 }else{
                    taskLog("找到button1 ，但是button1不可点击,所以根据坐标点击 " );

                    var X1 = button1.bounds().centerX();
                    var Y1 = button1.bounds().centerY();
                    // 验证 X 和 Y 是否为正数
                    if (X1 < 0 || Y1 < 0) {
                        taskLog("坐标无效，中心点X或Y为负值: X=" + X + ", Y=" + Y);
                        return
                    }
                    // 生成随机偏差
                    var _X1 = X1 - random(-2, 2);
                    var _Y1 = Y1 - random(-2, 2);
                    click(Math.max(0, _X1) , Math.max(0, _Y1))// 防止偏差导致负值

                    break; // 跳出循环


                 }
             }else if(button2){
                 taskLog("找到" + findText_ZH_TW);
                 taskLog("找到button2 = " + button2.clickable() );
                 if(button2.clickable()) {
                    button2.click()
                 }else{
                    taskLog("找到button2 ，但是button2不可点击,所以根据坐标点击 " );

                    var X2 = button2.bounds().centerX();
                    var Y2 = button2.bounds().centerY();
                    // 验证 X 和 Y 是否为正数
                    if (X2 < 0 || Y2 < 0) {
                        taskLog("坐标无效，中心点X或Y为负值: X=" + X2 + ", Y=" + Y2);
                        return
                    }
                    // 生成随机偏差
                    var _X2 = X2 - random(-2, 2);
                    var _Y2 = Y2 - random(-2, 2);
                    click(Math.max(0, _X2) , Math.max(0, _Y2))// 防止偏差导致负值

                    break; // 跳出循环
                 }
                 break; // 跳出循环
             }else if(button3){
                 taskLog("找到" + findText_EN_US);
                 taskLog("找到button3 = " + button3.clickable() );
                 if(button3.clickable()) {
                    button3.click()
                 }else{
                    taskLog("找到button3 ，但是button3不可点击,所以根据坐标点击 " );

                    var X3 = button3.bounds().centerX();
                    var Y3 = button3.bounds().centerY();
                    // 验证 X 和 Y 是否为正数
                    if (X3 < 0 || Y3 < 0) {
                        taskLog("坐标无效，中心点X或Y为负值: X=" + X3 + ", Y=" + Y3);
                        return
                    }
                    // 生成随机偏差
                    var _X3 = X3 - random(-2, 2);
                    var _Y3 = Y3 - random(-2, 2);
                    click(Math.max(0, _X3) , Math.max(0, _Y3))// 防止偏差导致负值

                 }
                 break; // 跳出循环
             }

             sleep(1000)

         }
}




//通过TextView的text
function find_textview_text_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US){

    //是否找到该TextView，找到：true / 未找到：false
    var findText_result = false


    var loopCount  = 0

     while (true) {
         taskLog(findText_ZH_CN + " - 循环寻找执行：" + (++loopCount));
         // 检查计数器是否达到3
         if (loopCount >= 3) {
             // 打印一条消息并退出循环
             taskLog("循环已执行3次，即将退出循环。");

             //不能抛出异常，因为可能Facebook记忆功能，自动跳转到输入页面
//                 throw new Error(findText_ZH_CN +"按钮没有找到");
            break;
         }

         // 查找控件
        var button1 = className("android.widget.TextView").text(findText_ZH_CN).findOne(1000);
        var button2 = className("android.widget.TextView").text(findText_ZH_TW).findOne(1000);
        var button3 = className("android.widget.TextView").text(findText_EN_US).findOne(1000);

        if (button1) {
            taskLog("找到" + findText_ZH_CN);
            taskLog("找到button1 = " + button1.clickable() );
            if(button1.clickable()) {
               button1.click()
               break; // 跳出循环
            }else{
               taskLog("找到button1 ，但是button1不可点击,所以根据坐标点击 " );

               var X1 = button1.bounds().centerX();
               var Y1 = button1.bounds().centerY();
               // 验证 X 和 Y 是否为正数
               if (X1 < 0 || Y1 < 0) {
                   taskLog("坐标无效，中心点X或Y为负值: X=" + X + ", Y=" + Y);
                   return
               }
               // 生成随机偏差
               var _X1 = X1 - random(-2, 2);
               var _Y1 = Y1 - random(-2, 2);
               click(Math.max(0, _X1) , Math.max(0, _Y1))// 防止偏差导致负值

               break; // 跳出循环


            }
        }else if(button2){
            taskLog("找到" + findText_ZH_TW);
            taskLog("找到button2 = " + button2.clickable() );
            if(button2.clickable()) {
               button2.click()
            }else{
               taskLog("找到button2 ，但是button2不可点击,所以根据坐标点击 " );

               var X2 = button2.bounds().centerX();
               var Y2 = button2.bounds().centerY();
               // 验证 X 和 Y 是否为正数
               if (X2 < 0 || Y2 < 0) {
                   taskLog("坐标无效，中心点X或Y为负值: X=" + X2 + ", Y=" + Y2);
                   return
               }
               // 生成随机偏差
               var _X2 = X2 - random(-2, 2);
               var _Y2 = Y2 - random(-2, 2);
               click(Math.max(0, _X2) , Math.max(0, _Y2))// 防止偏差导致负值

               break; // 跳出循环
            }
            break; // 跳出循环
        }else if(button3){
            taskLog("找到" + findText_EN_US);
            taskLog("找到button3 = " + button3.clickable() );
            if(button3.clickable()) {
               button3.click()
            }else{
               taskLog("找到button3 ，但是button3不可点击,所以根据坐标点击 " );

               var X3 = button3.bounds().centerX();
               var Y3 = button3.bounds().centerY();
               // 验证 X 和 Y 是否为正数
               if (X3 < 0 || Y3 < 0) {
                   taskLog("坐标无效，中心点X或Y为负值: X=" + X3 + ", Y=" + Y3);
                   return
               }
               // 生成随机偏差
               var _X3 = X3 - random(-2, 2);
               var _Y3 = Y3 - random(-2, 2);
               click(Math.max(0, _X3) , Math.max(0, _Y3))// 防止偏差导致负值

            }
            break; // 跳出循环
        }
         sleep(1000)

     }
     return findText_result
}


try {

    // close_friend_suggest()
    //Tab：点击 FrameLayout("Profile")
    find_btn_desc_base("個人資料","Profile","主页")
    sleep(3000)


    refreshMedia("/storage/emulated/0/Download/")
    var imageTempPath = transferHeadImageToNest(TT_PROFILE_HEAD_IMAGE)

    //点击：text("Edit profile")
    find_textview_text_base("编辑主页","編輯個人資料","Edit profile")


    
    //可能右侧没有“编辑主页”，只有一个Button
    //LinearLayout("Edit profile") :fullId("com.ss.android.ugc.trill:id/n9q")
    //fullId("com.zhiliaoapp.musically:id/n9p")
    if(targetPackageName == GLOBAL_TikTokPackageName){
        clickId(GLOBAL_TikTokPackageName +":id/n9p")
    }else{
        // fullId("com.ss.android.ugc.trill:id/dmw")
        // clickId(ASIA_TikTokPackageName +":id/dmw") //亚洲版，繁体中文，可能会出现“編輯個人資料”的LinearLayout
        // sleep(3000)
        clickId(ASIA_TikTokPackageName +":id/n9q")
    }



    
    // //点击头像
    // click_update_profile_head_image()

    // click_update_profile_head_image_from_photos()



    // //选中图片 
    // selectImageWithRetry(imageTempPath) 
    // sleep(3000)



    //点击：text("Name")
    sleep(5000) 
    //fullId("com.zhiliaoapp.musically:id/iuz")
    //fullId("com.ss.android.ugc.trill:id/iv0")
    if(targetPackageName == GLOBAL_TikTokPackageName){
        clickId(GLOBAL_TikTokPackageName +":id/iuz")
    }else{
        clickId(ASIA_TikTokPackageName +":id/iv0")
    }   

    sleep(5000) //延迟5S，否则可能找不到EditText
    //点击：EditText，输入Name

    var search_name_edits = className("android.widget.EditText").find();
    if(search_name_edits.size() > 0) {
        var search_name_edit = search_name_edits.get(0);
        if(search_name_edit) {
            taskLog("找到TextView控件-Text："+ search_name_edit.text());
            sleep(1000)
            search_name_edit.setText(TT_PROFILE_NAME)
            sleep(3000)

           //点击储存
           //fullId("com.zhiliaoapp.musically:id/l07")
           //fullId("com.ss.android.ugc.trill:id/l08")
           if(targetPackageName == GLOBAL_TikTokPackageName){
                clickId(GLOBAL_TikTokPackageName +":id/l07")
           }else{
                clickId(ASIA_TikTokPackageName +":id/l07")
           }

            // var nameSave = find_btn_desc_base("儲存","Save","保存")
            // if(nameSave) {
            sleep(5000)
            var confirm = find_btn_Text_base("確認","確認","Confirm")
            if(confirm) {
                back()
                sleep(5000)
            }else{
                back()
                sleep(5000)
            }
            // }else{
            //     back()
            //     sleep(5000)
            // }
        
        }
        
    }else{
        back()
        sleep(5000)
    }

    
    sleep(5000000)


    //点击：text("Username")
    find_textview_text_base("用户名","使用者名稱","Username")
    taskLog("准备输入Username：" + TT_PROFILE_USERNAME)
    //点击：EditText，输入Username
    sleep(5000) //延迟5S，否则可能找不到EditText
    var search_Username_edits = className("android.widget.EditText").find();
    if(search_Username_edits.size() > 0) {
        var search_Username_edit = search_Username_edits.get(0);
        if(search_Username_edit) {
            taskLog("找到TextView控件-Text："+ search_Username_edit.text());
            search_Username_edit.click()
            sleep(5000)
            search_Username_edit.setText(TT_PROFILE_USERNAME)

            sleep(5000)
            if(search_Username_edit.text() == TT_PROFILE_USERNAME) {
                var usernameSave = find_btn_Text_base("保存","儲存","Save")
                if(usernameSave) {
                    //text("設定使用者名稱")
                    find_btn_Text_base("設定使用者名稱","Set username","Set username")
                }else{
                    back()
                    sleep(5000)
                }
            }else{
                taskLog("输入的Username与保存的Username不一致，请检查")
                sleep(5000)
                back()
            }

        }
        
    }else{
        back()
        sleep(5000)
    }
    
    

    


    
    //点击：text("Bio")
    // find_btn_Text_base("Bio","個人簡介","Bio")
    //fullId("com.ss.android.ugc.trill:id/b93")
    //fullId("com.zhiliaoapp.musically:id/b93")
    if(targetPackageName == GLOBAL_TikTokPackageName){
        clickId(GLOBAL_TikTokPackageName +":id/b93")
    }else{
        clickId(ASIA_TikTokPackageName +":id/b93")
    }   

    
    //点击：EditText，输入Bio
    sleep(5000) //延迟5S，否则可能找不到EditText
    var search_Bio_edits = className("android.widget.EditText").find();
    if(search_Bio_edits.size() > 0) {
        var search_Bio_edit = search_Bio_edits.get(0);
        if(search_Bio_edit) {
            taskLog("找到TextView控件-Text："+ search_Bio_edit.text());
            sleep(3000)
            search_Bio_edit.setText(TT_PROFILE_BIO)
            sleep(3000)

            if(search_Bio_edit.text() == TT_PROFILE_BIO) {
                var bioSave = find_btn_Text_base("保存","儲存","Save")
                if(bioSave) {
                    find_btn_Text_base("確認","確認","Confirm")
                }else{
                    back()
                    sleep(5000)
                }
            }else{
                taskLog("输入的Bio与保存的Bio不一致，请检查")
                sleep(5000)
                back()
            }
        }
    }else{  
        back()
        sleep(5000)
    }
    
    back()



} catch (e) {
    handleError(e);
}

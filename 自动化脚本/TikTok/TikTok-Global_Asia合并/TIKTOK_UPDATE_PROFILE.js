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
const TT_PROFILE_HEAD_IMAGE = '$${M_個人頭像地址}';
const TT_PROFILE_NAME = '$${名稱}';
const TT_PROFILE_USERNAME = '$${使用者名稱}';
const TT_PROFILE_BIO = '$${個人簡介}';


// 需要关注的总数
var total_target = 0;
// 成功关注的数量
var total_success = 0;
// 错误信息
var fail_msg = "";


var ASIA_TikTokPackageName = 'com.ss.android.ugc.trill';
var GLOBAL_TikTokPackageName = 'com.zhiliaoapp.musically';


const FORCE_STOP_TEXT = {
    ZH_CN: "强行停止",    // 简体中文
    ZH_TW: "強制停止",    // 繁体中文
    EN_US: "FORCE STOP"   // 英文
};

// 定义确认按钮文本
const FORCE_STOP_CONFIRM_TEXT = {
    ZH_CN: "确定",      // 简体中文
    ZH_TW: "確定",      // 繁体中文
    EN_US: "OK"         // 英文
};


//点击：text("Username")
// find_textview_text_base("用户名","使用者名稱","Username")
const USERNAME_TEXT = {
    ZH_CN: "用户名",      // 简体中文
    ZH_TW: "使用者名稱",      // 繁体中文
    EN_US: "Username"         // 英文
};

//点击：text("Edit profile")
// find_textview_text_base("编辑主页","編輯個人資料","Edit profile")
const EDIT_PROFILE_TEXT = {
    ZH_CN: "编辑主页",      // 简体中文
    ZH_TW: "編輯個人資料",      // 繁体中文
    EN_US: "Edit profile"         // 英文
};

// find_btn_Text_base：确认
// find_btn_Text_base("確認","確認","Confirm")
const CONFIRM_TEXT = {
    ZH_CN: "确认",      // 简体中文
    ZH_TW: "確認",      // 繁体中文
    EN_US: "Confirm"         // 英文
};

//var usernameSave = find_btn_Text_base("保存","儲存","Save")
const SAVE_TEXT = {
    ZH_CN: "保存",      // 简体中文
    ZH_TW: "儲存",      // 繁体中文
    EN_US: "Save"         // 英文
};

//find_btn_Text_base("設定使用者名稱","Set username","Set username")
const SET_USERNAME_TEXT = {
    ZH_CN: "设定用户名",      // 简体中文
    ZH_TW: "設定使用者名稱",      // 繁体中文
    EN_US: "Set username"         // 英文
};


//var bioSave = find_btn_Text_base("保存","儲存","Save")
const BIO_SAVE_TEXT = {
    ZH_CN: "保存",      // 简体中文
    ZH_TW: "儲存",      // 繁体中文
    EN_US: "Save"         // 英文
};


//find_btn_Text_base("確認","確認","Confirm")
const BIO_CONFIRM_TEXT = {
    ZH_CN: "确认",      // 简体中文
    ZH_TW: "確認",      // 繁体中文
    EN_US: "Confirm"         // 英文
};


//find_btn_desc_base("個人資料","Profile","主页")
const PROFILE_TEXT = {
    ZH_CN: "个人资料",      // 简体中文
    ZH_TW: "個人資料",      // 繁体中文
    EN_US: "Profile"         // 英文
};




// 通过语言对象查找文本
function findTextByLanguages(languageObject) {
    for (let lang in languageObject) {
        let targetText = languageObject[lang];
        if (text(targetText).exists()) {
            taskLog("找到文本：" + targetText);
            let element = text(targetText).findOne();
            if (element && element.clickable()) {
                element.click();
                return true;
            } else if (element) {
                // 如果元素存在但不可点击，尝试点击其坐标
                let bounds = element.bounds();
                click(bounds.centerX(), bounds.centerY());
                return true;
            }
        }
    }
    taskLog("未找到任何匹配的文本");
    return false;
}

//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log_" + getSystemDate("df").replace(/:/g, "-").replace(" ", "_") + ".txt"
var RPAFilePath = "/sdcard/Download/log/";
// 如果目录存在且有内容就删除
if (files.exists(RPAFilePath)) {
    files.removeDir(RPAFilePath);
}
//日志文件路径
var logFilePath = RPAFilePath + taskLogFileName;
//确保日志目录存在
files.ensureDir(RPAFilePath);


//日志文件路径
var resultPath = RPAFilePath + "nest_result_rpa.txt";
//确保日志目录存在
files.ensureDir(resultPath);




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
        taskLogError("-----------------脚本执行出现异常---------------");
        taskLogError("Tiktok根據關鍵字，搜尋影片瀏覽養號，評論，點讚---------------");
        taskLogError("脚本执行时间：" + new Date().toLocaleString());
    }else{
        forceStop_APP(targetPackageName)
        taskLog("-----------------脚本功能执行结束：---------------");
        taskLog("Tiktok根據關鍵字，搜尋影片瀏覽養號，評論，點讚---------------");
        taskLog("脚本执行时间：" + new Date().toLocaleString());
    }
    openLogActivity();
});

function handleError(e) {
    handleErrorFlag = true
    forceStop_APP(targetPackageName)
    taskLogError("===错误报告开始===");
    fail_msg += "错误信息：" + e + "\n"; 
    taskLogError("错误信息：" + e);
    fail_msg += "错误堆栈：" + e.stack + "\n";
    taskLogError("错误堆栈：" + e.stack);
    fail_msg += "===错误报告结束===" + "\n";
    taskLogError("===错误报告结束===");
    fail_msg += "===错误报告结束===" + "\n";
    taskLog("脚本执行Error时间：" + new Date().toLocaleString());
}

function throw_error_storage_not_enough(){
    throw new Error("当前设备的存储空间不可用，请关机重启一次设备，然后重新执行一次脚本")
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
    taskLog("检测到TikTok没有安装，脚本终止。");
    throw new Error("未检测到TikTok安装，请先安装TikTok！");
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


// 替代 app.openAppSetting 的方式
function openAppSettings(packageName) {
    var intent = new Intent();
    intent.setAction(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
    intent.setData(android.net.Uri.parse("package:" + packageName));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    app.startActivity(intent);
}


//强制停止TikTok 
function forceStop_APP(packageName){
    taskLog("准备强杀:" + packageName + "...")
    sleep(1000);
    openAppSettings(packageName)
    sleep(5000)

    // 遍历所有可能的强制停止按钮文本
    for (let lang in FORCE_STOP_TEXT) {
        let stopText = FORCE_STOP_TEXT[lang];
        if (text(stopText).exists()) {
            let forceStopBtn = text(stopText).findOne();
            if (forceStopBtn && forceStopBtn.clickable()) {
                forceStopBtn.click();
                sleep(1000);
                
                // 遍历所有可能的确认按钮文本
                for (let confirmLang in FORCE_STOP_CONFIRM_TEXT) {
                    let confirmText = FORCE_STOP_CONFIRM_TEXT[confirmLang];
                    if (text(confirmText).exists()) {
                        text(confirmText).findOne().click();
                        taskLog("成功点击'" + stopText + "'按钮并确认");
                        sleep(3000);
                        home();
                        return;
                    }
                }
            } else {
                taskLog("未找到可点击的'" + stopText + "'按钮");
            }
        } else {
            taskLog("未找到'" + stopText + "'按钮");
        }
        sleep(1000);
    }

    // 如果所有语言都尝试失败，返回主页
    home();
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
    toast(_log)
    console.log(getSystemDate("df") +":" +_log)
    console.log(_log)


    try {
        //确保目录存在
        files.ensureDir(RPAFilePath);
        
        //将日志写入文件
        var logContent = getSystemDate("df") + ":" + _log + "\n";
        // var logContent = _log + "\n";
        files.append(logFilePath, logContent);
        
    } catch(e) {
        console.error("写入日志文件失败：" + e);
    }
}


function taskLogError(_log){
    toast(_log);
    
    console.error(getSystemDate("df") +":" +_log)
    // console.error(_log)

    try {
        //确保目录存在
        files.ensureDir(RPAFilePath);
        
        //将日志写入文件
        var logContent = getSystemDate("df") + ":" + "【!!!ERROR!!!】" + _log + "\n";
        // var logContent = "【!!!ERROR!!!】" + _log + "\n";
        files.append(logFilePath, logContent);
        
    } catch(e) {
        console.error("写入日志文件失败：" + e);
    }
}


//开始录屏截图到本地
function Nest_ScreenCapture(){
    // 申请截图权限（会弹系统录屏权限框）
    if (!requestScreenCapture()) {
        taskLog("自动化任务-申请截图权限失败");
    }

    // 申请截图权限（会弹系统录屏权限框）
    if (!requestScreenCapture()) {
        taskLog("自动化任务-申请截图权限失败");
    }

    // 截一张整屏
    var img = captureScreen();           // 返回 Image 对象
    if (!img) {
        taskLog("自动化任务-截图失败");
    }

    // 保存到相册/文件夹
    // var dir = "/sdcard/Pictures";
    // files.ensureDir(dir);
    // var path = dir + "/nestshot_" + Date.now() + ".png";
    var path = RPAFilePath + "/nestshot_" + Date.now() + ".png";
    img.saveTo(path);                    // 保存
    img.recycle();                       // 回收内存
    taskLog("自动化任务已经完成-已保存截图："+ path);


    //刷新媒体库
    sleep(3000)
    toast("开始刷新媒体库....");
    refreshMedia(RPAFilePath)
    return path
}
// 刷新指定路径的媒体库
function refreshMedia(path) {
    taskLog("开始刷新媒体库....");
    // 发送媒体扫描广播
    media.scanFile(path);
    // 等待扫描完成
    sleep(5000);
    taskLog("媒体库刷新完成.");
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




try {

    //Tab：点击 FrameLayout("Profile")
    // find_btn_desc_base("個人資料","Profile","主页")
    findTextByLanguages(PROFILE_TEXT)
    sleep(random(3000, 5000))


    refreshMedia("/storage/emulated/0/Download/")
    var imageTempPath = transferHeadImageToNest(TT_PROFILE_HEAD_IMAGE)

    //点击：text("Edit profile")
    // find_textview_text_base("编辑主页","編輯個人資料","Edit profile")
    findTextByLanguages(EDIT_PROFILE_TEXT)


    
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

            sleep(5000)
            // var confirm = find_btn_Text_base("確認","確認","Confirm")
            var confirm = findTextByLanguages(CONFIRM_TEXT)
            if(confirm) {
                back()
                sleep(5000)
            }else{
                back()
                sleep(5000)
            }
        
        }
        
    }else{
        back()
        sleep(5000)
    }

    
    sleep(random(5000, 8000))


    // //点击：text("Username")
    // find_textview_text_base("用户名","使用者名稱","Username")
    findTextByLanguages(USERNAME_TEXT)
    taskLog("准备输入Username：" + TT_PROFILE_USERNAME)
    //点击：EditText，输入Username
    sleep(random(5000, 8000)) //延迟5S，否则可能找不到EditText    
    var search_Username_edits = className("android.widget.EditText").find();
    if(search_Username_edits.size() > 0) {
        var search_Username_edit = search_Username_edits.get(0);
        if(search_Username_edit) {
            taskLog("找到TextView控件-Text："+ search_Username_edit.text());
            search_Username_edit.click()
            sleep(5000)
            search_Username_edit.setText(TT_PROFILE_USERNAME)

            sleep(5000)
            taskLog("输入的Username：" + search_Username_edit.text())
            taskLog("保存的Username：" + TT_PROFILE_USERNAME)
            taskLog("输入的Username与保存的Username是否一致：" + (search_Username_edit.text() == TT_PROFILE_USERNAME))
            if(search_Username_edit.text() == TT_PROFILE_USERNAME) {
                // var usernameSave = find_btn_Text_base("保存","儲存","Save")
                var usernameSave = findTextByLanguages(SAVE_TEXT)
                if(usernameSave) {
                    //text("設定使用者名稱")
                    // find_btn_Text_base("設定使用者名稱","Set username","Set username")
                    findTextByLanguages(SET_USERNAME_TEXT)
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
    



    sleep(random(5000, 8000))
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
                // var bioSave = find_btn_Text_base("保存","儲存","Save")
                var bioSave = findTextByLanguages(BIO_SAVE_TEXT)
                if(bioSave) {
                    // find_btn_Text_base("確認","確認","Confirm")
                    findTextByLanguages(BIO_CONFIRM_TEXT)
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

    taskLog("更新个人资料完成，准备截图....")
    Nest_ScreenCapture()
    sleep(random(5000, 8000))

    taskLog("点击返回按钮....")
    back()
    sleep(random(3000, 5000))

    
} catch(e) {
    if (e.message === "TASK_COMPLETED") {
        taskLog("任务正常完成");
    } else {
        Nest_ScreenCapture()
        sleep(random(5000, 8000))
        handleError(e);
    }
}finally{
    taskLog("保存统计结果到备用路径..." );
    try {
        var result = {
            total_target: total_target,
            total_success: total_success,
            fail_msg: fail_msg
        };
        // 打印统计结果
        taskLog("统计结果：" + JSON.stringify(result, null, 2));
        // 使用JSON.stringify将对象转换为JSON字符串，第三个参数2是为了美化输出格式
        files.write(resultPath, JSON.stringify(result, null, 2));
        taskLog("已保存统计结果到：" + resultPath);
    } catch(e) {
        console.error("保存统计结果失败：" + e.message);
    }
    // 刷新媒体库
    refreshMedia(RPAFilePath);
    sleep(random(3000, 5000))
}
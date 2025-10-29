// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************指定視屏點愛心.留言.分享給用戶
//(https://uwmqoxl2jb0.feishu.cn/docx/MtXkdbhYWo33Y7xXNjwc2fijnJc)*************************
//******************************************************************




//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"

//名稱.使用者名稱.個人簡介
const TT_VIDEO_URL = '$${指定视频链接/直播間鏈接}';
const TT_VIDEO_SHARE_TEXT = '$${分享文案}';
const TT_VIDEO_SHARE_FRIENDS_NUMBER = '$${分享好友數量}';

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
// console.show()


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
    taskLog("未检测到TikTok已安装，脚本终止。");
    throw new Error("未检测到TikTok未安装，请先安装TikTok！");
}



forceStop_APP(targetPackageName)
sleep(3000)



//******************************************************************
//******************************************************************
//******************************************************************

function openTikTokByUrl(tiktokUrl){
    try {
        taskLog("准备打开链接 = " + tiktokUrl);

        // 1. 从 URL 提取视频 ID
        var match = /\/video\/(\d+)/.exec(tiktokUrl);
        if(!match){
            taskLog("无法识别视频 ID: " + tiktokUrl);
            return false;
        }
        var videoId = match[1];
        taskLog("解析到视频 ID = " + videoId);

        // 2. 拼接 TikTok 深链
        var deepLink = "snssdk1233://aweme/detail/" + videoId;

        // 3. 构造 Intent 打开 TikTok
        var intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
        intent.setData(android.net.Uri.parse(deepLink));
        intent.setPackage(targetPackageName); // TikTok 包名
        intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);

        // 4. 直接启动
        app.startActivity(intent);
        
        return true;
    } catch (e) {
        taskLog("打开链接异常: " + e);
        return false;
    }
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



//从视频列表数组中，顺序挑选一条
function get_all_video_link(){
    // 用于存储用户的数组
    let comments = [];
    // 户是否存在
    const file = new java.io.File(TT_VIDEO_URL);
    if (file.exists() && file.isFile()) {
        try {
            // 读取文件内容
            const reader = new java.io.BufferedReader(new java.io.FileReader(file));
            let line;
            while ((line = reader.readLine()) !== null) {
                comments.push(line);
            }
            reader.close();
        } catch (e) {
            taskLog("读取文件时发生错误：" + e.message);
        }
    } else {
        // 如果文件不存在，将文件名添加到数组中
        comments.push(TT_VIDEO_URL);
    }
    
    return comments
}


//点击点赞按钮
function click_Like_Btn(){
    taskLog("开始准备点赞视频")
    //fullId("com.zhiliaoapp.musically:id/e2n") 
    //fullId("com.ss.android.ugc.trill:id/e2o")
    if(targetPackageName == GLOBAL_TikTokPackageName){  
        clickId(GLOBAL_TikTokPackageName + ":id/e2n")
    }else{
        clickId(ASIA_TikTokPackageName + ":id/e2o")
    }

}

//点击转发按钮
function click_Zhuanfa_Btn(){
    taskLog("开始准备转发视频")
    //fullId("com.zhiliaoapp.musically:id/pkk")
    //fullId("com.ss.android.ugc.trill:id/pkl")
    if(targetPackageName == GLOBAL_TikTokPackageName){  
        clickId(GLOBAL_TikTokPackageName + ":id/pkk")
    }else{
        clickId(ASIA_TikTokPackageName + ":id/pkl")
    }
    sleep(random(3000,5000))

    //点击好友列表
    click_friend_list()


}


//开始点击好友列表
function click_friend_list(){
    var number = parseInt(TT_VIDEO_SHARE_FRIENDS_NUMBER);  // 目标点击数量
    if (isNaN(number) || number <= 0) {
        taskLog("无效的目标点击数量：" + TT_VIDEO_SHARE_FRIENDS_NUMBER);
        return;
    }
    
    //点击查找更多：ImageView
    taskLog("点击最左侧放大镜");
    //fullId("com.zhiliaoapp.musically:id/imt")
    //fullId("com.ss.android.ugc.trill:id/imu")
    if(targetPackageName == GLOBAL_TikTokPackageName){  
        id(GLOBAL_TikTokPackageName + ":id/imt").findOne().click()
    }else{
        id(ASIA_TikTokPackageName + ":id/imu").findOne().click()
    }
    sleep(random(3000,5000));

    //等待好友列表加载
    var friend_list = className("androidx.recyclerview.widget.RecyclerView").findOne(8000);
    if(!friend_list){
        taskLog("没有找到好友列表");
        return;
    }
    
    taskLog("找到好友列表，开始点击好友");
    var clickCount = 0;
    var maxAttempts = 5; // 最大滑动次数
    var attempts = 0;
    
    // 使用Set记录已点击的好友名称，避免重复点击
    var clickedFriends = new Set();
    
    while(clickCount < number && attempts < maxAttempts) {
        // 获取当前页面所有的checkbox
        //fullId("com.zhiliaoapp.musically:id/cg0")
        if(targetPackageName == GLOBAL_TikTokPackageName){  
            var checkboxes = id(GLOBAL_TikTokPackageName + ":id/cg0").find();
        }else{
            var checkboxes = id(ASIA_TikTokPackageName + ":id/cg0").find();
        }

        // 获取当前页面所有的好友名称TextView
        //fullId("com.zhiliaoapp.musically:id/e0x")
        //fullId("com.ss.android.ugc.trill:id/e0y")
        if(targetPackageName == GLOBAL_TikTokPackageName){  
            var friendNames = id(GLOBAL_TikTokPackageName + ":id/e0x").find();
        }else{
            var friendNames = id(ASIA_TikTokPackageName + ":id/e0y").find();
        }
        

        if(!checkboxes || checkboxes.empty() || !friendNames || friendNames.empty()){
            taskLog("列表为空，退出点击");
            break;
        }
        
        var foundNewFriend = false;
        // 遍历所有checkbox和对应的好友名称
        for(var i = 0; i < checkboxes.size() && clickCount < number; i++){
            try {
                var checkbox = checkboxes.get(i);
                var friendName = friendNames.get(i);
                
                if(checkbox && friendName && checkbox.visibleToUser() && friendName.visibleToUser()){
                    var name = friendName.text();
                    
                    // 只点击未点击过的好友
                    if(!clickedFriends.has(name)){
                        // 获取checkbox的坐标信息
                        var bounds = checkbox.bounds();
                        var centerX = bounds.centerX();
                        var centerY = bounds.centerY();
                        
                        // 验证坐标是否有效
                        if (centerX < 0 || centerY < 0) {
                            taskLog("坐标无效，跳过当前好友: " + name);
                            continue;
                        }
                        
                        // 添加随机偏移
                        var offsetX = random(-2, 2);
                        var offsetY = random(-2, 2);
                        var targetX = Math.max(0, centerX + offsetX);
                        var targetY = Math.max(0, centerY + offsetY);
                        
                        // 执行点击
                        click(targetX, targetY);
                        clickedFriends.add(name);
                        clickCount++;
                        foundNewFriend = true;
                        taskLog("已点击第" + clickCount + "个好友：" + name);
                        sleep(random(1000,2000)); // 点击间隔
                    }
                }
            } catch(e) {
                taskLog("点击好友时出错: " + e);
            }
        }
        
        // 如果这一页没有找到新的好友可点击，尝试滑动
        if(!foundNewFriend && clickCount < number){
            taskLog("当前页面没有新的好友可点击，尝试滑动加载更多...");
            // 获取列表的边界
            var bounds = friend_list.bounds();
            // 从下往上滑动
            gesture(300, [bounds.centerX(), bounds.bottom - 100], 
                        [bounds.centerX(), bounds.top + 100]);
            sleep(1000); // 等待加载
            attempts++;
            taskLog("完成第" + attempts + "次滑动");
        }
    }
    
    taskLog("共点击了" + clickCount + "个好友");
    if(clickCount < number){
        taskLog("警告：实际点击数量(" + clickCount + ")少于目标数量(" + number + ")");
    }
    taskLog("已点击的好友：" + Array.from(clickedFriends).join(", "));


    sleep(random(3000,5000))
    //点击EditText：
    // clickId(GLOBAL_TikTokPackageName + ":id/e09")
    var autoCompleteTextViews = className("android.widget.EditText").find();
    taskLog("autoCompleteTextViews长度 = " + autoCompleteTextViews.size())
    if(autoCompleteTextViews.size() >0){
        var textView = autoCompleteTextViews.get(autoCompleteTextViews.size() - 1);
        if(textView) {
            taskLog("找到TextView控件-Text："+ textView.text());
            textView.click()
            sleep(1000)
            textView.setText(TT_VIDEO_SHARE_TEXT)
            sleep(5000)
        }
    }


    taskLog("点击好友列表完成，准备截图....")
    Nest_ScreenCapture()
    sleep(random(5000, 8000))

    //点击传送按钮： Button fullId("com.zhiliaoapp.musically:id/tks")
    //fullId("com.ss.android.ugc.trill:id/tkv")
    taskLog("点击传送按钮")
    if(targetPackageName == GLOBAL_TikTokPackageName){  
        clickId(GLOBAL_TikTokPackageName + ":id/tks")
    }else{
        clickId(ASIA_TikTokPackageName + ":id/tkv")
    }


    

}


try {
   
    var all_TT_VIDEO_LINK = get_all_video_link()
    if(all_TT_VIDEO_LINK.includes("$${T")){ 
        throw_error_storage_not_enough()
    }
    if(TT_VIDEO_SHARE_TEXT.includes("$${T")){ 
        throw_error_storage_not_enough()
    }

    total_target = all_TT_VIDEO_LINK.length
    taskLog("需要分享的视频数量 = " + total_target)
    
    
    if(all_TT_VIDEO_LINK.length == 0){
        taskLog("没有需要分享的视频") 
        throw new Error("没有需要分享的视频，请检查视频链接是否正确！");
    }else{
        for(var i = 0; i < all_TT_VIDEO_LINK.length; i++){
            taskLog("当前视频在第" + (i+1) + "个 = " + all_TT_VIDEO_LINK[i])      
            var video_info_link = all_TT_VIDEO_LINK[i]
            sleep(2000)
    
            var open_TikTok_success = openTikTokByUrl(video_info_link)
            if(!open_TikTok_success){
                taskLog("打开TikTok失败，继续下一个视频")
                fail_msg += "打开TikTok-" + video_info_link + "失败，继续下一个视频\n";
                continue
            }
            sleep(random(15000,18000))
            total_success++

            taskLog("打开TikTok-" + video_info_link + "成功...")
            sleep(random(5000,8000))

            //点赞
            click_Like_Btn()
            sleep(random(3000,5000))

            //转发
            click_Zhuanfa_Btn()
            sleep(random(8000,10000))
        }  

    }

    
    
} catch(e) {
    if (e.message === "TASK_COMPLETED") {
        taskLog("任务正常完成");
    } else {
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

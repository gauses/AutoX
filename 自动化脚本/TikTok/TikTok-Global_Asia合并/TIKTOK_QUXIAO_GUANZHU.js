// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************Tiktok取消关注(根据取消关注的数量，去取消关注)*************************
//******************************************************************


// 需要取消关注的总数
var total_target = 0;
// 成功取消关注的数量
var total_success = 0;
// 错误信息
var fail_msg = "";



//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"



//用户需要输入的取消关注的数量
const TT_Cancel_Follow_Count = '$${取消关注的数量}';
const TT_Cancel_Follow_Sleep_Time_Start = '$${每次取消关注后等待的时间-开始}'; //单位：毫秒
const TT_Cancel_Follow_Sleep_Time_End = '$${每次取消关注后等待的时间-结束}';//单位：毫秒


var ASIA_TikTokPackageName = 'com.ss.android.ugc.trill';
var GLOBAL_TikTokPackageName = 'com.zhiliaoapp.musically';

//定义Follow按钮在不同语言下的文本
const FOLLOW_TEXT = {
    ZH_CN: "关注",    // 简体中文
    ZH_TW: "關注",    // 繁体中文
    EN_US: "Follow"   // 英文
};

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


//Tiktok最右侧的Profile的按钮文字
const PROFILE_TEXT = {
    ZH_CN: "主页",    // 简体中文
    ZH_TW: "個人資料",    // 繁体中文
    EN_US: "Profile"   // 英文
};

//定义Following按钮在不同语言下的文本（Profile页面）
const FOLLOWING_TEXT = {
    ZH_CN: "关注",    // 简体中文
    ZH_TW: "關注中",    // 繁体中文
    EN_US: "Following"   // 英文
};

//定义Following列表的TextView在不同语言下的文本
const FOLLOWING_LIST_TEXT = {
    ZH_CN: "已关注",    // 简体中文
    ZH_TW: "關注中",    // 繁体中文
    EN_US: "Following"   // 英文
};


//定义Following列表的TextView在不同语言下的文本
const FRIENDS_LIST_TEXT = {
    ZH_CN: "好友",    // 简体中文
    ZH_TW: "好友",    // 繁体中文
    EN_US: "Friends"   // 英文
};


//定义Following按钮一共有多少个用户
const FOLLOWING_USER_COUNT_TEXT = {
    ZH_CN: "关注 0",    // 简体中文
    ZH_TW: "關注中 0",    // 繁体中文
    EN_US: "Following 0"   // 英文
};

// 通过语言对象查找文本
function findTextByLanguages(languageObject, needClick) {
    // 如果needClick参数未定义，则默认为true
    needClick = typeof needClick === 'undefined' ? true : needClick;
    for (let lang in languageObject) {
        let targetText = languageObject[lang];
        if (text(targetText).exists()) {
            taskLog("找到文本：" + targetText);
            let element = text(targetText).findOne();
            if (!needClick) {
                // 如果不需要点击，直接返回元素
                return element;
            }
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
        taskLogError("Tiktok私信：根據私訊列表UID的順序，去私訊​​用戶---------------");
        taskLogError("脚本执行时间：" + new Date().toLocaleString());
    }else{
        taskLog("-----------------脚本功能执行结束：---------------");
        taskLog("Tiktok私信：根據私訊列表UID的順序，去私訊​​用戶---------------");
        taskLog("脚本执行时间：" + new Date().toLocaleString());
    }
    openLogActivity();
});



//打开Autojs的Log activity
function openLogActivity() {
    var intent = {
        action: "android.intent.action.MAIN",
        packageName: "org.autojs.autoxjs",
        className: "org.autojs.autojs.ui.log.LogActivityKt"
    };
    app.startActivity(intent);
}
function throw_error_storage_not_enough(){
    throw new Error("当前设备的存储空间不可用，请关机重启一次设备，然后重新执行一次脚本")
}

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




//显示控制窗：https://github.com/kkevsekk1/AutoX/issues/868
//  console.show()


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
    throw new Error("未检测到TikTok安装，脚本终止。");
}

forceStop_APP(targetPackageName)
sleep(3000)

app.startActivity({
    action: "android.intent.action.VIEW",
    packageName: targetPackageName,
    className: targetClassName
});


sleep(random(3000, 5000))

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





//屏幕上滑
function swipe_to_up(){
    taskLog("准备执行屏幕上滑操作...");
    // 获取设备屏幕的宽高
    var width = device.width;
    var height = device.height;
    taskLog("当前设备屏幕尺寸：" + width + "x" + height);

    // 生成随机起始点
    var startX = random(width / 3 , width * 2 / 3);
    var startY = random(height * 2 / 3, height * 3 / 4);
    taskLog("计算滑动起始点 - X范围：" + (width/3).toFixed(0) + "~" + (width*2/3).toFixed(0));
    taskLog("计算滑动起始点 - Y范围：" + (height*2/3).toFixed(0) + "~" + (height*3/4).toFixed(0));

    // 生成随机结束点
    var endX = random(width / 3 , width * 2 / 3);
    var endY = random(height * 1 / 3, height * 1 / 4);
    taskLog("计算滑动终点 - X范围：" + (width/3).toFixed(0) + "~" + (width*2/3).toFixed(0));
    taskLog("计算滑动终点 - Y范围：" + (height/3).toFixed(0) + "~" + (height/4).toFixed(0));

    // 计算滑动距离和方向
    var distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    var direction = Math.atan2(endY - startY, endX - startX) * 180 / Math.PI;
    taskLog("滑动详情 - 距离：" + distance.toFixed(0) + "像素, 角度：" + direction.toFixed(1) + "度");

    // 屏幕上滑操作
    taskLog("开始执行滑动 - 起点：(" + startX + ", " + startY + ")");
    taskLog("开始执行滑动 - 终点：(" + endX + ", " + endY + ")");
    swipe(startX, startY, endX, endY, 500);
    taskLog("滑动操作执行完成");

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

//点击屏幕左上方
function click_left_top_screen(){
    // 获取屏幕宽度和高度
    var width = device.width;
    var height = device.height;

    // 定义左上角区域的边界
    var left = 200;
    var top = 200;
    var right = width / 2; // 左上区域的右边界
    var bottom = height / 2; // 左上区域的下边界

    // 生成随机坐标
    var randomX = Math.random() * (right - left) + left; // 随机 x 坐标
    var randomY = Math.random() * (bottom - top) + top; // 随机 y 坐标

    // 点击随机坐标
    click(randomX, randomY);


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


//点击个人主页
function click_Author_Page_Btn(){
    taskLog("开始准备查看个人主页")
    clickId("qza")
    sleep(random(5000,8000))

    // 获取屏幕宽高
    var width = device.width;
    var height = device.height;
    
     // 生成随机起始点
     var startX = random(width / 3 , width * 2 / 3);
     var startY = random(height * 2 / 3, height * 3 / 4);

     // 生成随机结束点
     var endX = random(width / 3 , width * 2 / 3);
     var endY = random(height * 1 / 3, height * 1 / 4);

    // 随机选择滑动方向：上滑或下滑
    for (var i = 0; i < 2; i++) {
        var direction = random(0, 1) === 0 ? 'up' : 'down';

        if (direction === 'up') {
            // 从下往上滑动
            swipe(startX, startY, endX, endY, 500);
        } else {
            // 从上往下滑动
            swipe(startX, startY, endX, endY, 500);
        }
        
        // 暂停一段时间，避免滑动过快
        sleep(random(3000,5000));
    }

    taskLog("从视频作者主页返回")
    sleep(random(3000,5000));
    back();
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

    sleep(3000)
//    //将task的截图上报
//    var res = http.postMultipart(url, {
//        taskId: "xxxxxxxxxxx",
//        file: open("/sdcard/Download/" + taskLogImgName)
//    });
//    log(res.body.string());

    console.hide()

}









//通过TextView的text
function find_textview_text_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US){

    //是否找到该TextView，找到：true / 未找到：false
    var findText_result = false


    var loopCount  = 0

     while (true) {
         taskLog(findText_ZH_CN + " - 循环寻找执行：" + (++loopCount));
         // 检查计数器是否达到3
         if (loopCount >= 6) {
             // 打印一条消息并退出循环
             taskLog("循环已执行6次，即将退出循环。");

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

            var X1 = button1.bounds().centerX();
            var Y1 = button1.bounds().centerY();
            
            // 验证 X 和 Y 是否为正数
            if (X1 >= 0 && Y1 >= 0) {
               click(X1, Y1)
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
           }else{
              taskLog("坐标无效，中心点X或Y为负值: X=" + X3 + ", Y=" + Y3);
           }
            break; // 跳出循环
        }

         sleep(1000)

     }
     return findText_result
}



try{
    
    taskLog("打开TikTok成功，首页会停留10-15秒...")
    sleep(random(10000, 15000))

    taskLog("开始点击首页最右侧Profile按钮")
    var profile_btn = findTextByLanguages(PROFILE_TEXT)
    if(profile_btn){
        sleep(random(2000, 4000))

        //开始寻找用户所有的关注用户列表的TextView
        // 循环等待直到找到FOLLOWING_TEXT按钮
        var maxWaitAttempts = 10; // 最大等待尝试次数
        var waitAttempt = 0;
        var Follow_text_button = null;
        
        while (waitAttempt < maxWaitAttempts) {
            Follow_text_button = findTextByLanguages(FOLLOWING_TEXT);
            if (Follow_text_button) {
                taskLog("找到Following按钮，继续执行");
                break;
            } else {
                waitAttempt++;
                taskLog("第" + waitAttempt + "次尝试：未找到Following按钮，等待后重试...");
                sleep(random(3000, 5000)); // 每次等待3-5秒
            }
        }
        
        if (Follow_text_button) {

            //先检查当前用户有多少个关注用户,通过检查text("Following 0")，如果存在，则说明没有关注用户，直接返回
            //text("Following 0")
            var Following_text_button = findTextByLanguages(FOLLOWING_USER_COUNT_TEXT)
            if(Following_text_button){
                taskLog("当前用户没有关注用户，直接返回")
                sleep(random(3000, 5000))
                var screenshotPath = Nest_ScreenCapture();
                taskLog("已保存完成后的截图：" + screenshotPath);
                // 抛出一个特殊的错误来结束脚本
                throw new Error("当前用户没有关注任何用户，任务完成");
            }




            taskLog("需要取消关注的用户, 一共有： " + TT_Cancel_Follow_Count + "个");
            total_target = TT_Cancel_Follow_Count;
            taskLog("每次取消关注后等待的时间: " + TT_Cancel_Follow_Sleep_Time_Start + "毫秒 - " + TT_Cancel_Follow_Sleep_Time_End + "毫秒");
            if (TT_Cancel_Follow_Count.length > 0) {
                var successCount = 0; // 成功取消关注的计数
                for (var i = 0; i < TT_Cancel_Follow_Count; i++) {
                    taskLog("开始取消关注用户: " + i)
                    // if(TT_Cancel_Follow_Sleep_Time_Start.length > 0 && TT_Cancel_Follow_Sleep_Time_End.length > 0){
                    //     sleep(random(TT_Cancel_Follow_Sleep_Time_Start, TT_Cancel_Follow_Sleep_Time_End))
                    // }else{
                        sleep(random(3000, 5000))
                    // }

                    // 尝试查找并点击Following按钮，如果找不到则滑动屏幕
                    var maxScrollAttempts = 10; // 最大滑动尝试次数
                    var scrollAttempt = 0;
                    var foundButton = false;
                    
                    while (!foundButton && scrollAttempt < maxScrollAttempts) {
                        // 循环等待直到找到FOLLOWING_LIST_TEXT或超时
                        var maxWaitAttempts = 3; // 最大等待尝试次数
                        var waitAttempt = 0;
                        var Follow_text_button = null;
                        
                        while (waitAttempt < maxWaitAttempts) {
                            taskLog("开始第" + (waitAttempt + 1) + "次尝试查找Following/Friends列表按钮");
                            
                            // // 先检查是否是Friends列表（不点击，只检查）
                            // var Friends_text_button = findTextByLanguages(FRIENDS_LIST_TEXT, false);
                            // if (Friends_text_button) {
                            //     taskLog("发现这是好友列表(Friends)，位置信息：" + JSON.stringify(Friends_text_button.bounds()));
                            //     taskLog("跳过当前用户，继续处理下一个");
                            //     foundButton = true; // 设置为true以跳出当前循环
                            //     waitAttempt = maxWaitAttempts; // 强制退出等待循环
                            //     break; // 退出当前循环
                            // }
                            
                            // 如果不是Friends列表，则查找Following列表（先只查找不点击）
                            Follow_text_button = findTextByLanguages(FOLLOWING_LIST_TEXT, false);
                            if (Follow_text_button) {
                                taskLog("找到用户个人中心的Follow列表的TextView，位置信息：" + JSON.stringify(Follow_text_button.bounds()));
                                taskLog("按钮状态：可点击=" + Follow_text_button.clickable() + ", 可见=" + Follow_text_button.visibleToUser());
                                foundButton = true;
                                // 执行点击操作
                                if (Follow_text_button.clickable()) {
                                    Follow_text_button.click();
                                } else {
                                    // 如果元素存在但不可点击，尝试点击其坐标
                                    let bounds = Follow_text_button.bounds();
                                    click(bounds.centerX(), bounds.centerY());
                                }
                                // 检查点击是否成功
                                if (true) { // 这里可以添加点击成功的验证逻辑   
                                    taskLog("成功点击取消关注按钮");
                                    total_success++; // 只有在成功点击后才增加计数
                                    successCount++; // 只有在成功点击后才增加计数
                                    taskLog("当前进度：" + successCount + "/" + TT_Cancel_Follow_Count + " (" + (successCount/TT_Cancel_Follow_Count*100).toFixed(1) + "%)");
                                    
                                    // 检查是否达到目标数量
                                    if (successCount >= TT_Cancel_Follow_Count) {
                                        taskLog("已达到目标取消关注数量！");
                                        foundButton = true;
                                        scrollAttempt = maxScrollAttempts; // 强制退出外层循环
                                        break; // 退出当前循环
                                    }
                                } else {
                                    taskLog("点击取消关注按钮失败");
                                    foundButton = false; // 如果点击失败，继续寻找下一个按钮
                                }
                                break;
                            } else {
                                waitAttempt++;
                                taskLog("第" + waitAttempt + "次尝试：未找到Following列表，等待后重试...");
                                sleep(random(3000, 5000)); // 每次等待3-5秒
                            }
                        }
                        
                        // 如果等待超时仍未找到按钮
                        if (!foundButton) {
                            if (waitAttempt >= maxWaitAttempts) {
                                taskLog("等待超时，尝试返回上一页并重新进入");
                                back();
                                sleep(random(2000, 3000));
                                
                                // 重新点击Following按钮
                                var retryAttempts = 5; // 重试次数限制
                                var retryCount = 0;
                                var followingButton = null;
                                
                                while (retryCount < retryAttempts) {
                                    taskLog("开始第" + (retryCount + 1) + "/" + retryAttempts + "次重试查找Following按钮");
                                    followingButton = findTextByLanguages(FOLLOWING_TEXT);
                                    if (followingButton) {
                                        taskLog("按钮状态：可点击=" + followingButton.clickable() + ", 可见=" + followingButton.visibleToUser());
                                        sleep(random(2000, 3000));
                                        taskLog("准备点击Following按钮...");
                                        break;
                                    } else {
                                        retryCount++;
                                        taskLog("第" + retryCount + "次重试失败，重试进度：" + (retryCount/retryAttempts*100).toFixed(1) + "%");
                                        taskLog("等待" + (random(2000, 3000)/1000).toFixed(1) + "秒后进行下一次重试");
                                        sleep(random(2000, 3000));
                                    }
                                }
                                
                                if (!followingButton) {
                                    taskLog("多次重试后仍未找到Following按钮，退出循环");
                                    break;
                                }
                                
                                // 重置滑动计数，给予新的尝试机会
                                scrollAttempt = 0;
                                continue;
                            }
                            
                            taskLog("开始第" + (scrollAttempt + 1) + "/" + maxScrollAttempts + "次滑动尝试");
                            taskLog("当前滑动进度：已完成" + (scrollAttempt/maxScrollAttempts*100).toFixed(1) + "%的屏幕滑动");
                            swipe_to_up();
                            taskLog("完成一次滑动操作，等待动画完成...");
                            sleep(random(3000, 5000)); // 等待滑动动画完成
                            scrollAttempt++;
                            taskLog("本轮滑动完成，即将开始下一轮搜索");
                        }
                    }
                    
                    if (!foundButton) {
                        taskLog("多次滑动后仍未找到更多Following按钮，可能已经到达列表底部");
                        break; // 退出主循环
                    } 
                    
                    // else if (Friends_text_button) {
                    //     taskLog("当前是Friends列表，继续处理下一个用户");
                    //     continue; // 继续下一次循环
                    // }
                }

                // 完成所有取消关注操作后进行截图
                taskLog("完成取消关注操作，成功取消关注 " + successCount + " 个用户");
                var screenshotPath = Nest_ScreenCapture();
                taskLog("已保存完成后的截图：" + screenshotPath);

            }else{
                Nest_ScreenCapture()
                sleep(random(3000, 5000))
                taskLog("设置的取消关注的用户数量为0，不进行取消关注")
                throw new Error("设置的取消关注的用户数量为0，不进行取消关注，检查一下参数配置")
            }



        }else{
            Nest_ScreenCapture()
            sleep(random(3000, 5000))
            taskLog("没有找到用户个人中心的Follow列表的TextView")
            throw new Error("没有找到用户个人中心的Follow列表的TextView")
        }


        
    }else{
        Nest_ScreenCapture()
        sleep(random(3000, 5000))
        taskLog("没有找到首页最右侧Profile按钮")
        throw new Error("没有找到首页最右侧Profile按钮")
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
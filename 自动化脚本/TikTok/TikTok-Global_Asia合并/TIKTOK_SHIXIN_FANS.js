// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************Tiktok私信：只私信自己的粉丝  *************************
//******************************************************************


//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


//用户需要输入的关注用户ID列表
const TT_Like_User_FANS_ID_COUNT = '$${私信用户粉丝数量}';
const TT_Message_GROUP = '$${T_私信用户文案列表}';



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


//定义Following列表的TextView在不同语言下的文本
const FOLLOWING_LIST_TEXT = {
    ZH_CN: "已关注",    // 简体中文
    ZH_TW: "關注中",    // 繁体中文
    EN_US: "Following"   // 英文
};


//定义粉丝按钮在不同语言下的文本（Profile页面）
const PROFILE_FANS_TEXT = {
    ZH_CN: "粉丝",    // 简体中文
    ZH_TW: "粉絲",    // 繁体中文 text("粉絲")
    EN_US: "Followers"   // 英文text("Followers")
};

//定义粉丝按钮一共有多少个用户
const PROFILE_FANS_COUNT_TEXT = {
    ZH_CN: "粉丝 0",    // 简体中文
    ZH_TW: "粉絲 0",    // 繁体中文
    EN_US: "Followers 0"   // 英文
};

//定义粉丝页面需要私信的按钮
const FANS_SIXIN_MESSAGE_TEXT = {
    ZH_CN: "消息",    // 简体中文
    ZH_TW: "訊息",    // 繁体中文
    EN_US: "Message"   // 英文
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

// 替代 app.openAppSetting 的方式
function openAppSettings(packageName) {
    var intent = new Intent();
    intent.setAction(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
    intent.setData(android.net.Uri.parse("package:" + packageName));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    app.startActivity(intent);
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
    taskLog("自动化任务-已保存："+ path);


    //刷新媒体库
    sleep(3000)
    toast("开始刷新媒体库，用时5秒钟....");
    refreshMedia(RPAFilePath)
    return path
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





//1.autox.js侧边栏的打开USB调试先打开
//2.vscode ctrl+shift+p 输入start all server 确定
//3.远程连接成功

//个人发文

//会在在无障碍服务启动后继续运行。
auto.waitFor();

//显示控制窗：https://github.com/kkevsekk1/AutoX/issues/868
// console.show()

//出现异常错误时，打印的日志错误信息
var handleErrorFlag = false //默认没有错误，如果出现异常，那么该值是true

// 注册退出事件监听器
 events.on('exit', function(){
    console.hide()
    sleep(1000)

    if(handleErrorFlag){
        console.error("-----------------脚本执行出现异常---------------");
        console.error("Tiktok私信：根據私訊列表UID的順序，去私訊​​用戶---------------");
        console.error("脚本执行时间：" + new Date().toLocaleString());
    }else{
        console.log("-----------------脚本功能执行结束：---------------");
        console.log("Tiktok私信：根據私訊列表UID的順序，去私訊​​用戶---------------");
        console.log("脚本执行时间：" + new Date().toLocaleString());
    }
    openLogActivity();
});

function handleError(e) {
    handleErrorFlag = true
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

function throw_error_storage_not_enough(){
    throw new Error("当前设备的存储空间不可用，请关机重启一次设备，然后重新执行一次脚本")
}

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


sleep(random(3000, 5000))



//推荐好友的弹窗，直接关闭
function close_friend_suggest(){
    if(id("c67").exists()){
        sleep(3000)
        id("c67").click()
    }
}



function getSystemDate(a) {
    var b = new SimpleDateFormat("HH:mm:ss"), c = new SimpleDateFormat("yyyy-MM-dd hh:mm:ss");
    return "tf" == a ? b.format(new java.util.Date()) :"df" == a ? c.format(new java.util.Date()) :void 0;
}

//打印日志
function taskLog(_log){
    toast(_log)
    console.log(getSystemDate("df") +":" +_log)
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


    //通过Button的Text
    function find_btn_Text_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US){


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
                    
                    sleep(1000);  // 点击前等待
                    click(button1.bounds().centerX(), button1.bounds().centerY())
                    sleep(1000);  // 点击后等待
                    break; // 跳出循环
                }else if(button2){
                    taskLog("找到" + findText_ZH_TW);
                    taskLog("找到button2 = " + button2.clickable() );
                    taskLog("找到button2 centerX= " + button2.bounds().centerX() );
                    taskLog("找到button2 centerY= " + button2.bounds().centerY() );

                    clickText(findText_ZH_TW)
                    //  click(button2.bounds().centerX(), button2.bounds().centerY())
                    break; // 跳出循环
                }else if(button3){
                    taskLog("找到" + findText_EN_US);
                    taskLog("找到button3 = " + button3.clickable() );
                    //  clickText(findText_EN_US)
                    sleep(1000);  // 点击前等待
                    click(button3.bounds().centerX(), button3.bounds().centerY())
                    sleep(1000);  // 点击后等待
                    break; // 跳出循环
                }
                sleep(1000)

            }
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
                    clickDesc(findText_ZH_CN)
                    break; // 跳出循环
                }else if(button2){
                    taskLog("找到" + findText_ZH_TW);
                    taskLog("找到button2 = " + button2.clickable() );
                    clickDesc(findText_ZH_TW)
                    break; // 跳出循环
                }else if(button3){
                    taskLog("找到" + findText_EN_US);
                    taskLog("找到button3 = " + button3.clickable() );
                    clickDesc(findText_EN_US)
                    break; // 跳出循环
                }

                sleep(1000)

            }
    }




    //通过TextView的text
    function find_textview_text_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US){
        //是否找到该TextView，找到：true / 未找到：false
        var findText_result = false
        var loopCount = 0

        while (true) {
            taskLog(findText_ZH_CN + " - 循环寻找执行：" + (++loopCount));
            if (loopCount >= 3) {
                taskLog("循环已执行3次，即将退出循环。");
                break;
            }

            // 使用正则表达式匹配可能带有前导空格的文本
            var button1 = textMatches("^\\s*" + findText_ZH_CN + "$").className("android.widget.TextView").findOne(1000);
            var button2 = textMatches("^\\s*" + findText_ZH_TW + "$").className("android.widget.TextView").findOne(1000);
            var button3 = textMatches("^\\s*" + findText_EN_US + "$").className("android.widget.TextView").findOne(1000);

            if (button1) {
                taskLog("找到" + findText_ZH_CN);
                taskLog("找到" + button1.clickable());
                click(button1.bounds().centerX(), button1.bounds().centerY());
                findText_result = true
                break;
            } else if(button2) {
                taskLog("找到" + findText_ZH_TW);
                taskLog("找到" + button2.clickable());
                click(button2.bounds().centerX(), button2.bounds().centerY());
                findText_result = true
                break;
            } else if(button3) {
                taskLog("找到" + findText_EN_US);
                taskLog("找到" + button3.clickable());
                click(button3.bounds().centerX(), button3.bounds().centerY());
                findText_result = true
                break;
            }

            sleep(1000)
        }
        return findText_result
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


    

 //点击首页的右上角Search按钮
function click_home_search_btn(){
    var find_search_btn_count = 0
    if(find_search_btn_count > 5){
        console.error("首页寻找'搜索'按钮超过5次，抛出异常")
        throw new error("首页寻找'搜索'按钮超过5次，抛出异常")
    }
    sleep(random(2000, 5000))

    var gz5_img_count = 0
    var targetGz5 = null; // 用于存储第二个gz5按钮
    
    var allImages = className("android.widget.ImageView").find();
    if (allImages && allImages.size() > 0) {
        taskLog("找到ImageView的总数量：" + allImages.size());
        
        for (var i = 0; i < allImages.size(); i++) {
            var img = allImages.get(i);
            if (img) {
                taskLog("第" + (i+1) + "个Image控件-Text：" + img.text() + ";ID = " + img.id());
                
                //fullId("com.zhiliaoapp.musically:id/h0i")
                //fullId("com.ss.android.ugc.trill:id/h0j")
                if (img.id() == (GLOBAL_TikTokPackageName+":id/h0i") || img.id() == (ASIA_TikTokPackageName+":id/h0j")) {
                    gz5_img_count++;
                    taskLog("这是第" + gz5_img_count + "个h0i按钮");
                    
                    // 获取父容器信息
                    var parent = img.parent();
                    taskLog("父容器类型：" + parent.className());
                    taskLog("父容器ID：" + parent.id());
                    
                    var bounds = img.bounds();
                    taskLog("元素位置：left=" + bounds.left + 
                           ", top=" + bounds.top + 
                           ", right=" + bounds.right + 
                           ", bottom=" + bounds.bottom);
                    
                    // 存储第二个gz5按钮
                    if(gz5_img_count == 2) {
                        targetGz5 = img;
                        break; // 找到第二个后就退出循环
                    }
                }
            }
        }
        
        // 点击第二个gz5按钮
        if(targetGz5) {
            taskLog("找到第二个gz5按钮，准备点击");
            var bounds = targetGz5.bounds();
            if(targetGz5.clickable()){
                targetGz5.click();
            } else {
                click(bounds.centerX(), bounds.centerY());
            }
            return;
        }
    }
    
    //如果没找到合适的按钮，尝试滑动
    taskLog("没有找到第二个gz5按钮，准备滑动屏幕");
    swipe_to_up();
    find_search_btn_count++;
    
    sleep(random(2000, 5000));
}


    //屏幕上滑
    function swipe_to_up(){
        // 获取设备屏幕的宽高
        var width = device.width;
        var height = device.height;

        // 生成随机起始点
        var startX = random(width / 3 , width * 2 / 3);
        var startY = random(height * 2 / 3, height * 3 / 4);

        // 生成随机结束点
        var endX = random(width / 3 , width * 2 / 3);
        var endY = random(height * 1 / 3, height * 1 / 4);

        // 屏幕上滑操作
        swipe(startX, startY, endX, endY, 500);
        taskLog("开始滑动位置，x = "+startX+"；y = " + startY)
        taskLog("结束滑动位置，x = "+endX+"；y = " + endY)

    }

//点击第二页的右上角Search按钮
function click_Second_search_btn(){

    sleep(random(2000, 5000))
    var allButtons = className("android.widget.Button").find();
    if (allButtons && allButtons.size() > 0) {
        for (var i = 0; i < allButtons.size(); i++) {
            var btn = allButtons.get(i);
            if (btn) {
                // taskLog("找到Button控件-Text：" + btn.text() + ";ID = " + btn.id());
                
                // fullId("com.zhiliaoapp.musically:id/tk1")
                // fullId("com.ss.android.ugc.trill:id/tk4")
                if (btn.id() == (GLOBAL_TikTokPackageName +":id/tk1") || btn.id() == (ASIA_TikTokPackageName +":id/tk4")) {
                    // 正确调用bounds()方法并点击
                    toast("找到Button控件: 第二个页面的搜索框！" );

                    var bounds = btn.bounds();
                    click(bounds.centerX(), bounds.centerY());
                    // 找到并点击后可以跳出循环
                    break;
                }
            }
        }
    }
    sleep(random(2000, 5000))
}



    // function click_back_btn(){
    //     // 获取所有相同id的控件（
    //     //fullId("com.zhiliaoapp.musically:id/ay9")
    //     let targets = id(GLOBAL_TikTokPackageName+":id/ay9").find();
    //     // 通过索引获取指定的那个，比如第二个就是[1]
    //     let target = targets[0];
    //     if (target) {
    //         taskLog("已经找到返回按钮 " )
    //         // 获取控件的坐标信息
    //         let bounds = target.bounds();
            
    //         // 计算控件中心点坐标
    //         let centerX = bounds.centerX();
    //         let centerY = bounds.centerY();
            
    //         // 使用click函数模拟点击中心点位置
    //         taskLog("已经找到返回按钮 centerX = " +centerX)
    //         taskLog("已经找到返回按钮 centerY = " +centerY)
    //         sleep(1000);  // 点击前等待
    //         click(centerX, centerY);
    //         sleep(1000);  // 点击后等待
            
    //         // 或者使用press函数来模拟按压
    //         // press(centerX, centerY, 100); // 100是按压时长(毫秒)
    //     }else{
    //         taskLog("没有找到首页搜索确认按钮,所以直接back " )
    //         back()
    //     }

    // }

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

    //点击点赞按钮
    function click_Like_Btn(){
        taskLog("开始准备点赞视频")
        clickId("dh4") 
    }



    //点击评论按钮
    function click_Comment_Btn(commentText){
        taskLog("开始准备评论视频")
        clickId("cgq")

        sleep(5000)
        var autoCompleteTextViews = className("android.widget.EditText").find();
        for(var i = 0; i < autoCompleteTextViews.size(); i++) {
            var textView = autoCompleteTextViews.get(i);
            if(textView) {
                taskLog("找到TextView控件-Text："+ textView.text());
                sleep(1000)
                taskLog("评论控件，设置内容：" +commentText );
                textView.setText(commentText)
                sleep(10000)

                var flag = clickId("cik") //发送按钮
                // if(flag){
                //     sleep(3000)
                //     back();
                // }

                sleep(2000)
                // clickId("aru") //评论区右上角关闭按钮

                var clickX = device.width  - 100 ; 
                var clickY = device.width /4; 
                taskLog("开始准备点击屏幕 clickX = " + clickX)
                taskLog("开始准备点击屏幕 clickY = " + clickY)
                click(clickX, clickY);
                
                
            }
        }
    

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



    //获取私信列表
function get_all_comments(){
    // 用于存储用户的数组
    let comments = [];
    // 户是否存在
    const file = new java.io.File(TT_Message_GROUP);
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
        comments.push(TT_Message_GROUP);
    }
    
    return comments
}




//进进入粉丝页，点击每一个粉丝：className("android.widget.FrameLayout") fullId("com.zhiliaoapp.musically:id/i7w")
function click_FrameLayout_FENSI_SIXIN(){
    // 使用静态变量记录当前处理到第几个粉丝
    if (typeof click_FrameLayout_FENSI_SIXIN.currentIndex === 'undefined') {
        click_FrameLayout_FENSI_SIXIN.currentIndex = 0;
    }

    sleep(random(2000, 5000));
    
    // 获取所有符合条件的粉丝项
    var targetFrames = id(GLOBAL_TikTokPackageName +":id/i7w").find();
    if (!targetFrames.nonEmpty()) {
        targetFrames = id(ASIA_TikTokPackageName +":id/iz9").find();
    }
    
    if (targetFrames.nonEmpty()) {
        // 如果当前索引超出了找到的元素数量，重置索引
        if (click_FrameLayout_FENSI_SIXIN.currentIndex >= targetFrames.size()) {
            click_FrameLayout_FENSI_SIXIN.currentIndex = 0;
            return false; // 需要滑动加载更多
        }
        
        // 获取当前需要点击的元素
        var targetFrame = targetFrames.get(click_FrameLayout_FENSI_SIXIN.currentIndex);
        if (targetFrame) {
            taskLog("准备点击第 " + (click_FrameLayout_FENSI_SIXIN.currentIndex + 1) + " 个粉丝");
            var bounds = targetFrame.bounds();
            click(bounds.centerX(), bounds.centerY());
            click_FrameLayout_FENSI_SIXIN.currentIndex++;
            sleep(random(2000, 3000));
            return true;
        }
    }
    
    // 如果没有找到任何符合条件的元素
    click_FrameLayout_FENSI_SIXIN.currentIndex = 0;
    return false;
}




try {
    
    

    var all_TT_Comment_TEXT = get_all_comments()
    if(all_TT_Comment_TEXT.includes("$${T")){ 
        throw_error_storage_not_enough()
    }
    taskLog("所有需要私信的文本数量 = " + all_TT_Comment_TEXT.length)
    sleep(random(2000,3000))


    if(all_TT_Comment_TEXT.length == 0){

        taskLog("没有需要私信的文本内容") 
        stopCurrentTask()
    } else{

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
            var Profile_Fans_text_button = null;
            
            while (waitAttempt < maxWaitAttempts) {
                Profile_Fans_text_button = findTextByLanguages(PROFILE_FANS_TEXT);
                if (Profile_Fans_text_button) {
                    taskLog("找到Followers按钮，继续执行");
                    break;
                } else {
                    waitAttempt++;
                    taskLog("第" + waitAttempt + "次尝试：未找到Followers按钮，等待后重试...");
                    sleep(random(3000, 5000)); // 每次等待3-5秒
                }
            }
            
            if (Profile_Fans_text_button) {

                //先检查当前用户有多少个关注用户,通过检查text("Following 0")，如果存在，则说明没有关注用户，直接返回
                //text("Following 0")
                var Fans_text_button = findTextByLanguages(PROFILE_FANS_COUNT_TEXT)
                if(Fans_text_button){
                    taskLog("当前用户没有粉丝，直接终止任务")
                    sleep(random(3000, 5000))
                    var screenshotPath = Nest_ScreenCapture();
                    taskLog("已保存完成后的截图：" + screenshotPath);
                    // 抛出一个特殊的错误来结束脚本
                    throw new Error("当前用户没有粉丝，直接终止任务");
                }


                taskLog("需要私信的用户, 一共有： " + TT_Like_User_FANS_ID_COUNT + "个");
                sleep(random(30000, 40000))
                if (TT_Like_User_FANS_ID_COUNT.length > 0) {
                    var successCount = 0; // 成功私信的计数
                    for (var i = 0; i < TT_Like_User_FANS_ID_COUNT; i++) {
                        
                        // 尝试查找并点击Following按钮，如果找不到则滑动屏幕
                        var maxScrollAttempts = 10; // 最大滑动尝试次数
                        var scrollAttempt = 0;
                        var foundButton = false;
                        
                        while (!foundButton && scrollAttempt < maxScrollAttempts) {
                            // 循环等待直到找到FOLLOWERS_LIST_TEXT或超时
                            var maxWaitAttempts = 5; // 最大等待尝试次数
                            var waitAttempt = 0;
                            var Follow_text_button = null;
                            
                            while (waitAttempt < maxWaitAttempts) {
                                var foundFanToMessage = false;
                                var currentPageFansProcessed = 0;
                                
                                while (successCount < TT_Like_User_FANS_ID_COUNT) {
                                    // 尝试点击当前页面的粉丝
                                    var clickResult = click_FrameLayout_FENSI_SIXIN();
                                    if (!clickResult) {
                                        taskLog("当前页面的粉丝都已处理完，需要滑动加载更多");
                                        swipe_to_up();
                                        sleep(random(3000, 5000));
                                        continue; // 跳过后续处理，直接进入下一次循环
                                    }
                                    sleep(random(3000, 5000));
                                    
                                    // 进入粉丝个人页面后，尝试查找私信按钮
                                    var maxRetry = 3;
                                    var retryCount = 0;
                                    var Fans_sixin_message_text = null;
                                    
                                    while (retryCount < maxRetry) {
                                        Fans_sixin_message_text = findTextByLanguages(FANS_SIXIN_MESSAGE_TEXT);
                                        if (Fans_sixin_message_text) {
                                            break;
                                        }
                                        retryCount++;
                                        sleep(1000);
                                    }
                                    
                                    if (Fans_sixin_message_text) {
                                        taskLog("找到粉丝页面需要私信的按钮，准备私信");
                                        sleep(random(3000, 5000));
                                        
                                        var autoCompleteTextViews = className("android.widget.EditText").find();
                                        if (autoCompleteTextViews.size() == 0) {
                                            taskLog("没有找到訊息控件，跳过当前用户");
                                            back();
                                            sleep(random(2000, 4000));
                                            back();
                                            sleep(random(2000, 4000));
                                            currentPageFansProcessed++;
                                        } else {
                                            // 发送私信
                                            for (var i = 0; i < autoCompleteTextViews.size(); i++) {
                                                var textView = autoCompleteTextViews.get(i);
                                                if (textView) {
                                                    sleep(random(2000, 4000));
                                                    var randIdx = random(0, all_TT_Comment_TEXT.length - 1);
                                                    var messageText = all_TT_Comment_TEXT[randIdx];
                                                    taskLog("评论控件，设置内容：" + messageText);
                                                    textView.setText(messageText);
                                                    sleep(random(2000, 4000));
                                                    
                                                    var allImages = className("android.widget.ImageView").find();
                                                    if (allImages && allImages.size() > 0) {
                                                        var lastIndex = allImages.size() - 1;
                                                        var lastImg = allImages.get(lastIndex);
                                                        if (lastImg) {
                                                            var bounds = lastImg.bounds();
                                                            if (lastImg.clickable()) {
                                                                lastImg.click();
                                                            } else {
                                                                click(bounds.centerX(), bounds.centerY());
                                                            }
                                                        }
                                                    }
                                                    
                                                    successCount++; // 增加成功私信计数
                                                    foundFanToMessage = true;
                                                    taskLog("成功私信第 " + successCount + " 个粉丝");
                                                    
                                                    sleep(3000);
                                                    back();
                                                    sleep(1000);
                                                    back();
                                                    sleep(5000);
                                                }
                                            }
                                            currentPageFansProcessed++;
                                        }
                                    } else {
                                        taskLog("当前粉丝无法私信，尝试下一个");
                                        back();
                                        sleep(random(2000, 4000));
                                        currentPageFansProcessed++;
                                    }
                                    
                                    // 已经在点击函数中处理了滑动加载更多的逻辑
                                    
                                    // 如果达到目标数量，退出循环
                                    if (successCount >= TT_Like_User_FANS_ID_COUNT) {
                                        taskLog("已达到目标私信数量：" + TT_Like_User_FANS_ID_COUNT);
                                        break;
                                    }
                                }

                            }
                            
                        }
                        
                        if (!foundButton) {
                            taskLog("多次滑动后仍未找到更多Following按钮，可能已经到达列表底部");
                            break; // 退出主循环
                        }
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

































        



        // // 按照顺序开始执行搜索User-ID
        // taskLog("- 找到可用的搜索用户, 开始搜索 - ");
        // for (var index_user = 0; index_user < all_TT_Users.length; index_user++) {
        //     var userId = all_TT_Users[index_user];
        //     taskLog("开始准备获取all_TT_Users的ID = " + userId)
        //     sleep(random(2000, 4000))

        //     taskLog("开始准备点击首页搜索按钮")
        //     var search_edits = className("android.widget.EditText").find();
        //     for(var i = 0; i < search_edits.size(); i++) {
        //         var search_edit = search_edits.get(i);
        //         if(search_edit) {
        //             sleep(1000)
        //             taskLog("搜索控件，设置用户NAME：" +userId );
        //             search_edit.setText(userId)    
        //             sleep(random(5000, 8000))
                    
        //             taskLog("开始点击Search按钮")
        //             click_Second_search_btn()

        //             sleep(random(5000, 8000))
        //             taskLog("开始点击视频Tab按钮")
        //             var findMSGTextResult = find_textview_text_base("用户","使用者","Users")
        //             if(!findMSGTextResult) {
        //                 taskLog("没有找到用户Tab控件，终止本次操作，开始下一个用户的私信行为！！！");
        //                 back()    
        //                 break
        //             }

        //             sleep(random(5000, 8000))
        //             //直接点击第一个关注按钮
        //             click_LinearLayout_GUANZHU()
        //             sleep(random(2000, 4000))

        
        //             //text("消息")：点击User的主页的"消息"按钮，准备发信息
        //             var findMSGTextResult = find_textview_text_base("訊息", "Message", "消息")
        //             if(!findMSGTextResult) {
        //                 taskLog("没有找到消息控件，终止本次操作，开始下一个用户的私信行为！！！");
        //                 sleep(3000)
        //                 back()
        //                 sleep(1000)
        //                 back()
        //                 sleep(3000)
        //                 break
        //             }
        //             sleep(random(2000, 4000))

        //             var autoCompleteTextViews = className("android.widget.EditText").find();
        //             if(autoCompleteTextViews.size() == 0){//这种场景对应的用户：mrbeast
        //                 taskLog("没有找到訊息控件，终止本次操作，开始下一个用户的私信行为！！！");               
        //                 back()
        //                 sleep(random(2000, 4000))
        //                 back()
        //                 sleep(random(2000, 4000))
        //                 back()
        //                 sleep(1000)
        //                 break
        //             }else{
        //                 for(var i = 0; i < autoCompleteTextViews.size(); i++) {
        //                     var textView = autoCompleteTextViews.get(i);
        //                     if(textView) {
        //                         taskLog("找到TextView控件-Text："+ textView.text());
        //                         sleep(1000)

        //                         var randIdx = random(0, all_TT_Comment_TEXT.length - 1)
        //                         taskLog("评论文案的下标randIdx："+randIdx)
        //                         var messageText = all_TT_Comment_TEXT[randIdx];

        //                         taskLog("评论控件，设置内容：" +messageText );

        //                         textView.setText(messageText)
        //                         sleep(random(2000, 4000))
                
                    

        //                         //点击发送按钮
        //                         // className("android.widget.ImageView").find().forEach((iv, idx) => {
        //                         //     taskLog("ImageView " + idx + ": " + iv.bounds());
        //                         // });

        //                         // taskLog("开始寻找发送按钮.....")
        //                         // taskLog("开始寻找发送按钮,device.width * 0.9 = " + device.width * 0.9)
        //                         // taskLog("开始寻找发送按钮,device.height * 0.9 = " + device.height * 0.9)


        //                         // let sendButton = className("android.widget.ImageView")
        //                         // .filter(function(w) {
        //                         //     let b = w.bounds();
        //                         //     // 检查是否在右下角区域
        //                         //     return b.centerX() > device.width * 0.8 && b.centerY() > device.height * 0.8;
        //                         // }).findOne(5000);


        //                         var allImages = className("android.widget.ImageView").find();
        //                         if (allImages && allImages.size() > 0) {
        //                             var lastIndex = allImages.size() - 1;
        //                             var lastImg = allImages.get(lastIndex);
        //                             if (lastImg) {
        //                                 var bounds = lastImg.bounds();
        //                                 if (lastImg.clickable()) {
        //                                     lastImg.click();
        //                                 } else {
        //                                     click(bounds.centerX(), bounds.centerY());
        //                                 }

        //                                 }
        //                         }



        //                         // // 点击按钮
        //                         // if(sendButton) {
        //                         //     taskLog("找到发送按钮，开始点击")
        //                         //     let bounds = sendButton.bounds();
        //                         //     sleep(1000);  // 点击前等待
        //                         //     click(bounds.centerX(), bounds.centerY());
        //                         //     sleep(1000);  // 点击后等待
                                    
        //                         // }else{
        //                         //     taskLog("没有找到私信发送按钮！！！！")
        //                         //     // throw new Error("没有找到私信发送按钮，所以报错"); 
        //                         // } 

        //                         sleep(3000)
        //                         back()      
        //                         sleep(1000)
        //                         back()
        //                         sleep(1000)
        //                         back()
        //                         sleep(5000)
        //                 }
        //             }


        //             }

        //         }
        //     }


        // }

    }




 
} catch(e) {
    handleError(e);
}



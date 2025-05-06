// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************Tiktok首页搜索养号*************************
// mx-phone-2  - drewryapilado@gmail.com
//******************************************************************

var ASIA_TikTokPackageName = 'com.ss.android.ugc.trill';
var GLOBAL_TikTokPackageName = 'com.zhiliaoapp.musically';


//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


//用户需要输入的评论内容
const TT_searchFile = '$${T_搜尋關鍵字}';
const TT_Watch_Count = "$${視頻瀏覽數量}" //观看视频个数


const TT_commentFile = '$${T_評論內容}';
const TT_Like_Count = "$${點讚概率}" //点赞概率
const TT_Save_Count = "$${收藏概率}" //收藏概率
const TT_Comment_Count = "$${評論概率}" //评论概率


const TT_Watch_Author_Page= 0 //查看作者主页的概率



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
        forceStop_APP(GLOBAL_TikTokPackageName)
        console.log("-----------------脚本功能执行结束：---------------");
        console.log("Tiktok根據關鍵字，搜尋影片瀏覽養號，評論，點讚---------------");
        console.log("脚本执行时间：" + new Date().toLocaleString());
    }
    openLogActivity();
});

function handleError(e) {
    handleErrorFlag = true
    forceStop_APP(GLOBAL_TikTokPackageName)
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
    //fullId("com.zhiliaoapp.musically:id/e2n") 
    //fullId("com.ss.android.ugc.trill:id/e2o")
    if(targetPackageName == GLOBAL_TikTokPackageName){  
        clickId(GLOBAL_TikTokPackageName + ":id/e2n")
    }else{
        clickId(ASIA_TikTokPackageName + ":id/e2o")
    }

}


//点击评论按钮
function click_Comment_Btn(commentText){
    taskLog("开始准备评论视频")
    //fullId("com.zhiliaoapp.musically:id/cxm")
    //fullId("com.ss.android.ugc.trill:id/cxn")
    if(targetPackageName == GLOBAL_TikTokPackageName){  
        clickId(GLOBAL_TikTokPackageName + ":id/cxm")
    }else{
        clickId(ASIA_TikTokPackageName + ":id/cxn")
    }

    sleep(5000)
    var autoCompleteTextViews = className("android.widget.EditText").find();
    taskLog("autoCompleteTextViews长度 = " + autoCompleteTextViews.size())


    //如果某个tiktok视频，0评论，自己是首评，那么界面会有两个"android.widget.EditText"
    if(autoCompleteTextViews.size() >0){
        var textView = autoCompleteTextViews.get(autoCompleteTextViews.size() - 1);
        if(textView) {
            taskLog("找到TextView控件-Text："+ textView.text());
            textView.click()
            sleep(1000)
            taskLog("评论控件，设置内容：" +commentText );
            textView.setText(commentText)
            sleep(5000)
    
    
            //发送按钮,如果某个tiktok视频，0评论，自己是首评，那么就会找不到fullId("com.zhiliaoapp.musically:id/czk")
            //所以必须要执行两次clickId(GLOBAL_TikTokPackageName + ":id/czk") ，因为0评论，和有评论的界面不一样
            // fullId("com.zhiliaoapp.musically:id/czk")
            // fullId("com.ss.android.ugc.trill:id/czm")

            if(targetPackageName == GLOBAL_TikTokPackageName){  
                clickId(GLOBAL_TikTokPackageName + ":id/czk")
            }else{
                clickId(ASIA_TikTokPackageName + ":id/czm")
            }

            sleep(random(2000, 3000))
            back()
            sleep(random(2000, 3000))
            
            if(targetPackageName == GLOBAL_TikTokPackageName){  
                clickId(GLOBAL_TikTokPackageName + ":id/czk")
            }else{
                clickId(ASIA_TikTokPackageName + ":id/czm")
            }
    
    
            sleep(random(10000, 15000))
    
    
            var clickX = device.width  - 100 ; 
            var clickY = device.width /4; 
            taskLog("开始准备点击屏幕 clickX = " + clickX)
            taskLog("开始准备点击屏幕 clickY = " + clickY)
            click(clickX, clickY);
                
                
            }
    }

}




//点击收藏按钮
function click_Save_Btn(){
    taskLog("开始准备收藏视频")
    //fullId("com.zhiliaoapp.musically:id/fdf")
    //fullId("com.ss.android.ugc.trill:id/fdg")
    if(targetPackageName == GLOBAL_TikTokPackageName){  
        clickId(GLOBAL_TikTokPackageName + ":id/fdf")   
    }else{
        clickId(ASIA_TikTokPackageName + ":id/fdg")
    }

}




//打印日志
function taskLog(_log){
    toast(_log)
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
                 clickText(findText_ZH_CN)
                 break; // 跳出循环
             }else if(button2){
                 taskLog("找到" + findText_ZH_TW);
                 taskLog("找到button2 = " + button2.clickable() );
                 clickText(findText_ZH_TW)
                 break; // 跳出循环
             }else if(button3){
                 taskLog("找到" + findText_EN_US);
                 taskLog("找到button3 = " + button3.clickable() );
                //  if(button3.clickable()) {
                //     sleep(1000);
                //     button3.click()
                //  }else{
                    clickText(findText_EN_US)
                //  }
                 
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
         // 检查计数器是否达到5
         if (loopCount >= 5) {
             // 打印一条消息并退出循环
             taskLog("循环已执行5次，即将退出循环。");

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

         if (button1 ) {
             taskLog("找到" + findText_ZH_CN);
             taskLog("找到" + button1.clickable());
             clickText(findText_ZH_CN)
             break; // 跳出循环
         }else if(button2){
             taskLog("找到" + findText_ZH_TW);
             taskLog("找到" + button2.clickable());
             clickText(findText_ZH_TW)
             break; // 跳出循环
         }else if(button3){
             taskLog("找到" + findText_EN_US);
             taskLog("找到" + button3.clickable());
            //  clickText(findText_EN_US)
            click(button3.bounds().centerX(), button3.bounds().centerY())
             break; // 跳出循环
         }

         sleep(1000)

     }
}



    //点击发送按钮
    function find_send_btn() {
        var allButtons = className("android.widget.Button").find();
        if (allButtons && allButtons.size() > 0) {
            // for (var i = 0; i < allButtons.size(); i++) {
            //     var button = allButtons.get(i);
            //     if (button) {
            //         taskLog("找到button控件-Text：" + button.text() + ";ID = " + button.id());
            //     }
            // }
            
            // 获取最后一个按钮
            var lastButton = allButtons.get(allButtons.size() - 1);
            if (lastButton) {
                // bounds()是一个方法,需要先调用它
                var bounds = lastButton.bounds();
                click(bounds.centerX(), bounds.centerY());
            }
        }
    }



    //获取评论列表
    function get_all_comments(){
        // 用于存储用户的数组
        let comments = [];
        // 户是否存在
        const file = new java.io.File(TT_commentFile);
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
            comments.push(TT_commentFile);
        }
        
        return comments
    }


        //获取关键字列表
        function get_all_keyword(){
            // 用于存储用户的数组
            let comments = [];
            // 户是否存在
            const file = new java.io.File(TT_searchFile);
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
                comments.push(TT_searchFile);
            }
            
            return comments
        }



try {
    
   

    //******************************************************************
    // 用于存储评论的数组
    var comments = get_all_comments()
    var search_text_array = get_all_keyword()

    if(search_text_array.length > 0){
        taskLog("- 找到可用的搜索关键字文案, 开始搜索观看 - ");
        for (var randIdx = 0; randIdx < search_text_array.length; randIdx++) {
            var keywordText = search_text_array[randIdx];
            taskLog("- 找到可用的搜索关键字文案: "+keywordText+", 开始搜索观看 - ");

            // 计算右上角区域的点击坐标(找不到按钮，所以只能是点击坐标)
            click_home_search_btn()
            sleep(random(5000, 8000))


            var search_edits = className("android.widget.EditText").find();
            for(var i = 0; i < search_edits.size(); i++) {
                var search_edit = search_edits.get(i);
                if(search_edit) {
                    taskLog("找到TextView控件-Text："+ search_edit.text());
                    sleep(1000)
                    taskLog("搜索控件，设置内容：" +keywordText );
                    search_edit.setText(keywordText)    
                    sleep(random(5000, 8000))
                    
                    taskLog("开始点击Search按钮")
                    click_Second_search_btn()



                    //开始观看视频
                    sleep(random(5000, 8000))
                    taskLog("开始点击视频Tab按钮")
                    find_textview_text_base("影片","Videos","视频")

                    sleep(random(5000, 8000))
                    click_left_top_screen()//直接观看第一个即可
                    

                    sleep(random(5000, 8000))
                    watch_TT_video(comments)


                    //看完之后，回退回去
                    back()
                    sleep(random(2000, 3000))
                    back()
                    sleep(random(2000, 3000))
        
                }
            }


        }


    }else{
        taskLog("- 没有可用的搜索关键字文案, 忽略 - ");
    }


    } catch (e) {
        handleError(e);
}

//开始观看视频
function watch_TT_video(comments){

    //开始观看
    var count = 1;
    do {
        // 将 count 加 1
        taskLog("开始观看第"+count+"个TikTok视频")
        count++;

        //
        close_friend_suggest()

        sleep(random(10000, 25000))

        if (Math.random() * 100 < TT_Like_Count)  {
            taskLog("开始触发点赞概率")
            click_Like_Btn()
            sleep(random(5000, 8000))
        }
        if (Math.random() * 100 < TT_Save_Count)  {
            taskLog("开始触发保存视频概率")
            click_Save_Btn()
            sleep(random(5000, 8000))
        }
        if (Math.random() * 100 < TT_Comment_Count)  {
            taskLog("开始触发评论视频概率")
            taskLog("评论文案的总个数："+comments.length)
            if (comments.length > 0) {

                //如果评论概率不是0，那么直接报错
                if(TT_Comment_Count > 0 && comments.includes("T_评论文案")) {
                    throw new Error("评论概率不是0，但评论内容是空，所以报错");
                }

                taskLog("- 找到可用评论文案, 开始评论 - ");
                var randIdx = random(0, comments.length - 1)
                taskLog("评论文案的下标randIdx："+randIdx)
                var commentText = comments[randIdx];
                taskLog("随机评论文案 :" + commentText);
                click_Comment_Btn(commentText)
                sleep(random(5000, 8000))
              }else{
                taskLog(`- 没有可用评论文案, 忽略 - `);

                //如果评论概率不是0，那么直接报错
                if(TT_Comment_Count > 0) {
                    throw new Error("评论概率不是0，但评论内容是空，所以报错");
                }
              }
        }

        if (Math.random() * 100 < TT_Watch_Author_Page)  {
            taskLog("开始触发查看作者主页的概率")
            click_Author_Page_Btn()
            sleep(random(5000, 8000))
        }


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
        swipe(startX, startY, endX, endY, 2000);
        taskLog("开始滑动位置，x = "+startX+"；y = " + startY)
        taskLog("结束滑动位置，x = "+endX+"；y = " + endY)



    } while (count < TT_Watch_Count); // 当 count 小于 TT_Watch_Count 时继续循环
}

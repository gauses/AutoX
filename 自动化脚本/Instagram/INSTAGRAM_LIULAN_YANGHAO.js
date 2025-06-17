// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************Tiktok首页浏览养号*************************
//******************************************************************

var ASIA_TikTokPackageName = 'com.ss.android.ugc.trill';
var GLOBAL_TikTokPackageName = 'com.zhiliaoapp.musically';

var INSTAGRAM_PACKAGE_NAME = 'com.instagram.android';



//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


//用户需要输入的评论内容
const TT_Watch_Count = "$${瀏覽數量}" //观看视频个数
const TT_commentFile = '$${T_留言內容}';
const TT_Like_Count = "$${點讚概率}" //点赞概率
const TT_Comment_Count = "$${留言概率}" //评论概率
const TT_Save_Count = "$${收藏概率}" //收藏概率


// 计算循环次数
const loopTimes = TT_Watch_Count;
taskLog("自定義瀏覽总执行次数：" + loopTimes + "次");


var targetPackageName = null;
var targetClassName = null;


//1.autox.js侧边栏的打开USB调试先打开
//2.vscode ctrl+shift+p 输入start all server 确定
//3.远程连接成功

//个人发文

//出现异常错误时，打印的日志错误信息
var handleErrorFlag = false //默认没有错误，如果出现异常，那么该值是true

// 注册退出事件监听器
 events.on('exit', function(){
    console.hide()
    sleep(1000)

    if(handleErrorFlag){
        console.error("-----------------脚本执行出现异常---------------");
        console.error("Tiktok根據推薦影片，自動瀏覽養號.評論.點讚---------------");
        console.error("脚本执行时间：" + new Date().toLocaleString());
    }else{
        forceStop_APP(targetPackageName)
        console.log("-----------------脚本功能执行结束：---------------");
        console.log("Tiktok根據推薦影片，自動瀏覽養號.評論.點讚---------------");
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
taskLog("准备启动Instagram...")



function isAppInstalled(packageName) {
    var pm = context.getPackageManager();
    try {
        pm.getPackageInfo(packageName, 0);
        return true;
    } catch (e) {
        return false;
    }
}

if (isAppInstalled(INSTAGRAM_PACKAGE_NAME)) {
    targetPackageName = INSTAGRAM_PACKAGE_NAME;
    targetClassName = "com.instagram.mainactivity.InstagramMainActivity";
    taskLog("检测到已安装Instagram，准备启动...");
} else {
    toast("未检测到Instagram已安装，请先安装Instagram！");
    taskLog("未检测到Instagram已安装，脚本终止。");
    exit();
}

sleep(random(3000, 5000))
openAppSetting(targetPackageName)
sleep(random(3000, 5000))

forceStop_APP(targetPackageName)
sleep(3000)

app.startActivity({
    action: "android.intent.action.VIEW",
    packageName: targetPackageName,
    className: targetClassName
});


sleep(random(3000, 5000))




function clickId(a) {
    let obj_ID = id(a).boundsInside(5, 5, device.width - 5, device.height - 5);
    
    // 检查是否找到元素
    let elements = obj_ID.find();
    if (elements.empty()) {
        taskLog("没有找到元素ID ：" + a);
        return;
    }
    
    // 获取第一个匹配的元素
    let element = elements.get(0);
    let X = element.bounds().centerX();
    let Y = element.bounds().centerY();
    
    // 验证 X 和 Y 是否为正数
    if (X < 0 || Y < 0) {
        taskLog("坐标无效，中心点X或Y为负值: X=" + X + ", Y=" + Y);
        return;
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
    //className("android.widget.Button")
    //fullId("com.instagram.android:id/row_feed_button_like")
    clickId("com.instagram.android:id/row_feed_button_like")

}



//点击评论按钮
function click_Comment_Btn(commentText){

    //提前检查一下
    check_save_btn_dialog()
    sleep(random(2000 , 3000))

    taskLog("开始准备评论视频")
    //fullId("com.instagram.android:id/row_feed_button_comment")
    clickId("com.instagram.android:id/row_feed_button_comment")

    sleep(5000)
    //className("android.widget.AutoCompleteTextView")
    var autoCompleteTextViews = className("android.widget.AutoCompleteTextView").find();
    taskLog("autoCompleteTextViews长度 = " + autoCompleteTextViews.size())


    if(autoCompleteTextViews.size() >0){
        var textView = autoCompleteTextViews.get(autoCompleteTextViews.size() - 1);
        if(textView) {
            taskLog("找到TextView控件-Text："+ textView.text());
            textView.click()
            sleep(1000)
            taskLog("评论控件，设置内容：" +commentText );
            textView.setText(commentText)
            sleep(5000)
    
    
            //发送按钮
            //fullId("com.instagram.android:id/layout_comment_thread_post_button_icon")
            clickId("com.instagram.android:id/layout_comment_thread_post_button_icon")


            sleep(random(2000, 3000))
            back()
            swipe_up()
            sleep(random(2000, 3000))
            back()
            sleep(random(2000, 3000))
                
            }
    }
   
}



//点击收藏按钮
function click_Save_Btn(){
    taskLog("开始准备收藏视频")
    //fullId("com.instagram.android:id/row_feed_button_save")
    clickId("com.instagram.android:id/row_feed_button_save")

    check_save_btn_dialog()

}



function check_save_btn_dialog(){
    //可能出现一个下拉框，需要点击back

    sleep(random(3000 , 5000))
    taskLog("检查是否存在收藏下拉框")
    //fullId("com.instagram.android:id/primary_action_button")
    if(id("com.instagram.android:id/primary_action_button").exists()){
        taskLog("存在收藏下拉框，点击back")
        back()
    }else{
        taskLog("不存在收藏下拉框")
    }
}

//点击观看
function click_Watch_Btn(){
    taskLog("开始准备观看视频")
    try {
        // 判断屏幕宽高是否有效
        if (device.width > 0 && device.height > 0) {
            let centerX = Math.floor(device.width / 2);
            let centerY = Math.floor(device.height / 2);
            // 再次校验中心点
            if (centerX >= 0 && centerY >= 0) {
                click(centerX, centerY);
                taskLog("已点击屏幕中心: X=" + centerX + ", Y=" + centerY);
            } else {
                taskLog("屏幕中心坐标无效: X=" + centerX + ", Y=" + centerY);
            }
        } else {
            taskLog("获取屏幕宽高失败，无法点击中心");
        }
    } catch (e) {
        taskLog("点击屏幕中心时发生异常: " + e.message);
    }
    sleep(random(3000, 5000));
    back();
}


function find_send_btn() {
    var allButtons = className("android.widget.Button").find();
    taskLog("find_send_btn allButtons长度 = " + allButtons.size())
    if (allButtons && allButtons.size() > 0) {

        // 获取最后一个按钮
        var lastButton = allButtons.get(allButtons.size() - 1);
        if (lastButton) {
            // bounds()是一个方法,需要先调用它
            var bounds = lastButton.bounds();
            click(bounds.centerX(), bounds.centerY());
        }
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
    Deviation = random(-10, 10), X1 = X - Deviation, Y1 = Y - Deviation, device.sdkInt<24?ra.tap(X1,Y1):click(X1,Y1);
}
function clickDesc(a) {
    for (obj_Desc = desc(a).boundsInside(5, 5, device.width-5, device.height-5); obj_Desc.find().empty(); ) sleep(1e3);
    X = obj_Desc.find().get(0).bounds().centerX(), Y = obj_Desc.find().get(0).bounds().centerY(),
    Deviation = random(-10, 10), X1 = X - Deviation, Y1 = Y - Deviation, device.sdkInt<24?ra.tap(X1,Y1):click(X1,Y1);
}

//========================================================================================================================


//结束当前任务
function stopCurrentTask(){
    // saveImg()

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
function find_btn_Text_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US, findText_EN_UK){


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
             var button4 = className("android.widget.Button").text(findText_EN_UK).findOne(1000);

             if (button1) {
                 taskLog("找到" + findText_ZH_CN);
                 button1.click();
                 break; // 跳出循环
             }else if(button2){
                 taskLog("找到" + findText_ZH_TW);
                 button2.click();
                 break; // 跳出循环
             }else if(button3){
                 taskLog("找到" + findText_EN_US);
                 button3.click();
                 break; // 跳出循环
             }else if(button4){
                taskLog("找到" + findText_EN_UK);
                button4.click();
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



//从评论数组中，顺序挑选一条内容
function get_all_TT_comment_text(){
    let comments = [];
    // 户是否存在
    taskLog("TT评论数组 =  " + TT_commentFile)
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


//从评论列表数组中，随机挑选一条内容，翻译
function get_post_text(){
    // 用于存储私信用户的数组
    let comments = [];


    if(TT_commentFile && 
        TT_commentFile.trim() !== "" && 
        TT_commentFile.trim().toLowerCase() !== "off" && 
        !TT_commentFile.includes("$${")){
            
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
        }



    return comments

}

function swipe_up(){
    //使用多段swipe实现曲线滑动
    let screenHeight = device.height;
    let startY = Math.floor(screenHeight * 0.9);  // 起点
    let endY = Math.floor(screenHeight * 0.1);    // 终点
    let distance = startY - endY;                 // 总距离
    
    // 第一段：向右倾斜
    swipe(
        device.width / 2,    // 起点X
        startY,             // 起点Y
        device.width * 0.7,  // 终点X
        startY - distance/3, // 终点Y
        700                 // 持续时间
    );
    sleep(200);
    
    // 第二段：向左倾斜
    swipe(
        device.width * 0.7,  // 起点X
        startY - distance/3, // 起点Y
        device.width * 0.3,  // 终点X
        startY - distance*2/3, // 终点Y
        700                 // 持续时间
    );
    sleep(200);
    
    // 第三段：回到中间
    swipe(
        device.width * 0.3,  // 起点X
        startY - distance*2/3, // 起点Y
        device.width / 2,    // 终点X
        endY,               // 终点Y
        600                 // 持续时间
    );
    sleep(3000); //等待滚动完成
}


try {
    
    // 开始主循环
    var commentTextArrays = get_post_text()
    toast("评论文案个数：" + commentTextArrays.length)

    for(let currentLoop = 1; currentLoop <= loopTimes; currentLoop++) {
        toast("开始第 " + currentLoop + "/" + loopTimes + " 次执行");    
        
        
        sleep(random(3000, 5000))

        taskLog("开始模拟滑动")
        swipe_up()

        check_save_btn_dialog()
        taskLog("开始准备寻找点赞按钮....");
        sleep(random(3000, 5000))

        //检查是不是有点赞按钮
        //fullId("com.instagram.android:id/row_feed_button_like")
        var likeBtnList = id("com.instagram.android:id/row_feed_button_like").className("android.widget.Button").find()
        taskLog("当前页面的likeBtn数量 = " + likeBtnList.size())
        // click_Watch_Btn()
        // sleep(random(3000, 5000))


        if(likeBtnList.size() > 0){
            if (Math.random() * 100 < TT_Like_Count)  {
                taskLog("开始触发点赞概率")
                click_Like_Btn()
            }else{
                taskLog("本次不需要触发点赞概率")
            }
            sleep(random(3000, 5000))

            if (Math.random() * 100 < TT_Save_Count)  {
                taskLog("开始触发保存视频概率")
                click_Save_Btn()
            }else{
                taskLog("本次不需要触发保存视频概率")
            }
            sleep(random(3000, 5000))

            if (Math.random() * 100 < TT_Comment_Count)  {
                taskLog("开始触发评论概率")
                
                if(commentTextArrays.length > 0){

                    var randIdx = random(0, commentTextArrays.length - 1)
                    var messageText = commentTextArrays[randIdx];

                    toast("评论文案：" + messageText)
                    toast("准备点击评论按钮....");
                    click_Comment_Btn(messageText)

                    taskLog("等待5秒后，准备返回上一个页面")
                    sleep(random(3000, 5000))


                }else{
                    toast("评论文案为空，所以不点击评论按钮");
                }



                
            }else{
                taskLog("本次不需要触发评论视频概率")
            }


            
        }else{
            taskLog("没有找到点赞按钮，直接下一次循环页面")
        }


        if(currentLoop < loopTimes) {
            taskLog("等待5秒后开始下一次循环...");
            sleep(random(3000, 5000))
        }
    }

    taskLog("所有循环执行完毕，准备结束任务...");
    stopCurrentTask()


} catch (e) {
    handleError(e);
}
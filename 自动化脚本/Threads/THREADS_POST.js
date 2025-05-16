// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************Threads發佈串文（圖片、視屏）*************************
//******************************************************************


var THREADS_PACKAGE_NAME = 'com.instagram.barcelona';

//将需要处理的多媒体图片，单独copy一份放到这个文件夹里面，后面处理完成之后，再删除这个文件夹
var A_NEST_Threads_MEDIA = 'A_NEST_Threads_MEDIA';    

//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


//用户需要输入的评论内容
const THREADS_POST_VIDEO_URL = '$${T_需要上傳影片的本地地址}';
const THREADS_POST_VIDEO_DESC = '$${T_上傳影片的說明}';




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
taskLog("准备启动Threads...")



function isAppInstalled(packageName) {
    var pm = context.getPackageManager();
    try {
        pm.getPackageInfo(packageName, 0);
        return true;
    } catch (e) {
        return false;
    }
}

if (isAppInstalled(THREADS_PACKAGE_NAME)) {
    targetPackageName = THREADS_PACKAGE_NAME;
    targetClassName = "com.instagram.barcelona.mainactivity.BarcelonaActivity";
    taskLog("检测到已安装Threads，准备启动...");
} else {
    toast("未检测到Threads已安装，请先安装Threads！");
    taskLog("未检测到Threads已安装，脚本终止。");
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







//点击评论按钮
function click_Comment_Btn(commentText){


    sleep(random(3000, 5000))
    //className("android.widget.EditText")
    var autoCompleteTextViews = className("android.widget.EditText").find();
    taskLog("autoCompleteTextViews长度 = " + autoCompleteTextViews.size())


    if(autoCompleteTextViews.size() >0){
        var textView = autoCompleteTextViews.get(autoCompleteTextViews.size() - 1);
        if(textView) {
            taskLog("找到TextView控件-Text："+ textView.text());
            textView.click()
            sleep(1000)
            taskLog("评论控件，设置内容：" +commentText );
            textView.setText(commentText)
            sleep(random(3000, 5000))
    
            //发送按钮
            var autoViewList = className("android.view.View").find();
            let foundSendBtn = false;

            if(autoViewList.length > 0){
                // 遍历所有找到的View
                for (let i = 0; i < autoViewList.length; i++) {
                    // 或者输出控件的某个属性
                    taskLog("autoViewList[" + i + "] id = " + autoViewList[i].id());

                    //clickable("false")
                    if (autoViewList[i] != null && autoViewList[i].id() == "permalink_inline_composer_post_button") {
                        taskLog("找到发送按钮，开始点击发送");
                        click(autoViewList[i].bounds().centerX(), autoViewList[i].bounds().centerY());
                        foundSendBtn = true;
                        sleep(random(3000, 5000))
                        break;
                    }
                }
            
            }
            if (!foundSendBtn) {
                taskLog("当前界面没有找到发送按钮，直接返回");
                back();
            }


            sleep(random(3000, 5000))
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
    taskLog("TT评论数组 =  " + THREADS_POST_VIDEO_DESC)
    const file = new java.io.File(THREADS_POST_VIDEO_DESC);
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
        comments.push(THREADS_POST_VIDEO_DESC);
    }
    
    return comments
}


//从评论列表数组中，随机挑选一条内容，翻译
function get_post_text(){
    // 用于存储私信用户的数组
    let comments = [];
    const file = new java.io.File(THREADS_POST_VIDEO_DESC);
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
        comments.push(THREADS_POST_VIDEO_DESC);
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

// 刷新指定路径的媒体库
function refreshMedia(path) {
    try {
        toast("开始刷新媒体库，用时5秒钟....");
        // 发送媒体扫描广播
        media.scanFile(path);
        // 等待扫描完成
        sleep(5000);
        toast("媒体库刷新完成，开始下一步任务...");
    } catch (error) {
        toast("path = " + path + " 媒体库刷新失败，error = " + error);
    }

}


//转移视频到Nest临时文件夹
function transferVideoToNest(fileName){
    let videoPath = null;
    if (files.exists(fileName)) {
        videoPath = fileName;
    }
    
    if (!videoPath) {
        console.error("未找到指定视频：" + fileName);
        toast("未找到指定视频：" + fileName);
        //throw new error("没有找到需要上传的视频，所以异常直接退出")
        return;
    }


    //开始拷贝一份，到本地自己的文件夹来单独处理，不处理原来的图片，
    // 创建文件夹(如果不存在)
    const newFolder = "/storage/emulated/0/Download/" + A_NEST_Threads_MEDIA;  // 替换成你想要的文件夹路径
    if(!files.exists(newFolder)){
        files.ensureDir(newFolder);
        console.log("创建文件夹: " + newFolder);
    }

    // 目标视频路径(在新文件夹中)
    const targetFileName = files.getName(videoPath);
    const targetPath = newFolder + "/" + targetFileName;
    console.log("新视频文件的绝对路径: " + targetPath);
    // 复制图片文件
    try {
        files.copy(videoPath, targetPath);
        console.log("复制成功!");
        console.log("新视频路径: " + targetPath);
    } catch(e) {
        console.error("复制失败: " + e);
    }

    sleep(3000);

    refreshMedia(newFolder)

    return targetPath
}

//从评论数组中，顺序挑选一条描述
function get_DESC_comment_text(){
    let comments = [];
    // 户是否存在
    taskLog("THREADS_POST_VIDEO_DESC评论数组 =  " + THREADS_POST_VIDEO_DESC )
    const file = new java.io.File(THREADS_POST_VIDEO_DESC);
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
        comments.push(THREADS_POST_VIDEO_DESC);
    }
    
    return comments
}


try {
    
    // 开始主循环
    var commentTextArrays = get_post_text()
    toast("评论文案个数：" + commentTextArrays.length)

        
    sleep(random(3000, 5000))


    //转移图片到临时文件夹
    taskLog("开始刷新本地媒体库.....")
    refreshMedia("/storage/emulated/0/Download/")
    sleep(3000)

    taskLog("开始转移视频到临时文件夹,THREADS_POST_VIDEO_URL = " + THREADS_POST_VIDEO_URL)
    sleep(2000)
    taskLog("开始转移视频到本地路径...")
    var imageTempPath = transferVideoToNest(THREADS_POST_VIDEO_URL)
    sleep(5000)




    //先点击What‘s New , 从而能进入一个新页面，来设置文本和图片
    //className("android.view.View") fullId("barcelona_tab_create")  clickable("false")
    var foundWhatNew = false
    var autoViewList = className("android.view.View").find();
    taskLog("当前页面找到 " + autoViewList.length + " 个View");
    if(autoViewList.length > 0){
        for (let i = 0; i < autoViewList.length; i++) {
            if (autoViewList[i] != null) {  
                taskLog("autoViewList[" + i + "] id = " + autoViewList[i].id());
                if(autoViewList[i].id() == "barcelona_tab_create"){
                    taskLog("找到What's new?，开始点击")
                    // autoTextViewList[i].click()
                    click(autoViewList[i].bounds().centerX(), autoViewList[i].bounds().centerY())
                    foundWhatNew = true
                    sleep(random(3000, 5000))
                    break;
                }
            }
        }
    }


    //描述
    var all_TT_DESC_text = []
    if(THREADS_POST_VIDEO_DESC && 
        THREADS_POST_VIDEO_DESC.trim() !== "" && 
        THREADS_POST_VIDEO_DESC.trim().toLowerCase() !== "off" && 
        !THREADS_POST_VIDEO_DESC.includes("$${")){
            all_TT_DESC_text = get_DESC_comment_text()

            //从数组中，随机挑选一条描述
            var randomIndex = Math.floor(Math.random() * all_TT_DESC_text.length);
            var randomDesc = all_TT_DESC_text[randomIndex];
            taskLog("随机挑选的描述 = " + randomDesc)

            //输入内容
            //className("android.widget.EditText") fullId("new_thread_screen_composer") clickable("true")
            var autoEditTextList = className("android.widget.EditText").find();
            taskLog("当前页面找到 " + autoEditTextList.length + " 个EditText");
            if(autoEditTextList.length > 0){
                for (let i = 0; i < autoEditTextList.length; i++) {
                    if (autoEditTextList[i] != null) {
                        taskLog("autoEditTextList[" + i + "] id = " + autoEditTextList[i].id());    
                        if(autoEditTextList[i].id() == "new_thread_screen_composer"){
                            taskLog("找到输入框，开始输入内容")
                            autoEditTextList[i].setText(randomDesc)
                            sleep(random(3000, 5000))
                            break;
                        }   
                    }
                }
            }else{
                taskLog("没有找到输入框，直接无视")
            }
            
    }else{
        taskLog("没有设置文本，所以不需要设文本")
    }


    //图片&视频
    var foundClickIMGAE = false
    if(THREADS_POST_VIDEO_URL && 
        THREADS_POST_VIDEO_URL.trim() !== "" && 
        THREADS_POST_VIDEO_URL.trim().toLowerCase() !== "off" && 
        !THREADS_POST_VIDEO_URL.includes("$${")){

            if(foundWhatNew){
                taskLog("找到What's new?，开始寻找图片按钮")
                var autoButtonList = className("android.widget.Button").find();
                taskLog("当前页面找到 " + autoButtonList.length + " 个按钮");
                if(autoButtonList.length > 0){
                    for (let i = 0; i < autoButtonList.length; i++) {
                        if (autoButtonList[i] != null) {  
                            // 或者输出控件的某个属性
                            taskLog("autoButtonList[" + i + "] id = " + autoButtonList[i].id());
            
                            //点击第一个按钮
                            //fullId("new_thread_screen_gallery_button")
                            if(autoButtonList[i].id() == "new_thread_screen_gallery_button"){
                                taskLog("找到按钮，开始准备寻找图片")
                                autoButtonList[i].click()
                                foundClickIMGAE = true
                                sleep(random(3000, 5000))
                                break;
                            }
                            
                        } else {
                            taskLog("这个位置按钮为空 = " + i + " 个按钮");
                        }
                    }
                }else{
                    taskLog("没有找到按钮，直接无视图片")
                }
        
        
        
                if(foundClickIMGAE){
                    //开始点击图片：className("android.view.ViewGroup") fullId("com.instagram.barcelona:id/gallery_picker_grid_item_container") clickable("true")
                    var autoGalleryList = className("android.view.ViewGroup").find();
                    taskLog("当前页面找到 " + autoGalleryList.length + " 个图片");
                    if(autoGalleryList.length > 0){
                        for (let i = 0; i < autoGalleryList.length; i++) {
                            if (autoGalleryList[i] != null) {  
                                taskLog("autoGalleryList[" + i + "] id = " + autoGalleryList[i].id());
                                if(autoGalleryList[i].id() == THREADS_PACKAGE_NAME + ":id/gallery_picker_grid_item_container"){
                                    taskLog("找到图片，开始点击")
                                    autoGalleryList[i].click()
                                    sleep(random(3000, 5000))

                                    //选中图片之后，点击done ：className("android.widget.Button") text("Done") clickable("true")
                                    var autoDoneButtonList = className("android.widget.Button").find();
                                    taskLog("当前页面找到 " + autoButtonList.length + " 个Button按钮");
                                    if(autoButtonList.length > 0){
                                        for (let i = 0; i < autoButtonList.length; i++) {
                                            if(autoDoneButtonList[i].text() == "Done"){
                                                taskLog("找到Done按钮，开始点击")
                                                autoDoneButtonList[i].click()
                                                sleep(random(3000, 5000))
                                                break;
                                            }
                                        }
                                    }else{
                                        back()
                                    }

                                    break;
                                }
                            }
                        }
                    }

                }

            }
            
    }else{
        taskLog("没有设置图片视频地址，所以不需要上传图片，只设置文字即可")
    }




    //最后点击POST
    //className("android.view.View")  fullId("new_thread_screen_post_button") clickable("false")
    var autoViewList = className("android.view.View").find();
    taskLog("当前页面找到 " + autoViewList.length + " 个View");
    if(autoViewList.length > 0){
        for (let i = 0; i < autoViewList.length; i++) {
            if(autoViewList[i].id() == "new_thread_screen_post_button"){
                taskLog("找到POST按钮，开始点击")
                click(autoViewList[i].bounds().centerX(), autoViewList[i].bounds().centerY())   
                sleep(random(3000, 5000))
                break;
            }
        }
    }






    

    

} catch (e) {
    handleError(e);
}
// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);


//******************************************************************
//***********************Threads指定追縱用戶*************************
//******************************************************************




//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


//用户需要输入的关注用户ID列表
const TT_Like_User_ID_GROUP = '$${T_輸入用戶ID}';

var THREADS_PACKAGE_NAME = 'com.instagram.barcelona';


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
        console.error("Tiktok关注：根據關注列表UID的順序，去關注用戶---------------");
        console.error("脚本执行时间：" + new Date().toLocaleString());
    }else{
        console.log("-----------------脚本功能执行结束：---------------");
        console.error("Tiktok关注：根據關注列表UID的順序，去關注用戶---------------");
        console.log("脚本执行时间：" + new Date().toLocaleString());
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


function handleError(e) {
    handleErrorFlag = true
    forceStop_APP(THREADS_PACKAGE_NAME)
    console.error("===错误报告开始===");
    console.error("错误信息：" + e);
    console.error("错误堆栈：" + e.stack);
    console.error("===错误报告结束===");
    exit()
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
taskLog("准备启动Threads...")

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


function throw_error_storage_not_enough(){
    throw new Error("当前设备的存储空间不可用，请关机重启一次设备，然后重新执行一次脚本")
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





//点击首页的右上角Search按钮
function click_home_search_btn(){
    //点击搜索按钮
    //fullId("com.instagram.android:id/search_tab")
    clickId("com.instagram.android:id/search_tab")
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


//输入需要关注的用户ID之后，找到第一个User的LinearLayout
function click_LinearLayout_GUANZHU(){

    var clickSuccess = false
    sleep(random(2000, 5000))
    var allButton = className("android.widget.Button").id("com.instagram.android:id/row_search_avatar_with_ring").find();
    taskLog("头像.size() = " + allButton.size());

    if (allButton && allButton.size() > 0) {
        for (var i = 0; i < allButton.size(); i++) {
            var button = allButton.get(i);
            if (button) {
                button.click()
                clickSuccess = true
                break;
            
        }
    }
         sleep(random(2000, 5000))
    }else{
        taskLog("没有找到头像控件，直接回退上一页")
    }

    return clickSuccess

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



function get_all_TT_User_ID_text(){
    let comments = [];
    // 户是否存在
    // taskLog("Ins评论数组 =  " + TT_Like_User_ID_GROUP)
    const file = new java.io.File(TT_Like_User_ID_GROUP);
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
        comments.push(TT_Like_User_ID_GROUP);
    }

    if (TT_Like_User_ID_GROUP.trim().toLowerCase() == 'off') {
        comments = [];
    }
    
    return comments
}


try{
    
    taskLog("打开Threads成功，首页会停留10-15秒...")
    sleep(random(10000, 15000))


    // 如果get_all_TT_User_ID_text等于'off'，则清空用户USER_ID列表
    
    var UserIDList = get_all_TT_User_ID_text()  

    if(UserIDList.includes("$${T")){ 
        throw_error_storage_not_enough()
    }
    taskLog("可用的搜索用户ID, 一共的数量有： " + UserIDList.length);


    taskLog("开始点击首页搜索按钮")
    // className("android.view.View") fullId("barcelona_tab_search") clickable("false")
    var foundSearch = false
    var autoViewList = className("android.view.View").find();
    taskLog("当前页面找到 " + autoViewList.length + " 个View");
    if(autoViewList.length > 0){
        for (let i = 0; i < autoViewList.length; i++) {
            if (autoViewList[i] != null) {  
                taskLog("autoViewList[" + i + "] id = " + autoViewList[i].id());
                if(autoViewList[i].id() == "barcelona_tab_search"){ 
                    taskLog("找到搜索按钮，开始点击")
                    click(autoViewList[i].bounds().centerX(), autoViewList[i].bounds().centerY())
                    foundSearch = true
                    sleep(random(3000, 5000))
                    break;
                }
            }
        }
    }
    


    
    // 按照顺序开始执行搜索User-ID
    if (UserIDList.length > 0) {

        //要删除UserIDList中所有的空格
        UserIDList = UserIDList.map(item => item.trim());


        taskLog("- 找到可用的搜索用户ID, UserIDList.length = " + UserIDList.length);
        for (var randIdx = 0; randIdx < UserIDList.length; randIdx++) {
            var commentText = UserIDList[randIdx];
            taskLog("- 找到可用的搜索用户ID: "+commentText+", 开始搜索 - ");


            // EditText :className("android.widget.EditText") fullId("BasicTextField") clickable("true")
            var search_edit = className("android.widget.EditText").findOne()
            if(search_edit){
                taskLog("找到搜索框控件，开始点击搜索框控件")
                search_edit.click()
                sleep(random(3000, 5000))

                // 清空搜索框内容
                search_edit.setText("")
                sleep(random(3000, 5000))
                taskLog("搜索控件，设置内容：" +commentText );

                // 输入搜索内容，注意要删除@符号
                if(commentText.startsWith("@")){
                    search_edit.setText(commentText.substring(1));
                    sleep(random(3000, 5000))
                }else{
                    search_edit.setText(commentText);
                    sleep(random(3000, 5000))
                }



                //会出现一个搜索结果，直接点击第一个
                // className("android.widget.Button") desc("追蹤") desc("Follow")
                var allFollowButton = className("android.widget.Button").find()  
                if(allFollowButton.length > 0){
                    taskLog("找到搜索头像控件，开始点击Follow, 页面的follow长度 = " + allFollowButton.length)

                    for(var i = 0; i < allFollowButton.length; i++){
                        //clickable("true")
                        if(allFollowButton[i].desc() == "追蹤" || allFollowButton[i].desc() == "Follow"){  
                            taskLog("找到Follow按钮，开始Follow ："+ commentText)
                            allFollowButton[i].click()
                            sleep(random(3000, 5000))
                            back()
                            sleep(random(3000, 5000))
                            break; // 找到后就退出循环
                        }
                    }

                }else{
                    taskLog("当前页面没有Follow按钮，直接开始寻找下一个用户");
                }


            }else{
                taskLog("没有找到搜索框控件，终止本次操作，开始下一个用户的Follow行为！！！");
            }


        }
        
    }else{
        toast("- 没有可用的搜索用户ID, 忽略 - ");
        throw new error("没有可用的搜索用户ID，无法关注，所以报错")
    }

}catch(e) {
    handleError(e);
}

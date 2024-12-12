// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************Tiktok私信：根據私訊列表UID的順序，去私訊​​用戶  *************************
//******************************************************************


//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


//用户需要输入的关注用户ID列表
const TT_Like_User_ID_GROUP = '$${T_关注用户ID列表}';
const TT_Message_GROUP = '$${T_私信用户文案列表}';

var TikTokPackageName = 'com.ss.android.ugc.trill';



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
        forceStop_titkok()
        console.log("-----------------脚本功能执行结束：---------------");
        console.log("Tiktok私信：根據私訊列表UID的順序，去私訊​​用戶---------------");
        console.log("脚本执行时间：" + new Date().toLocaleString());
    }
    openLogActivity();
});

function handleError(e) {
    handleErrorFlag = true
    forceStop_titkok()
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
    console.log(getSystemDate("df") +":" +_log)
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
                    //  clickText(findText_ZH_CN)
                    
                    click(button1.bounds().centerX(), button1.bounds().centerY())
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
                    click(button3.bounds().centerX(), button3.bounds().centerY())
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
                findText_result = true
                break; // 跳出循环
            }else if(button2){
                taskLog("找到" + findText_ZH_TW);
                taskLog("找到" + button2.clickable());
                clickText(findText_ZH_TW)
                findText_result = true
                break; // 跳出循环
            }else if(button3){
                taskLog("找到" + findText_EN_US);
                taskLog("找到" + button3.clickable());
                clickText(findText_EN_US)
                findText_result = true
                // click(button3.bounds().centerX(), button3.bounds().centerY())
                break; // 跳出循环
            }

            sleep(1000)

        }
        return findText_result
    }


    //强制停止TikTok 
    function forceStop_titkok(){
        taskLog("准备强杀TikTok...")
        sleep(1000);
        app.openAppSetting(TikTokPackageName)
        sleep(3000)

        //繁体
        if (text("強行停止").exists()) {
            let forceStopBtn = text("強行停止").findOne();
            if (forceStopBtn && forceStopBtn.clickable()) {
                forceStopBtn.click();
                sleep(1000);
                // 确认操作
                if (text("確定").exists()) {
                    taskLog("已经找到可点击的‘強行停止’按钮！！！！！！！！！！");
                    text("確定").findOne().click();
                }
            } else {
                taskLog("未找到可点击的‘強制停止’按钮");
            }
        } else {
            taskLog("未找到‘強制停止’按钮");
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
                taskLog("未找到可点击的‘强行停止’按钮");
            }
        } else {
            taskLog("未找到‘强行停止’按钮");
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
                taskLog("未找到可点击的‘Force stop’按钮");
            }
        } else {
            taskLog("未找到‘Force stop’按钮");
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
                taskLog("未找到可点击的‘FORCE STOP’按钮");
            }
        } else {
            taskLog("未找到‘FORCE STOP’按钮");
        }
        sleep(3000)


        home()

    }


    

    //点击首页的右上角Search按钮
    function click_home_search_btn(){

        var find_search_btn_count = 0
        if(find_search_btn_count > 3){
            console.error("首页寻找‘搜索’按钮超过3次，抛出异常")
            throw new error("首页寻找‘搜索’按钮超过3次，抛出异常")
        }
        sleep(random(2000, 5000))

        var allImages = className("android.widget.ImageView").boundsInside(0, 0, device.width, device.height).find();
        // var allImages = className("android.widget.ImageView").find();
        if (allImages && allImages.size() > 0) {
            for (var i = 0; i < allImages.size(); i++) {
                var img = allImages.get(i);
                if (img) {
                    taskLog("找到Image控件-Text：" + img.text() + ";ID = " + img.id());
                    
                    // 检查ID是否为"en4"
                    if (img.id() == (TikTokPackageName +":id/en4")) {
                        // 正确调用bounds()方法并点击
                        taskLog("找到Image控件: 首页搜索框！" );
                        taskLog("找到Image控件: 首页搜索框，属性 = " +  img.clickable());
                        
                        if(img.clickable()) {
                            img.click()
                        }else{

                            // for (obj_Text = text(a).boundsInside(5, 5, device.width-5, device.height-5); obj_Text.find().empty(); ) sleep(1e3);
                            // X = obj_Text.find().get(0).bounds().centerX(), Y = obj_Text.find().get(0).bounds().centerY(),
                            // Deviation = random(-5, 5), X1 = X - Deviation, Y1 = Y - Deviation, device.sdkInt<24?ra.tap(X1,Y1):click(X1,Y1);

                            var bounds = img.bounds();
                            taskLog("找到Image控件: 首页搜索框，centerX属性 = " +  bounds.centerX());
                            taskLog("找到Image控件: 首页搜索框，centerY属性 = " +  bounds.centerY());    
                            click(bounds.centerX(), bounds.centerY());
                        }
                        // 找到并点击后可以跳出循环
                        break;
                    }
                }
            }
        }else{
            //有可能是正在直播，需要滑到下一个
            swipe_to_up()
            find_search_btn_count ++ 
        }
        sleep(random(2000, 5000))
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
                    
                    // 检查ID是否为"r7e"
                    if (btn.id() == (TikTokPackageName +":id/r7e")) {
                        // 正确调用bounds()方法并点击
                        taskLog("找到Button控件: 第二个页面的搜索框！" );

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


    //输入需要私信用户ID之后，找到第一个User的LinearLayout
    function click_LinearLayout_GUANZHU(){

        sleep(random(2000, 5000))
        var allLinearLayout = className("android.widget.LinearLayout").find();
        if (allLinearLayout && allLinearLayout.size() > 0) {
            for (var i = 0; i < allLinearLayout.size(); i++) {
                var linearLayout = allLinearLayout.get(i);
                if (linearLayout) {
                    // taskLog("找到linearLayout控件-Text：" + linearLayout.text() + ";ID = " + linearLayout.id());
                    
                    // 检查ID是否为"hvl"
                    if (linearLayout.id() == (TikTokPackageName +":id/hvl")) {
                        // 正确调用bounds()方法并点击
                        taskLog("找到LinearLayout控件:开始点击第一个" );

                        var x = linearLayout.bounds().centerX()
                        var y = linearLayout.bounds().centerY()
                        taskLog("找到LinearLayout控件,坐标X = "+x );
                        taskLog("找到LinearLayout控件,坐标y = "+y );

                        // 找到并点击后可以跳出循环
                        if(x > 0 && y > 0) {
                            click(x, y);
                        }     
                        break;
                    }
                }
            }
        }
        sleep(random(2000, 5000))
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

    //点击收藏按钮
    function click_Save_Btn(){
        taskLog("开始准备收藏视频")
        // id("egc").className("android.widget.ImageView").findOne().click()
        clickId("egc")

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



try {
    
    forceStop_titkok()

    sleep(3000)
    taskLog("准备启动TikTok...")
    sleep(5000)
    app.startActivity({
        action: "android.intent.action.VIEW",
        packageName: TikTokPackageName,
        className: "com.ss.android.ugc.aweme.main.MainActivity"
    });



    taskLog("打开TikTok成功...")
    sleep(10000)


    close_friend_suggest()


    // 用于存储私信用户的数组
    let comments = [];
    // 私信用户是否存在
    taskLog("私信用户地址 =  " + TT_Like_User_ID_GROUP)
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

    // 如果TT_Like_User_ID_GROUP等于'off'，则清空用户USER_ID列表
    if (TT_Like_User_ID_GROUP == 'off') {
        comments = [];
    }

    // 输出结果，用于调试
    taskLog(comments);



    // 用于存储私信文案的数组
    let messages = [];
    // 检查文件是否存在
    taskLog("私信文案地址 =  " + TT_Message_GROUP)
    const msg_file = new java.io.File(TT_Message_GROUP);
    if (msg_file.exists() && msg_file.isFile()) {
        try {
            // 读取文件内容
            const msg_reader = new java.io.BufferedReader(new java.io.FileReader(msg_file));
            let msg_line;
            while ((msg_line = msg_reader.readLine()) !== null) {
                messages.push(msg_line);
            }
            msg_reader.close();
        } catch (e) {
            taskLog("读取文件时发生错误：" + e.message);
        }
    } else {
        // 如果文件不存在，将文件名添加到数组中
        messages.push(TT_Message_GROUP);
    }

    if (TT_Message_GROUP == 'off') {
        messages = [];
    }

    // 输出结果，用于调试
    taskLog(messages);




    //******************************************************************
    //******************************************************************
    //******************************************************************

    sleep(random(2000, 4000))
    click_home_search_btn()
    sleep(random(2000, 4000))





    // 按照顺序开始执行搜索User-ID
    if (comments.length > 0) {
        taskLog("- 找到可用的搜索用户, 开始搜索 - ");
        for (var index_user = 0; index_user < comments.length; index_user++) {

            taskLog("开始准备获取comments的下标 = " + index_user)
            sleep(5000)
            var commentText = comments[index_user];
            taskLog("- 找到可用的搜索用户ID: "+commentText+", 开始搜索 - ");
            taskLog("开始准备点击首页搜索按钮")


            var search_edits = className("android.widget.EditText").find();
            for(var i = 0; i < search_edits.size(); i++) {
                var search_edit = search_edits.get(i);
                if(search_edit) {
                    taskLog("找到TextView控件-Text："+ search_edit.text());
                    sleep(1000)
                    taskLog("搜索控件，设置内容：" +commentText );
                    search_edit.setText(commentText)    
                    sleep(random(5000, 8000))
                    
                    taskLog("开始点击Search按钮")
                    click_Second_search_btn()



                    sleep(random(5000, 8000))
                    taskLog("开始点击视频Tab按钮")
                    var findMSGTextResult = find_textview_text_base("用户","使用者","Users")
                    // console.show()
                    taskLog("findMSGTextResult = "+ findMSGTextResult);

                    if(!findMSGTextResult) {
                        taskLog("没有找到用户Tab控件，终止本次操作，开始下一个用户的私信行为！！！");
                        click_back_btn()
                        break
                    }

                    sleep(random(5000, 8000))
                    //直接点击第一个关注按钮
                    click_LinearLayout_GUANZHU()

                    sleep(random(2000, 4000))

                    // console.show()
                    //text("消息")：点击User的主页的"消息"按钮，准备发信息
                    var findMSGTextResult = find_textview_text_base("消息", "訊息", "Message")
                    if(!findMSGTextResult) {
                        taskLog("没有找到消息控件，终止本次操作，开始下一个用户的私信行为！！！");
                        sleep(3000)
                        click_back_btn()
                        sleep(1000)
                        click_back_btn()
                        sleep(3000)
                        break
                    }
                    sleep(random(2000, 4000))

                    var autoCompleteTextViews = className("android.widget.EditText").find();
                    for(var i = 0; i < autoCompleteTextViews.size(); i++) {
                        var textView = autoCompleteTextViews.get(i);
                        if(textView) {
                            taskLog("找到TextView控件-Text："+ textView.text());
                            sleep(1000)

                            var randIdx = random(0, messages.length - 1)
                            taskLog("评论文案的下标randIdx："+randIdx)
                            var messageText = messages[randIdx];

                            taskLog("评论控件，设置内容：" +messageText );

                            textView.setText(messageText)
                            sleep(random(2000, 4000))
            
                

                            //点击发送按钮
                            className("android.widget.ImageView").find().forEach((iv, idx) => {
                                taskLog("ImageView " + idx + ": " + iv.bounds());
                            });

                            taskLog("开始寻找发送按钮.....")
                            taskLog("开始寻找发送按钮,device.width * 0.9 = " + device.width * 0.9)
                            taskLog("开始寻找发送按钮,device.height * 0.9 = " + device.height * 0.9)


                            let sendButton = className("android.widget.ImageView")
                            .filter(function(w) {
                                let b = w.bounds();
                                // 检查是否在右下角区域
                                return b.centerX() > device.width * 0.8 && b.centerY() > device.height * 0.8;
                            }).findOne(5000);



                            // 点击按钮
                            if(sendButton) {
                                taskLog("找到发送按钮，开始点击")
                                let bounds = sendButton.bounds();
                                click(bounds.centerX(), bounds.centerY());
                                
                            }else{
                                taskLog("没有找到私信发送按钮！！！！")
                                // throw new Error("没有找到私信发送按钮，所以报错"); 
                            } 

                            sleep(3000)
                            click_back_btn()
                            sleep(1000)
                            click_back_btn()
                            sleep(1000)
                            click_back_btn()
                            sleep(5000)
                        }
                    }



                    
                    sleep(random(2000, 4000))
                    click_back_btn()
                    sleep(random(2000, 4000))
        
                }
            }


        }
        
    }else{
        taskLog("- 没有可用的搜索关键字文案, 忽略 - ");
    }

 
} catch(e) {
    handleError(e);
}



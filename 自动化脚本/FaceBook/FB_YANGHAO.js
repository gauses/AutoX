// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************Facebook首页点赞 + 留言*************************
//******************************************************************




//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


//用户需要输入的评论内容
const FB_Like_Count = "$${點讚概率}" //点赞概率
const FB_Comment_Count = "$${留言概率}" //评论概率
const FB_input_text = '$${T_FB_输入评论文案}';
const FB_input_Time = "$${FB_自定義总执行次数}"


// 计算循环次数
const loopTimes = FB_input_Time;
taskLog("自定義瀏覽总执行次数：" + loopTimes + "次");

var FacebookPackageName = 'com.facebook.katana';


//1.autox.js侧边栏的打开USB调试先打开
//2.vscode ctrl+shift+p 输入start all server 确定
//3.远程连接成功

//个人发文

//会在在无障碍服务启动后继续运行。
auto.waitFor();

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
taskLog("准备启动Facebook...")

var targetPackageName = null;
var targetClassName = null;

function throw_error_storage_not_enough(){
    throw new Error("当前设备的存储空间不可用，请关机重启一次设备，然后重新执行一次脚本")
}

// 替代 app.openAppSetting 的方式
function openAppSettings(packageName) {
    var intent = new Intent();
    intent.setAction(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
    intent.setData(android.net.Uri.parse("package:" + packageName));
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
    app.startActivity(intent);
}

function isAppInstalled(packageName) {
    var pm = context.getPackageManager();
    try {
        pm.getPackageInfo(packageName, 0);
        return true;
    } catch (e) {
        return false;
    }
}


function openFacebookLink_test(fbUrl){


    //是否打开成功，如果打开失败，那么直接进行下一个任务
    var openUrlFlag = false

    taskLog("准备打开链接 = " + fbUrl)
    var intent = new android.content.Intent(android.content.Intent.ACTION_VIEW);
    // intent.setData(android.net.Uri.parse("https://www.facebook.com/watch/huacemedia/")); //不行
    // intent.setData(android.net.Uri.parse("https://www.facebook.com/samsul.ujex"));  //加好友，异常
    // intent.setData(android.net.Uri.parse("https://www.facebook.com/share/r/1CdK7F3fRp/"));  //Reels -OK
    // intent.setData(android.net.Uri.parse("https://www.facebook.com/groups/850798899131453/"));  //Group -OK
    // intent.setData(android.net.Uri.parse("https://www.facebook.com/share/v/16cLEnDJoT/"));   //Live - OK
    // intent.setData(android.net.Uri.parse("https://www.facebook.com/profile.php?id=100079449592509"));  //Friend - OK
    // intent.setData(android.net.Uri.parse("https://www.facebook.com/share/v/14Dj3UQ6q2b/"));  //watch - OK（https://www.facebook.com/watch/?v=689492360538949&rdid=PU3MOv69wqSgVeh5）
    
    intent.setData(android.net.Uri.parse(fbUrl));
    intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
    intent.setPackage("com.facebook.katana");
    try {
        app.startActivity(intent);
        openUrlFlag = true
    } catch (e) {

        // 如果 Facebook App 无法处理，则用浏览器打开
        taskLog("Facebook无法处理该链接，所以跳过 = " + fbUrl);
        // var browserIntent = new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(fbUrl));
        // browserIntent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK);
        // app.startActivity(browserIntent);
        // openUrlFlag = true
    }

    return openUrlFlag
}



if (isAppInstalled(FacebookPackageName)) {
    targetPackageName = FacebookPackageName;
    targetClassName = "com.facebook.katana.activity.FbMainTabActivity";
    taskLog("检测到已安装Facebook，准备启动...");
} else {
    toast("未检测到Facebook已安装，请先安装Facebook！");
    taskLog("未检测到Facebook已安装，脚本终止。");
    exit();
}

sleep(random(3000, 5000))
forceStop_APP(targetPackageName)
sleep(3000)

app.startActivity({
    action: "android.intent.action.VIEW",
    packageName: targetPackageName,
    className: targetClassName
});


//跳转到Watch页面
function jump_to_watch_page(){
    openFacebookLink_test("fb://watch")

    var swipeCount = random(5, 8)
    for(let i = 0; i < swipeCount; i++){
        taskLog("watch页面滑动观看次数：" + (i + 1) + "/" + swipeCount)
        swipe_up()
        sleep(random(5000, 8000))
    } 

}


//打开好友列表
function jump_to_friends_page(){
    openFacebookLink_test("fb://friends")
    sleep(random(3000, 5000))
    swipe_up()
    sleep(random(5000, 8000))
}

//打开通知列表
function jump_to_notifications_page(){
    openFacebookLink_test("fb://notifications")
    sleep(random(3000, 5000))
    swipe_up()
    sleep(random(5000, 8000))
}

//搜索关键词
function search_keyword(keyword){
    openFacebookLink_test("fb://search?q=" + keyword)
    sleep(random(3000, 5000))
    swipe_up()
    sleep(random(5000, 8000))
}

//打开动态首页
function jump_to_home_page(){
    openFacebookLink_test("fb://feed")
    sleep(random(3000, 5000))
    swipe_up()
    sleep(random(5000, 8000))
}

//打开群组列表
function jump_to_groups_page(){
    openFacebookLink_test("fb://groups")
    sleep(random(3000, 5000))
    swipe_up()
    sleep(random(5000, 8000))
}

//打开好友请求列表
function jump_to_friends_requests_page(){
    openFacebookLink_test("fb://friends/requests")
    sleep(random(3000, 5000))
    swipe_up()
    sleep(random(5000, 8000))
}


//打开活动列表
function jump_to_events_page(){
    openFacebookLink_test("fb://events")
    sleep(random(3000, 5000))
    swipe_up()
    sleep(random(5000, 8000))
}


//打开消息列表
function jump_to_messages_page(){
    openFacebookLink_test("fb://messages")
    sleep(random(3000, 5000))
    swipe_up()
    sleep(random(5000, 8000))
}


//打开页面列表
function jump_to_pages_page(){
    openFacebookLink_test("fb://pages")
    sleep(random(3000, 5000))
    swipe_up()
    sleep(random(5000, 8000))
}




// 开始主循环
var commentTextArrays = get_post_text()

if(commentTextArrays.includes("$${T")){ 
    throw_error_storage_not_enough()
}
toast("评论文案个数：" + commentTextArrays.length)

//随机跳转页面的功能封装
function random_jump_pages(options) {
    // 如果没有传入options，使用空对象
    options = options || {};
    
    // 默认配置
    var minJumps = options.minJumps || 3;           // 最少跳转页面数
    var maxJumps = options.maxJumps || 5;           // 最多跳转页面数
    var keywords = options.keywords || ["lolita", "fashion", "style", "beauty"]; // 搜索关键词池
    var sleepTimeMin = (options.sleepTime && options.sleepTime.min) || 3000;    // 最小等待时间
    var sleepTimeMax = (options.sleepTime && options.sleepTime.max) || 5000;    // 最大等待时间
    var swipeCountMin = (options.swipeOptions && options.swipeOptions.count && options.swipeOptions.count.min) || 1;  // 最少滑动次数
    var swipeCountMax = (options.swipeOptions && options.swipeOptions.count && options.swipeOptions.count.max) || 3;  // 最多滑动次数
    
    // 随机确定本次跳转的页面数量
    var jumpCount = random(minJumps, maxJumps);
    
    // 随机选择一个搜索关键词
    var keyword = keywords[Math.floor(Math.random() * keywords.length)];

    taskLog("开始随机跳转到各个页面，计划跳转" + jumpCount + "个页面")

    // 定义所有可能的跳转操作
    const jumpOperations = [
        {
            name: "Watch页面",
            func: jump_to_watch_page
        },
        {
            name: "好友列表页面",
            func: jump_to_friends_page
        },
        {
            name: "通知列表页面",
            func: () => {
                jump_to_notifications_page();
                search_keyword(keyword);
            }
        },
        {
            name: "群组页面",
            func: jump_to_groups_page
        },
        {
            name: "好友请求页面",
            func: jump_to_friends_requests_page
        },
        {
            name: "活动页面",
            func: jump_to_events_page
        },
        {
            name: "消息页面",
            func: jump_to_messages_page
        },
        {
            name: "页面列表页面",
            func: jump_to_pages_page
        }
    ];

    // 参数验证
    if (jumpCount > jumpOperations.length) {
        jumpCount = jumpOperations.length;
        taskLog("警告：请求的跳转页面数量超过可用页面数量，已自动调整为" + jumpCount);
    }

    // 随机打乱数组
    let shuffledOperations = jumpOperations.slice();
    for (let i = shuffledOperations.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOperations[i], shuffledOperations[j]] = [shuffledOperations[j], shuffledOperations[i]];
    }

    // 选择指定数量的操作执行
    for (let i = 0; i < jumpCount; i++) {
        const operation = shuffledOperations[i];
        taskLog("跳转到" + operation.name);
        operation.func();
    }
}

// 执行随机跳转（默认跳转3个页面）
// random_jump_pages()

jump_to_home_page()
sleep(random(3000, 5000))
swipe_up()
sleep(random(5000, 8000))
random_jump_pages()
sleep(random(5000, 8000))
jump_to_home_page()
sleep(random(3000, 5000))
for(let currentLoop = 1; currentLoop <= loopTimes; currentLoop++) {
    toast("开始第 " + currentLoop + "/" + loopTimes + " 次执行");    
    sleep(random(3000, 5000))

    
    if(currentLoop % 5 == 0){
        random_jump_pages()
    }
    jump_to_home_page()


    toast("开始模拟滑动")
    swipe_up()


    sleep(5000)

    //检查是不是有点赞按钮
    var likeBtnList = className("android.view.ViewGroup").find();
    if(likeBtnList.size() > 0){
        for(var i = 0; i < likeBtnList.size(); i++) {
            var likeBtn = likeBtnList.get(i);
            if(likeBtn){
                if (likeBtn.desc() == "Like" || likeBtn.desc() == "讚" || likeBtn.desc() == "Like" )  {

                    if (Math.random() * 100 < FB_Like_Count)  {
                        taskLog("开始触发点赞概率")
                        click(likeBtn.bounds().centerX() , likeBtn.bounds().centerY())  
                        sleep(random(3000, 5000))
                    }else{
                        taskLog("虽然找到点赞按钮，没有触发点赞概率")
                    }
                                


                }else if(likeBtn.desc() == "Comment" || likeBtn.desc() == "留言" || likeBtn.desc() == "Comment"){

                    if (Math.random() * 100 < FB_Comment_Count)  { 

                        if(FB_input_text && 
                            FB_input_text.trim() !== "" && 
                            FB_input_text.trim().toLowerCase() !== "off" && 
                            !FB_input_text.includes("$${")){

                                if(commentTextArrays.length > 0){

                                    click(likeBtn.bounds().centerX() , likeBtn.bounds().centerY())  
        
                                    var randIdx = random(0, commentTextArrays.length - 1)
                                    var messageText = commentTextArrays[randIdx];
                        
                                    toast("评论文案：" + messageText)
                                    sleep(random(5000, 8000))
                        
                                    var autoCompleteTextViews = className("android.widget.AutoCompleteTextView").find();
                                    if(autoCompleteTextViews.size() > 0 ){
                                        for(var i = 0; i < autoCompleteTextViews.size(); i++) {
                                            var textView = autoCompleteTextViews.get(i);
                                            if(textView) {
                                                taskLog("找到AutoCompleteTextView控件-Text："+ textView.text());
                                                sleep(2000)
                                                textView.setText(messageText)
                                            }
                                        }
                                    }
                            
                                    //发送
                                    sleep(5000)
                                    find_btn_desc_base("傳送", "Send" , "Send")
        
                                    sleep(5000)
                                    back() //键盘收起
                                    sleep(1000)
                                    back() //返回上一个页面
        
                                }else{
                                    toast("评论文案为空，所以不点击评论按钮");
                                }

                            }else{
                                toast("没有填写输入内容或者输入内容有误，所以跳过输入内容")
                            }




                    }else{
                        taskLog("虽然找到评论按钮，没有触发评论概率")
                    }
                    break;

                }else{
                    taskLog("没有找到点赞或者评论按钮，直接下一个循环页面")
                }
            }
        }


    }else{
        taskLog("没有找到任何ViewGroup，直接下一个循环页面")
    }

    if(currentLoop < loopTimes) {
        taskLog("等待5秒后开始下一次循环...");
        toast("等待5秒后开始下一次循环...");
        sleep(5000);
    }
}

taskLog("所有循环执行完毕，准备结束任务...");
stopCurrentTask()






//打印日志
function taskLog(_log){
    console.log(getSystemDate("df") +":" +_log)
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

function clickId(a) {
    for (obj_ID = id(a).boundsInside(5, 5, device.width-5, device.height-5); obj_ID.find().empty(); ) sleep(1e3);
    X = obj_ID.find().get(0).bounds().centerX(), Y = obj_ID.find().get(0).bounds().centerY(),
    Deviation = random(-10, 10), X1 = X - Deviation, Y1 = Y - Deviation, device.sdkInt<24?ra.tap(X1,Y1):click(X1,Y1);
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
    // //将task的截图上报
    // var res = http.postMultipart(url, {
    //     taskId: "xxxxxxxxxxx",
    //     file: open("/sdcard/Download/" + taskLogImgName)
    // });
    // log(res.body.string());

    console.hide()
    forceStop_APP(FacebookPackageName)
    sleep(3000)

}


//通过Button的Text
function find_btn_Text_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US){

        var loopCount  = 0

         while (true) {
             taskLog(findText_ZH_CN + " - 循环寻找执行：" + (++loopCount));
             // 检查计数器是否达到3
             if (loopCount >= 3) {
                 // 打印一条消息并退出循环
                 taskLog("寻找" + findText_ZH_CN + "按钮失败");
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
             }

             sleep(1000)

         }
}



//通过Button的Desc
function find_btn_desc_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US){

        var findBtn = false

        var loopCount  = 0

         while (true) {
             taskLog(findText_ZH_CN + " - 循环寻找执行：" + (++loopCount));
             // 检查计数器是否达到3
             if (loopCount >= 3) {
                 // 打印一条消息并退出循环
                 taskLog("寻找" + findText_ZH_CN + "按钮失败");
                 taskLog("循环已执行3次，即将退出循环。");

                 //不能抛出异常，因为可能Facebook记忆功能，自动跳转到输入页面
//                 throw new Error(findText_ZH_CN +"按钮没有找到");
                break;
             }


             // 查找控件
             var button1 = className("android.widget.Button").desc(findText_ZH_CN).findOne(1000);
             var button2 = className("android.widget.Button").desc(findText_ZH_TW).findOne(1000);
             var button3 = className("android.widget.Button").desc(findText_EN_US).findOne(1000);
             if (button1) {
                 findBtn = true
                 taskLog("找到" + findText_ZH_CN);
                 button1.click();
                 break; // 跳出循环
             }else if(button2){
                 findBtn = true
                 taskLog("找到" + findText_ZH_TW);
                 button2.click();
                 break; // 跳出循环
             }else if(button3){
                 findBtn = true
                 taskLog("找到" + findText_EN_US);
                 button3.click();
                 break; // 跳出循环
             }

             sleep(1000)

         }

         return findBtn

}


//从评论列表数组中，随机挑选一条内容
function get_post_text(){
    // 用于存储用户的数组
    let comments = [];
    // 户是否存在
    taskLog("用户地址 =  " + FB_input_text)
    const file = new java.io.File(FB_input_text);
    if (file.exists() && file.isFile()) {
        try {
            // 读取文件内容
            const reader = new java.io.BufferedReader(new java.io.FileReader(file));
            let line;
            while ((line = reader.readLine()) !== null) {
                // 去除首尾空格后判断是否为空行
                if (line.trim() !== "") {
                    comments.push(line);
                }
            }
            reader.close();
        } catch (e) {
            taskLog("读取文件时发生错误：" + e.message);
        }
    } else {
        // 如果文件不存在，将文件名添加到数组中
        comments.push(FB_input_text);
    }    
    return comments
}



function swipe_up(options){
    //如果没有传入options，使用空对象
    options = options || {};
    
    //默认配置
    var startYPercent = options.startYPercent || 0.9;    // 起点Y位置（屏幕高度的百分比）
    var endYPercent = options.endYPercent || 0.1;      // 终点Y位置（屏幕高度的百分比）
    var maxOffsetX = options.maxOffsetX || 0.2;       // 最大X轴偏移量（屏幕宽度的百分比）
    var durationFirst = (options.duration && options.duration.first) || 700;  // 第一段滑动持续时间
    var durationSecond = (options.duration && options.duration.second) || 700; // 第二段滑动持续时间
    var durationThird = (options.duration && options.duration.third) || 600;  // 第三段滑动持续时间
    var interval = options.interval || 200;         // 段与段之间的间隔时间
    var endDelay = options.endDelay || random(2000, 3000);  // 滑动完成后的等待时间
    
    var screenHeight = device.height;
    var screenWidth = device.width;
    var startY = Math.floor(screenHeight * startYPercent);
    var endY = Math.floor(screenHeight * endYPercent);
    var distance = startY - endY;
    
    // 随机生成X轴偏移量，使滑动轨迹更自然
    var offsetX = screenWidth * maxOffsetX * (Math.random() > 0.5 ? 1 : -1);
    var centerX = screenWidth / 2;
    
    try {
        // 第一段：偏向一侧
        swipe(
            centerX,
            startY,
            centerX + offsetX,
            startY - distance/3,
            durationFirst
        );
        sleep(interval);
        
        // 第二段：偏向另一侧
        swipe(
            centerX + offsetX,
            startY - distance/3,
            centerX - offsetX,
            startY - distance*2/3,
            durationSecond
        );
        sleep(interval);
        
        // 第三段：回到中间
        swipe(
            centerX - offsetX,
            startY - distance*2/3,
            centerX,
            endY,
            durationThird
        );
        
        // 等待滑动完成
        sleep(endDelay);
        return true;
    } catch(e) {
        taskLog("滑动失败：" + e.message);
        return false;
    }
}




//通过Button的Desc
function find_viewGroup_desc_base(findText_ZH_CN, findText_ZH_TW, findText_EN_US){

    var findBtn = false

    var loopCount  = 0

     while (true) {
         taskLog(findText_ZH_CN + " - 循环寻找执行：" + (++loopCount));
         // 检查计数器是否达到3
         if (loopCount >= 3) {
             // 打印一条消息并退出循环
             taskLog("寻找" + findText_ZH_CN + "按钮失败");
             taskLog("循环已执行3次，即将退出循环。");

             //不能抛出异常，因为可能Facebook记忆功能，自动跳转到输入页面
//                 throw new Error(findText_ZH_CN +"按钮没有找到");
            break;
         }


         // 查找控件
         var button1 = className("android.view.ViewGroup").desc(findText_ZH_CN).findOne(1000);
         var button2 = className("android.view.ViewGroup").desc(findText_ZH_TW).findOne(1000);
         var button3 = className("android.view.ViewGroup").desc(findText_EN_US).findOne(1000);
         if (button1) {
             findBtn = true
             taskLog("找到" + findText_ZH_CN);
             click(button1.bounds().centerX() , button1.bounds().centerY())
             break; // 跳出循环
         }else if(button2){
             findBtn = true
             taskLog("找到" + findText_ZH_TW);
             click(button2.bounds().centerX() , button2.bounds().centerY())
             break; // 跳出循环
         }else if(button3){
             findBtn = true
             taskLog("找到" + findText_EN_US);
             click(button3.bounds().centerX() , button3.bounds().centerY())
             break; // 跳出循环
         }

         sleep(1000)

     }

     return findBtn

}


//强制停止TikTok 
function forceStop_APP(packageName){
    taskLog("准备强杀:" + packageName + "...")
    sleep(1000);
    openAppSettings(packageName)
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
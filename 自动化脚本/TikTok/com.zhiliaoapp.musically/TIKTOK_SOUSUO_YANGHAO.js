// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************Tiktok首页搜索养号*************************
// mx-phone-2  - drewryapilado@gmail.com
//******************************************************************




//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


//用户需要输入的评论内容
const TT_searchFile = '$${T_搜索关键字文案}';
const TT_commentFile = '$${T_评论文案}';
const TT_Like_Count = "$${点赞概率}" //点赞概率
const TT_Save_Count = 0 //收藏概率
const TT_Watch_Author_Page= 0 //查看作者主页的概率
const TT_Comment_Count = "$${评论概率}" //评论概率
const TT_Watch_Count = "$${浏览视频数量}" //观看视频个数


//1.autox.js侧边栏的打开USB调试先打开
//2.vscode ctrl+shift+p 输入start all server 确定
//3.远程连接成功

//个人发文

//会在在无障碍服务启动后继续运行。
auto.waitFor();

//显示控制窗：https://github.com/kkevsekk1/AutoX/issues/868
console.show()


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


forceStop_titkok()


taskLog("准备启动TikTok...")
sleep(5000)
app.startActivity({
    action: "android.intent.action.VIEW",
    packageName: "com.zhiliaoapp.musically",
    className: "com.ss.android.ugc.aweme.main.MainActivity"
});


taskLog("打开TikTok成功...")
sleep(10000)

close_friend_suggest()


//******************************************************************
// 用于存储评论的数组
let comments = [];
// 检查文件是否存在
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

// 如果TT_commentFile等于'off'，则清空评论数组
if (TT_commentFile == 'off') {
    comments = [];
}

// 输出结果，用于调试
taskLog(comments);
//******************************************************************









//******************************************************************
//******************************************************************
//******************************************************************
// 用于存储关键字的数组
let search_text_array = [];
// 检查文件是否存在
const search_file = new java.io.File(TT_searchFile);
if (search_file.exists() && search_file.isFile()) {
    try {
        // 读取文件内容
        const search_reader = new java.io.BufferedReader(new java.io.FileReader(search_file));
        let search_line;
        while ((search_line = search_reader.readLine()) !== null) {
            search_text_array.push(search_line);
        }
        search_reader.close();
    } catch (e) {
        taskLog("读取搜索关键字文件时发生错误：" + e.message);
    }
} else {
    // 如果文件不存在，将文件名添加到数组中
    search_text_array.push(TT_searchFile);
}

// 如果TT_commentFile等于'off'，则清空评论数组
if (TT_searchFile == 'off') {
    search_text_array = [];
}

// 输出搜索的关键字结果，用于调试
taskLog(search_text_array);

// 按照顺序开始执行搜索关键字
if (search_text_array.length > 0) {
    taskLog("- 找到可用的搜索关键字文案, 开始搜索观看 - ");
    for (var randIdx = 0; randIdx < search_text_array.length; randIdx++) {
        var commentText = search_text_array[randIdx];
        taskLog("- 找到可用的搜索关键字文案: "+commentText+", 开始搜索观看 - ");
        taskLog("开始准备点击首页搜索按钮")

        // 计算右上角区域的点击坐标(找不到按钮，所以只能是点击坐标)
        click_search_btn()
        sleep(random(5000, 8000))


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
                //各种方式都找不到元素，只好以坐标为准
                click_search_btn()
                // find_btn_Text_base("搜索","搜尋","Search")


                //开始观看视频
                sleep(random(5000, 8000))
                taskLog("开始点击视频Tab按钮")
                find_textview_text_base("视频","影片","Videos")

                sleep(random(5000, 8000))
                click_left_top_screen()//直接观看第一个即可
                

                sleep(random(5000, 8000))
                watch_TT_video()
    
            }
        }


    }
    
  }else{
    taskLog("- 没有可用的搜索关键字文案, 忽略 - ");
  }


//强制停止TikTok 
function forceStop_titkok(){
    taskLog("准备强杀TikTok...")
    app.openAppSetting("com.zhiliaoapp.musically")
    sleep(5000)

    //繁体
    if (text("強制停止").exists()) {
        let forceStopBtn = text("強制停止").findOne();
        if (forceStopBtn && forceStopBtn.clickable()) {
            forceStopBtn.click();
            sleep(1000);
            // 确认操作
            if (text("確定").exists()) {
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
    if (text("强制停止").exists()) {
        let forceStopBtn = text("强制停止").findOne();
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



//推荐好友的弹窗，直接关闭
function close_friend_suggest(){
    if(id("c67").exists()){
        sleep(3000)
        id("c67").click()
    }
}



// 计算右上角区域的点击坐标(找不到按钮，所以只能是点击坐标)
// 整个脚本一共有两个地方使用这个方法
function click_search_btn(){
    var clickX = device.width - 50; 
    var clickY = random(40 , 50); 
    taskLog("开始准备点击首页搜索确认按钮 clickX = " + clickX)
    taskLog("开始准备点击首页搜索确认按钮 clickY = " + clickY)
    click(clickX, clickY);
    sleep(random(5000, 8000))
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



//开始观看视频
function watch_TT_video(){
    //开始观看
    var count = 1;
    do {
        // 将 count 加 1
        taskLog("开始观看第"+count+"个TikTok视频")
        count++;

        close_friend_suggest()

        sleep(random(10000, 25000))

        if (Math.random() * 100 < TT_Like_Count)  {
            taskLog("开始触发点赞概率")
            click_Like_Btn()
            sleep(random(5000, 8000))
        }
        if (Math.random() * 100 < TT_Save_Count)  {
            taskLog("开始触发保存视频概率")
            click_Like_Btn()
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
        swipe(startX, startY, endX, endY, 500);
        taskLog("开始滑动位置，x = "+startX+"；y = " + startY)
        taskLog("结束滑动位置，x = "+endX+"；y = " + endY)



    } while (count < TT_Watch_Count); // 当 count 小于 TT_Watch_Count 时继续循环
}





function clickId(a) {
    obj_ID = id(a).boundsInside(5, 5, device.width - 5, device.height - 5);
    
    // 检查是否找到了元素
    if (obj_ID.find().empty()) {
        taskLog("没有找到元素ID ：" + a)
        return; // 如果没有找到，直接返回
    }
    //一旦找到元素，获取该元素的中心坐标 X 和 Y。
    X = obj_ID.find().get(0).bounds().centerX(), 
    Y = obj_ID.find().get(0).bounds().centerY(),
    //生成一个随机偏差（Deviation），范围从 -5 到 5，以避免点击时总是点击到相同的坐标。
    Deviation = random(-5, 5), 
    X1 = X - Deviation, 
    Y1 = Y - Deviation;

    device.sdkInt < 24 ? ra.tap(X1, Y1) : click(X1, Y1);
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
    clickId("dc7")
}



//点击评论按钮
function click_Comment_Btn(commentText){
    taskLog("开始准备评论视频")
    clickId("cd7")

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


            // clickId("cey") //如果主页已经有别人评论过：id = cey ， 点击发布评论
            // sleep(1000)

            // find_send_btn()
            // sleep(5000)
            // clickId("bgi") //如果主页已经有别人评论过：id = cey ， 点击发布评论
            find_btn_desc_base("发布评论","發佈評論","Post comment")


        }
    }
    back();
    sleep(3000)


}

//点击收藏按钮
function click_Save_Btn(){
    taskLog("开始准备收藏视频")
    // id("egc").className("android.widget.ImageView").findOne().click()
    clickId("egc")

}





//打印日志
function taskLog(_log){
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


// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//1.autox.js侧边栏的打开USB调试先打开
//2.vscode ctrl+shift+p 输入start all server 确定
//3.远程连接成功

//个人发文

//会在在无障碍服务启动后继续运行。
auto.waitFor();

//显示控制窗：https://github.com/kkevsekk1/AutoX/issues/868
console.show()

let fileLogName =  (new Date().getTime()) + ".txt";
initSaveLog(fileLogName);



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

taskLog("启动Facebook...")
sleep(5000)
app.startActivity({
    action: "android.intent.action.VIEW",
    packageName: "com.facebook.katana",
    className: "com.facebook.katana.activity.FbMainTabActivity"
});
taskLog("打开Facebook成功...")


taskLog("准备点击‘分享新鲜事 在 Facebook 发帖’按钮...");
//sleep(5000)
className("android.widget.Button").text("分享新鲜事 在 Facebook 发帖").findOne(3000).click();



sleep(5000)
// // 获取屏幕的宽度和高度
let screenWidth = device.width;
let screenHeight = device.height;
taskLog("屏幕区域的宽高坐标: (" + screenWidth + ", " + screenHeight + ")");


 // 计算屏幕上方2/3区域的底部位置
 let twoThirdsHeight = screenHeight * (2/3);

 // 计算该区域的中心点坐标
 let centerX = screenWidth / 2;
 let centerY = twoThirdsHeight - (screenHeight / 3) / 2;

// 打印屏幕上方2/3区域的中心点坐标
taskLog("准备点击屏幕上方2/3区域的中心点坐标: (" + centerX + ", " + centerY + ")");
click(centerX,centerY)


taskLog("准备输入分享内容....");
id("(name removed)").className("android.widget.AutoCompleteTextView").findOne(5000).setText("111122334444")



taskLog("准备点击下一步....");
sleep(5000)
className("android.widget.Button").desc("下一步").findOne(5000).click()



taskLog("准备点击分享....");
sleep(5000)
className("android.widget.Button").desc("分享").findOne(5000).click()



//在本地创建文件，保存数据
function initSaveLog(fileLogName){
    var issues = files.createWithDirs("/sdcard/Download/" + fileLogName);
    if(!issues){
        taskLog("创建本地日志文件已经存在..")
    }else{
        taskLog("创建本地日志文件成功..")
    }
}

//打印日志
function taskLog(_log){
    console.log(getSystemDate("df") +":" +_log)

    files.append("/sdcard/Download/" + fileLogName, getSystemDate("df") +":"+ _log+"\n");


}



//无论成功或者失败，最后截图一张
function saveImg(){
    console.log("开始截图...");
    if(!requestScreenCapture()){
        console.log("请求截图失败...");
        toast("请求截图失败");
        //exit();
    }else{
        toast("请求截图");
    }
    //截图并保存
    console.log("请求截图开始保存...");
    var toPath = "/sdcard/Download/" + (new Date().getTime()) + ".png";
    images.saveImage(captureScreen(), toPath);
}

//最终退出任务
function exitTask(){
    console.hide()
    exit()
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




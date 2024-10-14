
//1.autox.js侧边栏的打开USB调试先打开
//2.vscode ctrl+shift+p 输入start all server 确定
//3.远程连接成功

//个人发文

//会在在无障碍服务启动后继续运行。
auto.waitFor();




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



if(!requestScreenCapture()){
    toast("请求截图失败");
    //exit();
}else{
	toast("请求截图");
}
//截图并保存
images.saveImage(captureScreen(), "/sdcard/1.png");

console.show()


sleep(5000)
app.startActivity({
    action: "android.intent.action.VIEW",
    packageName: "com.facebook.katana",
    className: "com.facebook.katana.activity.FbMainTabActivity"
});
console.log("打开Facebook成功...")


sleep(5000)
console.log("准备点击‘分享新鲜事 在 Facebook 发帖’按钮...")
className("android.widget.Button").text("分享新鲜事 在 Facebook 发帖").findOne().click()




sleep(5000)
// // 获取屏幕的宽度和高度
let screenWidth = device.width;
let screenHeight = device.height;
console.log("屏幕区域的中心点坐标: (" + screenWidth + ", " + screenHeight + ")");


// // 计算屏幕上方1/3的高度
// let oneThirdHeight = screenHeight / 3;

// // 计算屏幕上方1/3区域的中心点坐标
// let centerX = screenWidth / 2;
// let centerY = oneThirdHeight + (screenHeight / 2);

// // 打印屏幕上方1/3区域的中心点坐标
// console.log("屏幕上方1/3区域的中心点坐标: (" + centerX + ", " + centerY + ")");
console.log("准备点击‘500,700’坐标...")
click(500,700)


sleep(5000)
id("(name removed)").className("android.widget.FrameLayout").depth(10).findOne().parent().setText("1111")


// sleep(3000)
// id("(name removed)").className("android.widget.FrameLayout").depth(10).findOne().parent().setText("1111")




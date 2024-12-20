// 导入SimpleDateFormat类
importClass(java.text.SimpleDateFormat);
importClass(java.io.PrintWriter);
importClass(java.io.FileWriter);

//******************************************************************
//***********************Tiktok关注*************************
//******************************************************************




//保证Java层和JS代码两边的日志文件一致
var taskLogFileName = "nest_task_log.txt"
var taskLogImgName = "nest_task_log.png"


//用户需要输入的关注用户ID列表
const TT_Like_User_ID_GROUP = '$${T_关注用户ID列表}';



//1.autox.js侧边栏的打开USB调试先打开
//2.vscode ctrl+shift+p 输入start all server 确定
//3.远程连接成功


//关机：
/** 
云手机的api：
https://help.nestbrowser.com/%E4%BA%91%E6%89%8B%E6%9C%BA/api.html
GET /run/:id
GET /stop/:id
const first = 'http://x.x.x.x:3001/api/1_0';
const api = first + '/run/1';

这就是关闭指定ip的主机上的第一个编号的云手机



问题1：我不知道ip和端口是啥
问题2：我只能用于搞关机，但是用不了开机
*/





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


//============
var url = "https://help.nestbrowser.com/%E4%BA%91%E6%89%8B%E6%9C%BA/api.html"
http.get(url, {}, function(res, err){
    if(err){
        console.error(err);
        return;
    }
    log("code = " + res.statusCode);
    log("html = " + res.body.string());
});

var city = "广州";
var res = http.get("http://www.sojson.com/open/api/weather/json.shtml?city=" + city);
if(res.statusCode != 200){
    toast("请求失败: " + res.statusCode + " " + res.statusMessage);
}else{
    var weather = res.body.json();
    log(weather);
    toast(util.format("温度: %s 湿度: %s 空气质量: %s", weather.data.wendu,
        weather.data.shidu, weather.quality));
}









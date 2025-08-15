var failCount = 0;  // 记录连续失败次数

function getUrlFromApi(url, proxyInfo,funType,refererUrl) {
  var apiUrl = "http://198.11.177.211:3001/api/getTargetUrl";

  // 构造请求体
  var payload = {
    "url": url,
    "proxyInfo": proxyInfo,
    "funType":funType,
    "refererUrl":refererUrl

  };


  var options = {
    'method': 'post', //
    'contentType': 'application/json', //
    'payload': JSON.stringify(payload), //
    'muteHttpExceptions': true, //
  };

  try {
    // 发送请求到接口
    var response = UrlFetchApp.fetch(apiUrl, options);
    var responseJson = JSON.parse(response.getContentText());

    // 获取接口返回的 URL 和 history 列表
    if (responseJson.status !== 'success') {
      Logger.log('API response error: ' + responseJson.message);
      return null; //
    }

    var targetUrl = responseJson.data.targetUrl; //
    var history = responseJson.data.history; //
    var url = responseJson.data.url; //
    return { targetUrl: targetUrl, history: history, url: url };
  } catch (e) {
    Logger.log('Error fetching URL from API: ' + e.toString());
    return null;
  }
}

function main() {
  // 配置您的代理信息
  var proxyInfo = {
      "username": "4985977-08c2c2fd",
      "password": "c48f2aa6-US",
      "host": "gate.kookeey.info",
      "port": "1000"
  };
  var funType = "fun3";  //===========================
  // 配置您的 URL，可以通过 history 列表选择或使用 url 或 targetUrl 字段
  // 平台链接=======================
  var defaultUrl = "https://yeahpromos.com/index/index/openurl?track=0b64cae88cdc72d2&url="; 
  var useHistory = false ;  // 高阶用法 设置为 true 使用 history 列表，false 使用 targetUrl 或 url
  var refererUrl = null;    //高阶用法 增加溯源默认为null
  var historyIndex = 2;  // 默认使用 history 列表中的第一个 URL
  while (true) {
    Logger.log("Script execution started at: " + new Date());
    var apiResponse = getUrlFromApi(defaultUrl, proxyInfo,funType,refererUrl);

    if (apiResponse) {
      var targetUrl = apiResponse.targetUrl;  
      var history = apiResponse.history;  
      var url = apiResponse.url;  
      var selectedUrl;
      if (useHistory && history && history.length > 0) {
        selectedUrl = history[historyIndex]; 
      } else {
        selectedUrl = targetUrl || url || defaultUrl;  
      }

      Logger.log("Selected URL for processing: " + selectedUrl);

      // 新增：拼接完整URL
      var fullUrl = selectedUrl;
      if (selectedUrl && !/^https?:\/\//i.test(selectedUrl)) {
        // 这里假设API返回的相对路径都属于 https://www.rebatesme.com
        fullUrl = "https://www.rebatesme.com" + selectedUrl;
      }

      // 新增：尝试跟踪 HTTP 跳转，获取最终 URL 及参数
      try {
        var response = UrlFetchApp.fetch(fullUrl, {
          'followRedirects': true,
          'muteHttpExceptions': true
        });
        var finalUrl = response.getFinalUrl ? response.getFinalUrl() : fullUrl;
        Logger.log("最终 HTTP 跳转后的 URL: " + finalUrl);
        var finalParams = finalUrl.split('?')[1] || '';
        Logger.log("最终参数: " + finalParams);
      } catch (e) {
        Logger.log('跟踪跳转出错: ' + e);
      }

      // 获取广告系列
      const campaignName = "Search-yeah(chrome)-Becker-US-185148-0604-A";  // 广告系列名称==========================
      const campaignIterator = AdsApp.campaigns()
          .withCondition(`campaign.name = "${campaignName}"`)
          .get();
      if (campaignIterator.hasNext()) {
        const campaign = campaignIterator.next();
        const urls = campaign.urls();
        const currentTrackingTemplate = urls.getTrackingTemplate();
        Logger.log("Current tracking old template: " + currentTrackingTemplate);
        const urlParts = selectedUrl.split('?');
        const queryParams = urlParts.length > 1 ? '?' + urlParts[1] : '';
        const cd_url = `{lpurl}${queryParams}`;
        if (cd_url !== currentTrackingTemplate) {
          Logger.log("Constructed new tracking template: " + cd_url);
          urls.setTrackingTemplate(cd_url);
          Logger.log("Updated tracking template for campaign: " + campaign.getName());
          failCount = 0; 
        } else {
          Logger.log("No change in tracking template, skipping update.");
        }
      } else {
        Logger.log("Campaign with name '" + campaignName + "' not found.");
      }
    } else {
      Logger.log("Failed to get the final URL from API.");
      failCount++; 
    }

    // 检查是否已经连续失败 3 次
    if (failCount >= 3) {
      Logger.log("Script has failed 3 times consecutively. Stopping the script.");
      break;  // 停止脚本
    }

    // 每次循环后等待 1 分钟
    Logger.log("Sleeping for 1 minute before next update...");
	
	
	//半小时跑一次
    //Utilities.sleep(60 * 1000); // 60秒 = 1分钟
    break;
	

	
  }
}

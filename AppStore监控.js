// AppStore 版本监控，Loon 专用
const appList = [
  {
    name: "Loon",
    id: "1373567447",
    country: "US",
    localVer: "3.5.3"
  }
];

function getAppIdFromLink(url) {
  const m = url.match(/id(\d+)/);
  return m ? m[1] : null;
}

function checkOne(item, doneAll) {
  const aid = item.id || getAppIdFromLink(item.link);
  if (!aid) return doneAll();
  const url = `https://itunes.apple.com/lookup?id=${aid}&country=${item.country}&media=software`;

  $httpClient.get(url, (err, resp, body) => {
    if (err || !resp || resp.status !== 200) {
      console.log(item.name + " 请求失败");
      return doneAll();
    }
    try {
      const json = JSON.parse(body);
      if (!json.results || json.results.length === 0) return doneAll();
      const app = json.results[0];
      const storeVer = app.version;
      const storeLink = app.trackViewUrl;
      const key = `asmon_${aid}`;
      const oldVer = $persistentStore.read(key);

      if (!oldVer) {
        $persistentStore.write(storeVer, key);
        console.log(`【${item.name}】首次记录商店版本：${storeVer}`);
        return doneAll();
      }

      if (storeVer !== oldVer) {
        $persistentStore.write(storeVer, key);
        $notification.post(
          "App 更新提醒",
          `${item.name}｜商店新版：${storeVer}`,
          `本地版本：${item.localVer}`,
          { openUrl: storeLink }
        );
      } else if (storeVer !== item.localVer) {
        $notification.post(
          "App 可更新",
          `${item.name}｜AppStore：${storeVer}`,
          `本地：${item.localVer}`,
          { openUrl: storeLink }
        );
        $persistentStore.write(storeVer, key);
      }
    } catch (e) {
      console.log(item.name + " 解析出错：" + e.message);
    }
    doneAll();
  });
}

// 串行挨个检查
let idx = 0;
function next() {
  if (idx >= appList.length) return $done();
  const cur = appList[idx++];
  checkOne(cur, next);
}
next();

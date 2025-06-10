
// 定义请求的URL和参数
const url = 'http://api.yesapi.net/api/SVIP/Szwyzzz888_MyApi/AUpdateMir2logincount';

const postData = {
  app_key: "C9D0523F019B3D49CF0D62F5CDCDF60F",
  service: "SVIP.Szwyzzz888_MyApiSandbox.AUpdateMir2logincount",
  username: "",
  logintime: "",
  loginip: "",
  info: "",
  yesapi_allow_origin:"1"
};

// logincount.js

// 获取或生成唯一标识
function getDeviceId() {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}

postData.username= getDeviceId()
postData.logintime = Math.floor(Date.now() / 1000);

// 使用 fetch 获取外网 IP
async function getPublicIP() {
  try {
    const response = await fetch('https://ipecho.net/plain');
    const data = await response.text();
    return data; // 返回外网 IP
  } catch (error) {
    console.error('无法获取外网 IP:', error);
    return null;
  }
}

// 设置 loginip 到 postData
async function setLoginIP() {
  postData.loginip = await getPublicIP(); // 将外网 IP 赋值给 loginip
  console.log('登录 IP:', postData.loginip);
  // 后续可以将 postData 发送到服务器
}

postData.info = navigator.userAgent;


(async function initLoginCount() {
  await setLoginIP(); // 等待 IP 获取完成

  console.log('Post Data:', postData);

  // 发起POST请求
  HTTPRequest.get(url, postData)
    .then(response => {
      console.log('请求成功，返回数据:', response);
    })
    .catch(error => {
      console.error('POST请求失败:', error);
    });
})();



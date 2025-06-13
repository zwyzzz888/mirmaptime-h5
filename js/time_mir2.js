var re_time; //记录刷新时间

function jisuan() {
    var result = calculateRefreshTime();
    document.getElementById('result').innerHTML = result.str;
    copy(result.str);
}

function jisuan_Chinese() {
    var result = calculateRefreshTime();
    document.getElementById('result').innerHTML = result.str;
    copy(replaceNumbersToChinese(result.str));
}

function jisuan_next() {
    updateRefreshTime();
    jisuan();
}

function jisuan_nextChinese() {
    updateRefreshTime();
    jisuan_Chinese();
}
function calculateRefreshTime() {
    re_time = document.getElementById("id_tv_time").value;
    let rtime = new Date(re_time);
    rtime.setTime(rtime.getTime() + getmaptime());
    const ctime = (rtime.getTime() - new Date().getTime() - 2 * 1000) / 1000;
    const str = "下次刷新时间约为" + getDate2(rtime) + "距离刷新还有" + ctime + "秒";
    return { rtime: rtime, str: str };
}
function updateRefreshTime() {
    re_time = document.getElementById("id_tv_time").value;
    var rtime = new Date(re_time);
    rtime.setTime(rtime.getTime() + getmaptime());
    var ctime = (rtime.getTime() - new Date().getTime() - 2 * 1000) / 1000;

    if (ctime <= 0) {
        document.getElementById('id_tv_time').value = getDate2(rtime);
    }

    return ctime;
}
function getmaptime() {
    var sec = 520
    var rdgrop = document.getElementsByName("select_time")
    for (let i = 0; i < rdgrop.length; i++) {
        if (rdgrop[i].checked && rdgrop[i].value > 0) {
            sec = rdgrop[i].value
            return sec * 1000
        } else if (rdgrop[i].checked) {
            sec = document.getElementById("custom_time").value
            return sec * 1000
        }
    }

    return sec * 1000
}

function make_ctime() {
    document.getElementById('id_tv_time').value = getDate();
}

function getDate() {

    window.setTimeout(function() {
        window.requestAnimationFrame(getDate)
    }, 1000 / 2)
    var d = new Date();
    var year = d.getFullYear() //获取年
    var month = d.getMonth() + 1; //获取月，从 Date 对象返回月份 (0 ~ 11)，故在此处+1
    var day = d.getDay() //获取日
    var days = d.getDate() //获取日期
    var hour = d.getHours() //获取小时
    var minute = d.getMinutes() //获取分钟
    var second = d.getSeconds() //获取秒 +
    if (month < 10) month = "0" + month
    if (days < 10) days = "0" + days
    if (hour < 10) hour = "0" + hour
    if (minute < 10) minute = "0" + minute
    if (second < 10) second = "0" + second
    var week = new Array("星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六")
    var da = year + "-" + month + "-" + days + " " + hour + ":" + minute + ":" + second
    return da
}

function getDate2(date) {

    window.setTimeout(function() {
        window.requestAnimationFrame(getDate)
    }, 1000 / 2)
    var d = new Date(date);
    var year = d.getFullYear() //获取年
    var month = d.getMonth() + 1; //获取月，从 Date 对象返回月份 (0 ~ 11)，故在此处+1
    var day = d.getDay() //获取日
    var days = d.getDate() //获取日期
    var hour = d.getHours() //获取小时
    var minute = d.getMinutes() //获取分钟
    var second = d.getSeconds() //获取秒 +
    if (month < 10) month = "0" + month
    if (days < 10) days = "0" + days
    if (hour < 10) hour = "0" + hour
    if (minute < 10) minute = "0" + minute
    if (second < 10) second = "0" + second
    var week = new Array("星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六")
    var da = year + "-" + month + "-" + days + " " + hour + ":" + minute + ":" + second
    return da
}

function copy(text) {
    if (navigator.clipboard) {
        // 支持 Clipboard API
        navigator.clipboard.writeText(text)
            .then(() => console.log('复制成功'))
            .catch(err => console.error('复制失败', err));
    } else {
        // 回退到 execCommand（注意：已废弃）
        const el = document.createElement('textarea');
        el.value = text;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        console.log('已使用 execCommand 复制');
    }
}
let blinkInterval = null; // 存储定时器 ID
let isRed = false;
function count_retime() {
    if (re_time != null) {
        var rtime;
        rtime = new Date(re_time);
        rtime.setTime(rtime.getTime() + getmaptime());
        ctime = new Date(rtime.getTime() - new Date().getTime() - 2 * 1000) / 1000;
        var str = "下次刷新时间约为" + getDate2(rtime) + "距离刷新还有" + parseInt(ctime) + "秒";
        document.getElementById('result').innerHTML = str;

          // 获取页面最外层容器或 body
          const pageContainer = document.body;

          if (ctime <= 10) {
              if (!blinkInterval) {
                  // 开始闪烁
                 

                      if (isRed) {
                          pageContainer.classList.remove('bg-red');
                          pageContainer.classList.add('bg-white');
                      } else {
                          pageContainer.classList.remove('bg-white');
                          pageContainer.classList.add('bg-red');
                      }
                      isRed = !isRed;
              }
          } else {
                // 恢复默认背景色
                pageContainer.classList.remove('bg-red', 'bg-white');
                // 如果你想恢复为某个特定颜色，可以设置：
                // pageContainer.style.backgroundColor = "#f8f9fa"; // 示例颜色
              
          }
    }
}

function replaceNumbersToChinese(text) {
    const numberMap = {
        '0': '０',
        '1': '１',
        '2': '２',
        '3': '３',
        '4': '４',
        '5': '５',
        '6': '６',
        '7': '７',
        '8': '８',
        '9': '９',
    };
    const wordMap = {
        '下次刷新时间约为': '刷新时间为',
        '距离刷新还有': '还有'
    };
    // 先替换汉字关键词
    let replacedText = text;
    for (const [key, value] of Object.entries(wordMap)) {
        replacedText = replacedText.split(key).join(value);
    }
    // 再替换数字为全角数字
    let str= replacedText.replace(/[0-9]/g, digit => numberMap[digit]);
    console.log(str);
    return str;
}

// 页面加载完成后执行初始化函数
window.onload = function() {
    document.getElementById('time').innerHTML = getDate();
    document.getElementById('id_tv_time').value = getDate();
    setInterval("document.getElementById('time').innerHTML = getDate();", 1000);
    setInterval(count_retime, 1000);
};
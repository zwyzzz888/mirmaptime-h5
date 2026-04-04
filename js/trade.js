/**
 * 实在传奇 - 交易信息发布模块
 * 功能：物品发布、浏览、检索、用户管理
 * 
 * 依赖文件：trade-api.js (果创云 YesAPI 接口封装)
 */

// ==================== 物品类型枚举（与数据库字段一致） ====================
const GOODS_TYPE_ENUM = {
    WQ: 'wq',  // 武器
    YF: 'yf',  // 衣服
    TK: 'tk',  // 头盔
    XL: 'xl',  // 项链
    SZ: 'sz',  // 手镯
    JZ: 'jz',  // 戒指
    SJ: 'sj',  // 书籍
    CL: 'cl',  // 材料
    XZ: 'xz'   // 勋章
};

// ==================== 工具函数 ====================

/**
 * 获取类型显示名称
 */
function getTypeName(type) {
    const typeMap = {
        'wq': '武器',
        'yf': '衣服',
        'tk': '头盔',
        'xl': '项链',
        'sz': '手镯',
        'jz': '戒指',
        'sj': '书籍',
        'cl': '材料',
        'xz': '勋章'
    };
    return typeMap[type] || type;
}

/**
 * 获取货币显示名称
 */
function getCurrencyName(currency) {
    return currency === 'gold' ? '金币' : 'RMB';
}

/**
 * 格式化价格显示
 */
function formatPrice(price, currency) {
    return parseInt(price).toLocaleString() + ' ' + getCurrencyName(currency);
}

/**
 * 复制到剪贴板
 */
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text);
    } else {
        // 降级方案
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return Promise.resolve();
    }
}

/**
 * 复制联系方式
 */
function copyContact(contact) {
    console.log('复制联系方式:', contact);
    copyToClipboard(contact).then(() => {
        console.log('✅ 复制成功');
        showToast('已复制到剪贴板');
    }).catch((err) => {
        console.error('❌ 复制失败:', err);
        showToast('复制失败');
    });
}

/**
 * 显示 Toast 提示
 */
function showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        z-index: 9999;
        font-size: 14px;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        document.body.removeChild(toast);
    }, duration);
}

/**
 * 敏感词检测（预留）
 */
function containsSensitiveWords(text) {
    // TODO: 实现敏感词库检测逻辑
    const sensitiveWords = []; // 待填充敏感词列表
    for (let word of sensitiveWords) {
        if (text.includes(word)) {
            return true;
        }
    }
    return false;
}

// ==================== 用户认证相关 ====================

/**
 * 检查登录状态
 */
function checkLoginStatus() {
    const token = localStorage.getItem('user_token');
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    
    if (token && userInfo.username) {
        // 已登录，显示用户信息
        $('#user-name').text(userInfo.username);
        console.log('用户已登录:', userInfo.username);
    } else {
        // 未登录，清除用户信息显示
        $('#user-name').text('');
        console.log('用户未登录');
    }
}

/**
 * 登录函数（对接真实 API）
 */
function login(username, password) {
    console.log('正在调用登录 API...');
    
    TradeAPI.login(username, password)
        .then(function(res) {
            console.log('登录成功:', res);
            checkLoginStatus();
            closeLoginModal();
            showToast('登录成功！');
        })
        .catch(function(err) {
            console.error('登录失败:', err);
            showToast('登录失败：' + (err.msg || '未知错误'));
        });
}

/**
 * 注册函数（对接真实 API）
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} email - 邮箱
 */
function register(username, password, email) {
    console.log('正在调用注册 API...');
    
    TradeAPI.register(username, password, email)
        .then(function(res) {
            console.log('注册成功:', res);
            showToast('注册成功！请登录');
            showLoginForm();
        })
        .catch(function(err) {
            console.error('注册失败:', err);
            showToast('注册失败：' + (err.msg || '未知错误'));
        });
}

/**
 * 退出登录
 */
function logout() {
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_info');
    checkLoginStatus();
    showToast('已退出登录');
}

// ==================== 全局变量存储物品数据 ====================
let TRADE_GOODS_DATA = {};  // 用于存储物品详情，key 为物品 ID

// ==================== 物品管理相关 ====================

/**
 * 加载物品列表（对接真实 API）
 */
function loadTradeList(page = 1) {
    const keyword = $('#search-keyword').val();
    const type = $('#filter-type').val();
    const currency = $('#filter-currency').val();
    
    console.log('加载物品列表，page:', page);
    
    // 将货币类型转换为 API 需要的值 (gold->2, rmb->1)
    let moneyType = undefined;
    if (currency === 'gold') {
        moneyType = '2';
    } else if (currency === 'rmb') {
        moneyType = '1';
    }
    
    // 调用公开 API 获取物品列表
    TradeAPI.getGoodsList({
        page: page,
        perpage: 20,
        title: keyword || undefined,
        goods_type: type || undefined,
        money_type: moneyType
    })
    .then(function(res) {
        console.log('物品列表获取成功:', res.data);
        
        // 转换数据格式以适配渲染函数
        const adaptedList = res.data.list.map(item => {
            const goodsData = {
                id: item.id,
                goods_name: item.title,
                goods_type: item.goods_type,
                goods_type_name: getTypeName(item.goods_type),
                goods_attr: item.goods_attrs,
                currency_type: item.money_type === '1' ? 'rmb' : 'gold',
                price: item.price,
                contact_type: item.contact_type,
                contact_info: item.contact,  // 保存联系方式
                goods_img: item.goods_img,
                create_time: item.sale_time,
                username: item.username || '未知'
            };
            
            // 存储到全局变量中供详情页使用
            TRADE_GOODS_DATA[item.id] = goodsData;
            
            return goodsData;
        });
        
        renderTradeList(adaptedList);
        renderPagination(res.data.total, page);
    })
    .catch(function(err) {
        console.error('物品列表获取失败:', err);
        showToast('加载失败：' + (err.msg || '网络错误'));
        
        // 降级方案：显示空状态
        renderTradeList([]);
    });
}

/**
 * 渲染物品列表
 */
function renderTradeList(list) {
    if (!list || list.length === 0) {
        $('#trade-goods-list').html(`
            <div class="empty-state" style="grid-column: 1/-1;">
                <p>暂无物品信息</p>
                <p style="font-size:14px;">登录后可以发布您的物品</p>
            </div>
        `);
        return;
    }
    
    let html = '';
    list.forEach(function(item) {
        const imgHtml = item.goods_img 
            ? `<img src="${item.goods_img}" alt="${item.goods_name}">` 
            : '<div style="width:100%;height:200px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;color:#999;margin-bottom:10px;">无图片</div>';
        
        html += `
            <div class="trade-item" onclick="viewGoodsDetail(${item.id})">
                ${imgHtml}
                <h4>${item.goods_name}</h4>
                <p><strong>类型：</strong>${getTypeName(item.goods_type)}</p>
                ${item.goods_attr ? `<p><strong>属性：</strong>${item.goods_attr}</p>` : ''}
                <p style="color:#e74c3c;font-weight:bold;"><strong>价格：</strong>${formatPrice(item.price, item.currency_type)}</p>
                <p><small>发布时间：${item.create_time}</small></p>
            </div>
        `;
    });
    $('#trade-goods-list').html(html);
}

/**
 * 渲染分页
 */
function renderPagination(total, current) {
    const pageSize = 20;
    const totalPages = Math.ceil(total / pageSize);
    
    if (totalPages <= 1) {
        $('#trade-pagination').html('');
        return;
    }
    
    let html = '';
    for (let i = 1; i <= totalPages; i++) {
        html += `<button class="${i === current ? 'active' : ''}" onclick="loadTradeList(${i})">${i}</button>`;
    }
    $('#trade-pagination').html(html);
}

/**
 * 查看物品详情
 */
function viewGoodsDetail(id) {
    console.log('查看物品详情，ID:', id);
    console.log('全局缓存数据:', TRADE_GOODS_DATA);
    
    // 直接从全局变量中查找物品数据
    const goods = TRADE_GOODS_DATA[id];
    
    if (!goods) {
        console.error('❌ 找不到物品:', id);
        showToast('物品不存在');
        return;
    }
    
    console.log('✅ 找到物品数据:', goods);
    
    renderGoodsDetail(goods);
    $('#goods-modal').addClass('show');
}

/**
 * 渲染物品详情
 */
function renderGoodsDetail(goods) {
    const imgHtml = goods.goods_img 
        ? `<img src="${goods.goods_img}" alt="${goods.goods_name}">` 
        : '';
    
    const contactType = goods.contact_type === 'qq' ? 'QQ' : '微信';
    
    const html = `
        <h3 style="margin-top:0;">${goods.goods_name}</h3>
        ${imgHtml}
        <p><strong>物品类型：</strong>${getTypeName(goods.goods_type)}</p>
        <p><strong>物品属性：</strong>${goods.goods_attr || '无'}</p>
        <p style="color:#e74c3c;font-size:18px;font-weight:bold;"><strong>价格：</strong>${formatPrice(goods.price, goods.currency_type)}</p>
        <p><strong>联系方式：</strong>${contactType}：<span style="color:#007bff;font-weight:bold;" onclick="copyContact('${goods.contact_info}')">${goods.contact_info} <small style="color:#999;cursor:pointer;">(点击复制)</small></span></p>
        <p><strong>卖家：</strong>${goods.username || '未知'}</p>
        <p><strong>发布时间：</strong>${goods.create_time}</p>
        <div class="trade-risk-notice" style="margin-top:20px;">
            <p style="margin:0;"><strong>⚠️ 风险提示：</strong>本站仅提供信息公示服务，不参与任何交易过程。请自行判断对方信用，谨防上当受骗！</p>
        </div>
    `;
    
    $('#goods-detail-content').html(html);
}

/**
 * 发布物品（对接真实 API）
 */
function publishGoods(formData) {
    console.log('📝 准备发布物品:', formData);
    
    // 敏感词检测
    if (containsSensitiveWords(formData.goods_name + formData.goods_attr)) {
        showToast('包含敏感词汇，请修改后重新提交');
        return Promise.reject(new Error('包含敏感词'));
    }
    
    // 调用真实 API 发布物品
    return TradeAPI.addGoods(formData)
        .then(function(res) {
            console.log('✅ 物品发布成功:', res);
            showToast('发布成功！' + (formData.goods_img ? ' ✓ 图片已保存' : ''));
            return res;
        })
        .catch(function(err) {
            console.error('❌ 物品发布失败:', err);
            showToast('发布失败：' + (err.msg || '未知错误'));
            throw err;
        });
}

// ==================== 全局变量存储我的物品数据 ====================
let MY_GOODS_DATA = {};  // 用于存储物品详情，key 为物品 ID

/**
 * 加载我的发布列表（对接真实 API）
 */
function loadMyGoodsList() {
    const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
    
    if (!userInfo.username) {
        showToast('请先登录');
        showLoginModal();
        return;
    }
    
    console.log('加载我的物品列表...');
    
    // 调用 API 获取我的物品
    TradeAPI.getMyGoodsList({
        page: 1,
        perpage: 20
    })
    .then(function(res) {
        console.log('我的物品列表:', res.data);
        
        // 转换数据格式，添加状态计算
        const adaptedList = res.data.list.map(item => {
            const saleTime = new Date(item.sale_time);
            const now = new Date();
            const threeMonthsLater = new Date(saleTime);
            threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
            
            // 判断是否超过 3 个月
            const isExpired = now > threeMonthsLater;
            
            const goodsData = {
                id: item.id,
                goods_name: item.title,
                goods_type: item.goods_type,
                goods_type_name: getTypeName(item.goods_type),
                goods_attr: item.goods_attrs,
                currency_type: item.money_type === '1' ? 'rmb' : 'gold',
                price: item.price,
                contact_type: item.contact_type,
                contact_info: item.contact,
                goods_img: item.goods_img,
                sale_time: item.sale_time,
                create_time: item.sale_time,
                username: userInfo.username,
                isExpired: isExpired,
                expiryTime: threeMonthsLater
            };
            
            // 存储到全局变量
            MY_GOODS_DATA[item.id] = goodsData;
            
            return goodsData;
        });
        
        renderMyGoodsList(adaptedList);
    })
    .catch(function(err) {
        console.error('获取我的物品列表失败:', err);
        showToast('加载失败：' + (err.msg || '网络错误'));
        
        // 降级方案：显示空状态
        renderMyGoodsList([]);
    });
}

/**
 * 渲染我的物品列表（带状态显示）
 */
function renderMyGoodsList(list) {
    if (!list || list.length === 0) {
        $('#my-goods-list').html(`
            <div class="empty-state">
                <p>您还没有发布任何物品</p>
                <button class="btn-primary" onclick="$(&quot;.tab-btn[data-tab='publish']&quot;).click()">去发布</button>
            </div>
        `);
        return;
    }
    
    let html = '';
    list.forEach(function(item) {
        // 计算状态文本和按钮
        const statusText = item.isExpired 
            ? '<span style="color:#999;font-size:12px;">已下架</span>' 
            : `<span style="color:#27ae60;font-size:12px;">📅 上架至 ${formatDate(item.expiryTime)}</span>`;
        
        const toggleButtonText = item.isExpired ? '🔄 重新上架' : '⬇️ 下架';
        const toggleButtonColor = item.isExpired ? '#27ae60' : '#e74c3c';
        
        html += `
            <div class="trade-item">
                ${item.goods_img ? `<img src="${item.goods_img}" alt="${item.goods_name}">` : ''}
                <h4>${item.goods_name}</h4>
                <p><strong>类型：</strong>${getTypeName(item.goods_type)}</p>
                <p><strong>属性：</strong>${item.goods_attr || '无'}</p>
                <p><strong>价格：</strong>${formatPrice(item.price, item.currency_type)}</p>
                <p><small>发布时间：${item.sale_time}</small></p>
                <p>${statusText}</p>
                <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">
                    <button class="btn-edit" style="padding:5px 10px;font-size:12px;background:#27ae60;color:white;border:none;border-radius:4px;cursor:pointer;" onclick="editGoods(${item.id})">✏️ 编辑</button>
                    <button class="btn-danger" style="padding:5px 10px;font-size:12px;background:#e74c3c;color:white;border:none;border-radius:4px;cursor:pointer;" onclick="deleteGoods(${item.id})">🗑️ 删除</button>
                    <button class="btn-status" style="padding:5px 10px;font-size:12px;background:${toggleButtonColor};color:white;border:none;border-radius:4px;cursor:pointer;" onclick="toggleGoodsStatus(${item.id}, ${item.isExpired})">${toggleButtonText}</button>
                </div>
            </div>
        `;
    });
    $('#my-goods-list').html(html);
}

/**
 * 格式化日期（添加 3 个月）
 */
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
}

/**
 * 编辑物品（对接真实 API）- 从缓存数据中获取
 */
function editGoods(id) {
    console.log('📝 编辑物品，ID:', id);
    console.log('当前缓存数据:', MY_GOODS_DATA);
    
    // 直接从全局变量中查找物品数据
    const goods = MY_GOODS_DATA[id];
    
    if (!goods) {
        console.error('❌ 找不到物品:', id);
        showToast('物品不存在');
        return;
    }
    
    console.log('✅ 找到物品数据:', goods);
    
    // 逐个字段填充并验证
    const $form = $('#publish-form');
    
    console.log('填充表单字段:');
    
    // 物品名称
    const $name = $form.find('[name="goods_name"]');
    $name.val(goods.goods_name || '');
    console.log('  - goods_name:', goods.goods_name, '-> 输入框值:', $name.val());
    
    // 物品类型
    const $type = $form.find('[name="goods_type"]');
    $type.val(goods.goods_type || '');
    console.log('  - goods_type:', goods.goods_type, '-> 下拉框值:', $type.val());
    
    // 物品属性
    const $attr = $form.find('[name="goods_attr"]');
    $attr.val(goods.goods_attr || '');
    console.log('  - goods_attr:', goods.goods_attr, '-> 输入框值:', $attr.val());
    
    // 价格
    const $price = $form.find('[name="price"]');
    $price.val(goods.price || '');
    console.log('  - price:', goods.price, '-> 输入框值:', $price.val());
    
    // 货币类型
    const $currency = $form.find('[name="currency_type"]');
    $currency.val(goods.currency_type || 'gold');
    console.log('  - currency_type:', goods.currency_type, '-> 下拉框值:', $currency.val());
    
    // 联系方式类型
    const $contactType = $form.find('[name="contact_type"]');
    // API 返回的值映射为 HTML 下拉框的值：qq -> qq, wx -> wechat
    let contactTypeValue = goods.contact_type || 'qq';
    if (contactTypeValue === 'wx') {
        contactTypeValue = 'wechat';  // API: wx -> HTML: wechat
    }
    $contactType.val(contactTypeValue);
    console.log('  - contact_type:', goods.contact_type, '-> 映射后:', contactTypeValue, '-> 下拉框值:', $contactType.val());
    
    // 联系方式
    const $contactInfo = $form.find('[name="contact_info"]');
    $contactInfo.val(goods.contact_info || '');
    console.log('  - contact_info:', goods.contact_info, '-> 输入框值:', $contactInfo.val());
    
    // 存储正在编辑的物品 ID
    $('#publish-form').data('editing-id', id);
    
    // 修改提交按钮文本
    $('#publish-form button[type="submit"]').text('💾 保存修改');
    
    // 切换到发布标签页（会在 initTabs 中重置表单，所以必须在切换后填充数据）
    $('.tab-btn[data-tab="publish"]').click();
    
    // 延迟填充数据，等待标签页切换完成
    setTimeout(function() {
        console.log('⏰ 延迟执行：开始填充表单数据');
        
        const $form = $('#publish-form');
        
        // 物品名称
        $form.find('[name="goods_name"]').val(goods.goods_name || '');
        
        // 物品类型
        $form.find('[name="goods_type"]').val(goods.goods_type || '');
        
        // 物品属性
        $form.find('[name="goods_attr"]').val(goods.goods_attr || '');
        
        // 价格
        $form.find('[name="price"]').val(goods.price || '');
        
        // 货币类型
        $form.find('[name="currency_type"]').val(goods.currency_type || 'gold');
        
        // 联系方式类型（映射）
        let contactTypeValue = goods.contact_type || 'qq';
        if (contactTypeValue === 'wx') {
            contactTypeValue = 'wechat';
        }
        $form.find('[name="contact_type"]').val(contactTypeValue);
        
        // 联系方式
        $form.find('[name="contact_info"]').val(goods.contact_info || '');
        
        // 图片 - 在延迟回调中处理
        if (goods.goods_img) {
            const $imgInput = $('#goods-img-url');
            $imgInput.val(goods.goods_img);
            console.log('  - goods_img:', goods.goods_img, '-> 输入框值:', $imgInput.val());
            
            // 移除旧的预览图
            $('#img-url-status').next('.image-preview').remove();
            
            // 显示预览图
            const previewHtml = `<div class="image-preview" style="margin-top:10px;"><img src="${goods.goods_img}" style="max-width:200px;max-height:200px;border-radius:5px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" alt="预览图"></div>`;
            $('#img-url-status').after(previewHtml);
            
            // 更新状态文本
            $('#img-url-status').text('✓ 图片已加载');
        } else {
            console.log('  - goods_img: (无图片)');
        }
        
        console.log('✅ 表单数据填充完成');
        showToast('已加载物品信息，请修改后保存');
    }, 50);
}

/**
 * 根据类型名称获取类型键
 */
function getTypeKey(typeName) {
    const typeMap = {
        '武器': 'wq',
        '衣服': 'yf',
        '头盔': 'tk',
        '项链': 'xl',
        '手镯': 'sz',
        '戒指': 'jz',
        '书籍': 'sj',
        '材料': 'cl',
        '勋章': 'xz'
    };
    return typeMap[typeName] || 'wq';
}

/**
 * 切换物品上架/下架状态
 */
function toggleGoodsStatus(id, isExpired) {
    const newSaleTime = isExpired 
        ? new Date().toLocaleString('zh-CN', { hour12: false })  // 重新上架：设置为当前时间
        : '2000-01-01 00:00:00';  // 下架：设置为 2000 年
    
    console.log('切换状态:', id, '新时间:', newSaleTime);
    
    // 调用 API 更新
    TradeAPI.editGoods(id, {
        sale_time: newSaleTime
    })
    .then(function(res) {
        console.log('状态更新成功:', res);
        showToast(isExpired ? '✅ 已重新上架' : '⬇️ 已下架');
        
        // 刷新列表
        loadMyGoodsList();
    })
    .catch(function(err) {
        console.error('状态更新失败:', err);
        showToast('操作失败：' + (err.msg || '未知错误'));
    });
}

/**
 * 删除物品（对接真实 API）
 */
function deleteGoods(id) {
    if (!confirm('确定要删除这个物品吗？')) return;
    
    console.log('删除物品，ID:', id);
    
    // 调用真实 API 删除物品
    TradeAPI.deleteGoods(id)
        .then(function(res) {
            console.log('✅ 物品删除成功:', res);
            showToast('删除成功！');
            
            // 删除成功后刷新列表
            loadMyGoodsList();
        })
        .catch(function(err) {
            console.error('❌ 物品删除失败:', err);
            showToast('删除失败：' + (err.msg || '未知错误'));
        });
}

// ==================== 图床 API 配置 ====================
// 已改为使用果创云 YesAPI 图片上传接口，避免 CORS 跨域问题
const IMAGE_HOST = {
    BASE_URL: 'https://api.yesapi.net', // 使用果创云 API
    UPLOAD_SERVICE: 'App.CDN.UploadImgByBase64' // 图片上传服务名
};

/**
 * 上传图片到图床（使用果创云 YesAPI）
 */
function uploadImage() {
    // 创建文件输入框
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        
        if (!file) {
            showToast('请选择图片文件');
            return;
        }
        
        // 检查文件大小（限制 1MB）
        if (file.size > 1 * 1024 * 1024) {
            showToast('图片大小不能超过 1MB');
            return;
        }
        
        // 显示上传中提示
        showToast('正在上传图片...', 3000);
        
        console.log('\n===========================================');
        console.log('📸 开始上传图片（果创云 API）');
        console.log('===========================================');
        console.log('文件名:', file.name);
        console.log('文件大小:', (file.size / 1024).toFixed(2), 'KB');
        console.log('文件类型:', file.type);
        
        // 读取文件为 Base64
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64Data = e.target.result; // data:image/png;base64,iVBOR...
            
            console.log('Base64 长度:', base64Data.length);
            
            // 构建 API 请求参数
            const requestData = {
                file: base64Data,  // 必须使用 POST 传递的 base64 数据
                file_name: file.name  // 文件名
            };
            
            // 调用果创云 API
            $.ajax({
                url: `${IMAGE_HOST.BASE_URL}/?s=${IMAGE_HOST.UPLOAD_SERVICE}&app_key=${TRADE_API.APP_KEY}&yesapi_allow_origin=1`,
                method: 'POST',
                data: requestData,
                dataType: 'json'
            })
            .done(function(res) {
                console.log('\n✅ 收到响应');
                console.log('响应内容:', JSON.stringify(res, null, 2));
                
                // 检查是否成功
                if (res.ret === 200 && res.data && res.data.err_code === 0) {
                    // 获取图片 URL（优先使用 HTTPS URL）
                    const imageUrl = res.data.https_url || res.data.url;
                    
                    if (!imageUrl) {
                        console.error('❌ 返回数据中没有图片 URL');
                        showToast('上传失败：未获取到图片 URL');
                        return;
                    }
                    
                    console.log('\n🔗 图片 URL:', imageUrl);
                    
                    // 填入到输入框
                    const $input = $('#goods-img-url');
                    if ($input.length === 0) {
                        console.error('❌ 找不到输入框 #goods-img-url');
                        showToast('页面错误：找不到图片输入框');
                        return;
                    }
                    
                    // 设置新值
                    $input.val(imageUrl);
                    console.log('✅ 已保存到输入框:', $input.val());
                    
                    // 移除旧的预览图（如果有）
                    $('#img-url-status').next('.image-preview').remove();
                    
                    // 显示预览图 - 插入到状态文本后面
                    const previewHtml = `<div class="image-preview" style="margin-top:10px;"><img src="${imageUrl}" style="max-width:200px;max-height:200px;border-radius:5px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" alt="预览图"></div>`;
                    $('#img-url-status').after(previewHtml);
                    
                    // 更新状态文本
                    $('#img-url-status').text('✓ 图片已上传');
                    
                    console.log('\n✅ 图片上传成功！');
                    console.log('===========================================\n');
                    
                    showToast('✅ 上传成功！图片 URL 已保存');
                } else {
                    console.error('\n❌ 上传失败 - err_code:', res.data?.err_code);
                    console.error('完整响应:', res);
                    showToast('上传失败：' + (res.data?.err_msg || res.msg || '未知错误'));
                }
            })
            .fail(function(xhr, status, error) {
                console.error('\n❌ 上传失败');
                console.error('状态:', status);
                console.error('错误:', error);
                console.error('XHR 响应:', xhr.responseText || xhr);
                console.error('===========================================\n');
                
                let errorMsg = '网络错误';
                if (xhr.responseText) {
                    try {
                        const errData = JSON.parse(xhr.responseText);
                        errorMsg = errData.msg || errData.message || error;
                    } catch (e) {
                        errorMsg = xhr.responseText.substring(0, 100);
                    }
                } else {
                    errorMsg = error;
                }
                
                showToast('上传失败：' + errorMsg);
            });
        };
        
        reader.onerror = function() {
            console.error('❌ 文件读取失败');
            showToast('文件读取失败，请重试');
        };
        
        // 读取文件
        reader.readAsDataURL(file);
    };
    
    // 触发文件选择
    fileInput.click();
}

/**
 * 删除图片（已禁用，果创云 API 不支持前端删除）
 * @param {string} imagePath - 图片路径
 */
// function deleteImage(imagePath) {
//     // 此函数已禁用，因为果创云 API 不支持从前端删除图片
//     // 需要在果创云后台手动删除
// }

/**
 * 检查图片 URL（调试用）
 */
function checkImgUrl() {
    const $input = $('#goods-img-url');
    const value = $input.val();
    const $status = $('#img-url-status');
    
    console.log('\n===========================================');
    console.log('🔍 检查图片 URL');
    console.log('===========================================');
    console.log('输入框 ID:', $input.attr('id'));
    console.log('输入框值:', value || '(空)');
    console.log('输入框长度:', value ? value.length : 0);
    
    if (!value) {
        $status.html('<span style="color:#f39c12;">⚠️ 图片 URL 为空</span>');
        console.warn('图片 URL 为空');
    } else {
        $status.html(`<span style="color:#27ae60;">✅ URL 已保存 (${value.length} 字符)</span>`);
        console.log('✅ URL 已保存:', value);
        
        // 验证 URL 格式
        if (value.startsWith('https://i.111666.best/image/')) {
            console.log('✅ URL 格式正确');
            $status.append('<br><span style="color:#27ae60;">✓ URL 格式正确</span>');
        } else {
            console.warn('⚠️ URL 格式可能不正确');
            $status.append('<br><span style="color:#f39c12;">⚠️ URL 格式可能不正确</span>');
        }
    }
    
    console.log('===========================================\n');
}

// ==================== UI 交互相关 ====================

/**
 * Tab 切换
 */
function initTabs() {
    $('.tab-btn').off('click').on('click', function() {
        const tabName = $(this).data('tab');
        
        // 检查是否需要登录
        const token = localStorage.getItem('user_token');
        const userInfo = JSON.parse(localStorage.getItem('user_info') || '{}');
        const isLoggedIn = token && userInfo.username;
        
        // 如果未登录且点击需要登录的标签页
        if (!isLoggedIn && (tabName === 'publish' || tabName === 'my' || tabName === 'user')) {
            showToast('请先登录');
            showLoginModal();
            return; // 阻止切换
        }
        
        // 切换按钮激活状态
        $('.tab-btn').removeClass('active');
        $(this).addClass('active');
        
        // 切换内容显示
        $('.tab-content').removeClass('active');
        $('#trade-tab-' + tabName).addClass('active');
        
        // 如果是切换到发布标签，检查是否有编辑任务
        if (tabName === 'publish') {
            const editingId = $('#publish-form').data('editing-id');
            
            // 如果没有编辑任务，才重置表单
            if (!editingId) {
                $('#publish-form')[0].reset();
                $('.image-preview').remove();
                $('#img-url-status').text('');  // 清除状态文本
                $('#publish-form button[type="submit"]').text('📦 发布物品');
            }
            // 如果有编辑任务，保持表单数据和按钮文本不变
        }
        
        // 加载对应数据
        if (tabName === 'list') {
            loadTradeList();
        } else if (tabName === 'my') {
            loadMyGoodsList();
        }
    });
}

/**
 * 登录弹窗控制
 */
function showLoginModal() {
    $('#login-modal').addClass('show');
}

function closeLoginModal() {
    $('#login-modal').removeClass('show');
}

function showLoginForm() {
    $('#login-form').show();
    $('#register-form').hide();
}

function showRegisterForm() {
    $('#login-form').hide();
    $('#register-form').show();
}

/**
 * 物品详情弹窗控制
 */
function closeGoodsModal() {
    $('#goods-modal').removeClass('show');
}

/**
 * 初始化表单事件
 */
function initForms() {
    // 登录表单
    $('#login-form').off('submit').on('submit', function(e) {
        e.preventDefault();
        const username = $(this).find('[name="username"]').val();
        const password = $(this).find('[name="password"]').val();
        login(username, password);
    });
    
    // 注册表单
    $('#register-form').off('submit').on('submit', function(e) {
        e.preventDefault();
        const username = $(this).find('[name="reg_username"]').val();
        const password = $(this).find('[name="reg_password"]').val();
        const email = $(this).find('[name="reg_email"]').val();
        register(username, password, email);
    });
    
    // 发布表单
    $('#publish-form').off('submit').on('submit', function(e) {
        e.preventDefault();
        
        const $form = $(this);
        const editingId = $form.data('editing-id');
        
        // 先获取输入框的值（在序列化之前）
        const imgValue = $form.find('[name="goods_img"]').val();
        console.log('\n===========================================');
        console.log('📤 准备提交表单');
        console.log('===========================================');
        console.log('🖼️  图片 URL 输入框的值:', imgValue || '(空)');
        
        // 获取联系方式类型并映射为 API 需要的值
        let contactType = $form.find('[name="contact_type"]').val();
        const apiContactType = contactType === 'wechat' ? 'wx' : 'qq';  // HTML: qq/wechat -> API: qq/wx
        
        const formData = {
            goods_name: $form.find('[name="goods_name"]').val(),
            goods_type: $form.find('[name="goods_type"]').val(),
            goods_attr: $form.find('[name="goods_attr"]').val(),
            currency_type: $form.find('[name="currency_type"]').val(),
            price: $form.find('[name="price"]').val(),
            contact_type: apiContactType,  // 使用映射后的值
            contact_info: $form.find('[name="contact_info"]').val(),
            goods_img: imgValue
        };
        
        console.log('\n📋 完整表单数据:');
        for (let key in formData) {
            console.log(`   ${key}: ${formData[key] || '(空)'}`);
        }
        console.log('   (contact_type 已映射：HTML 值 "' + contactType + '" -> API 值 "' + apiContactType + '")');
        
        if (!formData.goods_img) {
            console.warn('\n⚠️  警告：图片 URL 为空！');
            if (confirm('图片 URL 为空，确定要提交吗？')) {
                console.log('用户选择继续提交（无图片）');
            } else {
                console.log('用户取消提交');
                return;
            }
        } else {
            console.log('\n✅ 图片 URL 已获取:', formData.goods_img);
        }
        
        // 判断是新增还是编辑
        if (editingId) {
            // 编辑模式：调用更新 API
            console.log('📝 更新物品，ID:', editingId);
            TradeAPI.editGoods(editingId, formData)
                .then(function(res) {
                    console.log('✅ 物品更新成功！');
                    showToast('修改成功！');
                    $form[0].reset();
                    $('.image-preview').remove();
                    $form.removeData('editing-id');
                    $('#publish-form button[type="submit"]').text('📦 发布物品');
                    $('.tab-btn[data-tab="my"]').click();
                })
                .catch(function(err) {
                    console.error('❌ 物品更新失败:', err);
                    showToast('修改失败：' + (err.msg || '未知错误'));
                });
        } else {
            // 新增模式：调用发布 API
            publishGoods(formData).then(() => {
                console.log('\n✅ 表单提交成功！');
                $('#publish-form')[0].reset();
                // 清除预览图
                $('.image-preview').remove();
                $('.tab-btn[data-tab="my"]').click();
            }).catch(() => {
                // 错误已在函数内处理
            });
        }
    });
}

/**
 * 初始化搜索事件
 */
function initSearch() {
    // 回车搜索
    $('#search-keyword').off('keypress').on('keypress', function(e) {
        if (e.which === 13) {
            loadTradeList(1);
        }
    });
    
    // 搜索按钮
    $('.trade-filter button').off('click').on('click', function() {
        loadTradeList(1);
    });
}

/**
 * 初始化弹窗关闭事件
 */
function initModalClose() {
    // 点击关闭按钮
    $('.close').off('click').on('click', function() {
        $(this).closest('.modal').removeClass('show');
    });
    
    // 点击遮罩关闭
    $('.modal').off('click').on('click', function(e) {
        if (e.target === this) {
            $(this).removeClass('show');
        }
    });
}

// ==================== 页面初始化 ====================

/**
 * 初始化所有功能
 */
$(document).ready(function() {
    console.log('交易信息发布模块已加载');
    
    // 检查登录状态（只更新用户信息显示，不控制面板）
    checkLoginStatus();
    
    // 初始化 Tab
    initTabs();
    
    // 初始化表单
    initForms();
    
    // 初始化搜索
    initSearch();
    
    // 初始化弹窗关闭
    initModalClose();
    
    // 默认加载物品列表（所有人可见）
    loadTradeList();
    
    // 为价格输入框添加整数限制
    $(document).on('input', 'input[name="price"]', function() {
        // 移除非数字字符（除了开头可能的负号，但价格不需要负号）
        this.value = this.value.replace(/[^0-9]/g, '');
    });
});

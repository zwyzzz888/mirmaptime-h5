/**
 * 实在传奇 - 交易信息 API 接口封装
 * 基于果创云 YesAPI 平台
 * 
 * 接口配置说明：
 * - 所有接口默认不验签
 * - app_key: C9D0523F019B3D49CF0D62F5CDCDF60F
 */

// ==================== API 基础配置 ====================
const TRADE_API = {
    //BASE_URL: 'http://api.yesapi.net',  // 旧地址
    BASE_URL: 'https://api.yesapi.net',  // 使用 HTTPS 避免混合内容问题
    APP_KEY: 'C9D0523F019B3D49CF0D62F5CDCDF60F',
    
    // 数据表名称
    TABLE_NAME: 'shizai_trade_goods',
    
    // 接口服务名
    SERVICE: {
        // 用户认证
        LOGIN: 'App.User.LoginExt',           // 会员登录
        REGISTER: 'App.User.RegisterExt',     // 会员注册
        
        // 物品管理（不需要登录）
        GOODS_LIST: 'SVIP.Szwyzzz888_MyApi.AListShizaitradegoods',  // 获取物品列表
        
        // 物品管理（需要登录）
        GOODS_QUERY: 'App.Table.FreeQuery',   // 分页查询物品
        GOODS_ADD: 'App.Table.CheckCreate',   // 新增物品
        GOODS_EDIT: 'App.Table.Update',       // 编辑物品
        GOODS_DELETE: 'App.Table.Delete'      // 删除物品
    }
};

// ==================== 通用工具函数 ====================

/**
 * 构建 API 请求 URL
 */
function buildApiUrl(service) {
    return `${TRADE_API.BASE_URL}/?s=${service}&app_key=${TRADE_API.APP_KEY}&yesapi_allow_origin=1`;
}

/**
 * 获取存储的用户凭证
 */
function getUserCredentials() {
    const uuid = localStorage.getItem('user_uuid');
    const token = localStorage.getItem('user_token');
    return { uuid, token };
}

/**
 * 保存用户凭证
 */
function saveUserCredentials(uuid, token) {
    localStorage.setItem('user_uuid', uuid);
    localStorage.setItem('user_token', token);
}

/**
 * 清除用户凭证
 */
function clearUserCredentials() {
    localStorage.removeItem('user_uuid');
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_info');
}

/**
 * 统一处理 API 响应
 */
function handleApiResponse(response, successCallback, errorCallback) {
    console.log('API 响应:', response);
    
    if (!response) {
        const errorMsg = '网络请求失败，请检查网络连接或 API 服务是否正常';
        console.error(errorMsg);
        errorCallback && errorCallback({ code: -1, msg: errorMsg });
        return;
    }
    
    // YesAPI 标准响应格式
    if (response.ret === 200) {
        // 业务逻辑判断
        if (response.data && response.data.err_code === 0) {
            successCallback && successCallback(response.data);
        } else {
            const errMsg = response.data?.err_msg || '操作失败';
            console.error('业务错误:', errMsg);
            errorCallback && errorCallback({ 
                code: response.data?.err_code || -1, 
                msg: errMsg 
            });
        }
    } else {
        // HTTP 或协议错误
        const errMsg = response.msg || '请求失败';
        console.error('请求错误:', errMsg);
        errorCallback && errorCallback({ 
            code: response.ret || -1, 
            msg: errMsg + '（如果是在 HTTPS 页面访问，请确认 API 支持 HTTPS）'
        });
    }
}

// ==================== 用户认证 API ====================

/**
 * 用户登录
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise}
 */
function login(username, password) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: buildApiUrl(TRADE_API.SERVICE.LOGIN),
            method: 'POST',
            dataType: 'jsonp',
            data: {
                username: username,
                password: password,
                is_allow_many: true  // 允许多设备登录
            },
            jsonpCallback: 'loginCallback'
        })
        .done(function(res) {
            handleApiResponse(res, 
                function(data) {
                    // 登录成功，保存凭证
                    saveUserCredentials(data.uuid, data.token);
                    
                    // 获取用户信息
                    const userInfo = {
                        uuid: data.uuid,
                        username: username,
                        token: data.token
                    };
                    localStorage.setItem('user_info', JSON.stringify(userInfo));
                    
                    console.log('登录成功:', userInfo);
                    resolve({ 
                        code: 0, 
                        msg: '登录成功',
                        data: {
                            uuid: data.uuid,
                            token: data.token,
                            user: userInfo
                        }
                    });
                },
                function(err) {
                    reject(err);
                }
            );
        })
        .fail(function(xhr, status, error) {
            console.error('登录请求失败:', error);
            reject({ code: -1, msg: '网络错误：' + error });
        });
    });
}

/**
 * 用户注册
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @param {string} email - 邮箱（扩展字段）
 * @returns {Promise}
 */
function register(username, password, email) {
    return new Promise((resolve, reject) => {
        // 构建扩展信息对象
        const extInfo = {
            yesapi_email: email || ''
        };
        
        $.ajax({
            url: buildApiUrl(TRADE_API.SERVICE.REGISTER),
            method: 'POST',
            dataType: 'jsonp',
            data: {
                username: username,
                password: password,
                // 扩展字段：将邮箱放在 ext_info 中，需要 JSON 编码
                ext_info: JSON.stringify(extInfo)
            },
            jsonpCallback: 'registerCallback'
        })
        .done(function(res) {
            handleApiResponse(res,
                function(data) {
                    console.log('注册成功，UUID:', data.uuid);
                    resolve({ 
                        code: 0, 
                        msg: '注册成功',
                        data: { uuid: data.uuid }
                    });
                },
                function(err) {
                    reject(err);
                }
            );
        })
        .fail(function(xhr, status, error) {
            console.error('注册请求失败:', error);
            reject({ code: -1, msg: '网络错误：' + error });
        });
    });
}

/**
 * 退出登录
 */
function logout() {
    clearUserCredentials();
    console.log('已退出登录');
}

/**
 * 检查登录状态
 */
function checkLoginStatus() {
    const { uuid, token } = getUserCredentials();
    return !!(uuid && token);
}

/**
 * 获取当前用户信息
 */
function getCurrentUser() {
    const userInfo = localStorage.getItem('user_info');
    return userInfo ? JSON.parse(userInfo) : null;
}

// ==================== 物品管理 API ====================

/**
 * 获取物品列表（公开接口，无需登录）
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.perpage - 每页数量
 * @param {string} params.title - 物品名称关键词
 * @param {string} params.goods_type - 物品类型
 * @param {string} params.money_type - 货币类型 (0-金币，1-RMB)
 * @returns {Promise}
 */
function getGoodsList(params = {}) {
    const defaultParams = {
        page: params.page || 1,
        perpage: params.perpage || 21
    };
    
    // 添加可选的筛选条件
    if (params.title) {
        defaultParams.title = params.title;
    }
    if (params.goods_type) {
        defaultParams.goods_type = params.goods_type;
    }
    if (params.money_type) {
        defaultParams.money_type = params.money_type;
    }
    
    return new Promise((resolve, reject) => {
        $.ajax({
            url: buildApiUrl(TRADE_API.SERVICE.GOODS_LIST),
            method: 'POST',
            dataType: 'json',  // 改为普通 JSON，不使用 JSONP
            data: defaultParams,
            crossDomain: true  // 允许跨域
        })
        .done(function(res) {
            handleApiResponse(res,
                function(data) {
                    console.log('物品列表获取成功:', data);
                    resolve({ 
                        code: 0, 
                        msg: 'success',
                        data: {
                            list: data.items || [],
                            total: data.total || 0,
                            page: parseInt(params.page) || 1,
                            perpage: parseInt(params.perpage) || 21
                        }
                    });
                },
                function(err) {
                    reject(err);
                }
            );
        })
        .fail(function(xhr, status, error) {
            console.error('获取物品列表失败:', error);
            reject({ code: -1, msg: '网络错误：' + error });
        });
    });
}

/**
 * 分页查询物品数据（需要登录）
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
function queryGoods(params = {}) {
    const { uuid, token } = getUserCredentials();
    
    if (!uuid || !token) {
        return Promise.reject({ code: 401, msg: '请先登录' });
    }
    
    const queryParams = {
        model_name: TRADE_API.TABLE_NAME,
        model_uuid: uuid,  // 传递当前登录用户的 uuid
        page: params.page || 1,
        perpage: params.perpage || 20,
        uuid: uuid,
        token: token
    };
    
    // 添加排序（默认按发布时间倒序）
    if (!params.order) {
        queryParams.order = ['id DESC'];
    }
    
    // 添加自定义查询条件
    if (params.where) {
        queryParams.where = JSON.stringify(params.where);
    }
    
    return new Promise((resolve, reject) => {
        $.ajax({
            url: buildApiUrl(TRADE_API.SERVICE.GOODS_QUERY),
            method: 'POST',
            dataType: 'jsonp',
            data: queryParams,
            jsonpCallback: 'queryGoodsCallback'
        })
        .done(function(res) {
            handleApiResponse(res,
                function(data) {
                    console.log('物品查询成功:', data);
                    resolve({ 
                        code: 0, 
                        msg: 'success',
                        data: {
                            list: data.list || [],
                            total: data.total || 0,
                            page: data.page || 1,
                            perpage: data.perpage || 20
                        }
                    });
                },
                function(err) {
                    reject(err);
                }
            );
        })
        .fail(function(xhr, status, error) {
            console.error('物品查询失败:', error);
            reject({ code: -1, msg: '网络错误：' + error });
        });
    });
}

/**
 * 发布物品（需要登录）
 * @param {Object} goodsData - 物品数据
 * @returns {Promise}
 */
function addGoods(goodsData) {
    const { uuid, token } = getUserCredentials();
    
    if (!uuid || !token) {
        return Promise.reject({ code: 401, msg: '请先登录' });
    }
    
    // 构建提交数据
    const submitData = {
        model_name: TRADE_API.TABLE_NAME,
        model_uuid: uuid,  // 传递当前登录用户的 uuid
        uuid: uuid,
        token: token,
        check_field: 'title,sale_time,contact'  // 检测重复的字段
    };
    
    // 使用 data_X 方式传递动态参数（更方便）
    submitData.data_title = goodsData.goods_name;
    submitData.data_goods_type = goodsData.goods_type;
    submitData.data_goods_attrs = goodsData.goods_attr || '';
    submitData.data_money_type = goodsData.currency_type === 'rmb' ? '1' : '2';
    submitData.data_price = parseInt(goodsData.price);
    submitData.data_contact_type = goodsData.contact_type;
    submitData.data_contact = goodsData.contact_info;
    submitData.data_goods_img = goodsData.goods_img || '';
    submitData.data_sale_time = new Date().toLocaleString('zh-CN', { hour12: false });
    
    return new Promise((resolve, reject) => {
        $.ajax({
            url: buildApiUrl(TRADE_API.SERVICE.GOODS_ADD),
            method: 'POST',
            dataType: 'jsonp',
            data: submitData,
            jsonpCallback: 'addGoodsCallback'
        })
        .done(function(res) {
            handleApiResponse(res,
                function(data) {
                    console.log('物品发布成功，ID:', data.id);
                    resolve({ 
                        code: 0, 
                        msg: '发布成功',
                        data: { id: data.id }
                    });
                },
                function(err) {
                    reject(err);
                }
            );
        })
        .fail(function(xhr, status, error) {
            console.error('物品发布失败:', error);
            reject({ code: -1, msg: '网络错误：' + error });
        });
    });
}

/**
 * 编辑物品（需要登录）
 * @param {number} id - 物品 ID
 * @param {Object} goodsData - 物品数据
 * @returns {Promise}
 */
function editGoods(id, goodsData) {
    const { uuid, token } = getUserCredentials();
    
    if (!uuid || !token) {
        return Promise.reject({ code: 401, msg: '请先登录' });
    }
    
    const submitData = {
        model_name: TRADE_API.TABLE_NAME,
        model_uuid: uuid,  // 传递当前登录用户的 uuid
        id: id,
        uuid: uuid,
        token: token
    };
    
    // 使用 data_X 方式传递要更新的字段
    if (goodsData.goods_name !== undefined) {
        submitData.data_title = goodsData.goods_name;
    }
    if (goodsData.goods_type !== undefined) {
        submitData.data_goods_type = goodsData.goods_type;
    }
    if (goodsData.goods_attr !== undefined) {
        submitData.data_goods_attrs = goodsData.goods_attr;
    }
    if (goodsData.currency_type !== undefined) {
        submitData.data_money_type = goodsData.currency_type === 'rmb' ? '1' : '2';
    }
    if (goodsData.price !== undefined) {
        submitData.data_price = parseInt(goodsData.price);
    }
    if (goodsData.contact_type !== undefined) {
        submitData.data_contact_type = goodsData.contact_type;
    }
    if (goodsData.contact_info !== undefined) {
        submitData.data_contact = goodsData.contact_info;
    }
    if (goodsData.goods_img !== undefined) {
        submitData.data_goods_img = goodsData.goods_img;
    }
    if (goodsData.sale_time !== undefined) {
        submitData.data_sale_time = goodsData.sale_time;
    }
    
    // 如果没有任何 data_X 参数，至少传递一个空的数据对象
    if (!submitData.data_title && !submitData.data_goods_type && 
        !submitData.data_goods_attrs && !submitData.data_money_type &&
        !submitData.data_price && !submitData.data_contact_type &&
        !submitData.data_contact && !submitData.data_goods_img &&
        !submitData.data_sale_time) {
        submitData.data_sale_time = '';  // 默认值
    }
    
    return new Promise((resolve, reject) => {
        $.ajax({
            url: buildApiUrl(TRADE_API.SERVICE.GOODS_EDIT),
            method: 'POST',
            dataType: 'jsonp',
            data: submitData,
            jsonpCallback: 'editGoodsCallback'
        })
        .done(function(res) {
            handleApiResponse(res,
                function(data) {
                    console.log('物品编辑成功，ID:', id);
                    resolve({ 
                        code: 0, 
                        msg: '修改成功'
                    });
                },
                function(err) {
                    reject(err);
                }
            );
        })
        .fail(function(xhr, status, error) {
            console.error('物品编辑失败:', error);
            reject({ code: -1, msg: '网络错误：' + error });
        });
    });
}

/**
 * 删除物品（需要登录）
 * @param {number} id - 物品 ID
 * @returns {Promise}
 */
function deleteGoods(id) {
    const { uuid, token } = getUserCredentials();
    
    if (!uuid || !token) {
        return Promise.reject({ code: 401, msg: '请先登录' });
    }
    
    const submitData = {
        model_name: TRADE_API.TABLE_NAME,
        model_uuid: uuid,  // 传递当前登录用户的 uuid
        id: id,
        uuid: uuid,
        token: token
    };
    
    return new Promise((resolve, reject) => {
        $.ajax({
            url: buildApiUrl(TRADE_API.SERVICE.GOODS_DELETE),
            method: 'POST',
            dataType: 'jsonp',
            data: submitData,
            jsonpCallback: 'deleteGoodsCallback'
        })
        .done(function(res) {
            handleApiResponse(res,
                function(data) {
                    console.log('物品删除成功，ID:', id);
                    resolve({ 
                        code: 0, 
                        msg: '删除成功'
                    });
                },
                function(err) {
                    reject(err);
                }
            );
        })
        .fail(function(xhr, status, error) {
            console.error('物品删除失败:', error);
            reject({ code: -1, msg: '网络错误：' + error });
        });
    });
}

/**
 * 获取我的物品列表
 * @param {Object} params - 查询参数
 * @returns {Promise}
 */
function getMyGoodsList(params = {}) {
    const currentUser = getCurrentUser();
    
    if (!currentUser || !currentUser.uuid) {
        return Promise.reject({ code: 401, msg: '请先登录' });
    }
    
    // 构建查询条件：只查询当前用户的物品
    const whereConditions = [];
    if (currentUser.uuid) {
        // 假设数据表有 uuid 字段记录发布者
        whereConditions.push(['uuid', 'EQ', currentUser.uuid]);
    }
    
    return queryGoods({
        ...params,
        where: whereConditions
    });
}

// ==================== 导出接口（供外部调用） ====================

window.TradeAPI = {
    // 基础配置
    config: TRADE_API,
    
    // 工具函数
    buildApiUrl: buildApiUrl,
    getUserCredentials: getUserCredentials,
    checkLoginStatus: checkLoginStatus,
    getCurrentUser: getCurrentUser,
    
    // 用户认证
    login: login,
    register: register,
    logout: logout,
    
    // 物品管理
    getGoodsList: getGoodsList,      // 公开接口
    queryGoods: queryGoods,          // 需要登录
    addGoods: addGoods,              // 需要登录
    editGoods: editGoods,            // 需要登录
    deleteGoods: deleteGoods,        // 需要登录
    getMyGoodsList: getMyGoodsList   // 需要登录
};

console.log('✅ TradeAPI 已加载 - 果创云 YesAPI 接口封装完成');
console.log('APP_KEY:', TRADE_API.APP_KEY);

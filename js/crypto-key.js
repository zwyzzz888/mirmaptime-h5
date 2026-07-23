/**
 * API 密钥保护模块
 * ------------------------------------------------------------
 * 说明：原明文密钥可能已泄露，这里改为以 Base64 形式存储，
 * 在真正发起请求时再调用 decodeApiKey() 解码还原。
 * 注意：Base64 只是“编码/混淆”，并非加密；若密钥确已泄露，
 * 最根本的解决办法仍是前往对应平台重新生成（轮换）密钥。
 * ------------------------------------------------------------
 */

(function (global) {
    'use strict';

    // 以 Base64 形式存储的密钥（非明文，仅本文件可见）
    var ENCODED_KEYS = {
        // 果创云 YesAPI APP_KEY
        APP_KEY: 'QzlEMDUyM0YwMTlCM0Q0OUNGMEQ2MkY1Q0RDREY2MEY=',
        // AI 识别服务 apiKey
        AI_API_KEY: 'c2stZFFFVFRqRmw2QmJlQmlwTWppa2ZUYzc5bHZxa3BKVWgyUDNra2Y5dTlGVGdmeGdP'
    };

    /**
     * 将 Base64 编码后的密钥解码为明文
     * @param {string} encoded Base64 字符串
     * @returns {string} 解码后的明文密钥
     */
    function decodeApiKey(encoded) {
        return atob(encoded);
    }

    global.ENCODED_KEYS = ENCODED_KEYS;
    global.decodeApiKey = decodeApiKey;
})(typeof window !== 'undefined' ? window : this);

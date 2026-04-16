/**
 * 商品图片AI识别模块
 * 用于识别上传的商品图片，自动提取商品信息并填充表单
 */

// AI配置（需要在页面加载时设置）
const AI_CONFIG = {
    apiKey: '',           // API密钥
    baseUrl: '',          // API基础URL
    model: ''             // 模型名称
};

/**
 * 初始化AI配置
 * @param {Object} config - AI配置对象
 */
function initAIConfig(config) {
    AI_CONFIG.apiKey = config.apiKey || '';
    AI_CONFIG.baseUrl = config.baseUrl || '';
    AI_CONFIG.model = config.model || '';
    
    console.log('✅ AI配置已初始化');
    console.log('   Base URL:', AI_CONFIG.baseUrl);
    console.log('   Model:', AI_CONFIG.model);
}

/**
 * 构建请求头
 * @returns {Object} 请求头对象
 */
function buildHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    
    if (AI_CONFIG.apiKey) {
        headers['Authorization'] = `Bearer ${AI_CONFIG.apiKey}`;
    }
    
    return headers;
}

/**
 * 识别商品图片
 * @param {string} imageData - Base64编码的图片数据
 * @returns {Promise<Object>} 识别结果
 */
async function recognizeGoodsImage(imageData) {
    if (!AI_CONFIG.apiKey || !AI_CONFIG.baseUrl || !AI_CONFIG.model) {
        throw new Error('AI配置未初始化，请先调用 initAIConfig()');
    }
    
    console.log('\n===========================================');
    console.log('🤖 开始AI识别商品图片');
    console.log('===========================================');
    
    // 确定图像格式
    const imageUrl = imageData.startsWith('data:') 
        ? imageData 
        : `data:image/png;base64,${imageData}`;
    
    // 构建提示词
    const prompt = `你是一个专业的游戏装备识别助手。请分析这张游戏装备截图，提取以下信息并以JSON格式返回：

{
  "goods_name": "装备名称",
  "goods_type": "装备类型（必须是以下之一：wq-武器/yf-衣服/tk-头盔/xl-项链/sz-手镯/jz-戒指/sj-书籍/cl-材料/xz-勋章）",
  "goods_attr": "装备属性描述（如：攻击2-5、防御3-6等）"
}

要求：
1. goods_name：只返回装备的具体名称，不要包含其他文字
2. goods_type：必须从给定的9个类型中选择最匹配的一个，只返回类型代码（如wq、yf等）
3. goods_attr：详细描述装备的所有属性，包括攻击、防御、魔法、道术等数值
4. 如果某些信息无法识别，对应字段返回空字符串
5. 只返回纯JSON，不要有任何额外的说明文字或markdown标记`;

    const requestBody = {
        model: AI_CONFIG.model,
        messages: [
            {
                role: 'user',
                content: [
                    {
                        type: 'text',
                        text: prompt
                    },
                    {
                        type: 'image_url',
                        image_url: {
                            url: imageUrl,
                            detail: 'high'
                        }
                    }
                ]
            }
        ],
        max_tokens: 500,
        temperature: 0.3  // 降低温度以获得更稳定的输出
    };
    
    try {
        console.log('发送请求到:', `${AI_CONFIG.baseUrl}/chat/completions`);
        
        const response = await fetch(`${AI_CONFIG.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: buildHeaders(),
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API请求失败:', response.status, errorText);
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ API响应成功');
        
        if (!data.choices || data.choices.length === 0) {
            throw new Error('API返回结果为空');
        }
        
        const content = data.choices[0].message?.content?.trim() || '';
        
        if (!content) {
            throw new Error('识别结果为空');
        }
        
        console.log('📝 AI原始回复:', content);
        
        // 尝试解析JSON
        let result;
        try {
            // 清理可能的markdown标记
            let jsonStr = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
            result = JSON.parse(jsonStr);
        } catch (e) {
            console.warn('⚠️ JSON解析失败，尝试提取JSON内容');
            // 尝试从文本中提取JSON
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                result = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('无法解析AI返回的结果');
            }
        }
        
        console.log('✅ 解析后的结果:', result);
        console.log('===========================================\n');
        
        return {
            success: true,
            data: result
        };
        
    } catch (error) {
        console.error('❌ AI识别失败:', error);
        console.log('===========================================\n');
        
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * 将识别结果填充到表单
 * @param {Object} goodsInfo - 商品信息对象
 */
function fillFormWithGoodsInfo(goodsInfo) {
    console.log('\n===========================================');
    console.log('📝 开始填充表单');
    console.log('===========================================');
    
    const $form = $('#publish-form');
    
    // 填充物品名称
    if (goodsInfo.goods_name) {
        $form.find('[name="goods_name"]').val(goodsInfo.goods_name);
        console.log('✅ 物品名称:', goodsInfo.goods_name);
    }
    
    // 填充物品类型
    if (goodsInfo.goods_type) {
        $form.find('[name="goods_type"]').val(goodsInfo.goods_type);
        console.log('✅ 物品类型:', goodsInfo.goods_type);
    }
    
    // 填充物品属性
    if (goodsInfo.goods_attr) {
        $form.find('[name="goods_attr"]').val(goodsInfo.goods_attr);
        console.log('✅ 物品属性:', goodsInfo.goods_attr);
    }
    
    console.log('===========================================\n');
    
    showToast('✨ AI识别完成，已自动填充商品信息');
}

/**
 * 处理图片上传并触发AI识别
 * @param {File} file - 图片文件
 */
async function handleImageUploadWithAI(file) {
    if (!file) {
        showToast('请选择图片文件');
        return;
    }
    
    // 检查是否为图片
    if (!file.type.startsWith('image/')) {
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
    reader.onload = async function(e) {
        const base64Data = e.target.result; // data:image/png;base64,iVBOR...
        
        console.log('Base64 长度:', base64Data.length);
        
        // 构建 API 请求参数
        const requestData = {
            file: base64Data,  // 必须使用 POST 传递的 base64 数据
            file_name: file.name,  // 文件名
            yesapi_allow_origin: 1
        };
        
        try {
            // 调用果创云 API 上传图片
            const uploadResult = await new Promise((resolve, reject) => {
                $.ajax({
                    url: `${IMAGE_HOST.BASE_URL}/?s=${IMAGE_HOST.UPLOAD_SERVICE}&app_key=${TRADE_API.APP_KEY}&yesapi_allow_origin=1`,
                    method: 'POST',
                    data: requestData,
                    dataType: 'json',
                    crossDomain: true
                })
                .done(function(res) {
                    console.log('\n✅ 收到响应');
                    console.log('响应内容:', JSON.stringify(res, null, 2));
                    
                    if (res.ret === 200 && res.data && res.data.err_code === 0) {
                        const imageUrl = res.data.https_url || res.data.url;
                        
                        if (!imageUrl) {
                            reject(new Error('未获取到图片 URL'));
                            return;
                        }
                        
                        console.log('\n🔗 图片 URL:', imageUrl);
                        resolve(imageUrl);
                    } else {
                        reject(new Error(res.data?.err_msg || res.msg || '上传失败'));
                    }
                })
                .fail(function(xhr, status, error) {
                    console.error('\n❌ 上传失败');
                    console.error('状态:', status);
                    console.error('错误:', error);
                    reject(new Error('网络错误'));
                });
            });
            
            // 填入到输入框
            const $input = $('#goods-img-url');
            $input.val(uploadResult);
            console.log('✅ 已保存到输入框:', $input.val());
            
            // 移除旧的预览图（如果有）
            $('#img-url-status').next('.image-preview').remove();
            
            // 显示预览图
            const previewHtml = `<div class="image-preview" style="margin-top:10px;"><img src="${uploadResult}" style="max-width:200px;max-height:200px;border-radius:5px;box-shadow:0 2px 8px rgba(0,0,0,0.1);" alt="预览图"></div>`;
            $('#img-url-status').after(previewHtml);
            
            // 更新状态文本
            $('#img-url-status').text('✓ 图片已上传');
            
            showToast('✅ 上传成功！');
            
            // 🆕 上传图片成功后，自动触发AI识别
            showToast('🤖 正在AI识别商品信息...', 3000);
            
            const aiResult = await recognizeGoodsImage(base64Data);
            
            if (aiResult.success) {
                fillFormWithGoodsInfo(aiResult.data);
            } else {
                console.warn('⚠️ AI识别失败:', aiResult.error);
                showToast('⚠️ AI识别失败，请手动填写商品信息');
            }
            
        } catch (error) {
            console.error('❌ 上传失败:', error);
            showToast('图片上传失败，请重试');
        }
    };
    
    reader.onerror = function() {
        console.error('❌ 文件读取失败');
        showToast('文件读取失败，请重试');
    };
    
    // 读取文件
    reader.readAsDataURL(file);
}

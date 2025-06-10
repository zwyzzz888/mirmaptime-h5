// httpRequest.js

const HTTPRequest = {
  // 默认配置
  defaultOptions: {
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin':'*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
      // 可以添加 Authorization 等默认 header
    },
    timeout: 10000, // 超时时间（ms）
  },

  // 处理 POST 请求
  async post(url, data, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.defaultOptions.timeout);

    const finalOptions = {
      method: 'POST',
      headers: { ...this.defaultOptions.headers, ...options.headers },
      body: JSON.stringify(data),
      signal: controller.signal,
      ...options,
    };

    try {
      const response = await fetch(url, finalOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json(); // 假设返回的是 JSON 格式
    } catch (error) {
      console.error('HTTP POST request failed:', error.message);
      throw error;
    }
  },


  // 处理 GET 请求
  async get(url, params = {}, options = {}) {
    // 将查询参数拼接到 URL
    const queryString = new URLSearchParams(params).toString();
    const requestUrl = queryString ? `${url}?${queryString}` : url;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.defaultOptions.timeout);

    const finalOptions = {
      method: 'GET',
      headers: { ...this.defaultOptions.headers, ...options.headers },
      signal: controller.signal,
      ...options,
    };

    try {
      const response = await fetch(requestUrl, finalOptions);
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json(); // 假设返回的是 JSON 格式
    } catch (error) {
      console.error('HTTP GET request failed:', error.message);
      throw error;
    }
  }


  // 可以扩展 GET、PUT、DELETE 等方法...
};

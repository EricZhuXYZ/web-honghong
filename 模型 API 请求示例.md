# AI 模型 API 请求示例

## LLM

**google-flash-文本模型** 的请求示例如下：

### **请求基本信息**

- **Method：** `POST`
- **URL：** `https://openrouter.ai/api/v1/chat/completions`

### **Headers**

| Key           | Value             |
| ------------- | ----------------- |
| Content-Type  | application/json  |
| Authorization | Bearer 见环境变量 |

### **Body**

页面中 Body 内容未完整展示，但根据响应结果可以推断标准请求格式如下：

```json
{
  "model": "google/gemini-3-flash-preview-20251217",
  "messages": [
    {
      "role": "user",
      "content": "你的问题内容"
    }
  ]
}
```

### **成功响应示例**

```json
{
  "id": "gen-1777691714-OqDkmAcWzt6ZbaNY6eP2",
  "object": "chat.completion",
  "created": 1777691714,
  "model": "google/gemini-3-flash-preview-20251217",
  "provider": "Google",
  "choices": [
    {
      "index": 0,
      "finish_reason": "stop",
      "message": {
        "role": "assistant",
        "content": "我是 Gemini，是由 Google 开发的大型语言模型。"
      }
    }
  ]
}
```



## TTS

**豆包语音合成** 的请求示例如下：

### **请求基本信息**

- **Method：** `POST`
- **URL：** `https://openspeech.bytedance.com/api/v3/tts/unidirectional`

### **Headers**

| Key               | Value            |
| ----------------- | ---------------- |
| Content-Type      | application/json |
| X-Api-Key         | 见环境变量       |
| X-Api-Resource-Id | seed-tts-2.0     |


### **Body**

```json
{
  "user": {
    "uid": "postman_test_001"
  },
  "namespace": "TTS",
  "req_params": {
    "text": "在这个静谧的清晨。",
    "speaker": "zh_female_xiaohe_uranus_bigtts",
    "audio_params": {
      "format": "mp3",
      "sample_rate": 24000,
      "bit_rate": 128000
    },
    "additions": "{\"context_texts\":[\"像说悄悄话一样，还有撒娇\"]}"
  }
}
```

### **成功响应示例**

```
{"code":0,"message":"","data":"Base64"}
{"code":0,"message":"","data":"Base64"}
{"code":0,"message":"","data":"Base64"}
{"code":0,"message":"","data":null,"sentence":{"phonemes":[],"text":"在这个静谧的清晨。","words":[]}}
{"code":20000000,"message":"OK","data":null}
```

## **seedream-文生图**

### 请求基本信息

**请求方式：** `POST`

**Endpoint：**

```text
https://ark.cn-beijing.volces.com/api/v3/images/generations
```

### **Headers**

| Key           | Value             |
| ------------- | ----------------- |
| Content-Type  | application/json  |
| Authorization | Bearer 见环境变量 |

### **Body**

根据接口返回的响应，实际使用的模型为 `doubao-seedream-4-0-250828`，Body 参考结构如下：

```json
{
  "model": "doubao-seedream-4-0-250828",
  "prompt": "你的文字描述",
  "size": "1024x1024",
  "n": 1
}
```

### **成功响应示例：**

```json
{
  "model": "doubao-seedream-4-0-250828",
  "created": 1777799720,
  "data": [
    {
      "url": "https://ark-content-generation-v2-cn-beijing.tos-cn-beijing.volces.com/...",
      "size": "3136x1344"
    }
  ],
  "usage": {
    "generated_images": 1,
    "output_tokens": 16464,
    "total_tokens": 16464
  }
}
```



## **seedream-图生图**

### **请求基本信息**

**请求方式：** `POST`

**Endpoint：**

```text
https://ark.cn-beijing.volces.com/api/v3/images/generations
```

###  **Headers**

| Key           | Value             |
| ------------- | ----------------- |
| Content-Type  | application/json  |
| Authorization | Bearer 见环境变量 |

### **Body**

```json
{
  "model": "doubao-seedream-4-0-250828",
  "prompt": "让图片1里左侧的人，穿上图片2的衣服",
  "image": [
    "https://your-image-url-1.png",
    "https://your-image-url-2.png"
  ],
  "sequential_image_generation": "disabled",
  "response_format": "url",
  "size": "2K",
  "stream": false,
  "watermark": false
}
```

### **成功响应示例**

```json
{
  "model": "doubao-seedream-4-0-250828",
  "created": 1777800268,
  "data": [
    {
      "url": "https://ark-content-generation-v2-cn-beijing.tos-cn-beijing.volces.com/...",
      "size": "1600x2848"
    }
  ],
  "usage": {
    "generated_images": 1,
    "output_tokens": 17800,
    "total_tokens": 17800
  }
}
```

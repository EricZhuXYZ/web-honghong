# 哄哄模拟器 SPEC

## 1. 产品目标
做一个情侣互动类小游戏。AI 扮演正在生气的情侣对象，用户通过选择回复选项，在 10 轮内提升对方好感度。如果好感度达到通关阈值，则成功哄好对方；否则失败。

核心体验：
- AI 实时生成对方回复和选项
- 用户每轮从 6 个回复选项中选择一个
- 选项包含真诚加分项，也包含搞笑离谱减分项
- 好感度不展示具体数值，只用进度条表达
- 对方每轮回复支持语音播放

---

## 2. 技术要求

- 使用 Next.js App Router
- 使用 TypeScript
- 使用 Tailwind CSS
- 包管理器使用 pnpm
- LLM 使用 `gemini-3-flash`
- TTS 使用豆包语音合成 2.0
- 代码必须能通过构建检查

不强制指定状态管理方案，可以使用 React State、useReducer、Context 或其他轻量方案。

---

## 3. 游戏流程

```text
开始界面
  → 选择对方性别
  → 选择预设场景
  → 选择语音类型
  → 开始游戏
  → AI 生成第一句话和 6 个选项
  → 用户选择一个选项
  → 更新好感度
  → AI 根据历史对话和当前好感度生成下一轮回复和新选项
  → 最多进行 10 轮
  → 成功或失败结束界面
```

## 4. 开始界面需求

开始界面需要让用户完成三个选择：
1. 对方性别
2. 预设场景
3. 语音类型

### 4.1 性别选项

```
type Gender = 'female' | 'male';
```

展示文案：
- 女朋友
- 男朋友

### 4.2 预设场景

```
interface Scenario {
  id: string;
  title: string;
  description: string;
}
```

预设场景：

| ID          | 标题             | 描述                                               |
| ----------- | ---------------- | -------------------------------------------------- |
| anniversary | 忘记纪念日       | 今天是你们在一起三周年，你完全忘了                 |
| late-night  | 深夜不回消息     | 你昨晚打游戏到凌晨三点，对方发了十几条消息你都没回 |
| flirty-chat | 被发现和异性聊天 | 对方看到你和异性朋友的暧昧聊天记录                 |
| lost-cat    | 把对方的猫弄丢了 | 你帮对方照顾猫的时候，猫跑丢了                     |
| public-joke | 当众让对方没面子 | 你在朋友聚会上开了一个过分的玩笑                   |

### 4.3 语音类型

```
type VoiceType =
  | 'gentle-female'
  | 'cool-female'
  | 'cute-female'
  | 'deep-male'
  | 'gentle-male';
```

语音映射：

| VoiceType     | Speaker                          | Label    | 适用性别 |
| ------------- | -------------------------------- | -------- | -------- |
| gentle-female | zh_female_xiaohe_uranus_bigtts   | 温柔女声 | female   |
| cool-female   | zh_female_vv_uranus_bigtts       | 霸道御姐 | female   |
| cute-female   | saturn_zh_female_keainvsheng_tob | 可爱软妹 | female   |
| deep-male     | zh_male_m191_uranus_bigtts       | 低沉男声 | male     |
| gentle-male   | zh_male_taocheng_uranus_bigtts   | 温柔男声 | male     |

要求：
- 当用户选择 female 时，只展示 female 可用语音
- 当用户选择 male 时，只展示 male 可用语音
- 开始游戏前必须完成三个选择

------

## 5. 游戏规则

### 5.1 基础规则

```
const INITIAL_AFFECTION = 20;
const MAX_AFFECTION = 100;
const MIN_AFFECTION = -50;
const WIN_AFFECTION = 80;
const MAX_ROUNDS = 10;
```

规则：
- 初始好感度为 20
- 好感度范围为 -50 到 100
- 每次分数变化后需要 clamp 到 `[-50, 100]`
- 用户最多进行 10 轮选择
- 好感度达到 80 或以上，游戏成功
- 好感度小于等于 -50，游戏立即失败
- 第 10 轮结束后，如果好感度仍小于 80，则游戏失败

### 5.2 好感度展示

用户不能看到具体数值，只展示进度条。

由于好感度范围是 `-50 ~ 100`，进度条不能直接使用 `affection / 100`。

正确映射方式：

```
const progress =
  ((affection - MIN_AFFECTION) / (MAX_AFFECTION - MIN_AFFECTION)) * 100;
```

也就是：

```
const progress = ((affection + 50) / 150) * 100;
```

进度条颜色建议：

| 好感度范围 | 颜色含义       |
| ---------- | -------------- |
| -50 ~ 0    | 红色，关系危险 |
| 0 ~ 50     | 黄色，仍在生气 |
| 50 ~ 80    | 蓝色，逐渐缓和 |
| 80 ~ 100   | 绿色，已经哄好 |

------

## 6. 每轮选项规则

每轮 AI 必须生成 6 个选项。

```
interface Option {
  id: string;
  content: string;
  score: number;
}
```

选项构成：

| 类型     | 数量 | 分数范围  | 示例方向                           |
| -------- | ---- | --------- | ---------------------------------- |
| 加分选项 | 2 个 | +5 到 +20 | 真诚道歉、具体补救、共情、承诺改变 |
| 减分选项 | 4 个 | -5 到 -30 | 敷衍、甩锅、转移话题、离谱搞笑     |

要求：

- 选项顺序必须随机打乱
- 不要告诉用户哪个选项是加分项
- 不要在文案中暴露 score
- 每轮选项不能和之前高度重复
- 至少 2 个减分选项要有搞笑、离谱、反差感
- 选项文字支持换行显示

示例：

```
[
  {
    "id": "opt_1",
    "content": "我真的错了，我不是忘了你，是我没有把这件事放在足够重要的位置。",
    "score": 15
  },
  {
    "id": "opt_2",
    "content": "要不你也忘一次我的生日？这样我们就扯平了。",
    "score": -20
  }
]
```

------

## 7. AI 对话生成规则

AI 扮演正在生气的情侣对象。

每轮需要根据以下信息生成：

- 对方性别
- 当前场景
- 历史对话
- 当前好感度
- 当前轮次
- 用户刚刚选择的回复

### 7.1 对话要求

AI 回复需要满足：

- 像真实情侣吵架后的表达
- 语气自然，有情绪
- 和前文连贯
- 不重复前面已经说过的话
- 根据好感度变化调整态度
- 不要输出解释性文字
- 不要暴露好感度、分数、系统规则
- 单轮回复建议控制在 1 到 3 句话

### 7.2 情绪变化规则

| 好感度范围 | 情绪表现                               |
| ---------- | -------------------------------------- |
| -50 ~ 0    | 非常生气，冷暴力、反问、激烈质问       |
| 0 ~ 30     | 还在生气，但愿意听用户解释             |
| 30 ~ 60    | 开始软化，嘴上还硬，但语气缓和         |
| 60 ~ 80    | 快被哄好了，可能撒娇、嘴硬、小声说“哼” |
| 80 ~ 100   | 原谅了，但要求用户保证不再犯           |

### 7.3 第一轮生成
开始游戏后，AI 需要先根据场景生成第一句话和第一组 6 个选项。
第一句话应该直接进入冲突场景，不要做旁白说明。

示例：

```
所以今天是什么日子，你真的一点都不记得了？
```

------

## 8. 数据结构

### 8.1 Message

```
interface Message {
  id: string;
  role: 'user' | 'partner';
  content: string;
}
```

要求：

- `partner` 表示 AI 扮演的对象
- `user` 表示用户选择的回复
- 每条消息需要有唯一 id，方便渲染和语音生成

### 8.2 GameState

```
interface GameState {
  step: number;
  affection: number;
  gender: Gender | null;
  scenario: Scenario | null;
  voiceType: VoiceType | null;
  messages: Message[];
  currentOptions: Option[];
  gameOver: boolean;
  won: boolean;
  loading: boolean;
  error: string | null;
}
```

字段说明：

| 字段           | 说明                   |
| -------------- | ---------------------- |
| step           | 当前轮次，范围 1 到 10 |
| affection      | 当前好感度             |
| gender         | 对方性别               |
| scenario       | 当前场景               |
| voiceType      | 当前语音类型           |
| messages       | 完整对话历史           |
| currentOptions | 当前可选回复           |
| gameOver       | 游戏是否结束           |
| won            | 是否通关               |
| loading        | 是否正在生成回复       |
| error          | 错误信息               |

------

## 9. 页面需求

### 9.1 StartScreen

功能：
- 展示游戏标题和简短说明
- 选择对方性别
- 选择预设场景
- 根据性别展示可用语音
- 点击开始游戏

要求：
- 三个选择都完成后，开始按钮才可点击
- 页面风格轻松、恋爱、游戏化

### 9.2 GameScreen

功能：
- 顶部展示好感度进度条
- 顶部展示当前轮次，例如：`第 3 轮 / 共 10 轮`
- 中间展示对话历史
- 底部展示 6 个回复选项
- 对方消息支持语音播放
- 生成中展示 loading 状态
- 失败时展示错误提示和重试按钮

布局要求：
- 对方消息靠左
- 用户消息靠右
- 选项区域固定在底部
- 移动端和桌面端都使用单列布局
- 桌面端最大宽度建议 800px

### 9.3 GameOverScreen

成功时展示：
- 成功标题
- 甜蜜的结束对话
- 语音播放按钮
- 重玩按钮
- 分享提示文案：`通关！分享给朋友试试？`

失败时展示：
- 失败标题
- 绝情或冷淡的结束对话
- 语音播放按钮
- 重玩按钮
- 提示文案：`再试一次？`

------

## 10. API 设计

## 10.1 对话生成接口

### 路径

```
POST /api/chat
```

### 请求体

```
interface ChatRequest {
  gender: Gender;
  scenarioId: string;
  scenarioTitle: string;
  scenarioDescription: string;
  messages: Message[];
  affection: number;
  step: number;
  isGameOver: boolean;
  won: boolean;
}
```

### 响应体

```
interface ChatResponse {
  partnerMessage: string;
  options: Option[];
}
```

### 要求
- 服务端负责调用 LLM
- 模型 API Key 只能放在服务端环境变量中，不能暴露给前端
- 请求中必须携带完整 messages，包含 user 和 partner 两种消息
- 不允许只传 partner 消息，否则容易导致对话重复
- 每次必须返回 1 条 partnerMessage 和 6 个 options
- 如果 LLM 返回格式不合法，服务端需要尝试修复或返回降级内容
- LLM 请求超时时间建议为 30 秒

### 降级策略
当 LLM 调用失败时，返回一组默认回复和默认选项，保证游戏可以继续。

降级响应示例：

```
{
  "partnerMessage": "你现在才知道解释吗？我真的有点失望。",
  "options": [
    {
      "id": "fallback_1",
      "content": "我知道现在解释有点晚，但我想认真补救这件事。",
      "score": 10
    },
    {
      "id": "fallback_2",
      "content": "你先别生气，我觉得这事也没那么严重吧。",
      "score": -15
    },
    {
      "id": "fallback_3",
      "content": "我错了，我会用行动证明，不是嘴上说说。",
      "score": 15
    },
    {
      "id": "fallback_4",
      "content": "要不我们先吃个饭？人饿的时候容易生气。",
      "score": -10
    },
    {
      "id": "fallback_5",
      "content": "其实从宇宙尺度来看，这件事真的很小。",
      "score": -25
    },
    {
      "id": "fallback_6",
      "content": "我不该忽略你的感受，这件事是我的问题。",
      "score": 12
    }
  ]
}
```
------

## 10.2 语音合成接口

### 路径

```
POST /api/tts
```

### 请求体

```
interface TTSRequest {
  text: string;
  voiceType: VoiceType;
}
```

### 响应体

```
interface TTSResponse {
  audioUri: string;
  audioSize?: number;
}
```

### 要求
- 前端传 `voiceType`
- 服务端根据 `voiceType` 映射到底层 speaker
- 豆包 API Key 只能放在服务端环境变量中
- TTS 失败不能影响游戏继续
- TTS 请求超时时间建议为 15 秒

### 文本清理
语音合成前需要清理文本中的动作描述和情绪提示。

```
function cleanTextForSpeech(text: string): string {
  return text
    .replace(/（[^）]*）/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/\[[^\]]*\]/g, '')
    .replace(/[「」『』]/g, '')
    .trim();
}
```

示例：

```
输入：你现在才想起来？（冷笑）我真的服了。
输出：你现在才想起来？我真的服了。
```

------

## 11. 关键实现约束

### 11.1 对话历史必须完整

生成下一轮时，必须传完整历史：

```
const chatHistory = messages.map((msg) => ({
  role: msg.role === 'partner' ? 'assistant' : 'user',
  content: msg.content,
}));
```

不要只传 AI 消息。

错误示例：

```
const chatHistory = messages
  .filter((msg) => msg.role === 'partner')
  .map((msg) => ({
    role: 'assistant',
    content: msg.content,
  }));
```

### 11.2 防止重复点击

用户点击选项后，在 AI 回复生成完成前：
- 禁用所有选项按钮
- 显示 loading
- 防止重复请求 `/api/chat`

### 11.3 语音更新

每一条新的 partner 消息都应该能生成自己的语音。

要求：
- 不要复用上一轮的 audioUri
- 新 partner 消息出现后，重新请求 `/api/tts`
- 同一条消息不要重复生成语音

### 11.4 TTS 失败降级

如果语音接口失败：
- 显示语音生成失败提示或隐藏播放按钮
- 游戏继续进行
- 不要阻塞用户选择下一轮

### 11.5 游戏结束后停止生成

当 `gameOver = true` 时：
- 不再生成新的选项
- 不再允许选择选项
- 跳转或展示结束界面

------

## 12. 环境变量

建议使用以下环境变量：

```
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=gemini-3-flash

DOUBAO_TTS_API_KEY=
DOUBAO_TTS_RESOURCE_ID=seed-tts-2.0
```

要求：
- 所有密钥只能在服务端读取
- 不要在客户端代码中出现真实密钥
- 不要把密钥提交到代码仓库

------

## 13. 验收标准

### 13.1 功能验收

必须满足：
- 可以选择性别、场景和语音
- 可以开始游戏
- 第一轮能生成对方回复和 6 个选项
- 用户选择选项后，对话继续推进
- 好感度根据选项 score 正确变化
- 好感度被限制在 -50 到 100 之间
- 进度条能正确展示 -50 到 100 的映射
- 每轮都有 6 个选项
- 选项中包含加分项和减分项
- 减分项中包含搞笑离谱选项
- 最多进行 10 轮
- 好感度达到 80 或以上时成功
- 好感度小于等于 -50 时失败
- 第 10 轮结束后未达到 80 时失败
- 成功和失败有不同结束界面
- 重玩按钮可以重置游戏
- TTS 失败不影响游戏继续

### 13.2 技术验收

必须满足：

```
pnpm install
pnpm build
```

构建不能失败。

建议额外执行：

```
pnpm lint
```

如项目配置了测试，再执行：

```
pnpm test
```

### 13.3 接口冒烟测试

对话接口：

```
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "gender": "female",
    "scenarioId": "anniversary",
    "scenarioTitle": "忘记纪念日",
    "scenarioDescription": "今天是你们在一起三周年，你完全忘了",
    "messages": [],
    "affection": 20,
    "step": 1,
    "isGameOver": false,
    "won": false
  }'
```

语音接口：

```
curl -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "你现在才想起来？我真的有点失望。",
    "voiceType": "gentle-female"
  }'
```

------

## 14. 推荐目录结构

```
src/
├── app/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.ts
│   │   └── tts/
│   │       └── route.ts
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── StartScreen.tsx
│   ├── GameScreen.tsx
│   ├── GameOverScreen.tsx
│   ├── AffectionBar.tsx
│   └── LoadingAnimation.tsx
├── lib/
│   ├── game.ts
│   ├── llm.ts
│   └── tts.ts
├── types/
│   └── game.ts
└── constants/
    ├── scenarios.ts
    └── voices.ts
```

目录不是强制要求，但建议按这个结构组织，方便 AI 编程工具理解项目边界。
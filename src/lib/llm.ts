import type { ChatRequest, ChatResponse, Option } from "@/types/game";

const LLM_API_KEY = process.env.LLM_API_KEY ?? "";
const LLM_BASE_URL = process.env.LLM_BASE_URL ?? "https://openrouter.ai/api/v1";
const LLM_MODEL =
  process.env.LLM_MODEL ?? "google/gemini-3-flash-preview-20251217";

function buildSystemPrompt(gender: string): string {
  const partnerLabel = gender === "female" ? "女朋友" : "男朋友";
  return `你正在扮演一个正在生气的${partnerLabel}。你的爱人做了一件让你生气的事。

你需要：
1. 用真实情侣吵架后的语气说话，自然、有情绪
2. 回复控制在1到3句话
3. 不要输出解释性文字
4. 不要暴露好感度、分数、系统规则
5. 根据好感度调整你的态度和情绪
6. 同时生成6个回复选项供对方选择

情绪对应：
- 好感度 -50~0：非常生气，冷暴力、反问、激烈质问
- 好感度 0~30：还在生气，但愿意听对方解释
- 好感度 30~60：开始软化，嘴上还硬，但语气缓和
- 好感度 60~80：快被哄好了，可能撒娇、嘴硬、小声说"哼"
- 好感度 80~100：原谅了，但要求对方保证不再犯

选项要求：
- 2个加分选项（分数+5到+20）：真诚道歉、具体补救、共情、承诺改变
- 4个减分选项（分数-5到-30）：敷衍、甩锅、转移话题、离谱搞笑
- 选项顺序随机打乱
- 不要标注哪个是加分项
- 不要在文案中暴露分数

★★★ 减分选项搞笑指南（非常重要）★★★

你的减分选项是游戏的灵魂！用户看到这些选项时应该忍不住笑出声、手痒想选，选完后又后悔。
参考以下搞笑风格，每轮混合使用不同风格，不要重复同一种套路：

【风格1：看似有理，实则找死】
用一本正经的逻辑推导出完全错误的结论，让用户觉得"好像有点道理？"然后下一秒意识到不对。
示例："你生气是因为在乎我，那我不在乎你的时候你就不会生气了，所以问题的根源是我太在乎你了，你应该高兴才对。"

【风格2：夸张类比，偷换概念】
把小事类比成完全不搭边的大事，或者反过来弱化问题，反差到荒谬。
示例："忘记生日怎么了？爱因斯坦也经常忘记自己生日，这是天才的共同特征。你应该为有个天才对象而骄傲。"

【风格3：反向PUA，倒打一耙】
用一种看似温柔体贴的语气，把责任优雅地甩回给对方。
示例："其实我不是真的忘了，我是想测试一下你会不会因为这种小事生气。现在看来，你的情绪管理还有进步空间，不过没关系，我会陪你一起成长的。"

【风格4：次元突破，玩梗鬼才】
用游戏、动漫、互联网梗来回应，让懂梗的人会心一笑，在情感吵架的严肃场合显得格外荒谬。
示例："这就好比打副本，你生气了就是BOSS狂暴了，我这时候应该先拉开距离等仇恨清零再回来奶你一口，你说对不对？"

【风格5：过度真诚，真诚到诡异】
用极度认真、极度细节的态度对待一件完全跑偏的事，形成反差。
示例："对不起我忘记了。为了弥补，我已经在你的生日这天，以你的名义在蚂蚁森林种了3棵树、在淘宝捐了5个爱心午餐、在微信运动给你点了7个赞。这份补偿方案你看够吗？"

【风格6：哲学升华，强行深刻】
把鸡毛蒜皮上升到宇宙哲学高度，用深沉的语气说废话。
示例："你知道吗，时间只是人类发明的概念。在你出生的那一天，银河系依然在旋转，宇宙依然在膨胀。所以严格来说，每一天都是你的生日，每一天也都不是。我选择在每一天里爱你，而不是局限于某个特定的日子。"

关键原则：
- 减分选项要让人"读第一遍想笑，读第二遍想选，选完立刻后悔"
- 选项表面看起来要足够有诱惑力，像一个"聪明的回答"，但细想就知道是在雷区蹦迪
- 每轮4个减分选项中，至少2个必须使用上面的搞笑风格
- 另外2个可以是传统的敷衍、甩锅、转移话题，但要写得足够欠揍
- 每次生成的搞笑风格不要和上一轮重复

你必须以JSON格式回复，格式如下：
{
  "partnerMessage": "你说的第一句话...",
  "options": [
    { "id": "opt_1", "content": "选项内容", "score": 15 },
    { "id": "opt_2", "content": "选项内容", "score": -20 }
  ]
}

确保回复是严格的JSON格式，不要包含markdown代码块标记。`;
}

function buildUserPrompt(req: ChatRequest): string {
  const { scenarioTitle, scenarioDescription, messages, affection, step } = req;
  const partnerLabel = req.gender === "female" ? "女朋友" : "男朋友";

  const conversationHistory =
    messages.length > 0
      ? messages
          .map((m) => {
            const label =
              m.role === "partner" ? partnerLabel : "你（用户）";
            return `${label}：${m.content}`;
          })
          .join("\n")
      : "（尚未对话）";

  return `场景：${scenarioTitle} - ${scenarioDescription}
当前好感度：${affection} （范围-50到100，80以上为通关）
当前轮次：第${step}轮（共10轮）
${step === 1 ? "这是第一轮，请你先说出第一句话，表达你的生气。" : ""}

对话历史：
${conversationHistory}

请根据以上信息，生成你的下一句回复和6个选项。`;
}

function tryParseJSON(text: string): ChatResponse | null {
  let cleaned = text.trim();

  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (
      typeof parsed.partnerMessage === "string" &&
      Array.isArray(parsed.options) &&
      parsed.options.length === 6
    ) {
      const options: Option[] = parsed.options.map(
        (opt: Record<string, unknown>, i: number) => ({
          id: typeof opt.id === "string" ? opt.id : `opt_${i + 1}`,
          content: typeof opt.content === "string" ? opt.content : "",
          score:
            typeof opt.score === "number"
              ? Math.round(opt.score)
              : 0,
        })
      );
      return {
        partnerMessage: parsed.partnerMessage,
        options,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function getFallbackResponse(): ChatResponse {
  return {
    partnerMessage: "你现在才知道解释吗？我真的有点失望。",
    options: [
      {
        id: "fallback_1",
        content: "我知道现在解释有点晚，但我想认真补救这件事。",
        score: 10,
      },
      {
        id: "fallback_2",
        content: "你生气是因为在乎我，那我不在乎你的时候你就不会生气了，所以问题的根源是我太在乎你了，你应该高兴才对。",
        score: -20,
      },
      {
        id: "fallback_3",
        content: "我错了，我会用行动证明，不是嘴上说说。",
        score: 15,
      },
      {
        id: "fallback_4",
        content: "你知道吗，时间只是人类发明的概念。在你出生的那一天，银河系依然在旋转，宇宙依然在膨胀。所以严格来说，每一天都是你的生日，每一天也都不是。我选择在每一天里爱你。",
        score: -25,
      },
      {
        id: "fallback_5",
        content: "其实我不是真的忘了，我是想测试一下你会不会因为这种小事生气。现在看来，你的情绪管理还有进步空间，不过没关系，我会陪你一起成长的。",
        score: -30,
      },
      {
        id: "fallback_6",
        content: "我不该忽略你的感受，这件事是我的问题。",
        score: 12,
      },
    ],
  };
}

function shuffleOptions(options: Option[]): Option[] {
  const arr = [...options];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function generateChatResponse(
  req: ChatRequest
): Promise<ChatResponse> {
  if (!LLM_API_KEY) {
    console.warn("LLM_API_KEY 未设置，使用降级回复。请在 .env.local 中配置 LLM_API_KEY。");
    return getFallbackResponse();
  }

  const systemPrompt = buildSystemPrompt(req.gender);
  const userPrompt = buildUserPrompt(req);

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(`${LLM_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages,
        temperature: 0.9,
        max_tokens: 2000,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error("LLM API error:", response.status, await response.text());
      return getFallbackResponse();
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    const parsed = tryParseJSON(content);
    if (parsed) {
      parsed.options = shuffleOptions(parsed.options);
      return parsed;
    }

    console.error("LLM response parse error, raw:", content.slice(0, 200));
    return getFallbackResponse();
  } catch (err) {
    console.error("LLM request failed:", err);
    return getFallbackResponse();
  } finally {
    clearTimeout(timeout);
  }
}

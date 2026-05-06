import type { Scenario } from "@/types/game";

export const SCENARIOS: Scenario[] = [
  {
    id: "anniversary",
    title: "忘记纪念日",
    description: "今天是你们在一起三周年，你完全忘了",
  },
  {
    id: "late-night",
    title: "深夜不回消息",
    description: "你昨晚打游戏到凌晨三点，对方发了十几条消息你都没回",
  },
  {
    id: "flirty-chat",
    title: "被发现和异性聊天",
    description: "对方看到你和异性朋友的暧昧聊天记录",
  },
  {
    id: "lost-cat",
    title: "把对方的猫弄丢了",
    description: "你帮对方照顾猫的时候，猫跑丢了",
  },
  {
    id: "public-joke",
    title: "当众让对方没面子",
    description: "你在朋友聚会上开了一个过分的玩笑",
  },
];

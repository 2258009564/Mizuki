---
title: CFBetter 快速配置 AI 翻译（接入 DeepSeek V4 Flash）
published: 2026-06-07
description: "在 Codeforces Better 中接入 DeepSeek V4 Flash，三步搞定高质量 AI 翻译，告别机翻时代"
tags: [Tutorial, Codeforces, DeepSeek, AI翻译]
category: Tutorial
draft: false
comment: true
---

# 写在前面

刷 Codeforces 的时候，题目读不懂怎么办？传统翻译工具翻译出来的东西，经常把题目里的数学公式和关键信息搞得面目全非，还不如自己硬啃英文。

**CFBetter**（也叫 OJBetter / Codeforces Better）是一个非常好用的 Codeforces 增强插件，它支持多种翻译服务，其中最推荐的就是 **AI 翻译（ChatGPT 兼容接口）** —— 因为 AI 能理解上下文，还能自动识别和保护 LaTeX 公式，翻译质量远超传统机翻。

本文将教你如何**快速配置** CFBetter 的 AI 翻译功能，接入 **DeepSeek V4 Flash** 模型。整个配置过程不到 5 分钟，翻译质量极高，且花费极低。

> 为什么选择 DeepSeek V4 Flash？
> - **便宜**：输入 1 元 / 百万 tokens，输出 2 元 / 百万 tokens（翻译一篇题目大概不到 0.01 元）
> - **快**：响应速度在 AI 模型中属于第一梯队
> - **质量好**：翻译准确，能正确保留 LaTeX 公式
> - **兼容 OpenAI 格式**：可以直接接入任何支持 OpenAI API 的工具

# 1. 准备工作

## 1.1 安装 CFBetter

CFBetter 是一个 Tampermonkey 油猴脚本（也有 Chrome 扩展版本），你需要在浏览器中先安装它。

**方式一：Chrome 扩展（推荐）**

直接在 Chrome Web Store 搜索 "CF Better" 或 "OJBetter" 安装即可。

**方式二：油猴脚本**

1. 安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. 前往 [OJBetter GitHub 仓库](https://github.com/beijixiaohu/OJBetter) 安装脚本

## 1.2 获取 DeepSeek API Key

1. 前往 [DeepSeek 开放平台](https://platform.deepseek.com/) 注册账号（支持微信、手机号登录）
2. 登录后，点击左侧菜单的 **「API Keys」**
3. 点击 **「创建 API Key」**，输入一个名称（比如 `CFBetter`）
4. 创建后，**立刻复制并保存** API Key（格式为 `sk-xxxx...`，只显示一次）

:::tip
新注册账号通常有赠送额度，可以直接使用，不需要立即充值。翻译 Codeforces 题目的消耗非常少，赠送额度足够用很久。
:::

# 2. 配置 CFBetter 的 AI 翻译

## 2.1 打开设置面板

在 Codeforces 任意页面，点击右上角的 **「CodeforcesBetter 设置」** 按钮，打开设置面板。

也可以直接访问扩展的设置页面。

## 2.2 选择翻译服务

在设置面板中，找到 **「翻译服务」** 选项，从下拉菜单中选择 **「使用 ChatGPT 翻译」**。

## 2.3 添加 DeepSeek 配置

选中 ChatGPT 翻译后，下方会出现 ChatGPT 的配置区域。点击 **「添加」** 按钮，新建一个配置，然后填写以下信息：

| 配置项 | 填写内容 |
|--------|---------|
| **名称** | 随意，比如 `DeepSeek V4 Flash` |
| **KEY** | 你的 DeepSeek API Key（`sk-xxxx...` 格式） |
| **Proxy API** | `https://api.deepseek.com/v1/chat/completions` |
| **Model** | `deepseek-v4-flash` |

:::warning
**Proxy API 地址一定要填完整！** 包括 `/v1/chat/completions` 路径，不要只填 `https://api.deepseek.com`。
:::

填写完成后保存即可。

### 配置参数说明

**关于模型名称：**

| 模型名称 | 说明 | 推荐 |
|----------|------|------|
| `deepseek-v4-flash` | DeepSeek V4 Flash 模型，速度快、便宜 | ✅ 推荐 |
| `deepseek-v4-pro` | DeepSeek V4 Pro 模型，推理能力更强 | 复杂题目可选 |
| `deepseek-chat` | 旧版模型名，对应 V4 Flash 非思考模式（2026/07/24 弃用） | 不推荐 |

**对于翻译场景，`deepseek-v4-flash` 完全够用，不建议使用 `deepseek-v4-pro`，因为翻译不需要复杂推理能力，用 Pro 纯属浪费钱。**

# 3. 使用与测试

配置完成后，在任意 Codeforces 题目页面，点击翻译按钮即可使用 AI 翻译。

- 翻译会自动保留 LaTeX 数学公式不被破坏
- 翻译质量远超 DeepL、Google 等传统翻译工具
- 首次翻译可能需要授权 Tampermonkey 的跨域请求，点击允许即可

## 3.1 推荐的翻译设置

回到 CFBetter 的设置面板，建议进行以下调整：

- **翻译模式**：选择「普通模式」（一次性翻译整个区域，上下文更完整）
- **自动翻译**：可以开启，建议设置短文本阈值为 200 字符
- **历史翻译恢复**：建议开启，避免重复翻译消耗 API 额度

## 3.2 快速切换翻译服务

右键页面上的任意**翻译图标按钮**，可以快速切换翻译服务，不需要每次都打开设置面板。

# 4. 费用估算

DeepSeek V4 Flash 的定价如下（截至 2026 年 6 月）：

| 项目 | 价格 |
|------|------|
| 输入（缓存命中） | 0.02 元 / 百万 tokens |
| 输入（缓存未命中） | 1 元 / 百万 tokens |
| 输出 | 2 元 / 百万 tokens |

实际使用中，翻译一道 Codeforces 题目（包括题目描述、输入输出说明、样例等）大约消耗 500-2000 tokens，折合人民币 **不到 0.01 元**。

也就是说，**充 10 块钱，能翻译上千道题目**，基本等于白嫖。

# 5. 常见问题

### Q: 翻译报错 401 Unauthorized？

检查 API Key 是否正确，确保完整复制了 `sk-` 开头的整个 Key，没有多余空格。

### Q: 翻译报错 402 Payment Required？

你的 DeepSeek 账号余额不足，前往 [DeepSeek 开放平台](https://platform.deepseek.com/) 充值即可。支持微信、支付宝。

### Q: 翻译很慢怎么办？

AI 翻译的速度取决于 DeepSeek 服务器的响应时间，通常在 2-5 秒左右。如果经常很慢，可能是网络问题，建议检查网络连接。

### Q: 公式显示异常？

使用 ChatGPT/AI 翻译时，CFBetter 会通过提示词告知 AI 保留 LaTeX 公式，通常不会出现公式被破坏的情况。如果偶尔出现，可以重新翻译一次。

### Q: Tampermonkey 弹出跨域警告？

这是正常现象，因为你在使用自定义 API 地址。点击「允许」或「始终允许」即可。

### Q: 可以用其他 AI 模型吗？

可以！只要模型支持 OpenAI 兼容的 API 格式（`/v1/chat/completions`），都可以使用。例如：
- **OpenAI**：`https://api.openai.com/v1/chat/completions`，模型 `gpt-4o`
- **硅基流动 (SiliconFlow)**：填入对应的 API 地址和模型名
- **其他代理服务**：填入代理商提供的完整 API 地址

只需要修改 **KEY**、**Proxy API** 和 **Model** 三个字段即可。

# 参考

- [OJBetter GitHub 仓库](https://github.com/beijixiaohu/OJBetter)
- [OJBetter 翻译配置 Wiki](https://github.com/beijixiaohu/OJBetter/wiki/%E7%BF%BB%E8%AF%91)
- [DeepSeek 开放平台](https://platform.deepseek.com/)
- [DeepSeek API 定价](https://api-docs.deepseek.com/zh-cn/quick_start/pricing)

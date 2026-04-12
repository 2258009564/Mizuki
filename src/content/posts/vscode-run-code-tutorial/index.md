---
title: vscode 快速配置 g++
description: fuck
published: 2026-04-13
updated: 2026-04-13T02:20:45Z
category: Tutorial
tags: [vscode, 算法竞赛]
draft: false
pinned: false
comment: true
---

# 写在前面

众所周知，打 acm 的各种比赛的时候，使用 vscode 作为代码编辑器是非常方便的。

:spoiler[如果不赞同上面这句话，请你立马关闭这篇文章(]

在机房或者考场拿到一台只装了 Dev-C++ / CodeBlocks 等古董 IDE 的电脑时，如何快速拯救自己的双手？

通过本教程，你将在极短的时间内，利用已有 IDE 里的编译器，快速配置好 Windows 的环境变量，从而达成 **在 VS Code 终端中丝滑使用 `g++` 编译和运行 C++ 代码** 的目的。


# 基本了解

这个教程的本质其实是针对 Windows 用户的 path 环境变量的配置教程。

让我们先了解几个概念：

## g++

g++ 是 GNU Compiler Collection 的 C++ 编译器。它是一个开源的编译器，支持多种平台和操作系统。

g++ 可以将 C++ 代码编译成可执行文件，或者将其编译成目标文件以供链接器使用。它支持 C++11、C++14、C++17 等多个 C++ 标准，并且提供了丰富的编译选项和优化功能。

## path 环境变量

在 Windows 系统中，path 环境变量是一个包含了系统可执行文件路径的列表。当你在命令行中输入一个命令时，系统会在这些路径中查找对应的可执行文件并运行它。

因此，如果你想在命令行中使用 g++ 编译器，你需要确保 g++ 的可执行文件所在的路径已经被添加到 path 环境变量中。


```mermaid
sequenceDiagram
    participant U as 👨‍💻 你 (VS Code终端)
    participant W as 💻 Windows 系统
    participant P as 📂 Path 环境变量
    participant G as ⚙️ g++ 编译器

    U->>W: 输入命令: `g++ main.cpp`
    W->>W: 思考: 我认识 g++ 吗？
    alt 没配置 Path
        W-->>U: 报错: "g++ 不是内部或外部命令" ❌
    else 配置了 Path
        W->>P: 翻找通讯录 (Path)
        P-->>W: 找到了！它在 `D:\Dev-Cpp\MinGW64\bin`
        W->>G: 喂，g++，干活了！
        G->>G: 编译 main.cpp
        G-->>U: 生成 `a.exe`，编译成功！ ✅
    end
```

# 理论分析

基于上面的概念 我们来分析一下当前都有什么，应该如何调整：

我们有：
- 已经安装好的 Dev-C++ 或 CodeBlocks 等 IDE。
- 这些 IDE 自带了 g++ 编译器，但它们的路径没有被添加到 Windows 的 path 环境变量中，因此只可以在 IDE 内部使用。
- 一个 vscode 编辑器 但是无法用来编译和运行 C++ 代码。
- 一个渴望在 vscode 里使用 g++ 的，愿意折腾的你。

我们需要：
- 找到 g++ 编译器的路径。
- 将这个路径添加到 Windows 的 path 环境变量中。
- 重启 vscode 让它加载新的环境变量。
- 在 vscode 终端中畅快的使用 g++ 。

# 正式配置

## 1. 白嫖现成的 g++ 编译器

既然电脑里有 Dev-C++ 或 CodeBlocks，我们就直接“借用”它们自带的编译器，不需要重新下载！

1. 找到 Dev-C++ 或 CodeBlocks 的安装目录。

![alt text](image-1.png)

2. 顺藤摸瓜，找到名为 MinGW 或 MinGW64 的文件夹。

![alt text](image-2.png)

3. 一直点进去，直到看到一个名为 bin 的文件夹。

![alt text](image-3.png)

4. 打开 bin 文件夹，确认里面有 g++.exe。

![alt text](image-4.png)

5. 复制当前的文件路径（例如：C:\Program Files (x86)\Dev-Cpp\MinGW64\bin）。

![alt text](image-5.png)

## 2. 将路径写入 Path 环境变量

1. 按下 Win 键，直接搜索 “环境变量” (或者搜索 "Environment Variables")。

![alt text](image-6.png)

2. 点击 “编辑系统环境变量”，在弹出的窗口右下角，点击 “环境变量(N)...”，在下半部分的“系统变量”中，找到叫 Path 的那一行，双击它。

![alt text](image-7.png)

3. 点击 “新建”，把你刚才复制的 bin 文件夹路径粘贴进去。

![alt text](image-8.png)

4. 一路点击 “确定” 保存退出。

## 3. 在 VS Code 中验证
配置完成后，我们需要测试一下是否成功。

- 重启 VS Code（必须重启，否则终端无法加载新的环境变量！）。

- 使用快捷键 Ctrl + ` 打开集成终端。

- 输入以下命令并回车：

```bash
g++ -v // 等效于 g++ --version 作用是查看 g++ 的版本信息
```
如果终端吐出了一大串包含 g++ (GCC) ... 的版本信息，恭喜你，配置大功告成！
![alt text](image.png)

现在，你可以使用这个终端方便的完成编译和运行了。

# 如何使用

## 1. 最基础的编译

```bash
g++ main.cpp
```

- 这是最简单的命令。它会把 main.cpp 编译成一个默认名为 a.exe（Windows）或 a.out（Linux/Mac）的可执行文件。

缺点：每次都生成 a.exe，如果你有多个源代码，会互相覆盖。

## 2. 指定输出文件名 (-o)

```bash
g++ main.cpp -o main
```

- -o 代表 Output。这条命令会把编译后的程序命名为 main.exe。

运行方式：输入 ./main 即可运行。

## 3. 开启标准警告 (-Wall)

```bash
g++ main.cpp -o main -Wall
```

- W 代表 Warning，all 代表 all。它会提醒你代码中潜在的问题（比如变量定义了但没使用、非 void 函数没写 return 等）。

:::tip
赛时建议全程开启，能帮你规避很多低级 Bug。
:::

## 4. 指定 C++ 标准

```bash
g++ main.cpp -o main -std=c++11
```

- 强制编译器使用特定的 C++ 版本。

为什么需要：有些现代语法在老版本编译器下会报错。

你知道的，:spoiler[蓝桥杯和哈理工的校赛只支持到 cpp11，我积累半生的语法糖全部！无法使用。]

## 5. 进阶

在命令行里，如果你想编译完立刻运行（如果编译失败则不运行），可以使用 && 符号连接指令：

```bash
g++ main.cpp -o main -Wall -std=c++11 && ./main
```

指令分解说明：

- 'g++ main.cpp': 呼叫g++，开始翻译代码。
- '-o main': 把翻译好的程序取名为 main.exe。
- '-Wall': 开启所有警告，检查代码细节。
- '-std=c++11': 使用 C++11 标准编译。
- '&&': 这是一个逻辑门。只有当前面的编译操作成功了，才会执行后面的指令。
- './main': 运行刚才生成的可执行程序。
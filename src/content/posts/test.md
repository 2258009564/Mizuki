---
title: test 
published: 2026-03-11
tags: [Markdown, Demo]
category: Examples
draft: false
pinned: false
description: 这是一个测试文章，用于验证博客系统的功能是否正常。
---

# 测试
这是一个测试文章，用于验证博客系统的功能是否正常。文章内容可以是任何文本，这里我简单地贴一段我早已经忘却的组合数板子来测试。

```cpp
const int MAXN = 1e7;
const int MOD = 1e9 + 7;

vector<int> fact(MAXN), invfact(MAXN);
bool inited = 0;
int ksm(int base, int exp)
{
	int ans = 1;
	while (exp)
	{
		if (exp & 1)
		{
			ans = ans * base % MOD;
		}
		base = base * base % MOD;
		exp >>= 1;
	}
	return ans;
}

int inv(int x)
{
	return ksm(x, MOD - 2);
}

void pre()
{
	if (inited) return;
	inited = 1;
	fact[0] = 1;
	for (int i = 1; i < MAXN; i++)
	{
		fact[i] = fact[i - 1] * i % MOD;
	}

	invfact[MAXN - 1] = inv(fact[MAXN - 1]);
	for (int i = MAXN - 2; i >= 0; i--)
	{
		invfact[i] = invfact[i + 1] * (i + 1) % MOD;
	}
}

int comb(int n, int k)
{
	if (!inited) 
    {
        pre();
	}

	if (k < 0 or k > n) 
    {
        return 0;
    }
    
	return fact[n] * invfact[k] % MOD * invfact[n - k] % MOD;
}
```
以下是更多功能的测试：

# heading 1
## heading 2
### heading 3
#### heading 4
##### heading 5
###### heading 6

**bold**
*italic*

- bullet item 1
- bullet item 2
	- nested item
- bullet item 1

1. no.1
2. no.2

[[学习笔记]]
[link text](https://www.google.com) 

==Highlight Text==
～～ dont know why i cant use strikethrough ～～

- [ ] checkbox
- [x] put 'x' 

> [!node]
> 1

---
%这是一个注释% 

> 以下是 `latex` 

$$
+
-
\times
\div
=
\neq 
$$
$$
(a + b)
\{a + b\}
[a + b]
\frac{a}{b}

a^2
x_1
\sqrt{a}
$$
$$
\alpha \times \beta = \gamma
\sum_{i = 1}^{n} i
\Sigma_{i = 1}^{n} i
\Pi_{i = 1}^{n} i
$$

从中发现，高光、删除线、注释 等功能无法正常使用，但是无伤大雅，毕竟这些功能并不是博客系统的核心功能。总的来说，这篇测试文章成功地验证了博客系统的基本功能，并且展示了各种文本格式和数学公式的支持情况。可喜可贺，可喜可贺。
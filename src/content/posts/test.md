---
title: test 
published: 2026-03-11
tags: [Markdown, Demo]
category: Examples
draft: false
pinned: true
description: An article for testing the page layout and features. It is currently in draft status and will not be published until it is ready.
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



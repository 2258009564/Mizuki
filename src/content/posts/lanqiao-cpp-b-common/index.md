---
title: 蓝桥杯 C++ B 组常用板子
description: 个人复习用
published: 2026-04-10
updated: 2026-04-10T22:22:49Z
# image: ""
category: Tutorial
tags: [蓝桥杯, 算法竞赛]
draft: false
pinned: false
comment: true
---

:::note
个人复习用，由于打的 B组 太难的也用不上，只整理了一点，用 ai 审核了一遍似乎是都能用在 cpp11 ，但是其实还是会心慌

希望一切顺利。
:::
## 1. 基础中的基础

### 1.1 基本板子

```cpp
#include <bits/stdc++.h>
using namespace std;
#define int long long
#define endl '\n'
#define all(x) (x).begin(), (x).end()

void solve()
{

}

signed main()
{
    cin.tie(0)->sync_with_stdio(0);
    cout << setiosflags(ios::fixed) << setprecision(2);
    int tt = 1;
    cin >> tt;
    while (tt--)
    {
        solve();
        cout << endl;
    }
}
```
 

### 1.2 常见类型范围

- `int` 约 $2.1 \times 10^9$。
- `long long` 约 $9 \times 10^{18}$。 

### 1.3 排序与比较器

```cpp
vector<pair<int,int>> a;
// cpp11 不支持 泛型lambda 因此传参时候不能使用 auto&& 可惜可惜
sort(a.begin(), a.end(), [](pair<int, int> x, pair<int, int> y) {
    if (x.first != y.first) return x.first < y.first;
    return x.second > y.second;
});
```

## 2. STL 高频容器和用法

### 2.1 `string`

- 子串：`s.substr(pos, len)`。
- 查找：`s.find("abc")`，找不到返回 `string::npos`。

### 2.2 `queue` / `priority_queue`

```cpp
queue<int> q;
q.push(1);
q.pop();

priority_queue<int> maxh; // 大根堆
priority_queue<int, vector<int>, greater<int>> minh; // 小根堆
```

### 2.3 `set` / `map` 与 `unordered_set` / `unordered_map`

- `set/map`：有序，复杂度通常 $O(\log n)$。
- `unordered_*`：均摊 $O(1)$，但极端可能退化。

```cpp
unordered_map<int, int> cnt;
for (int x : {1,2,2,3,3,3}) cnt[x]++;
```

## 3. 简单的板子

## 3.1 前缀和

适用：区间和查询频繁。
```cpp
vector<int> v(n + 1), pre = v;
for (int i = 1; i <= n; i++)
{
    pre[i] = pre[i - 1] + v[i];
}
```

## 3.2 差分

适用：区间加法更新频繁。

```cpp
vector<int> diff(n + 2, 0);
// 给 [l, r] +k
diff[l] += k;
diff[r + 1] -= k;

for (int i = 1; i <= n; i++) 
{
    diff[i] += diff[i - 1];
    // diff[i] 就是最终值
}
```

## 3.3 二分答案

发现“答案满足单调性”时，优先考虑二分。

```cpp
int l = 0, r = 1e18;
int ans = r;
while (l <= r) {
    auto mid = (l + r) >> 1;
    if (check(mid))
    {
        r = (ans = mid) - 1;
    }
    else
    {
        l = mid + 1;
    }
}
```

## 3.4 双指针

适用：区间性质可维护（例如“窗口内不同元素数不超过 k”）。

核心套路：

- 右指针扩展。
- 不满足条件时左指针收缩。
- 每步更新答案。

:::note
差不多是 枚举一个 更新另一个 这样
:::

## 3.5 BFS 

具有无优先级搜索的特性，稍加改造就变成 dijk
适用：无权图最短路、迷宫最短步数。

## 3.6 Dijkstra

跟 bfs 是大致相同的，把 queue 换成 priority_queue 就行了。

要特别注意的是 插入优先队列的元素是 pair<距离, 节点>，而不是 pair<节点, 距离>，因为优先级是根据距离来排序的。

## 3.7 DFS 与回溯

适用：全排列、组合枚举、连通块统计。

回溯写法注意：
- 进入下一层前“做选择”。
- 回来后“撤销选择”。

:::tip
全排列还可以用
```cpp
do {

} while (next_permutation(all(a)));
```
值得一提的是，上面的 `next_permutation` 是 copilot 帮我补全的，可见我的补全依赖已经到达了一个叹为观止的地步。
:::

## 3.8 并查集（DSU）

```cpp
 class DSU
{
private:
    vector<int> parent, rank, size;
    int count;

public:
    DSU(int n) : parent(n + 1), rank(n + 1, 0), size(n + 1, 1), count(n)
    {
        iota(all(parent), 0ll);
    }

    int find(int x)
    {
        return parent[x] == x ? x : parent[x] = find(parent[x]);
    }

    void merge(int i, int j)
    {
        int ri = find(i), rj = find(j);
        if (ri == rj)
        {
            return;
        }

        if (rank[ri] < rank[rj])
        {
            swap(ri, rj);
        }
        parent[rj] = ri;
        size[ri] += size[rj];
        if (rank[ri] == rank[rj])
        {
            rank[ri]++;
        }
        count--;
    }

    bool issame(int i, int j)
    {
        return find(i) == find(j);
    }

    int getsize(int x)
    {
        return size[find(x)];
    }

    int getgroups()
    {
        return count;
    }
};
```

写的简短些似乎可以
```cpp
vector<int> parent(n + 1);

void init()
{
    iota(all(parent), 0ll);
}

int find(int x)
{
    return x == parent[x] ? x : parent[x] = find(parent[x]);
}

void merge(int i, int j)
{
    auto ri = find(i), rj = find(j);
    parent[ri] = rj;
}
```
剩下的 size, count 等属性自己慢慢往里面添加即可。

### 3.9 BIT

- 适用于频繁的区间求和和单点更新。复杂度 $O(\log n)$。

```cpp
class Fenwick
{
private:
    vector<int> tree;
    int n;
public:
    Fenwick(int n) : tree(n + 1, 0), n(n) {}

    int lowbit(int x)
    {
        return x & -x;
    }

    void update(int i, int delta)
    {
        for (; i <= n; i += lowbit(i))
        {
            tree[i] += delta;
        }
    }

    int query(int i)
    {
        int sum = 0;
        for (; i > 0; i -= lowbit(i))
        {
            sum += tree[i];
        }
        return sum;
    }

    int range_query(int l, int r)
    {
        return query(r) - query(l - 1);
    }
}
```

### 3.10 线段树

- 代码量略大，基本不考虑了...

```cpp
class SegTree
{
private:
    int n;
    vector<int> sum, ad;
    vector<int> v;

public:
    void build(int l, int r, int i)
    {
        ad[i] = 0;
        if (l == r)
        {
            sum[i] = v[l];
            return;
        }

        auto mid = (l + r) >> 1;
        build(l, mid, i << 1);
        build(mid + 1, r, i << 1 | 1);
        up(i);
    }

    SegTree(int n) : n(n), sum(n << 2), ad(n << 2), v(n + 1)
    {
        build(1, n, 1);
    };

    SegTree(vector<int> &v) : n(v.size() - 1), sum(n << 2), ad(n << 2), v(v)
    {
        build(1, n, 1);
    }

    void lazy(int i, int v, int len)
    {
        sum[i] += v * len;
        ad[i] += v;
    }

    void up(int i)
    {
        sum[i] = sum[i << 1] + sum[i << 1 | 1];
    }

    void down(int i, int ln, int rn)
    {
        if (ad[i])
        {
            lazy(i << 1, ad[i], ln);
            lazy(i << 1 | 1, ad[i], rn);
            ad[i] = 0;
        }
    }

    void update(int jobl, int jobr, int v, int l, int r, int i)
    {
        if (jobl <= l and jobr >= r)
        {
            lazy(i, v, r - l + 1);
            return;
        }

        auto mid = (l + r) >> 1;
        down(i, mid - l + 1, r - mid);

        if (jobl <= mid)
        {
            update(jobl, jobr, v, l, mid, i << 1);
        }
        if (jobr > mid)
        {
            update(jobl, jobr, v, mid + 1, r, i << 1 | 1);
        }
        up(i);
    }

    void update(int jobl, int jobr, int v)
    {
        update(jobl, jobr, v, 1, n, 1);
    }

    int query(int jobl, int jobr, int l, int r, int i)
    {
        if (jobl <= l and jobr >= r)
        {
            return sum[i];
        }
        auto mid = (l + r) >> 1;
        down(i, mid - l + 1, r - mid);
        int res = 0;
        if (jobl <= mid)
        {
            res += query(jobl, jobr, l, mid, i << 1);
        }
        if (jobr > mid)
        {
            res += query(jobl, jobr, mid + 1, r, i << 1 | 1);
        }
        return res;
    }

    int query(int jobl, int jobr)
    {
        return query(jobl, jobr, 1, n, 1);
    }
};
```

## 4. 动态规划入门框架

> 我能做到这玩意吗

大部分 DP 题目都可以从这些角度入手：

1. 状态是什么（`dp[i]`、`dp[i][j]`）？
2. 转移从哪里来？
3. 初始化和遍历顺序是什么？
 
## 5. 数学与数论高频点

### 5.1 gcd \ lcm

- gcd
```cpp
int gcd(int a, int b)
{
    return b == 0 ? a : gcd(b, a % b);
}
```

- lcm
```cpp
int lcm(int a, int b)
{
    return a / gcd(a, b) * b;
    // 这是为了避免乘法溢出
}
```

### 5.2 快速幂

```cpp
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
```

### 5.3 质数筛

```cpp
const int N = 1e7;
vector<int> isprime(N + 1, 1);
vector<int> primes;
isprime[0] = isprime[1] = 0;

void init()
{
    for (int i = 2; i <= N / i; i++)
    {
        if (isprime[i])
        {
            primes.emplace_back(i);
            for (int j = i * i; j <= N; j += i)
            {
                isprime[j] = 0;
            }
        }
    }
}
```

### 5.4 逆元
```cpp
int inv(int x)
{
    return ksm(x, MOD - 2);
}
```

### 5.5 组合数
```cpp
const int N = 1e6;
// 预处理阶乘和逆元阶乘
vector<int> fact(N + 1, 1), invf(N + 1, 1);
void init()
{
    fact[0] = 1;
    for (int i = 1; i <= N; i++)
    {
        fact[i] = fact[i - 1] * i % MOD;
    }

    invf[N] = inv(fact[N]);
    for (int i = N - 1; i >= 1; i--)
    {
        invf[i] = invf[i + 1] * (i + 1) % MOD;
        // 可以记成 1/(i!) = 1/((i+1)!) * (i+1)
    }
}

/* C(n, k) = n! / (k! * (n - k)!)
当 n < k 或 k < 0 时 C(n, k) = 0
*/ 

int C(int n, int k)
{
    if (n < k or k < 0) 
    {
        return 0;
    }
    return fact[n] * invf[k] % MOD * invf[n - k] % MOD;
}
```
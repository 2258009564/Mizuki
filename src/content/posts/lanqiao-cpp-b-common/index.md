---
title: 个人常用算法模板
description: 算法竞赛常用 C++ 模板与临场速查
published: 2026-04-10
updated: 2026-08-13T10:30:42Z
# image: ""
category: Tutorial
tags: [算法竞赛, C++, 代码模板]
draft: false
pinned: true
comment: true
---

:::note
自用的算法竞赛模板合集。最初只为蓝桥杯准备，后来越补越多，已经和蓝桥杯没有太大关系了，于是干脆改成通用板子集合。

这里以“赛场上能快速找到、复制后容易改”为第一目标，不追求把每个知识点讲成完整教程。部分模板彼此有依赖，使用前先看下面的约定。
:::

## 使用约定

- 默认使用 GNU C++17 或更高版本；少数模板使用结构化绑定、`optional` 和泛型 lambda。
- 许多模板默认已有 `#include <bits/stdc++.h>`、`using namespace std;`、`all(x)`、`MOD` 等基础定义。
- 文中的各段代码是独立板子，不应整篇直接拼成一个源文件；复制需要的部分后，再按题意修改下标、数据范围、模数和无穷大。
- 图和树的模板通常按 `1..n` 编号；字符串模板多使用 `0` 下标，具体以代码前的注释为准。
- 线段树、带权并查集、矩阵等内容一定要先确认“维护的信息”和“操作是否满足要求”，不要只凭名字硬套。

:::warning
板子只能减少重复劳动，不能替代对边界条件的检查。尤其注意空区间、单点、重边、不连通、负权、模数是否为质数，以及 `int` 是否溢出。
:::

## 基础速查

### 常见类型范围

- `int`：约 $[-2.1\times 10^9, 2.1\times 10^9]$。
- `long long`：约 $[-9.2\times 10^{18}, 9.2\times 10^{18}]$。
- 两个 `int` 相乘、距离累加或组合计数时，先转成 `long long` 再计算。

### 排序与比较器

```cpp
vector<pair<int, int>> a;
sort(all(a), [](const auto &x, const auto &y)
{
    if (x.first != y.first)
    {
        return x.first < y.first;
    }
    return x.second > y.second;
});
```

### 前缀和与差分

```cpp
// pre[i] 表示 a[1..i] 的和；区间 [l, r] 的和为 pre[r] - pre[l - 1]。
vector<int> pre(n + 1);
for (int i = 1; i <= n; i++)
{
    pre[i] = pre[i - 1] + a[i];
}

// 给闭区间 [l, r] 加上 x。
vector<int> diff(n + 2);
diff[l] += x;
diff[r + 1] -= x;
for (int i = 1; i <= n; i++)
{
    diff[i] += diff[i - 1];
}
```

### BFS 与 DFS 骨架

```cpp
// BFS：无权图最短路。dist 为 -1 表示尚未访问。
vector<int> dist(n + 1, -1);
queue<int> q;
dist[s] = 0;
q.push(s);
while (!q.empty())
{
    int u = q.front();
    q.pop();
    for (int v : g[u])
    {
        if (dist[v] != -1)
        {
            continue;
        }
        dist[v] = dist[u] + 1;
        q.push(v);
    }
}

// DFS：树或连通块遍历。
auto dfs = [&](auto &&self, int u, int parent) -> void
{
    for (int v : g[u])
    {
        if (v == parent)
        {
            continue;
        }
        self(self, v, u);
    }
};
dfs(dfs, 1, 0);
```

## 快速索引

1. [基础速查](#基础速查)：类型范围、排序、前缀和、差分、BFS、DFS
2. [基础与搜索](#基础与搜索)：基础框架、离散化、二分答案、ST 表
3. [数据结构](#数据结构)：并查集、树状数组、线段树、左偏树
4. [树与图](#树与图)：LCA、重心、直径、最短路、最小生成树、拓扑排序
5. [数论](#数论)：组合数、快速幂、质数筛
6. [字符串](#字符串)：双哈希、Trie、Z 函数
7. [动态规划](#动态规划)：矩阵快速幂、背包

:::tip
如果只是赛前复习，可以先看每节代码上方的说明；真正要用时，再完整复制对应代码块。原始练习代码仍保留在本地板子目录里，这篇只收通用性比较强的版本。
:::

---

## 基础与搜索

### 基础模板

```cpp
// #pragma GCC optimize(2)
#include <bits/stdc++.h>
using namespace std;
#define int long long
#define endl '\n'
#define all(x) (x).begin(), (x).end()

constexpr int MOD = 1e9 + 7;
// -9.2e18 ~ 9.2e18

void solve()
{

}

signed main()
{
    cin.tie(0)->ios::sync_with_stdio(0);
    cout << setiosflags(ios::fixed) << setprecision(2);
    int TT = 1;
    // cin >> TT;
    while (TT--)
    {
        solve();
        // cout << endl;
    }
}
```

### 离散化

```cpp
vector<int> vals = a;
sort(all(vals));
vals.erase(unique(all(vals)), vals.end());
int C = vals.size();
vector<int> b(n);
for (int i = 0; i < n; i++)
{
    b[i] = lower_bound(all(vals), a[i]) - vals.begin();
}
```

### 二分答案

```cpp
// 二分答案：找最小的可行值（单调性 false ... false, true ... true）
long long first_true(long long lo, long long hi, auto check) {
    while (lo < hi) {
        long long mid = lo + (hi - lo) / 2;
        if (check(mid)) hi = mid;
        else lo = mid + 1;
    }
    return lo;
}

// 找最大的可行值（单调性 true ... true, false ... false）
long long last_true(long long lo, long long hi, auto check) {
    while (lo < hi) {
        long long mid = lo + (hi - lo + 1) / 2;
        if (check(mid)) lo = mid;
        else hi = mid - 1;
    }
    return lo;
}
```

### ST 表

```cpp
// ============================================================
// ST 表 / Sparse Table（静态区间查询，数组使用 1 下标）
// ============================================================
// 支持：min、max、gcd、按位与、按位或、区间和、区间异或。
// 数组建立后不能修改；有修改操作时应使用线段树或树状数组。
//
// 用法：
//   vector<int> v(n + 1); // v[1..n]
//   STTable st(v, ST_MAX);
//   cout << st.query(l, r);
//
// min/max/gcd/and/or 查询是 O(1)：
//   它们允许用两个可能重叠的区间覆盖 [l,r]，重复计算不影响答案。
//
// sum/xor 查询是 O(log n)：
//   它们不能重复计算，所以要把 [l,r] 拆成互不重叠的 2 的幂区间。
//   实际做题时，静态 sum 推荐前缀和，静态 xor 推荐前缀异或，会比 ST 表更简单。
//
// 建表 O(n log n)，空间 O(n log n)。
// ============================================================

enum STMode
{
    ST_MIN,
    ST_MAX,
    ST_GCD,
    ST_AND,
    ST_OR,
    ST_SUM,
    ST_XOR
};

class STTable
{
private:
    int n, LOG;
    STMode mode;

    // st[j][i] 表示区间 [i, i + 2^j - 1] 的答案。
    vector<vector<int>> st;

    // 合并左右两个区间的答案。
    int merge(int left, int right) const
    {
        if (mode == ST_MIN)
        {
            return min(left, right);
        }
        if (mode == ST_MAX)
        {
            return max(left, right);
        }
        if (mode == ST_GCD)
        {
            return gcd(left, right);
        }
        if (mode == ST_AND)
        {
            return left & right;
        }
        if (mode == ST_OR)
        {
            return left | right;
        }
        if (mode == ST_SUM)
        {
            return left + right;
        }
        return left ^ right;
    }

    // 这些运算重复计算同一个元素不会改变答案，可以使用 O(1) 重叠查询。
    bool can_overlap() const
    {
        return mode == ST_MIN or mode == ST_MAX or mode == ST_GCD or
               mode == ST_AND or mode == ST_OR;
    }

public:
    // v 使用 1 下标，v[0] 空置。
    STTable(const vector<int> &v, STMode mode)
        : n(v.size() - 1), LOG(__lg(max(1ll, n)) + 1), mode(mode),
          st(LOG, vector<int>(n + 1))
    {
        for (int i = 1; i <= n; i++)
        {
            st[0][i] = v[i];
        }

        // 两个长度为 2^(j-1) 的相邻区间，合并成长度为 2^j 的区间。
        for (int j = 1; j < LOG; j++)
        {
            int half = 1ll << (j - 1);
            int len = 1ll << j;
            for (int i = 1; i + len - 1 <= n; i++)
            {
                st[j][i] = merge(st[j - 1][i], st[j - 1][i + half]);
            }
        }
    }

    // 查询闭区间 [l,r]，要求 1 <= l <= r <= n。
    int query(int l, int r) const
    {
        if (can_overlap())
        {
            int k = __lg(r - l + 1);
            return merge(st[k][l], st[k][r - (1ll << k) + 1]);
        }

        // sum/xor：从左到右取互不重叠的区间。
        int ans = 0;
        int pos = l;
        for (int j = LOG - 1; j >= 0; j--)
        {
            int len = 1ll << j;
            if (pos + len - 1 <= r)
            {
                ans = merge(ans, st[j][pos]);
                pos += len;
            }
        }
        return ans;
    }
};
```

---

## 数据结构

### 普通并查集 DSU

```cpp
// 普通并查集：路径压缩 + 按秩合并，点编号默认是 1..n。
class DSU
{
private:
    vector<int> parent, rank, size;
    int count;

public:
    DSU(int n = 0)
    {
        init(n);
    }

    void init(int n)
    {
        parent.resize(n + 1);
        rank.assign(n + 1, 0);
        size.assign(n + 1, 1);
        count = n;
        iota(all(parent), 0ll);
    }

    int find(int x)
    {
        return parent[x] == x ? x : parent[x] = find(parent[x]);
    }

    // 返回是否真的合并了两个原本不同的集合。
    bool merge(int x, int y)
    {
        int rx = find(x), ry = find(y);
        if (rx == ry)
        {
            return false;
        }

        if (rank[rx] < rank[ry])
        {
            swap(rx, ry);
        }
        parent[ry] = rx;
        size[rx] += size[ry];
        if (rank[rx] == rank[ry])
        {
            rank[rx]++;
        }
        count--;
        return true;
    }

    bool issame(int x, int y)
    {
        return find(x) == find(y);
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

### 带权并查集

```cpp
// ============================================================
// 带权并查集（维护点权之间的差）
// ============================================================
// 默认定义：
//   weight[x] = value[x] - value[parent[x]]
//
// 路径压缩后：
//   weight[x] = value[x] - value[root]
//
// merge(x, y, w) 加入的约束是：
//   value[y] - value[x] = w
//
// diff(x, y) 返回：
//   value[y] - value[x]
//
// 例子：
//   merge(1, 2, 3) 表示 value[2] - value[1] = 3
//   merge(2, 3, 5) 表示 value[3] - value[2] = 5
//   diff(1, 3) 得到 8
//
// merge 的返回值：
//   true  ：成功合并，或者原有关系与新约束一致
//   false ：x、y 已经连通，但新约束与原关系矛盾
//
// 换题时最容易改错的地方：
//   1. 有的题给的是 value[x] - value[y] = w。
//      此时调用 merge(x, y, -w)，不要同时修改多处公式。
//   2. 若维护异或关系，把“+ / -”整体换成 xor；
//      路径压缩和合并公式也必须一起推导，不能只改 diff()。
//   3. 食物链这类模 k 关系：所有 weight 和 w 都需要规范到 [0, k)。
//      相加、相减后也要取模。
//   4. 带权并查集只能维护同一连通块内的相对关系，不能直接得到绝对值。
//
// 合并公式推导（默认把 ry 接到 rx 时）：
//   wx = value[x] - value[rx]
//   wy = value[y] - value[ry]
//   又有 value[y] - value[x] = w
//   所以 value[ry] - value[rx] = w + wx - wy
//   即 weight[ry] = w + wx - wy
// ============================================================

class WeightedDSU
{
private:
    vector<int> parent, rank, size;
    vector<int> weight;
    int count;

public:
    WeightedDSU(int n)
        : parent(n + 1), rank(n + 1), size(n + 1, 1),
          weight(n + 1), count(n)
    {
        iota(all(parent), 0ll);
    }

    int find(int x)
    {
        if (parent[x] == x)
        {
            return x;
        }

        int old_parent = parent[x];
        parent[x] = find(parent[x]);
        weight[x] += weight[old_parent];
        return parent[x];
    }

    bool merge(int x, int y, int w)
    {
        int rx = find(x), ry = find(y);
        int wx = weight[x], wy = weight[y];

        if (rx == ry)
        {
            return wy - wx == w;
        }

        if (rank[rx] < rank[ry])
        {
            parent[rx] = ry;
            weight[rx] = wy - wx - w;
            size[ry] += size[rx];
        }
        else
        {
            parent[ry] = rx;
            weight[ry] = w + wx - wy;
            size[rx] += size[ry];
            if (rank[rx] == rank[ry])
            {
                rank[rx]++;
            }
        }

        count--;
        return true;
    }

    bool issame(int x, int y)
    {
        return find(x) == find(y);
    }

    // 调用前应保证 issame(x, y) 为 true。
    int diff(int x, int y)
    {
        find(x);
        find(y);
        return weight[y] - weight[x];
    }

    bool check(int x, int y, int w)
    {
        return issame(x, y) and diff(x, y) == w;
    }

    int getweight(int x)
    {
        find(x);
        return weight[x];
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

### 树状数组 BIT

```cpp
// ============================================================
// 树状数组（全部使用 1 下标）
// ============================================================
// BIT 支持：单点加、单点赋值、前缀和、区间和、前缀 lower_bound。
// RangeBIT 支持：区间加、前缀和、区间和、单点查询。
//
// kth(target) 返回最小的 pos，使 sum(pos) >= target。
// 它要求树状数组维护的是非负频次，否则前缀和不单调，不能二分。
// 若 target > sum(n)，返回 n + 1。
// ============================================================

class BIT
{
private:
    int n;
    vector<int> c;

    int lowbit(int x)
    {
        return x & -x;
    }

public:
    BIT(int size = 0) : n(size), c(n + 1)
    {
    }

    // arr 使用 1 下标，有效元素为 arr[1..n]，arr[0] 空置。
    BIT(const vector<int> &arr) : n(arr.size() - 1), c(n + 1)
    {
        for (int i = 1; i <= n; i++)
        {
            add(i, arr[i]);
        }
    }

    void init(int size)
    {
        n = size;
        c.assign(n + 1, 0);
    }

    void add(int i, int val)
    {
        while (i <= n)
        {
            c[i] += val;
            i += lowbit(i);
        }
    }

    int sum(int i)
    {
        int ans = 0;
        while (i > 0)
        {
            ans += c[i];
            i -= lowbit(i);
        }
        return ans;
    }

    int query(int l, int r)
    {
        if (l > r)
        {
            return 0;
        }
        return sum(r) - sum(l - 1);
    }

    int get(int i)
    {
        return query(i, i);
    }

    void update(int i, int val)
    {
        int delta = val - get(i);
        add(i, delta);
    }

    int kth(int target)
    {
        if (target <= 0)
        {
            return 1;
        }

        int pos = 0;
        int pre = 0;
        int step = 1;
        while ((step << 1) <= n)
        {
            step <<= 1;
        }

        for (; step; step >>= 1)
        {
            int nxt = pos + step;
            if (nxt <= n and pre + c[nxt] < target)
            {
                pos = nxt;
                pre += c[nxt];
            }
        }
        return pos + 1;
    }

    void clear()
    {
        fill(all(c), 0);
    }

    int size()
    {
        return n;
    }
};

class RangeBIT
{
private:
    int n;
    BIT c1, c2;

    void add(BIT &c, int pos, int val)
    {
        if (pos <= n)
        {
            c.add(pos, val);
        }
    }

public:
    RangeBIT(int n = 0) : n(n), c1(n), c2(n)
    {
    }

    // 在 [l, r] 全部增加 val。
    void add(int l, int r, int val)
    {
        add(c1, l, val);
        add(c1, r + 1, -val);
        add(c2, l, val * (l - 1));
        add(c2, r + 1, -val * r);
    }

    int sum(int pos)
    {
        return c1.sum(pos) * pos - c2.sum(pos);
    }

    int query(int l, int r)
    {
        if (l > r)
        {
            return 0;
        }
        return sum(r) - sum(l - 1);
    }

    int get(int pos)
    {
        return query(pos, pos);
    }
};
```

### 线段树 SegTree

```cpp
// ============================================================
// 通用线段树（数组使用 1 下标）
// ============================================================
// 当前支持：
//   1. 区间加：add(l, r, val)
//   2. 区间赋值：change(l, r, val)
//   3. 区间取 min：setmin(l, r, val)，即 a[i] = min(a[i], val)
//   4. 区间取 max：setmax(l, r, val)，即 a[i] = max(a[i], val)
//   5. 区间和：getsum(l, r)
//   6. 区间最小值：getmin(l, r)
//   7. 区间最大值：getmax(l, r)
//   8. 单点赋值：modify(pos, val)
//   9. 单点查询：get(pos)
//  10. 在区间内寻找第一个/最后一个值 >= val 的位置
//
// 默认语义：
//   change 是“覆盖”，add 是“在当前值上增加”。
//   若同一节点先 change 再 add，下传时也必须先下传 change，再下传 add。
//   这是 down() 中两个懒标记顺序不能交换的原因。
//
// 换题时常见改动：
//   1. 只需要 add + getsum：可以删除 mmin、mmax、ch、has_ch 相关代码。
//   2. 只需要 add + getmax/getmin：可以删除 sum；lazy_add 不再需要 len。
//   3. 只需要 change：可以删除 ad 和 lazy_add。
//   4. 求区间乘积、gcd 等：重点修改 up() 和查询时的合并方式；
//      但区间 add 通常不能直接维护 gcd/乘积，不能只改变量名。
//   5. 找第一个满足条件的位置：find_first_ge 依赖“区间最大值”。
//      如果改成寻找 <= val，应改用 mmin 剪枝。
//
// 注意：
//   - 构造函数 SegTree(vector<int> &v) 要求 v 的有效元素是 v[1..n]。
//   - n 必须至少为 1。
//   - 若题目中的值和区间和可能超过 long long，需要改成 __int128。
// ============================================================

class SegTree
{
private:
    int n;
    // sum[i]、mmin[i]、mmax[i] 分别记录节点 i 所管区间的和、最小值、最大值。
    vector<int> sum, mmin, mmax;
    // smn/smx：严格次小值/严格次大值；cmn/cmx：最小值/最大值出现次数。
    // 这些信息用于 Segment Tree Beats，在不下沉到叶子的情况下完成区间 chmin/chmax。
    vector<int> smn, smx, cmn, cmx;
    // ad[i]：节点 i 所管区间整体还要增加多少，尚未下传给儿子。
    // ch[i]：节点 i 所管区间整体要被赋成什么值。
    // has_ch[i]：不能用 ch[i] 是否为 0 判断赋值标记，因为“赋值为 0”也是合法操作。
    vector<int> ad, ch;
    vector<int> has_ch;
    // 保存建树时使用的原数组，有效范围是 v[1..n]。
    vector<int> v;

    // 把“整个节点 i 所管区间增加 val”直接作用到节点信息上。
    // len 是该节点所管区间长度：区间和增加 val * len，最值只增加 val。
    // 这里只更新当前节点并累计懒标记，不立刻递归修改它的儿子。
    void lazy_add(int i, int val, int len)
    {
        sum[i] += val * len;
        mmin[i] += val;
        mmax[i] += val;
        if (smn[i] != LLONG_MAX)
            smn[i] += val;
        if (smx[i] != LLONG_MIN)
            smx[i] += val;
        // 已有赋值标记时直接合并到赋值值，保持 has_ch 与 ad 不同时存在。
        // 这能让后续 setmin/setmax 与 change/add 的组合保持唯一语义。
        if (has_ch[i])
            ch[i] += val;
        else
            ad[i] += val;
    }

    // 把“整个节点 i 所管区间赋值为 val”直接作用到节点信息上。
    // 赋值会覆盖此前尚未下传的加法，所以必须把 ad[i] 清零。
    // has_ch[i] 设为 1，表示以后 down() 时需要把赋值继续传给两个儿子。
    void lazy_change(int i, int val, int len)
    {
        sum[i] = val * len;
        mmin[i] = mmax[i] = val;
        smn[i] = LLONG_MAX;
        smx[i] = LLONG_MIN;
        cmn[i] = cmx[i] = len;
        ch[i] = val;
        ad[i] = 0;
        has_ch[i] = 1;
    }

    // 前提：smx[i] < val < mmax[i]。只有当前最大值会被压低到 val。
    void lazy_setmin(int i, int val)
    {
        if (mmax[i] <= val)
            return;
        sum[i] += (val - mmax[i]) * cmx[i];
        if (mmin[i] == mmax[i])
            mmin[i] = val;
        else if (smn[i] == mmax[i])
            smn[i] = val;
        mmax[i] = val;
        if (has_ch[i])
            ch[i] = val;
    }

    // 前提：mmin[i] < val < smn[i]。只有当前最小值会被抬高到 val。
    void lazy_setmax(int i, int val)
    {
        if (mmin[i] >= val)
            return;
        sum[i] += (val - mmin[i]) * cmn[i];
        if (mmax[i] == mmin[i])
            mmax[i] = val;
        else if (smx[i] == mmin[i])
            smx[i] = val;
        mmin[i] = val;
        if (has_ch[i])
            ch[i] = val;
    }

    // 用两个儿子的信息重新计算父节点 i。
    // 每次对子区间递归修改完成后，都要调用 up(i)。
    void up(int i)
    {
        sum[i] = sum[i << 1] + sum[i << 1 | 1];

        if (mmax[i << 1] == mmax[i << 1 | 1])
        {
            mmax[i] = mmax[i << 1];
            cmx[i] = cmx[i << 1] + cmx[i << 1 | 1];
            smx[i] = max(smx[i << 1], smx[i << 1 | 1]);
        }
        else if (mmax[i << 1] > mmax[i << 1 | 1])
        {
            mmax[i] = mmax[i << 1];
            cmx[i] = cmx[i << 1];
            smx[i] = max(smx[i << 1], mmax[i << 1 | 1]);
        }
        else
        {
            mmax[i] = mmax[i << 1 | 1];
            cmx[i] = cmx[i << 1 | 1];
            smx[i] = max(mmax[i << 1], smx[i << 1 | 1]);
        }

        if (mmin[i << 1] == mmin[i << 1 | 1])
        {
            mmin[i] = mmin[i << 1];
            cmn[i] = cmn[i << 1] + cmn[i << 1 | 1];
            smn[i] = min(smn[i << 1], smn[i << 1 | 1]);
        }
        else if (mmin[i << 1] < mmin[i << 1 | 1])
        {
            mmin[i] = mmin[i << 1];
            cmn[i] = cmn[i << 1];
            smn[i] = min(smn[i << 1], mmin[i << 1 | 1]);
        }
        else
        {
            mmin[i] = mmin[i << 1 | 1];
            cmn[i] = cmn[i << 1 | 1];
            smn[i] = min(mmin[i << 1], smn[i << 1 | 1]);
        }
    }

    // 把节点 i 上尚未下传的懒标记传给左右儿子。
    // ln、rn 分别是左儿子、右儿子所管区间的长度。
    // 必须先传 change 再传 add，因为赋值会覆盖旧值，加法是在赋值后的新值上继续增加。
    void down(int i, int ln, int rn)
    {
        if (has_ch[i])
        {
            lazy_change(i << 1, ch[i], ln);
            lazy_change(i << 1 | 1, ch[i], rn);
            has_ch[i] = 0;
        }

        if (ad[i])
        {
            lazy_add(i << 1, ad[i], ln);
            lazy_add(i << 1 | 1, ad[i], rn);
            ad[i] = 0;
        }

        // 父节点可能做过 chmin/chmax；把父节点的新上下界同步给儿子。
        if (mmax[i << 1] > mmax[i])
            lazy_setmin(i << 1, mmax[i]);
        if (mmax[i << 1 | 1] > mmax[i])
            lazy_setmin(i << 1 | 1, mmax[i]);
        if (mmin[i << 1] < mmin[i])
            lazy_setmax(i << 1, mmin[i]);
        if (mmin[i << 1 | 1] < mmin[i])
            lazy_setmax(i << 1 | 1, mmin[i]);
    }

    // 建立当前节点 i，它负责原数组区间 [l, r]。
    // 到达叶子时，直接读取 v[l]；否则递归建立两个儿子后调用 up(i)。
    void build(int l, int r, int i)
    {
        ad[i] = ch[i] = has_ch[i] = 0;
        if (l == r)
        {
            sum[i] = mmin[i] = mmax[i] = v[l];
            smn[i] = LLONG_MAX;
            smx[i] = LLONG_MIN;
            cmn[i] = cmx[i] = 1;
            return;
        }

        int mid = (l + r) >> 1;
        build(l, mid, i << 1);
        build(mid + 1, r, i << 1 | 1);
        up(i);
    }

    // 递归执行区间加。
    // jobl、jobr：本次真正想修改的目标区间。
    // l、r      ：当前节点 i 所管的区间。
    // i         ：当前线段树节点编号，左儿子 i<<1，右儿子 i<<1|1。
    void add(int jobl, int jobr, int val, int l, int r, int i)
    {
        if (jobl <= l and r <= jobr)
        {
            lazy_add(i, val, r - l + 1);
            return;
        }

        int mid = (l + r) >> 1;
        down(i, mid - l + 1, r - mid);
        if (jobl <= mid)
        {
            add(jobl, jobr, val, l, mid, i << 1);
        }
        if (jobr > mid)
        {
            add(jobl, jobr, val, mid + 1, r, i << 1 | 1);
        }
        up(i);
    }

    // 递归执行区间赋值，参数含义与上面的 add 相同。
    // 如果当前区间被目标区间完整覆盖，就打 change 懒标记，不再继续向下递归。
    void change(int jobl, int jobr, int val, int l, int r, int i)
    {
        if (jobl <= l and r <= jobr)
        {
            lazy_change(i, val, r - l + 1);
            return;
        }

        int mid = (l + r) >> 1;
        down(i, mid - l + 1, r - mid);
        if (jobl <= mid)
        {
            change(jobl, jobr, val, l, mid, i << 1);
        }
        if (jobr > mid)
        {
            change(jobl, jobr, val, mid + 1, r, i << 1 | 1);
        }
        up(i);
    }

    void setmin(int jobl, int jobr, int val, int l, int r, int i)
    {
        if (mmax[i] <= val)
            return;
        if (jobl <= l and r <= jobr and smx[i] < val)
        {
            lazy_setmin(i, val);
            return;
        }
        int mid = (l + r) >> 1;
        down(i, mid - l + 1, r - mid);
        if (jobl <= mid)
            setmin(jobl, jobr, val, l, mid, i << 1);
        if (jobr > mid)
            setmin(jobl, jobr, val, mid + 1, r, i << 1 | 1);
        up(i);
    }

    void setmax(int jobl, int jobr, int val, int l, int r, int i)
    {
        if (mmin[i] >= val)
            return;
        if (jobl <= l and r <= jobr and smn[i] > val)
        {
            lazy_setmax(i, val);
            return;
        }
        int mid = (l + r) >> 1;
        down(i, mid - l + 1, r - mid);
        if (jobl <= mid)
            setmax(jobl, jobr, val, l, mid, i << 1);
        if (jobr > mid)
            setmax(jobl, jobr, val, mid + 1, r, i << 1 | 1);
        up(i);
    }

    // 递归查询目标区间 [jobl, jobr] 的区间和。
    // 查询前调用 down()，保证儿子的信息包含父节点此前积累的懒标记。
    int getsum(int jobl, int jobr, int l, int r, int i)
    {
        if (jobl <= l and r <= jobr)
        {
            return sum[i];
        }

        int mid = (l + r) >> 1;
        down(i, mid - l + 1, r - mid);
        int ans = 0;
        if (jobl <= mid)
        {
            ans += getsum(jobl, jobr, l, mid, i << 1);
        }
        if (jobr > mid)
        {
            ans += getsum(jobl, jobr, mid + 1, r, i << 1 | 1);
        }
        return ans;
    }

    // 递归查询目标区间 [jobl, jobr] 的最小值。
    // ans 初始为正无穷，因为 min(正无穷, 合法答案) 仍是合法答案。
    int getmin(int jobl, int jobr, int l, int r, int i)
    {
        if (jobl <= l and r <= jobr)
        {
            return mmin[i];
        }

        int mid = (l + r) >> 1;
        down(i, mid - l + 1, r - mid);
        int ans = LLONG_MAX;
        if (jobl <= mid)
        {
            ans = min(ans, getmin(jobl, jobr, l, mid, i << 1));
        }
        if (jobr > mid)
        {
            ans = min(ans, getmin(jobl, jobr, mid + 1, r, i << 1 | 1));
        }
        return ans;
    }

    // 递归查询目标区间 [jobl, jobr] 的最大值。
    // ans 初始为负无穷，因为 max(负无穷, 合法答案) 仍是合法答案。
    int getmax(int jobl, int jobr, int l, int r, int i)
    {
        if (jobl <= l and r <= jobr)
        {
            return mmax[i];
        }

        int mid = (l + r) >> 1;
        down(i, mid - l + 1, r - mid);
        int ans = LLONG_MIN;
        if (jobl <= mid)
        {
            ans = max(ans, getmax(jobl, jobr, l, mid, i << 1));
        }
        if (jobr > mid)
        {
            ans = max(ans, getmax(jobl, jobr, mid + 1, r, i << 1 | 1));
        }
        return ans;
    }

    // 在 [jobl, jobr] 中寻找最靠左且数组值 >= val 的位置，不存在返回 -1。
    // 如果当前区间与目标区间无交集，或者当前区间最大值都小于 val，可以直接剪枝。
    // 先递归左儿子，只有左边找不到时才找右边，因此得到的是“第一个位置”。
    int find_first_ge(int jobl, int jobr, int val, int l, int r, int i)
    {
        if (r < jobl or jobr < l or mmax[i] < val)
        {
            return -1;
        }
        if (l == r)
        {
            return l;
        }

        int mid = (l + r) >> 1;
        down(i, mid - l + 1, r - mid);
        int ans = find_first_ge(jobl, jobr, val, l, mid, i << 1);
        if (ans == -1)
        {
            ans = find_first_ge(jobl, jobr, val, mid + 1, r, i << 1 | 1);
        }
        return ans;
    }

    // 在 [jobl, jobr] 中寻找最靠右且数组值 >= val 的位置，不存在返回 -1。
    // 与 find_first_ge 相同，只是优先递归右儿子，因此得到的是“最后一个位置”。
    int find_last_ge(int jobl, int jobr, int val, int l, int r, int i)
    {
        if (r < jobl or jobr < l or mmax[i] < val)
        {
            return -1;
        }
        if (l == r)
        {
            return l;
        }

        int mid = (l + r) >> 1;
        down(i, mid - l + 1, r - mid);
        int ans = find_last_ge(jobl, jobr, val, mid + 1, r, i << 1 | 1);
        if (ans == -1)
        {
            ans = find_last_ge(jobl, jobr, val, l, mid, i << 1);
        }
        return ans;
    }

public:
    // 建立一个长度为 n、初始值全部为 0 的线段树。
    SegTree(int n) : n(n), sum(n << 2), mmin(n << 2), mmax(n << 2),
                     smn(n << 2), smx(n << 2), cmn(n << 2), cmx(n << 2),
                     ad(n << 2), ch(n << 2), has_ch(n << 2), v(n + 1)
    {
        build(1, n, 1);
    }

    // 根据 1 下标数组 v 建树：v[0] 空置，有效元素为 v[1..n]。
    SegTree(vector<int> &v) : n(v.size() - 1), sum(n << 2), mmin(n << 2),
                              mmax(n << 2), smn(n << 2), smx(n << 2),
                              cmn(n << 2), cmx(n << 2), ad(n << 2), ch(n << 2),
                              has_ch(n << 2), v(v)
    {
        build(1, n, 1);
    }

    // 对闭区间 [l, r] 的每个数增加 val。
    void add(int l, int r, int val)
    {
        add(l, r, val, 1, n, 1);
    }

    // 把闭区间 [l, r] 的每个数全部赋值为 val。
    void change(int l, int r, int val)
    {
        if (l > r)
            return;
        change(l, r, val, 1, n, 1);
    }

    // 对闭区间 [l, r] 执行 a[i] = min(a[i], val)。
    void setmin(int l, int r, int val)
    {
        if (l > r)
            return;
        setmin(l, r, val, 1, n, 1);
    }

    // 对闭区间 [l, r] 执行 a[i] = max(a[i], val)。
    void setmax(int l, int r, int val)
    {
        if (l > r)
            return;
        setmax(l, r, val, 1, n, 1);
    }

    // 单点赋值：把下标 pos 的值改成 val。
    void modify(int pos, int val)
    {
        change(pos, pos, val);
    }

    // 返回闭区间 [l, r] 的元素和。
    int getsum(int l, int r)
    {
        return getsum(l, r, 1, n, 1);
    }

    // 返回闭区间 [l, r] 的最小值。
    int getmin(int l, int r)
    {
        return getmin(l, r, 1, n, 1);
    }

    // 返回闭区间 [l, r] 的最大值。
    int getmax(int l, int r)
    {
        return getmax(l, r, 1, n, 1);
    }

    // 返回下标 pos 当前的值。
    int get(int pos)
    {
        return getsum(pos, pos);
    }

    // 返回 [l, r] 内第一个值 >= val 的下标，不存在返回 -1。
    int find_first_ge(int l, int r, int val)
    {
        return find_first_ge(l, r, val, 1, n, 1);
    }

    // 返回 [l, r] 内最后一个值 >= val 的下标，不存在返回 -1。
    int find_last_ge(int l, int r, int val)
    {
        return find_last_ge(l, r, val, 1, n, 1);
    }

    // 兼容旧模板：update 表示区间加，query 表示区间和。
    void update(int l, int r, int val)
    {
        add(l, r, val);
    }

    int query(int l, int r)
    {
        return getsum(l, r);
    }

    // 返回当前维护的数组长度。
    int size()
    {
        return n;
    }
};
```

### 左偏树与可并堆

```cpp
// ============================================================
// 左偏树（可并堆 / Mergeable Heap，节点编号从 1 开始）
// ============================================================
// 支持：
//   1. newnode(val)             新建一个只有一个节点的堆，返回节点编号
//   2. merge(x, y)              合并两个堆，返回新根
//   3. push(root, val)          插入元素，返回新根
//   4. top(root)                查询堆顶值
//   5. top_id(root)             查询堆顶节点编号
//   6. pop(root)                删除堆顶，返回新根
//   7. add_all(root, val)       整个堆的所有值增加 val
//   8. size(root) / empty(root) 查询大小 / 判空
//
// 默认是小根堆：
//   LeftistTree<int> heap;
// 改成大根堆：
//   LeftistTree<int, greater<int>> heap;
//
// 左偏树性质：
//   dis[x] 表示 x 到最近空儿子的距离，规定 dis[0] = 0。
//   始终保持 dis[ls[x]] >= dis[rs[x]]，因此右链长度为 O(log n)。
//   merge 是所有操作的核心，单次合并 / 插入 / 删除堆顶均为 O(log n)。
//
// 重要约束：
//   - merge(x, y) 要求 x、y 是两个互不相交的堆，否则会形成环。
//   - pop(root) 后旧根已经删除，不要继续把旧根当成合法堆使用。
//   - add_all 是“整堆统一加”，不会改变堆内相对大小，因此可以懒标记。
//   - 若只需要最基础左偏树，可删除 lazy、apply、down、add_all。
//   - 值相同时按节点编号小的优先，方便题目要求稳定判定。
// ============================================================

template <class T = int, class Compare = less<T>>
class LeftistTree
{
private:
    vector<T> val, lazy;
    vector<int> ls, rs, dis, siz;
    vector<char> deleted;
    Compare cmp;

    // a 是否应该排在 b 前面。
    // 小根堆时值小的优先，大根堆时值大的优先；值相同则编号小的优先。
    bool better(int a, int b) const
    {
        if (cmp(val[a], val[b]))
        {
            return true;
        }
        if (cmp(val[b], val[a]))
        {
            return false;
        }
        return a < b;
    }

    void apply(int x, const T &v)
    {
        if (!x)
        {
            return;
        }
        val[x] += v;
        lazy[x] += v;
    }

    void down(int x)
    {
        if (!x or lazy[x] == T{})
        {
            return;
        }
        apply(ls[x], lazy[x]);
        apply(rs[x], lazy[x]);
        lazy[x] = T{};
    }

    void up(int x)
    {
        if (dis[ls[x]] < dis[rs[x]])
        {
            swap(ls[x], rs[x]);
        }
        dis[x] = dis[rs[x]] + 1;
        siz[x] = siz[ls[x]] + siz[rs[x]] + 1;
    }

public:
    LeftistTree(int reserve_n = 0)
    {
        val.reserve(reserve_n + 1);
        lazy.reserve(reserve_n + 1);
        ls.reserve(reserve_n + 1);
        rs.reserve(reserve_n + 1);
        dis.reserve(reserve_n + 1);
        siz.reserve(reserve_n + 1);
        deleted.reserve(reserve_n + 1);

        // 0 号节点表示空节点。
        val.push_back(T{});
        lazy.push_back(T{});
        ls.push_back(0);
        rs.push_back(0);
        dis.push_back(0);
        siz.push_back(0);
        deleted.push_back(1);
    }

    // 新建单点堆并返回节点编号。
    int newnode(const T &v)
    {
        int id = val.size();
        val.push_back(v);
        lazy.push_back(T{});
        ls.push_back(0);
        rs.push_back(0);
        dis.push_back(1);
        siz.push_back(1);
        deleted.push_back(0);
        return id;
    }

    // 合并两个互不相交的堆，返回新根。
    int merge(int x, int y)
    {
        if (!x or !y)
        {
            return x | y;
        }
        if (!better(x, y))
        {
            swap(x, y);
        }

        down(x);
        rs[x] = merge(rs[x], y);
        up(x);
        return x;
    }

    // 向 root 所在堆插入一个值，返回新根。
    int push(int root, const T &v)
    {
        return merge(root, newnode(v));
    }

    // 查询堆顶值；调用者须保证 root != 0。
    const T &top(int root) const
    {
        return val[root];
    }

    int top_id(int root) const
    {
        return root;
    }

    // 删除堆顶并返回新根。
    int pop(int root)
    {
        down(root);
        int x = ls[root], y = rs[root];
        ls[root] = rs[root] = 0;
        dis[root] = siz[root] = 0;
        deleted[root] = 1;
        return merge(x, y);
    }

    // 整个堆统一增加 v，O(1)。
    void add_all(int root, const T &v)
    {
        apply(root, v);
    }

    int size(int root) const
    {
        return siz[root];
    }

    bool empty(int root) const
    {
        return root == 0;
    }

    bool alive(int id) const
    {
        return id > 0 and id < (int)deleted.size() and !deleted[id];
    }

    int nodes() const
    {
        return (int)val.size() - 1;
    }
};

// ============================================================
// 常见用法 1：维护若干个“根编号”
// ============================================================
/*
LeftistTree<int> heap(n);
vector<int> root(k + 1);

root[1] = heap.push(root[1], 10);
root[1] = heap.push(root[1], 3);
root[2] = heap.push(root[2], 7);

root[1] = heap.merge(root[1], root[2]);
root[2] = 0; // 两个堆已经合并，原来的 root[2] 必须作废。

cout << heap.top(root[1]) << endl; // 3
root[1] = heap.pop(root[1]);
cout << heap.top(root[1]) << endl; // 7
*/

// ============================================================
// 常见用法 2：每个初始节点属于一个可合并堆（P3377 类型）
// ============================================================
// 这种题通常有两种操作：
//   merge_set(x, y)：合并 x、y 当前所属的堆；
//   pop_set(x)     ：删除 x 当前所属堆的堆顶，并返回 {堆顶编号, 堆顶值}。
//
// 注意：
//   删除堆顶后，并查集代表元需要改成新的堆根。
//   已删除节点再次参与操作时，本封装直接忽略。
//   该封装不提供 add_all；如果题目同时需要整堆加，根映射需按题意额外维护。
// ============================================================

template <class T = int, class Compare = less<T>>
class MergeableHeap
{
private:
    LeftistTree<T, Compare> heap;
    vector<int> fa;
    vector<char> removed;

    int find(int x)
    {
        return fa[x] == x ? x : fa[x] = find(fa[x]);
    }

public:
    // a 必须是 1 下标数组，有效范围 a[1..n]。
    MergeableHeap(const vector<T> &a) : heap((int)a.size() - 1)
    {
        int n = (int)a.size() - 1;
        fa.resize(n + 1);
        removed.assign(n + 1, 0);
        fa[0] = 0;
        for (int i = 1; i <= n; i++)
        {
            int id = heap.newnode(a[i]);
            fa[i] = id;
        }
    }

    bool alive(int x) const
    {
        return x > 0 and x < (int)removed.size() and !removed[x];
    }

    // 合并 x、y 所属的堆；任一点已删除时忽略。
    void merge_set(int x, int y)
    {
        if (!alive(x) or !alive(y))
        {
            return;
        }
        int rx = find(x), ry = find(y);
        if (rx == ry)
        {
            return;
        }
        int root = heap.merge(rx, ry);
        fa[rx] = fa[ry] = fa[root] = root;
    }

    // 返回 x 所属堆的堆顶编号；x 已删除时返回 -1。
    int top_id(int x)
    {
        return alive(x) ? find(x) : -1;
    }

    // 返回 x 所属堆的堆顶值；调用者须保证 x 未删除。
    const T &top(int x)
    {
        return heap.top(find(x));
    }

    // 删除 x 所属堆的堆顶，返回 {被删编号, 被删值}。
    // x 已删除时返回 {-1, T{}}。
    pair<int, T> pop_set(int x)
    {
        if (!alive(x))
        {
            return {-1, T{}};
        }

        int oldroot = find(x);
        T answer = heap.top(oldroot);
        int newroot = heap.pop(oldroot);
        removed[oldroot] = 1;
        fa[oldroot] = newroot;
        if (newroot)
        {
            fa[newroot] = newroot;
        }
        return {oldroot, answer};
    }
};

// ============================================================
// P3377 类型 solve 示例
// ============================================================
/*
void solve()
{
    int n, m;
    cin >> n >> m;
    vector<int> a(n + 1);
    for (int i = 1; i <= n; i++)
    {
        cin >> a[i];
    }

    MergeableHeap<int> heap(a);
    while (m--)
    {
        int op, x, y;
        cin >> op >> x;
        if (op == 1)
        {
            cin >> y;
            heap.merge_set(x, y);
        }
        else
        {
            auto [id, value] = heap.pop_set(x);
            if (id == -1)
            {
                cout << -1 << endl;
            }
            else
            {
                cout << value << endl;
            }
        }
    }
}
*/
```

---

## 树与图

### 倍增 LCA

```cpp
// ============================================================
// 倍增 LCA（无权树，点编号 1..n）
// ============================================================
// 支持：LCA、k 级祖先、两点距离、祖先判断、路径上的第 k 个点。
// kth_on_path(x, y, k) 中 k 从 0 开始：k=0 返回 x。
// get_kth_ancestor(x, k) 若跳到根上方，返回 0。
//
// 如果是带权树：
//   把 adj 改为 vector<vector<pair<int,int>>>，DFS 时维护 dist[u]；
//   距离改成 dist[x] + dist[y] - 2 * dist[lca]。
//   up 表本身不需要改变。
// ============================================================

class LCA
{
private:
    int n, LOG, root, timer;
    vector<vector<int>> up;
    vector<int> depth, tin, tout;

    void dfs(int u, int parent, const vector<vector<int>> &adj)
    {
        tin[u] = ++timer;
        up[u][0] = parent;
        for (int j = 1; j < LOG; j++)
        {
            up[u][j] = up[up[u][j - 1]][j - 1];
        }

        for (int nxt : adj[u])
        {
            if (nxt == parent)
            {
                continue;
            }
            depth[nxt] = depth[u] + 1;
            dfs(nxt, u, adj);
        }
        tout[u] = timer;
    }

public:
    LCA(const vector<vector<int>> &adj, int root = 1)
        : n(adj.size() - 1), LOG(__lg(max(1ll, n)) + 2), root(root), timer(0),
          up(n + 1, vector<int>(LOG)), depth(n + 1), tin(n + 1), tout(n + 1)
    {
        dfs(root, 0, adj);
    }

    bool is_ancestor(int x, int y) const
    {
        return tin[x] <= tin[y] and tout[y] <= tout[x];
    }

    int get_kth_ancestor(int x, int k) const
    {
        for (int j = 0; j < LOG and x; j++)
        {
            if (k >> j & 1)
            {
                x = up[x][j];
            }
        }
        return x;
    }

    int getlca(int x, int y) const
    {
        if (is_ancestor(x, y))
        {
            return x;
        }
        if (is_ancestor(y, x))
        {
            return y;
        }

        for (int j = LOG - 1; j >= 0; j--)
        {
            if (up[x][j] and !is_ancestor(up[x][j], y))
            {
                x = up[x][j];
            }
        }
        return up[x][0];
    }

    int getfa(int x) const
    {
        return up[x][0];
    }

    int getdepth(int x) const
    {
        return depth[x];
    }

    int distance(int x, int y) const
    {
        int z = getlca(x, y);
        return depth[x] + depth[y] - 2 * depth[z];
    }

    int kth_on_path(int x, int y, int k) const
    {
        int z = getlca(x, y);
        int up_len = depth[x] - depth[z];
        int total = up_len + depth[y] - depth[z];
        if (k < 0 or k > total)
        {
            return 0;
        }
        if (k <= up_len)
        {
            return get_kth_ancestor(x, k);
        }
        return get_kth_ancestor(y, total - k);
    }
};
```

### Tarjan 离线 LCA

```cpp
// ============================================================
// Tarjan 离线 LCA
// ============================================================
// adj 使用 1 下标；queries[i] = {x, y}。
// 返回 ans[i]，顺序与输入询问完全一致。
// 复杂度约 O((n + q) alpha(n))，适合全部询问预先给出的情况。
// 如果还要在线回答新询问，应使用倍增 LCA，而不是 Tarjan 离线算法。
// ============================================================

vector<int> tarjan_lca(const vector<vector<int>> &adj,
                       const vector<pair<int, int>> &queries,
                       int root = 1)
{
    int n = adj.size() - 1;
    vector<vector<pair<int, int>>> q(n + 1);
    for (int i = 0; i < (int)queries.size(); i++)
    {
        auto [x, y] = queries[i];
        q[x].emplace_back(y, i);
        q[y].emplace_back(x, i);
    }

    vector<int> parent(n + 1), rank(n + 1), ancestor(n + 1);
    vector<int> state(n + 1); // 0 未访问，1 正在 DFS，2 已处理完成
    vector<int> ans(queries.size());
    iota(all(parent), 0ll);

    auto find = [&](auto &&self, int x) -> int
    {
        return parent[x] == x ? x : parent[x] = self(self, parent[x]);
    };

    auto merge = [&](int x, int y) -> void
    {
        x = find(find, x);
        y = find(find, y);
        if (x == y)
        {
            return;
        }
        if (rank[x] < rank[y])
        {
            swap(x, y);
        }
        parent[y] = x;
        if (rank[x] == rank[y])
        {
            rank[x]++;
        }
    };

    auto dfs = [&](auto &&self, int u, int fa) -> void
    {
        state[u] = 1;
        ancestor[u] = u;

        for (int nxt : adj[u])
        {
            if (nxt == fa)
            {
                continue;
            }
            self(self, nxt, u);
            merge(u, nxt);
            ancestor[find(find, u)] = u;
        }

        state[u] = 2;
        for (auto [other, id] : q[u])
        {
            if (state[other] == 2)
            {
                ans[id] = ancestor[find(find, other)];
            }
        }
    };

    dfs(dfs, root, 0);
    return ans;
}
```

### 树的重心

```cpp
// ============================================================
// 树的重心
// ============================================================
// 删除重心后，剩余每个连通块的大小都不超过 n / 2。
// 一棵树最多有两个重心；如果有两个，它们一定相邻。
// adj 使用 1 下标。返回全部重心，顺序由 DFS 顺序决定。
// ============================================================

vector<int> get_centroids(const vector<vector<int>> &adj, int root = 1)
{
    int n = adj.size() - 1;
    vector<int> size(n + 1);
    vector<int> ans;
    int best = LLONG_MAX;

    auto dfs = [&](auto &&self, int u, int parent) -> void
    {
        size[u] = 1;
        int max_part = 0;
        for (int nxt : adj[u])
        {
            if (nxt == parent)
            {
                continue;
            }
            self(self, nxt, u);
            size[u] += size[nxt];
            max_part = max(max_part, size[nxt]);
        }

        max_part = max(max_part, n - size[u]);
        if (max_part < best)
        {
            best = max_part;
            ans.clear();
            ans.emplace_back(u);
        }
        else if (max_part == best)
        {
            ans.emplace_back(u);
        }
    };

    dfs(dfs, root, 0);
    return ans;
}
```

### 两次搜索求树的直径

```cpp
// ============================================================
// 两次搜索求树的直径（边权要求非负）
// ============================================================
// 返回长度、两个端点以及从 left 到 right 的完整路径。
// 无权树把每条边长度视为 1；带权树使用 pair<终点, 边权>。
// 若存在负边，最远点两次搜索的结论不能直接套用，应使用树形 DP。
// ============================================================

struct DiameterResult
{
    int length;
    int left, right;
    vector<int> path;
};

DiameterResult get_diameter(const vector<vector<int>> &adj, int start = 1)
{
    int n = adj.size() - 1;

    auto get_farthest = [&](int source)
    {
        vector<int> parent(n + 1), dist(n + 1, -1);
        queue<int> q;
        q.push(source);
        dist[source] = 0;

        while (!q.empty())
        {
            int u = q.front();
            q.pop();
            for (int nxt : adj[u])
            {
                if (nxt == parent[u])
                {
                    continue;
                }
                parent[nxt] = u;
                dist[nxt] = dist[u] + 1;
                q.push(nxt);
            }
        }

        int farthest = source;
        for (int i = 1; i <= n; i++)
        {
            if (dist[i] > dist[farthest])
            {
                farthest = i;
            }
        }
        return tuple<int, vector<int>, vector<int>>(farthest, parent, dist);
    };

    auto [left, parent1, dist1] = get_farthest(start);
    auto [right, parent, dist] = get_farthest(left);

    vector<int> path;
    for (int u = right; u; u = parent[u])
    {
        path.emplace_back(u);
        if (u == left)
        {
            break;
        }
    }
    reverse(all(path));
    return {dist[right], left, right, path};
}

DiameterResult get_diameter(const vector<vector<pair<int, int>>> &adj, int start = 1)
{
    int n = adj.size() - 1;

    auto get_farthest = [&](int source)
    {
        vector<int> parent(n + 1), dist(n + 1, LLONG_MIN);
        stack<int> st;
        st.push(source);
        dist[source] = 0;

        while (!st.empty())
        {
            int u = st.top();
            st.pop();
            for (auto [nxt, w] : adj[u])
            {
                if (nxt == parent[u])
                {
                    continue;
                }
                parent[nxt] = u;
                dist[nxt] = dist[u] + w;
                st.push(nxt);
            }
        }

        int farthest = source;
        for (int i = 1; i <= n; i++)
        {
            if (dist[i] > dist[farthest])
            {
                farthest = i;
            }
        }
        return tuple<int, vector<int>, vector<int>>(farthest, parent, dist);
    };

    auto [left, parent1, dist1] = get_farthest(start);
    auto [right, parent, dist] = get_farthest(left);

    vector<int> path;
    for (int u = right; u; u = parent[u])
    {
        path.emplace_back(u);
        if (u == left)
        {
            break;
        }
    }
    reverse(all(path));
    return {dist[right], left, right, path};
}
```

### 树形 DP 求直径

```cpp
// ============================================================
// 树形 DP 求直径
// ============================================================
// down[u]：从 u 向子树内走的最长链。
// 对每个 u，取最大的两条子链拼起来更新直径。
// 这里返回直径长度；如果还需要端点和路径，使用 dfs diameter.txt。
// 无权树返回边数；带权版本允许非负边权。
// ============================================================

int tree_diameter_dp(const vector<vector<int>> &adj, int root = 1)
{
    int n = adj.size() - 1;
    vector<int> down(n + 1);
    int ans = 0;

    auto dfs = [&](auto &&self, int u, int parent) -> void
    {
        int first = 0, second = 0;
        for (int nxt : adj[u])
        {
            if (nxt == parent)
            {
                continue;
            }
            self(self, nxt, u);
            int cur = down[nxt] + 1;
            if (cur > first)
            {
                second = first;
                first = cur;
            }
            else if (cur > second)
            {
                second = cur;
            }
        }
        down[u] = first;
        ans = max(ans, first + second);
    };

    dfs(dfs, root, 0);
    return ans;
}

int tree_diameter_dp(const vector<vector<pair<int, int>>> &adj, int root = 1)
{
    int n = adj.size() - 1;
    vector<int> down(n + 1);
    int ans = 0;

    auto dfs = [&](auto &&self, int u, int parent) -> void
    {
        int first = 0, second = 0;
        for (auto [nxt, w] : adj[u])
        {
            if (nxt == parent)
            {
                continue;
            }
            self(self, nxt, u);
            int cur = down[nxt] + w;
            if (cur > first)
            {
                second = first;
                first = cur;
            }
            else if (cur > second)
            {
                second = cur;
            }
        }
        down[u] = first;
        ans = max(ans, first + second);
    };

    dfs(dfs, root, 0);
    return ans;
}
```

### Dijkstra 最短路

```cpp
using ll = long long;
const ll INF = (1LL << 62);

vector<ll> dijkstra(int n, int s,
                    const vector<vector<pair<int, int>>>& g) {
    vector<ll> dist(n + 1, INF);
    priority_queue<pair<ll, int>,
                   vector<pair<ll, int>>,
                   greater<pair<ll, int>>> pq;
    dist[s] = 0;
    pq.push({0, s});
    while (!pq.empty()) {
        auto [du, u] = pq.top();
        pq.pop();
        if (du != dist[u]) continue;
        for (auto [v, w] : g[u]) {
            if (dist[v] > du + w) {
                dist[v] = du + w;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}
```

### Kruskal 最小生成树

```cpp
struct Edge {
    int u, v;
    long long w;
};

// 依赖 DSU；不连通时返回 nullopt。
optional<long long> kruskal(int n, vector<Edge> edges) {
    sort(edges.begin(), edges.end(),
         [](const Edge& a, const Edge& b) { return a.w < b.w; });
    DSU dsu(n);
    long long ans = 0;
    int used = 0;
    for (auto [u, v, w] : edges) {
        if (dsu.merge(u, v)) {
            ans += w;
            if (++used == n - 1) break;
        }
    }
    if (used != n - 1) return nullopt;
    return ans;
}
```

### 拓扑排序

```cpp
// 返回任意一个拓扑序；存在环时返回空数组。
vector<int> topo_sort(int n, const vector<vector<int>>& g) {
    vector<int> indeg(n + 1), order;
    for (int u = 1; u <= n; ++u)
        for (int v : g[u]) ++indeg[v];

    queue<int> q;
    for (int i = 1; i <= n; ++i)
        if (indeg[i] == 0) q.push(i);

    while (!q.empty()) {
        int u = q.front();
        q.pop();
        order.push_back(u);
        for (int v : g[u])
            if (--indeg[v] == 0) q.push(v);
    }
    if ((int)order.size() != n) return {};
    return order;
}
```

---

## 数论

### 组合数预处理

```cpp
// COMB begin ----
const int N = 1e6;
vector<int> f(N), invf(N);
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
    return ksm(x, MOD - 2) % MOD;
}

void pre()
{
    if (inited)
    {
        return;
    }
    inited = 1;
    f[0] = 1;
    for (int i = 1; i < N; i++)
    {
        f[i] = f[i - 1] * i % MOD;
    }

    invf[N - 1] = inv(f[N - 1]);
    for (int i = N - 2; i >= 0; i--)
    {
        invf[i] = invf[i + 1] * (i + 1) % MOD;
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

    return f[n] * invf[k] % MOD * invf[n - k] % MOD;
}
// comb end ----
```

### 快速幂

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

### 质数筛与最小质因子

```cpp
const int N = 1e7;

vector<int> primes, isprime(N + 1, 1), minfactor(N + 1);
void init()
{
    isprime[0] = isprime[1] = 0;
    for (int i = 2; i <= N; i++)
    {
        if (isprime[i])
        {
            minfactor[i] = i;
            for (int j = i * i; j <= N; j += i)
            {
                isprime[j] = 0;
                if (!minfactor[j])
                {
                    minfactor[j] = i;
                }
            }
        }
    }

    for (int i = 2; i <= N; i++)
    {
        if (isprime[i])
        {
            primes.emplace_back(i);
        }
    }
}

// 返回 x 的最小质因数。调用前需要先执行 init()。
// x 必须满足 2 <= x <= N。
int getminfactor(int x)
{
    return minfactor[x];
}
```

---

## 字符串

### 双模字符串哈希

```cpp
// 双哈希。get_s(l, r) 使用 0 下标闭区间，equal/lcp 使用的也是 0 下标。
// 哈希只能把冲突概率降得很低，不能从数学上保证绝对无冲突。
// 如果题目区间是 1 下标，推荐调用 get_s(l - 1, r - 1)。
// 也可以先写 s = ' ' + s，此时原字符位于 1..原长度，直接传题目的 l、r 也能查询；
// 但 size() 会比原长度多 1，使用 lcp() 时也要记得这个占位字符属于字符串的一部分。
struct DoubleHash
{
    const int P = 13331;
    const int MOD1 = 998244353;
    const int MOD2 = 1000000007;

    int n = 0;
    vector<int> p1, p2, hs1, hs2;

    DoubleHash()
    {
    }

    DoubleHash(const string &s)
    {
        init(s);
    }

    void init(const string &s)
    {
        n = s.size();
        p1.assign(n + 1, 0);
        p2.assign(n + 1, 0);
        hs1.assign(n + 1, 0);
        hs2.assign(n + 1, 0);

        p1[0] = p2[0] = 1;
        for (int i = 1; i <= n; i++)
        {
            p1[i] = p1[i - 1] * P % MOD1;
            p2[i] = p2[i - 1] * P % MOD2;
            int ch = (unsigned char)s[i - 1] + 1;
            hs1[i] = (hs1[i - 1] * P + ch) % MOD1;
            hs2[i] = (hs2[i - 1] * P + ch) % MOD2;
        }
    }

    pair<int, int> get_s(int l, int r) const
    {
        if (l > r)
        {
            return {0, 0};
        }
        int x1 = (hs1[r + 1] - hs1[l] * p1[r - l + 1] % MOD1 + MOD1) % MOD1;
        int x2 = (hs2[r + 1] - hs2[l] * p2[r - l + 1] % MOD2 + MOD2) % MOD2;
        return {x1, x2};
    }

    bool equal(int l1, int r1, int l2, int r2) const
    {
        if (r1 - l1 != r2 - l2)
        {
            return false;
        }
        return get_s(l1, r1) == get_s(l2, r2);
    }

    // 返回两个后缀从 l1、l2 开始的最长公共前缀长度，最多比较 limit 个字符。
    int lcp(int l1, int l2, int limit) const
    {
        limit = min({limit, n - l1, n - l2});
        int l = 0, r = limit;
        while (l < r)
        {
            int mid = (l + r + 1) >> 1;
            if (get_s(l1, l1 + mid - 1) == get_s(l2, l2 + mid - 1))
            {
                l = mid;
            }
            else
            {
                r = mid - 1;
            }
        }
        return l;
    }

    int size() const
    {
        return n;
    }
};
```

### 字符 Trie

```cpp
// ============================================================
// 小写字母 Trie
// ============================================================
// end[p] ：恰好在节点 p 结束的字符串数量。
// pass[p]：经过节点 p 的字符串数量，因此可用于查询前缀数量。
// erase 只减少计数，不回收节点；竞赛中通常更稳，也便于重复插入/删除。
// 如果字符集不是 a-z，修改 SIGMA 和 getid()，并同步修改 array 的大小。
// ============================================================

class Trie
{
private:
    static constexpr int SIGMA = 26;
    vector<array<int, SIGMA>> tr;
    vector<int> pass, ending;

    int getid(char c)
    {
        return c - 'a';
    }

public:
    Trie()
    {
        clear();
    }

    void clear()
    {
        tr.assign(1, array<int, SIGMA>{});
        pass.assign(1, 0);
        ending.assign(1, 0);
    }

    void insert(const string &s)
    {
        int p = 0;
        pass[p]++;
        for (char c : s)
        {
            int u = getid(c);
            if (!tr[p][u])
            {
                tr[p][u] = tr.size();
                tr.push_back(array<int, SIGMA>{});
                pass.push_back(0);
                ending.push_back(0);
            }
            p = tr[p][u];
            pass[p]++;
        }
        ending[p]++;
    }

    int query(const string &s)
    {
        int p = 0;
        for (char c : s)
        {
            int u = getid(c);
            if (!tr[p][u])
            {
                return 0;
            }
            p = tr[p][u];
        }
        return ending[p];
    }

    int count_prefix(const string &prefix)
    {
        int p = 0;
        for (char c : prefix)
        {
            int u = getid(c);
            if (!tr[p][u])
            {
                return 0;
            }
            p = tr[p][u];
        }
        return pass[p];
    }

    bool starts_with(const string &prefix)
    {
        return count_prefix(prefix) > 0;
    }

    bool erase(const string &s)
    {
        if (!query(s))
        {
            return false;
        }

        int p = 0;
        pass[p]--;
        for (char c : s)
        {
            p = tr[p][getid(c)];
            pass[p]--;
        }
        ending[p]--;
        return true;
    }

    int count_all()
    {
        return pass[0];
    }

    int nodes()
    {
        return tr.size();
    }
};
```

### Z 函数

```cpp
// z[i]：s 与 s[i..] 的最长公共前缀长度。
vector<int> z_function(const string& s) {
    int n = (int)s.size();
    vector<int> z(n);
    z[0] = n;
    for (int i = 1, l = 0, r = 0; i < n; ++i) {
        if (i <= r) z[i] = min(r - i + 1, z[i - l]);
        while (i + z[i] < n && s[z[i]] == s[i + z[i]]) ++z[i];
        if (i + z[i] - 1 > r) {
            l = i;
            r = i + z[i] - 1;
        }
    }
    return z;
}

// pattern 在 text 中的全部出现位置（0 下标）。
vector<int> find_occurrences(string pattern, const string& text) {
    string s = pattern + "#" + text;
    auto z = z_function(s);
    vector<int> pos;
    for (int i = (int)pattern.size() + 1; i < (int)s.size(); ++i)
        if (z[i] >= (int)pattern.size())
            pos.push_back(i - (int)pattern.size() - 1);
    return pos;
}
```

---

## 动态规划

### 普通矩阵快速幂

```cpp
// ============================================================
// 普通矩阵 + 矩阵快速幂模板（模 MOD）
// ============================================================
// 当前支持：
//   1. 任意行列矩阵
//   2. 矩阵加法、减法、乘法
//   3. 单位矩阵 Matrix::identity(n)
//   4. 方阵快速幂 qpow(base, exp)
//   5. 矩阵乘列向量 multiply_vector(v)
//
// 默认语义：
//   普通模意义矩阵乘法：
//     C[i][j] = sum(A[i][k] * B[k][j]) % MOD
//   下标从 0 开始。
//
// 换题时常见改动：
//   1. 固定小矩阵且特别卡常：把 vector 改成静态数组 int a[N][N]。
//   2. 不取模：删除 norm() 和所有 % MOD，但要检查是否会溢出。
//   3. MOD 不是全局常量：可以给 Matrix 增加成员 mod，并保证参与运算的矩阵 mod 相同。
//   4. max-plus / min-plus：不能只把 MOD 删除。
//      max-plus 要把“加法”改为 max，把“乘法”改为 +，
//      单位矩阵对角线为 0，其余位置为负无穷。
//      当前目录已有“矩阵快速幂 max-plus.cpp”作为对应示例。
//   5. 行向量转移通常写 old_dp * trans；列向量转移通常写 trans * old_dp。
//      建转移矩阵前一定先确定自己采用哪种方向。
//
// 注意：
//   - qpow 只接受方阵。
//   - 默认依赖外部的 constexpr int MOD。
//   - 在 #define int long long 的代码风格下，两个模数内元素相乘通常可放入 long long；
//     如果 MOD 更大，乘法应改用 __int128。
// ============================================================

class Matrix
{
private:
    int row, col;
    vector<vector<int>> a;

    int norm(int x) const
    {
        x %= MOD;
        if (x < 0)
        {
            x += MOD;
        }
        return x;
    }

public:
    Matrix(int row = 0, int col = 0, int val = 0)
        : row(row), col(col), a(row, vector<int>(col, norm(val)))
    {
    }

    Matrix(const vector<vector<int>> &v)
        : row(v.size()), col(v.empty() ? 0 : v[0].size()), a(v)
    {
        for (int i = 0; i < row; i++)
        {
            for (int j = 0; j < col; j++)
            {
                a[i][j] = norm(a[i][j]);
            }
        }
    }

    static Matrix identity(int n)
    {
        Matrix ans(n, n);
        for (int i = 0; i < n; i++)
        {
            ans[i][i] = 1;
        }
        return ans;
    }

    vector<int> &operator[](int i)
    {
        return a[i];
    }

    const vector<int> &operator[](int i) const
    {
        return a[i];
    }

    int rows() const
    {
        return row;
    }

    int cols() const
    {
        return col;
    }

    Matrix operator+(const Matrix &other) const
    {
        Matrix ans(row, col);
        for (int i = 0; i < row; i++)
        {
            for (int j = 0; j < col; j++)
            {
                ans[i][j] = norm(a[i][j] + other[i][j]);
            }
        }
        return ans;
    }

    Matrix operator-(const Matrix &other) const
    {
        Matrix ans(row, col);
        for (int i = 0; i < row; i++)
        {
            for (int j = 0; j < col; j++)
            {
                ans[i][j] = norm(a[i][j] - other[i][j]);
            }
        }
        return ans;
    }

    Matrix operator*(const Matrix &other) const
    {
        Matrix ans(row, other.col);
        for (int i = 0; i < row; i++)
        {
            for (int k = 0; k < col; k++)
            {
                if (a[i][k] == 0)
                {
                    continue;
                }
                for (int j = 0; j < other.col; j++)
                {
                    ans[i][j] = (ans[i][j] + a[i][k] * other[k][j]) % MOD;
                }
            }
        }
        return ans;
    }

    Matrix &operator+=(const Matrix &other)
    {
        return *this = *this + other;
    }

    Matrix &operator-=(const Matrix &other)
    {
        return *this = *this - other;
    }

    Matrix &operator*=(const Matrix &other)
    {
        return *this = *this * other;
    }

    vector<int> multiply_vector(const vector<int> &v) const
    {
        vector<int> ans(row);
        for (int i = 0; i < row; i++)
        {
            for (int j = 0; j < col; j++)
            {
                ans[i] = (ans[i] + a[i][j] * norm(v[j])) % MOD;
            }
        }
        return ans;
    }
};

Matrix qpow(Matrix base, int exp)
{
    Matrix ans = Matrix::identity(base.rows());
    while (exp)
    {
        if (exp & 1)
        {
            ans *= base;
        }
        base *= base;
        exp >>= 1;
    }
    return ans;
}
```

### 0/1 与完全背包

```cpp
// 0/1 背包：每件物品最多一次，容量不超过 W。
vector<long long> zero_one_knapsack(
    int W, const vector<pair<int, int>>& items) {
    vector<long long> dp(W + 1);
    for (auto [weight, value] : items)
        for (int j = W; j >= weight; --j)
            dp[j] = max(dp[j], dp[j - weight] + value);
    return dp;
}

// 完全背包：每件物品可用任意次。
vector<long long> complete_knapsack(
    int W, const vector<pair<int, int>>& items) {
    vector<long long> dp(W + 1);
    for (auto [weight, value] : items)
        for (int j = weight; j <= W; ++j)
            dp[j] = max(dp[j], dp[j - weight] + value);
    return dp;
}
```

---

## 维护记录

- 这篇文章只保留可复用模板；具体题目的完整实现、分块练习和特殊线段树题仍放在原代码目录中。
- 模板改过接口或修过边界后，应同步更新这里，避免赛场上翻到两份互相矛盾的版本。

> 最后更新：2026-08-13。把原来的蓝桥杯速查扩充为个人通用模板合集，并统一了目录与说明。

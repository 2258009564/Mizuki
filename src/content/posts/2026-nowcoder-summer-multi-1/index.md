---
title: 2026 牛客暑期多校训练营第一场补题
description: 2026 牛客暑期多校第一场补题，顺序为 A、E、F、C、J、G
published: 2026-07-17
updated: 2026-07-17
category: 算法竞赛
tags: [算法竞赛, 牛客多校, 补题]
draft: true
pinned: false
comment: true
---

持续更新中……

# A

## 题目信息

- 题目名称：TODO
- 题目链接：TODO
- 难度 / 赛时通过数：TODO
- 关键词：TODO

## 思路

血签。


## 复杂度

- 时间复杂度：$O(\text{TODO})$
- 空间复杂度：$O(\text{TODO})$

## 代码

```cpp
void solve()
{
    string s;
    cin >> s;
    int n = s.size();
    s = ' ' + s;
    int ok = 1;
    if (n != 8)
    {
        return void(cout << "Well-Being");
    }
    vector v = {'a', 'e', 'i', 'o', 'u'};
    for (int i = 1; i <= 8; i += 2)
    {
        for (auto c : v)
        {
            if (c == s[i])
            {
                ok = 0;
            }
        }
    }
    for (int i = 2; i <= 8; i += 2)
    {
        if (count(all(v), s[i]) == 0)
        {
            ok = 0;
        }
    }
    cout << (ok ? "Suspected Virus" : "Well-Being");
}
```

# E

## 题目信息

- 题目名称：TODO
- 题目链接：TODO
- 难度 / 赛时通过数：TODO
- 关键词：TODO

## 题意

TODO：用自己的话概括题意、输入输出与关键限制。

## 思路

也是血签。

考虑拆分贡献，每一个 `v[i]` 在之前出现了 `i - 1` 次，在之后出现了 `n - i` 次，枚举并累加贡献即可。

## 代码

```cpp
void solve()
{
    int n;
    cin >> n;
    vector<int> v(n + 1);
    for (int i = 1; i <= n; i++)
    {
        cin >> v[i];
    }

    int ans = 0;
    for (int i = 1; i <= n; i++)
    {
        ans += (i - 1) * v[i];
        ans -= (n - i) * v[i];
    }
    cout << ans;
}
```

## 复盘

- 可复用结论 / 技巧：拆分贡献，枚举每个元素的贡献值，把O(n^2)的复杂度降为O(n)。

# F

## 题目信息

- 题目名称：TODO
- 题目链接：TODO
- 难度 / 赛时通过数：TODO
- 关键词：TODO

## 题意

TODO：用自己的话概括题意、输入输出与关键限制。

## 思路

首先考虑沿用上面关于拆分贡献的公式：
```cpp
    auto f = [&](vector<int> v, int n) -> int
    {
        int ans = 0;
        for (int i = 0; i < n; i++)
        {
            ans += (i - 1) * v[i];
            ans -= (n - i) * v[i];
        }
        return (ans % n + n) % n;
    };
```
然后枚举 `n = 2, 3, 4, 5` 的情况：
```cpp

    for (int nn = 2; nn <= 5; nn++)
    {
        for (int kk = 0; kk < nn; kk++)
        {
            for (int xx = 0; xx < nn; xx++)
            {
                vector<int> tmp(nn);
                iota(all(tmp), 0ll);
                do
                {
                    auto ttmp = tmp;
                    do
                    {
                        if (ttmp[kk] != xx)
                        {
                            continue;
                        }
                        if (f(tmp, nn) == f(ttmp, nn))
                        {
                            cout << "!" << endl;
                            for (auto a : tmp)
                            {
                                cout << a << ' ';
                            }
                            cout << endl;
                            for (auto a : ttmp)
                            {
                                cout << a << ' ';
                            }
                            cout << endl;
                        }

                    } while (next_permutation(all(ttmp)));
                } while (next_permutation(all(tmp)));
            }
        }
    }
```

打表出来发现只要是循环移位，都不改变贡献的值。所以最后代码是非常显然的，只需要循环移位直到 `v[k] = x` 即可。
下面考虑证明：

## 正确性说明


## 代码

```cpp
void solve()
{
    int n, k, x;
    cin >> n >> k >> x;

    vector<int> v(n);
    for (int i = 0; i < n; i++)
    {
        cin >> v[i];
    }
    int delta = 0;
    int tmp = v[k];
    while (tmp != x)
    {
        delta++;
        tmp++;
        if (tmp == n)
        {
            tmp = 0;
        }
    }
    for (int i = 0; i < n; i++)
    {
        cout << (v[i] + delta) % n << ' ';
    }
}
```

## 复盘

- 卡点：TODO

- 可复用结论 / 技巧：再遇到排列的值发生改变，可以考虑循环移位。

# C

## 题目信息



## 题意

给定一个 `n × m` 的网格，初始时所有格子都是障碍。之后依次加入鱼，并处理两种操作：

- `1 x y v`：将 `(x, y)` 的障碍变成一条大小为 `v` 的鱼，询问从这条鱼出发最多能吃掉多少条鱼。新加入的鱼不会小于此前加入的任何鱼。
- `2 x y`：可以先将 `(x, y)` 处的鱼增大任意非负整数。为了让它吃掉所在连通块中的所有其他鱼，求所需的最小增量。

鱼每次只能向上下左右移动。当相邻格子中的鱼不大于自己时，可以移动过去将其吃掉，随后自身大小增加 `1`；不能进入障碍，也不能吃比自己大的鱼。

每次询问都是假想过程，不会真的改变网格中鱼的位置和大小。输入坐标还需要与上一次的答案异或后解密。

## 思路

看到动态维护连通块，首先考虑并查集。

对于操作一，题目保证新加入的鱼不小于此前加入的所有鱼。因此，新鱼与相邻连通块合并后，一定能够吃掉其中的全部旧鱼，答案就是新连通块的大小减一：

```cpp
size[find(id)] - 1
```

操作二不能只在根上维护一个统一的最小值，因为从同一连通块中的不同位置出发，遇到大鱼之前能够先吃掉的鱼数可能不同。我们需要保留各个连通块的合并历史，因此使用维护路径最大值的带权并查集。

每次加入大小为 `v` 的新鱼 `i` 时，让所有相邻旧连通块的根 `r` 挂到 `i` 下面。这里不能按秩或按大小决定合并方向，因为父子关系需要表示加入顺序，新鱼必须成为根。

设旧连通块共有 `size[r]` 条鱼，从其中某条鱼出发时的初始大小为 `S`。吃完旧连通块中的其他鱼后，其大小变为：

$$
S+size[r]-1
$$

为了继续吃掉新鱼 `v`，需要满足：

$$
S+size[r]-1\ge v
$$

因此：

$$
S\ge v-size[r]+1
$$

令 `need[r]` 表示从节点 `r` 跨到父亲所在连通块时所要求的最小初始大小，那么合并时有：

```cpp
parent[r] = i;
need[r] = v - size[r] + 1;
size[i] += size[r];
```

如果一条鱼到当前根的路径上存在多个门槛，就必须同时满足它们，所以查询的是路径上的最大值。路径压缩时同步维护：

```cpp
int old_parent = parent[x];
int root = find(old_parent);
need[x] = max(need[x], need[old_parent]);
parent[x] = root;
```

执行 `find(x)` 后，`need[x]` 就是从 `x` 出发吃完整个当前连通块所要求的最小初始大小。设这条鱼原本大小为 `value[x]`，操作二的答案为：

```cpp
max(0LL, need[x] - value[x])
```

这里 `size` 是维护在根上的连通块信息，因此通过 `size[find(x)]` 查询；`need` 是维护在边上的路径信息，因此需要先执行 `find(x)`，再读取 `need[x]`。

## 正确性说明

TODO：说明算法为什么能够得到正确答案。

## 复杂度

- 时间复杂度：$O(\text{TODO})$
- 空间复杂度：$O(\text{TODO})$

## 代码

```cpp
// TODO
```

## 复盘

- 卡点：TODO
- 错误提交：TODO
- 可复用结论 / 技巧：TODO

# J

## 题目信息

- 题目名称：TODO
- 题目链接：TODO
- 难度 / 赛时通过数：TODO
- 关键词：TODO

## 题意

TODO：用自己的话概括题意、输入输出与关键限制。

## 思路

TODO：记录从观察到结论的推导过程，以及容易忽略的边界情况。

## 正确性说明

TODO：说明算法为什么能够得到正确答案。

## 复杂度

- 时间复杂度：$O(\text{TODO})$
- 空间复杂度：$O(\text{TODO})$

## 代码

```cpp
// TODO
```

## 复盘

- 卡点：TODO
- 错误提交：TODO
- 可复用结论 / 技巧：TODO

# G

## 题目信息

- 题目名称：TODO
- 题目链接：TODO
- 难度 / 赛时通过数：TODO
- 关键词：TODO

## 题意

TODO：用自己的话概括题意、输入输出与关键限制。

## 思路

TODO：记录从观察到结论的推导过程，以及容易忽略的边界情况。

## 正确性说明

TODO：说明算法为什么能够得到正确答案。

## 复杂度

- 时间复杂度：$O(\text{TODO})$
- 空间复杂度：$O(\text{TODO})$

## 代码

```cpp
// TODO
```

## 复盘

- 卡点：TODO
- 错误提交：TODO
- 可复用结论 / 技巧：TODO

# 总结

## 本场新知识

- TODO

## 暴露的问题

- TODO

## 后续复习计划

- [ ] 重写 A
- [ ] 重写 E
- [ ] 重写 F
- [ ] 重写 C
- [ ] 重写 J
- [ ] 重写 G

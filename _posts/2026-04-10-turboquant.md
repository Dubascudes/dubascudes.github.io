---
layout: post
title: "TurboQuant: Redefining AI Efficiency with Extreme Compression"
date: 2026-04-10
permalink: /posts/2026/04/turboquant/
tags:
  - machine learning
  - quantization
  - LLMs
---

<style>
.yt-embed {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  height: 0;
  overflow: hidden;
  margin: 1.5rem 0;
}
.yt-embed iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
</style>

# TurboQuant: Redefining AI Efficiency with Extreme Compression

This post is adapted from a presentation I gave on **TurboQuant**, a vector quantization method that compresses the KV cache of LLMs with essentially zero accuracy loss. The subject is **Vector Quantization (VQ)**, not to be confused with **Weight Quantization**, the offline compression of model parameters. VQ lets us reduce the *online* memory demands of the **Key** and **Value** caches, which are a bottleneck for deploying LLMs at scale. Before we get to the quantization part, let's talk about the vectors we want to quantize.

## Background: Transformer Attention

The modern transformer's self-attention mechanism computes, for each token, a **Query**, **Key**, and **Value** vector. The output is a weighted sum of value vectors, with weights determined by the scaled dot product of the query against all prior keys.

{% include figure.liquid loading="eager" path="assets/img/turboquant/kv_cache.png" class="img-fluid rounded z-depth-1" %}

Naively, generating token 1000 would require recomputing all 999 previous key and value vectors. The **KV cache** is the standard trick that avoids this: we store K and V for every token as we go, so each new token only requires computing one new K and V.

The KV cache makes inference tractable; it's one of the key innovations that makes LLMs deployable. But what we buy in FLOPs, we pay for in memory. The cache takes up space, and that space directly constrains both the context window and the number of concurrent users a server can support.

So we'd like to shrink the vectors in the cache so we can fit more of them. But how do we reduce the size of a vector without losing information?

## How TurboQuant Works

TurboQuant is a compression method that achieves a large reduction in vector size with (nearly) zero accuracy loss. It has two stages:

1. **High-quality compression (the PolarQuant method):** TurboQuant randomly rotates each data vector, then applies a scalar quantizer independently to each coordinate. This first stage uses the majority of the bit budget to capture the bulk of the vector's information.
2. **Eliminating hidden errors (QJL):** TurboQuant uses a small residual (just 1 bit) to apply the Quantized Johnson-Lindenstrauss transform to the leftover error from stage 1. QJL acts as an unbiased error-checker that cleans up the bias introduced by the first stage.

The theoretical contributions are:

- **PolarQuant:** Lloyd-Max quantization *without calibration* (!)
- **Quantized Johnson-Lindenstrauss (QJL):** unbiased inner products
- **TurboQuant:** PolarQuant + QJL
- Tight bounds on the MSE distortion measure

## Vector Quantization, Formally

Given a high-dimensional vector, map it to a **compact discrete code** using fewer bits per element, while minimizing **distortion**. Formally: construct a quantizer $$Q(\cdot)$$ that, for any desired bit-width $$b$$, minimizes the following expected distortion measures for any worst-case vectors $$\mathbf{x}, \mathbf{y} \in \mathbb{R}^d$$:

$$
D_{\text{mse}} := \mathbb{E}_Q\left[\|\mathbf{x} - Q^{-1}(Q(\mathbf{x}))\|_2^2\right]
$$

$$
D_{\text{prod}} := \mathbb{E}_Q\left[|\langle \mathbf{y}, \mathbf{x}\rangle - \langle \mathbf{y}, Q^{-1}(Q(\mathbf{x}))\rangle|^2\right]
$$

The two metrics matter because attention cares about inner products, not just reconstruction.

## Background: Lloyd-Max Quantization

Before we can appreciate what PolarQuant is doing, we need to understand the classical approach: **Lloyd-Max quantization**.

<div class="yt-embed"><iframe src="https://www.youtube.com/embed/5mwdReRRXv8" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>

## Part 1: PolarQuant

Here's Algorithm 1, `TurboQuant_mse`, optimized for MSE:

{% include figure.liquid loading="eager" path="assets/img/turboquant/alg1.png" class="img-fluid rounded z-depth-1" %}

The procedure is almost suspiciously simple: generate a random rotation matrix $$\Pi$$, build a codebook of centroids, rotate each vector before quantizing, and invert the rotation on dequantization. **Why does this work?**

### More Background: The Maxwell-Poincaré-Borel Lemma

The answer comes from a classical result about the distribution of coordinates of a random point on a high-dimensional sphere.

**Lemma 1 (coordinate distribution of a random point on the hypersphere).** For any positive integer $$d$$, if $$\mathbf{x} \in \mathbb{S}^{d-1}$$ is uniformly distributed over the unit hypersphere, then for any $$j \in [d]$$ the coordinate $$x_j$$ follows the (scaled/shifted) Beta distribution:

$$
x_j \sim f_X(x) := \frac{\Gamma(d/2)}{\sqrt{\pi} \cdot \Gamma((d-1)/2)} (1 - x^2)^{(d-3)/2}.
$$

In high dimensions this Beta distribution converges to $$\mathcal{N}(0, 1/d)$$.

The proof is a Pythagorean-theorem argument: $$f_X(x)$$ equals the ratio of the $$(d-1)$$-dimensional surface area of a sphere with radius $$\sqrt{1-x^2}$$ to the volume of a unit sphere in $$d$$ dimensions, scaled by $$1/\sqrt{1-x^2}$$. Here's a visualization:

<div class="yt-embed"><iframe src="https://www.youtube.com/embed/0n8N-FtjtUk" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>

### PolarQuant Hacks Lloyd-Max

So we know the distribution of the coordinates of a point on a $$d$$-sphere. This is huge: it means we can **skip all the work of Lloyd-Max**. Instead of iteratively calibrating a codebook on our data, we can precompute the optimal centroids once and for all, because we know exactly what distribution the rotated coordinates will follow.

<div class="yt-embed"><iframe src="https://www.youtube.com/embed/K6uuhIysKmc" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>

### PolarQuant's Flaw

PolarQuant is brilliant at MSE, but it has a subtle flaw: it's **biased** on inner products.

<div class="yt-embed"><iframe src="https://www.youtube.com/embed/GueXxXz83HE" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>

That bias is what Part 2 of TurboQuant is designed to fix.

## Part 2: Quantized Johnson-Lindenstrauss (QJL)

**Definition (QJL).** For any positive integer $$d$$, the QJL map $$Q_{\text{qjl}}: \mathbb{R}^d \to \{-1, +1\}^d$$ is defined as:

$$
Q_{\text{qjl}}(\mathbf{x}) := \text{sign}(\mathbf{S} \cdot \mathbf{x}) \quad \text{for any } \mathbf{x} \in \mathbb{R}^d,
$$

where $$\mathbf{S} \in \mathbb{R}^{d \times d}$$ is a random matrix with i.i.d. entries sampled from $$\mathcal{N}(0,1)$$ and $$\text{sign}$$ is applied entry-wise. The dequantization map is:

$$
Q_{\text{qjl}}^{-1}(\mathbf{z}) := \frac{\sqrt{\pi/2}}{d} \cdot \mathbf{S}^\top \cdot \mathbf{z} \quad \text{for any } \mathbf{z} \in \{-1, +1\}^d.
$$

QJL gives unbiased inner products. The trick in TurboQuant is to apply QJL not to the original vector but to the **residual** left over by PolarQuant:

{% include figure.liquid loading="eager" path="assets/img/turboquant/alg2.png" class="img-fluid rounded z-depth-1" %}

PolarQuant eats up $$b-1$$ bits doing the heavy lifting, and QJL spends 1 bit on the residual to kill the bias.

<div class="yt-embed"><iframe src="https://www.youtube.com/embed/k7G51sv-tgw" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>

## Experimental Results

On LongBench-V1, TurboQuant matches or beats the full KV cache at a fraction of the size:

{% include figure.liquid loading="eager" path="assets/img/turboquant/results_table.png" class="img-fluid rounded z-depth-1" %}



## Hype


> "Micron stock has tumbled this week as investors reset sky-high expectations for the memory chip giant. Chief among the pressures is Google's TurboQuant algorithm, which promises to compress memory requirements by as much as six times." - The Motley Fool*

## Practical Consequences

- We now have matching upper and lower bounds on vector distortion. The gap between PolarQuant's actual distortion (inner product error and MSE) and the information-theoretic lower bound **disappears as $$d \to \infty$$**.
- Long-context inference becomes feasible on consumer hardware. A 7–8B model at 32K context goes from needing ~16GB for the KV cache alone to **~3GB at 3-bit**.
- The rotation trick employed by PolarQuant is a design pattern that could be applied to *any* vector we want to quantize.

## References

- *Attention is All You Need*: [https://arxiv.org/abs/1706.03762](https://arxiv.org/abs/1706.03762)
- *TurboQuant*: [https://arxiv.org/abs/2504.19874](https://arxiv.org/abs/2504.19874)
- *PolarQuant*: [https://arxiv.org/pdf/2502.02617](https://arxiv.org/pdf/2502.02617)
- *QJL*: [https://arxiv.org/pdf/2406.03482](https://arxiv.org/pdf/2406.03482)

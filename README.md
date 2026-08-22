# Every attention mechanism, in the order it actually appeared

ERA V5 — Assignment 8.

**Live site:** _(deploy link goes here)_
**Source:** this repository.

A single-page site that walks through **42 attention mechanisms in strict chronological order of
first public appearance**, 2017 to 2025. Every entry is framed the way the assignment asks: *what was
broken at that moment, what this did about it, what it cost, and when you should and should not reach
for it.* There are no "best mechanism" claims anywhere on the page.

It is a static site — HTML, CSS and one JSON file. No framework, no build step, no dependencies.

---

## Why the ordering is the whole point

A list of attention variants is a menu. The same list **sorted by date** is an argument, because each
entry stops looking like a design choice and starts looking like a response to a specific problem that
existed on a specific day. Multi-Query Attention is a curiosity in November 2019 and an obvious
necessity in May 2023, and nothing about the mechanism changed in between — the deployment
economics did. You can only see that if the dates are right, and in order.

That is also why the dates are the risky part of this assignment, and why most of the work here went
into them rather than into the prose.

---

## How the dates were established

**The rule, stated once and applied everywhere:**

> A mechanism is dated by the **first public appearance of the mechanism itself**, not by the
> conference that later accepted it, not by the version of the paper you find today, and not by the
> model that made it famous.

In practice that means:

| Date type | What it means | Count |
|---|---|---|
| `arXiv v1` | The **v1 submission date** from the arXiv abstract page. Not the v3 you land on today, not the ICLR/NeurIPS year. | 39 |
| `model release` | No paper exists. The date is the day the model/blog/repo went public. | 2 |
| `Reddit post (approx.)` | No paper, no repo. Community post; day is best-evidence, not primary-source. | 1 |

**Every arXiv date was read off the primary source** — the arXiv abstract page's own
`citation_date` metadata for the **v1** submission — not from a secondary summary, a blog, a
Papers-with-Code entry, or model memory. Two independent verification passes were run over the full
list (one covering 2017–2023, one covering 2024–2025), each required to report the exact title, the
first author, the v1 date and the latest version number for every ID, and each explicitly instructed
to report **NOT FOUND** rather than produce a plausible-looking date.

Corrections that pass actually caught, listed because "we checked" is worth nothing without them:

- **GQA's title** is *"…Generalized Multi-Query Transformer **Models** from Multi-Head Checkpoints"*.
  The widely-copied variant that reads *"Transformer Checkpoints from Multi-Head Checkpoints"* is
  wrong, and it is wrong in a lot of places.
- **Selective Attention** is an **October 2024** paper (arXiv:2410.02703), not a 2025 one. It is
  *published at* ICLR 2025, which is exactly the trap the dating rule above exists to avoid.
- **NTK-aware scaled RoPE** moved from 30 June to **29 June 2023** on the strength of an archived
  mirror of the thread plus a GitHub issue that cross-references it with a timestamp.
- **Sliding-window attention** is credited to Longformer (April 2020) as the mechanism, with the
  Mistral 7B **blog post of 27 September 2023** noted separately as the day it became a production
  default — that is 13 days before the Mistral arXiv paper, which is the date most write-ups use.

### The three entries whose dates are *not* clean, flagged rather than hidden

The assignment rewards honesty about sources over the appearance of precision, so these are marked on
the page itself, in the citation block of the relevant card:

1. **NTK-aware scaled RoPE — no paper.** It was a Reddit post by *bloc97* on r/LocalLLaMA. Reddit now
   requires authentication, so the page could not be loaded directly; the 29 June 2023 date comes from
   an archived mirror and a cross-referencing GitHub issue. High confidence, **not primary source**,
   and the card says so. Two footnotes worth having: *bloc97* is Bowen Peng, first author of YaRN nine
   weeks later — and **kaiokendev** pushed linear position interpolation to GitHub on **21 June 2023**
   (`cutoff-len-is-context-len`, first commit *"Add dope for extending context to 8K"*), **six days
   before** the Meta Positional Interpolation preprint that carries the citable date.
2. **iRoPE — no paper.** The interleaved-RoPE/NoPE arrangement in Llama 4 is described in the release
   material of **5 April 2025**, not in a publication.
3. **DeepSeek Sparse Attention — no arXiv v1.** It shipped with DeepSeek-V3.2-Exp on
   **29 September 2025**, documented in the release and the GitHub tech report.

Where a mechanism was introduced *inside* a model paper rather than as a standalone contribution
(MLA inside DeepSeek-V2, T5 relative bias inside the T5 paper, sliding window inside Longformer), the
card names the host paper explicitly rather than implying a dedicated one exists.

### One date is in the future-ish and it is real

**DroPE** (arXiv:2512.12167, Sakana AI, v1 **13 December 2025**) is genuinely a December 2025 paper,
verified at the abstract page. It is included because it is the current end of the positional-encoding
arc, and it is called out here because "the agent invented a December 2025 paper" is the first thing a
reader should suspect.

---

## Full source table

Generated directly from `data/mechanisms.json` by `tools/build_readme_sources.py`, so the README and
the site cannot disagree about a date — there is only one copy of the data.

<!-- SOURCES:BEGIN - generated by tools/build_readme_sources.py, do not edit by hand -->

**42 mechanisms, 2017-2025. 42 of 42 dates checked against the primary source.** Date types: 39 x `arXiv v1`, 2 x `model release`, 1 x `Reddit post (approx.)`.

| # | Date | Mechanism | Source document | ID | Date type | Verified |
|---|------|-----------|-----------------|----|-----------|----------|
| 1 | `2017-05-08` | **Learned absolute position embeddings** | Convolutional Sequence to Sequence Learning | [arXiv:1705.03122](https://arxiv.org/abs/1705.03122) | arXiv v1 | yes |
| 2 | `2017-06-12` | **Scaled dot-product attention (the standard one)** | Attention Is All You Need | [arXiv:1706.03762](https://arxiv.org/abs/1706.03762) | arXiv v1 | yes |
| 3 | `2017-06-12` | **Sinusoidal position encoding** | Attention Is All You Need (§3.5, Positional Encoding) | [arXiv:1706.03762](https://arxiv.org/abs/1706.03762) | arXiv v1 | yes |
| 4 | `2018-03-06` | **Relative position representations** | Self-Attention with Relative Position Representations | [arXiv:1803.02155](https://arxiv.org/abs/1803.02155) | arXiv v1 | yes |
| 5 | `2019-01-09` | **Segment recurrence + relative encoding (Transformer-XL)** | Transformer-XL: Attentive Language Models Beyond a Fixed-Length Context | [arXiv:1901.02860](https://arxiv.org/abs/1901.02860) | arXiv v1 | yes |
| 6 | `2019-04-23` | **Fixed sparse attention patterns** | Generating Long Sequences with Sparse Transformers | [arXiv:1904.10509](https://arxiv.org/abs/1904.10509) | arXiv v1 | yes |
| 7 | `2019-10-23` | **Relative position bias buckets (T5)** | Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer | [arXiv:1910.10683](https://arxiv.org/abs/1910.10683) | arXiv v1 | yes |
| 8 | `2019-11-06` | **Multi-query attention (MQA)** | Fast Transformer Decoding: One Write-Head is All You Need | [arXiv:1911.02150](https://arxiv.org/abs/1911.02150) | arXiv v1 | yes |
| 9 | `2019-12-25` | **Top-k / explicit sparse attention** | Explicit Sparse Transformer: Concentrated Attention Through Explicit Selection | [arXiv:1912.11637](https://arxiv.org/abs/1912.11637) | arXiv v1 | yes |
| 10 | `2020-01-13` | **LSH attention (Reformer)** | Reformer: The Efficient Transformer | [arXiv:2001.04451](https://arxiv.org/abs/2001.04451) | arXiv v1 | yes |
| 11 | `2020-04-10` | **Sliding window attention** | Longformer: The Long-Document Transformer | [arXiv:2004.05150](https://arxiv.org/abs/2004.05150) | arXiv v1 | yes |
| 12 | `2020-06-08` | **Low-rank projected attention (Linformer)** | Linformer: Self-Attention with Linear Complexity | [arXiv:2006.04768](https://arxiv.org/abs/2006.04768) | arXiv v1 | yes |
| 13 | `2020-06-29` | **Linear attention (kernel feature maps)** | Transformers are RNNs: Fast Autoregressive Transformers with Linear Attention | [arXiv:2006.16236](https://arxiv.org/abs/2006.16236) | arXiv v1 | yes |
| 14 | `2020-07-28` | **Local + global + random sparse attention (BigBird)** | Big Bird: Transformers for Longer Sequences | [arXiv:2007.14062](https://arxiv.org/abs/2007.14062) | arXiv v1 | yes |
| 15 | `2020-09-30` | **Random-feature softmax approximation (Performer)** | Rethinking Attention with Performers | [arXiv:2009.14794](https://arxiv.org/abs/2009.14794) | arXiv v1 | yes |
| 16 | `2021-02-22` | **The delta rule (fast weight programmers)** | Linear Transformers Are Secretly Fast Weight Programmers | [arXiv:2102.11174](https://arxiv.org/abs/2102.11174) | arXiv v1 | yes |
| 17 | `2021-04-20` | **Rotary position embedding (RoPE)** | RoFormer: Enhanced Transformer with Rotary Position Embedding | [arXiv:2104.09864](https://arxiv.org/abs/2104.09864) | arXiv v1 | yes |
| 18 | `2021-08-27` | **ALiBi (attention with linear biases)** | Train Short, Test Long: Attention with Linear Biases Enables Input Length Extrapolation | [arXiv:2108.12409](https://arxiv.org/abs/2108.12409) | arXiv v1 | yes |
| 19 | `2022-03-30` | **NoPE - no positional encoding at all** | Transformer Language Models without Positional Encodings Still Learn Positional Information | [arXiv:2203.16634](https://arxiv.org/abs/2203.16634) | arXiv v1 | yes |
| 20 | `2022-05-27` | **FlashAttention (IO-aware exact attention)** | FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness | [arXiv:2205.14135](https://arxiv.org/abs/2205.14135) | arXiv v1 | yes |
| 21 | `2023-05-22` | **Grouped-query attention (GQA)** | GQA: Training Generalized Multi-Query Transformer Models from Multi-Head Checkpoints | [arXiv:2305.13245](https://arxiv.org/abs/2305.13245) | arXiv v1 | yes |
| 22 | `2023-06-24` | **KV cache eviction by heavy hitters (H2O)** | H2O: Heavy-Hitter Oracle for Efficient Generative Inference of Large Language Models | [arXiv:2306.14048](https://arxiv.org/abs/2306.14048) | arXiv v1 | yes |
| 23 | `2023-06-27` | **Linear position interpolation (PI)** | Extending Context Window of Large Language Models via Positional Interpolation | [arXiv:2306.15595](https://arxiv.org/abs/2306.15595) | arXiv v1 | yes |
| 24 | `2023-06-29` | **NTK-aware scaled RoPE** | NTK-Aware Scaled RoPE allows LLaMA models to have extended (8k+) context size without any fine-tuning and minimal perplexity degradation | [r/LocalLLaMA post](https://www.reddit.com/r/LocalLLaMA/comments/14lz7j5/ntkaware_scaled_rope_allows_llama_models_to_have/) | Reddit post (approx.) | yes |
| 25 | `2023-08-31` | **YaRN (yet another RoPE extension)** | YaRN: Efficient Context Window Extension of Large Language Models | [arXiv:2309.00071](https://arxiv.org/abs/2309.00071) | arXiv v1 | yes |
| 26 | `2023-09-12` | **PagedAttention (virtual memory for the KV cache)** | Efficient Memory Management for Large Language Model Serving with PagedAttention | [arXiv:2309.06180](https://arxiv.org/abs/2309.06180) | arXiv v1 | yes |
| 27 | `2023-09-29` | **Attention sinks (StreamingLLM)** | Efficient Streaming Language Models with Attention Sinks | [arXiv:2309.17453](https://arxiv.org/abs/2309.17453) | arXiv v1 | yes |
| 28 | `2023-10-03` | **Ring attention (blockwise, device-parallel)** | Ring Attention with Blockwise Transformers for Near-Infinite Context | [arXiv:2310.01889](https://arxiv.org/abs/2310.01889) | arXiv v1 | yes |
| 29 | `2023-12-01` | **Selective state space (Mamba)** | Mamba: Linear-Time Sequence Modeling with Selective State Spaces | [arXiv:2312.00752](https://arxiv.org/abs/2312.00752) | arXiv v1 | yes |
| 30 | `2024-04-10` | **Infini-attention (compressive memory in the attention block)** | Leave No Context Behind: Efficient Infinite Context Transformers with Infini-attention | [arXiv:2404.07143](https://arxiv.org/abs/2404.07143) | arXiv v1 | yes |
| 31 | `2024-05-07` | **Multi-head latent attention (MLA)** | DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model | [arXiv:2405.04434](https://arxiv.org/abs/2405.04434) | arXiv v1 | yes |
| 32 | `2024-05-31` | **Structured state space duality (Mamba-2)** | Transformers are SSMs: Generalized Models and Efficient Algorithms Through Structured State Space Duality | [arXiv:2405.21060](https://arxiv.org/abs/2405.21060) | arXiv v1 | yes |
| 33 | `2024-10-03` | **Selective attention (learned context dropping)** | Selective Attention Improves Transformer | [arXiv:2410.02703](https://arxiv.org/abs/2410.02703) | arXiv v1 | yes |
| 34 | `2024-10-07` | **Differential attention** | Differential Transformer | [arXiv:2410.05258](https://arxiv.org/abs/2410.05258) | arXiv v1 | yes |
| 35 | `2024-12-09` | **Gated DeltaNet** | Gated Delta Networks: Improving Mamba2 with Delta Rule | [arXiv:2412.06464](https://arxiv.org/abs/2412.06464) | arXiv v1 | yes |
| 36 | `2025-01-14` | **Lightning attention at frontier scale (MiniMax-01)** | MiniMax-01: Scaling Foundation Models with Lightning Attention | [arXiv:2501.08313](https://arxiv.org/abs/2501.08313) | arXiv v1 | yes |
| 37 | `2025-02-16` | **Native sparse attention (NSA)** | Native Sparse Attention: Hardware-Aligned and Natively Trainable Sparse Attention | [arXiv:2502.11089](https://arxiv.org/abs/2502.11089) | arXiv v1 | yes |
| 38 | `2025-02-18` | **Mixture of block attention (MoBA)** | MoBA: Mixture of Block Attention for Long-Context LLMs | [arXiv:2502.13189](https://arxiv.org/abs/2502.13189) | arXiv v1 | yes |
| 39 | `2025-04-01` | **Multi-token attention** | Multi-Token Attention | [arXiv:2504.00927](https://arxiv.org/abs/2504.00927) | arXiv v1 | yes |
| 40 | `2025-04-05` | **iRoPE - interleaved RoPE and NoPE layers** | The Llama 4 herd: the beginning of a new era of natively multimodal AI innovation | [Meta AI blog](https://ai.meta.com/blog/llama-4-multimodal-intelligence/) | model release | yes |
| 41 | `2025-09-29` | **DeepSeek sparse attention (DSA)** | DeepSeek-V3.2-Exp: Boosting Long-Context Efficiency with DeepSeek Sparse Attention | [release + tech report](https://github.com/deepseek-ai/DeepSeek-V3.2-Exp) | model release | yes |
| 42 | `2025-12-13` | **DroPE - dropping positional embeddings after pretraining** | Extending the Context of Pretrained LLMs by Dropping Their Positional Embeddings | [arXiv:2512.12167](https://arxiv.org/abs/2512.12167) | arXiv v1 | yes |

<!-- SOURCES:END -->

---

## Question 2 — what the timeline shows that a list cannot

The site's **Findings** section is the long-form answer, with the dates inline. In short, seven things
are visible only after sorting:

1. **The field spent five years solving the wrong bottleneck.** From April 2019 to late 2020, nearly
   every mechanism attacks the quadratic term — and almost none of them are in a frontier model today.
   FlashAttention (27 May 2022) then made exact attention fast enough that approximating it stopped
   being worth the accuracy loss. The winning move was an *implementation*, not an architecture.
2. **The constraint switched from training to serving, and you can date the switch.** MQA was
   published **6 November 2019** and ignored for three and a half years. Then GQA (22 May 2023), H₂O
   (24 June 2023), PagedAttention (12 September 2023), attention sinks (29 September 2023) and MLA
   (7 May 2024) arrive in a cluster. The mechanism did not improve; **inference became the bill.**
3. **Two of the most consequential ideas of 2023 were not papers** — position interpolation
   (kaiokendev, GitHub, 21 June 2023) and NTK-aware scaled RoPE (Reddit, 29 June 2023). A
   paper-only timeline of attention is missing the ideas that unlocked long context in practice.
4. **The field threw memory away, then spent four years buying it back.** Transformers dropped
   recurrence in 2017; the delta rule (22 February 2021) through Mamba (1 December 2023), SSD
   (31 May 2024) and Gated DeltaNet (9 December 2024) is the sound of recurrence being rebuilt with
   better update rules.
5. **Positional encoding moved monotonically towards less.** Learned absolute → sinusoidal →
   relative → learned bias → rotary → linear bias → **none** → dropped from pretrained models
   (DroPE, 13 December 2025). Nobody planned that; it is only visible in order.
6. **Sparsity had to become trainable before anyone would ship it.** The 2019–2020 patterns were
   fixed and hand-designed. NSA (16 February 2025) and MoBA (18 February 2025) — two days apart, two
   labs — make the sparsity *learned*, and DeepSeek then ships it (29 September 2025).
7. **The shape predicts.** The site closes with three falsifiable predictions that follow from the
   above, offered as predictions and clearly labelled as such.

### Bonus — mechanisms not on the assignment's list

Included with verified dates: **Selective Attention** (2410.02703, 3 Oct 2024), **Multi-Token
Attention** (2504.00927, 1 Apr 2025), **Lightning Attention / MiniMax-01** (2501.08313, 14 Jan 2025),
**Differential Transformer** (2410.05258, 7 Oct 2024), **Explicit Sparse Transformer** (1912.11637,
25 Dec 2019), and the systems-side mechanisms **FlashAttention**, **PagedAttention** and **Ring
Attention** — which belong on an attention timeline precisely because point 1 above is not true
without them.

---

## Running it locally

The page loads `data/mechanisms.json` with `fetch`, which browsers block on `file://`. Serve it over
HTTP:

```bash
python -m http.server 8899
# then open http://localhost:8899
```

Opening `index.html` directly will show an explicit error panel telling you the same thing.

## Repository layout

```
index.html                     page shell
css/style.css                  all styling; family colours live here as --f-<family>
js/app.js                      renders timeline, filters, comparator and the interactive labs
js/findings.js                 the Question 2 write-up
data/mechanisms.json           the entire content layer: families, eras, 42 mechanisms + citations
tools/build_readme_sources.py  regenerates the source table above from the JSON
```

To add or correct a mechanism, edit **`data/mechanisms.json` only**, then re-run
`python tools/build_readme_sources.py`. Nothing about a mechanism is hard-coded in the HTML or JS.

## Known limitations

- "First public appearance" is a defensible rule, not the only one. Dating by conference acceptance,
  or by the first model to ship the mechanism, would reorder parts of this timeline — most visibly
  around Selective Attention and sliding-window attention.
- A handful of ideas have genuinely contested priority (linear attention and fast-weight programmers;
  position interpolation). Where that is true the card says so rather than picking a winner silently.
- The cost figures on the cards are asymptotic characterisations, not benchmarks. No wall-clock
  numbers are claimed anywhere, because none were measured here.

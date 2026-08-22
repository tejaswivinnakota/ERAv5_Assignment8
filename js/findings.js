/* ==========================================================================
   findings.js — "What the timeline actually shows"
   --------------------------------------------------------------------------
   This is the answer to Question 2 of the assignment. It is kept in its own
   file because it is prose, not data: these are claims about the shape of the
   history, and every one of them should be checkable against the timeline
   above it.
   ========================================================================== */
'use strict';

const FINDINGS = [
  {
    n: '01',
    h: 'The field spent five years solving the wrong bottleneck',
    body: [
      'From <b>April 2019 to late 2020</b> almost everything is an attack on the quadratic term. ' +
      'Sparse Transformer, Reformer, Longformer, BigBird, Linformer, Performer, linear attention — ' +
      'six major efficiency papers inside eighteen months, all aimed at <code>O(n&sup2;)</code>.',

      'Then look at what actually shipped. Almost none of it. The models that took over the world in ' +
      '2020&ndash;2023 ran <b>plain dense attention</b>. In a list this looks like a productive research ' +
      'period. On a timeline it looks like something else: a cluster of solutions arriving years before ' +
      'the problem they solved became the binding constraint, aimed at a cost that was not the one ' +
      'hurting most.',

      'The tell is <b>FlashAttention (27 May 2022)</b>, which sits in the middle of that dead zone and ' +
      'is not a mechanism at all — it changes no mathematics and returns bit-exact the same answer. It ' +
      'just stops writing the score matrix to memory. It beat the entire approximate-attention literature ' +
      'on the metric that mattered, and it did so by <i>refusing to approximate</i>. Half the efficiency ' +
      'zoo was solving a memory problem while believing it was solving a compute problem. That is the ' +
      'single most expensive lesson on this page, and you can only see it by putting a kernel paper on ' +
      'the same axis as the mechanisms.'
    ]
  },
  {
    n: '02',
    h: 'The real constraint switched from training to serving, and you can date it',
    body: [
      'MQA was published <b>6 November 2019</b> and then sat almost untouched for three and a half years. ' +
      'GQA appears <b>22 May 2023</b>; Llama 2 ships it that July. Nothing about the mathematics got better ' +
      'in the interim. What changed is that the industry moved from <i>training</i> models to <i>serving</i> ' +
      'them, and at generation time you are not compute-bound at all — you are memory-bandwidth-bound, ' +
      're-reading the entire KV cache for every single token.',

      'Once you notice the gap, the 2023&ndash;2024 cluster stops looking like a coincidence. GQA (May 2023), ' +
      'H2O (June 2023), PagedAttention (September 2023), attention sinks (September 2023), MLA (May 2024) — ' +
      'five different attacks on the same cache, inside twelve months, after four years of near-silence. ' +
      '<b>Shazeer was not early because he was lucky. He was early because he was at Google, where they ' +
      'were already serving.</b>',

      'This is the clearest case on the whole timeline of a mechanism whose value is set by deployment ' +
      'economics rather than by anything in the paper.'
    ]
  },
  {
    n: '03',
    h: 'Two of the most consequential ideas of 2023 were not papers',
    body: [
      'Linear position interpolation and NTK-aware scaling both arrived in <b>late June 2023</b>, within ' +
      'days of each other, and the community versions were not peer-reviewed anything. Position ' +
      'interpolation was pushed to GitHub by <b>kaiokendev</b> on <b>21 June 2023</b> ' +
      '(<code>cutoff-len-is-context-len</code>, first commit: "Add dope for extending context to 8K") and ' +
      'independently published by Meta on arXiv on <b>27 June 2023</b>. NTK-aware scaled RoPE was a ' +
      '<b>Reddit post by "bloc97" on r/LocalLLaMA</b> on <b>29 June 2023</b>. Nine days, three sources, ' +
      'one of them a paper.',

      'Within about two months both were absorbed into a formal paper (YaRN, 31 August 2023), and from ' +
      'there into essentially every long-context model in production. The lag from Reddit post to ' +
      'industry standard was measured in <b>weeks</b>.',

      'This is invisible in a list, which flattens a Reddit post and a NeurIPS paper into identically ' +
      'formatted rows. On a timeline it is one of the loudest signals here: for a stretch of 2023, open ' +
      'weights plus a consumer GPU meant the fastest iteration loop in the field was <i>outside</i> the ' +
      'labs. It is also, honestly, the hardest part of this page to source — which is exactly why it is ' +
      'the part most likely to be got wrong.'
    ]
  },
  {
    n: '04',
    h: 'The field threw memory away, then spent four years buying it back',
    body: [
      'This is the arc the whole exercise is built to expose, and the dates make it exact.',

      '<b>2017:</b> attention discards recurrence entirely. That is the trade that makes it parallel and ' +
      'makes it win. The past is not compressed into a state — it is kept in full and re-read.<br>' +
      '<b>2020&ndash;2021:</b> linear attention notices that if you drop the softmax you get an RNN back, ' +
      'and re-derives a fixed-size recurrent state. The delta rule (February 2021) points out that the ' +
      'naive version just <i>adds</i> to that state forever and therefore smears; you want to ' +
      '<i>edit</i> it.<br>' +
      '<b>2023&ndash;2024:</b> Mamba adds input-dependent gating, so the state can decide what to forget. ' +
      'Gated DeltaNet (December 2024) fuses the two: gated forgetting <i>and</i> precise editing.<br>' +
      '<b>2025:</b> that combination ships in production models.',

      'So the sequence is: throw away the recurrent state to get parallelism, discover the state was ' +
      'load-bearing, and spend four years rebuilding it with better update rules than the one we ' +
      'discarded. <b>The 2025 architectures are not a rejection of the Transformer and they are not a ' +
      'return to the RNN — they are hybrids</b>, mostly linear layers with full attention kept every few ' +
      'blocks. Nobody was willing to give up exact recall entirely. That reluctance is the most ' +
      'informative fact on the timeline.'
    ]
  },
  {
    n: '05',
    h: 'Positional encoding kept moving in one direction: towards less',
    body: [
      'Read only the positional entries, in order, and the trend is monotone. Learned absolute embeddings ' +
      '(2017) are a table of parameters. Sinusoidal (2017) removes the parameters. Shaw (2018) and ' +
      'Transformer-XL (2019) drop absolute position for relative. T5 (2019) reduces relative position to ' +
      'a single learned scalar per bucket. RoPE (2021) removes the additive term entirely and encodes ' +
      'position as a rotation. ALiBi (2021) removes the embedding and leaves a straight-line penalty. ' +
      'NoPE (2022) observes that a causal decoder infers position from the mask and may need <b>nothing ' +
      'at all</b>.',

      'And then <b>DroPE (13 December 2025)</b> closes the loop in the least obvious way available: train ' +
      '<i>with</i> RoPE, because the inductive bias helps convergence, then <b>delete it</b> and briefly ' +
      'recalibrate. Position ends up as scaffolding — necessary to build the model, removed once it ' +
      'stands.',

      'Eight years, and the direction never reverses. That is a genuine prediction signal, and it is only ' +
      'legible chronologically: sorted by family, these look like eight competing options; sorted by date, ' +
      'they are one idea being progressively deleted.'
    ]
  },
  {
    n: '06',
    h: 'Sparsity had to become trainable before anyone would ship it',
    body: [
      'The 2019&ndash;2020 sparse methods used <b>fixed, hand-designed patterns</b> — strided, local, ' +
      'random, block. They were bolted on, and mostly they stayed in the papers.',

      'The 2025 sparse methods are the same idea with one difference that turns out to decide everything: ' +
      '<b>the selection is learned, differentiable and trained end-to-end</b>. NSA (16 February 2025) ' +
      'calls this out in its title — "natively trainable". MoBA (18 February 2025), two days later, ' +
      'arrives at the same conclusion from the MoE direction: let a gate choose the blocks. In September ' +
      '2025 DeepSeek shipped sparse attention in a production frontier model.',

      'Six years separate the pattern from the shipping product, and the gap is not hardware. It is that ' +
      'a sparsity pattern chosen by a human is a guess about what matters, while one chosen by a gate is ' +
      'a thing the model can be held responsible for. <b>The lesson repeats across the timeline: ' +
      'mechanisms that make a decision on the model\'s behalf lose to mechanisms that let the model make ' +
      'the decision.</b>'
    ]
  },
  {
    n: '07',
    h: 'So what comes next — the part the ordering is actually for',
    body: [
      'Three predictions fall out of the shape above, offered as predictions and not as facts.',

      '<b>Position keeps getting deleted.</b> The direction has not reversed once in eight years and ' +
      'DroPE just showed you can remove it after the fact. Expect the frontier default to become ' +
      '"positional encoding during pretraining, little or none at inference", and expect more hybrids ' +
      'like Llama 4\'s iRoPE where only some layers carry position at all.',

      '<b>The hybrid ratio becomes a tuning knob, not a research question.</b> 2025 settled on "mostly ' +
      'linear, full attention every few layers" without settling on the ratio. That is what an unfinished ' +
      'trade looks like. The interesting version is a model that varies the ratio by <i>task</i> — cheap ' +
      'recurrent state for fluent generation, exact attention only when something must genuinely be ' +
      'retrieved.',

      '<b>And the one worth watching hardest:</b> every mechanism here optimises a cost that some piece of ' +
      'hardware made painful. FlashAttention exists because SRAM is small and HBM is slow. MQA and GQA ' +
      'exist because bandwidth did not scale with FLOPs. If that ratio changes — and large-memory ' +
      'accelerators are explicitly aimed at it — then several mechanisms on this page stop being worth ' +
      'their accuracy cost, and dense attention gets cheaper to justify again. <b>Most of these are not ' +
      'discoveries about language. They are load-bearing responses to a memory hierarchy</b>, and they ' +
      'are only permanent for as long as it is.'
    ]
  }
];

document.addEventListener('DOMContentLoaded', () => {
  const host = document.getElementById('findings');
  if (!host) return;
  FINDINGS.forEach(f => {
    const card = document.createElement('div');
    card.className = 'finding';
    const h = document.createElement('h3');
    h.innerHTML = `<span class="n">${f.n}</span><span>${f.h}</span>`;
    card.appendChild(h);
    f.body.forEach(p => {
      const el = document.createElement('p');
      el.innerHTML = p;
      card.appendChild(el);
    });
    host.appendChild(card);
  });
});

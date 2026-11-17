/**
 * BountyScout engine — pure logic, no DOM, no network.
 * Works in the browser (window.BountyScout) and in Node (module.exports).
 *
 * What it does: reads the public text of a bug-bounty program
 * (program page, rules, or README) and extracts the facts a hunter
 * actually decides on — reward, submit fee, reputation gate, KYC,
 * scope — then scores the program 0-100 and gives a GO / CAUTION /
 * SKIP verdict with human-readable reasons.
 *
 * The extractor is a deterministic pattern + keyword model over the
 * program text (a small, transparent NLP pipeline). An optional LLM
 * pass (app.js, OpenRouter free models, user key only) can refine
 * the verdict, but the core works fully offline with no key.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.BountyScout = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // ---------------------------------------------------------------- money
  function parseMoney(str) {
    if (!str) return null;
    const n = parseFloat(String(str).replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  }

  // Largest "$X" amount that looks like a reward (pool / max / up to).
  function extractReward(text) {
    const amounts = [];
    const patterns = [
      /(?:up to|maximum|max|pool|prize|reward|bounty)[^$\n]{0,40}?\$ ?([\d,]+(?:\.\d+)?)/gi,
      /(?:up to|maximum|max|pool|prize|reward|bounty)[^$\n]{0,40}?([\d,]+(?:\.\d+)?)\s*(?:USDC|USDT|USD)\b/gi,
    ];
    let m;
    for (const re of patterns) {
      while ((m = re.exec(text)) !== null) {
        const v = parseMoney(m[1]);
        if (v !== null && v > 0) amounts.push(v);
      }
    }
    // Fallback: any standalone $ amount or N USDC/USDT/USD amount.
    if (amounts.length === 0) {
      const fallbacks = [/\$ ?([\d,]+(?:\.\d+)?)/g, /([\d,]+(?:\.\d+)?)\s*(?:USDC|USDT|USD)\b/g];
      for (const re of fallbacks) {
        while ((m = re.exec(text)) !== null) {
          const v = parseMoney(m[1]);
          if (v !== null && v > 0) amounts.push(v);
        }
      }
    }
    return amounts.length ? Math.max.apply(null, amounts) : null;
  }

  // ---------------------------------------------------------------- gates
  function extractFee(text) {
    // "submit fee $5", "100 credits (= 100 USDC)", "deposit $30", "pay $7"
    const patterns = [
      /(?:submit|submission|entry|pay-to-submit)[^.\n]{0,60}?(?:\$ ?([\d,]+)|([\d,]+)\s*credits?)/i,
      /(\d+)\s*credits?\s*(?:=|\(|,)[^.\n]{0,30}?\$ ?([\d,]+)/i,
      /(?:fee|deposit)[^.\n]{0,40}?\$ ?([\d,]+(?:\.\d+)?)/i,
      /requires?\s+(?:a\s+)?\$ ?([\d,]+(?:\.\d+)?)\s*(?:fee|deposit|payment)/i,
    ];
    for (const re of patterns) {
      const m = text.match(re);
      if (!m) continue;
      const v = parseMoney(m[1] || m[2]);
      if (v !== null && v > 0) return { amountUsd: v, raw: m[0].trim() };
    }
    return null;
  }

  function extractReputationGate(text) {
    const patterns = [
      /reputation[^.\n]{0,60}?(\d+)\s*(?:\+|points?|pts|or more|minimum|min)/i,
      /(?:requires?|needs?|minimum|min)[^.\n]{0,40}?(\d+)\s*(?:\+)?\s*(?:reputation|points?)/i,
      /(\d+)\s*\+\s*(?:reputation|points?)/i,
    ];
    for (const re of patterns) {
      const m = text.match(re);
      if (!m) continue;
      const v = parseInt(m[1], 10);
      if (Number.isFinite(v) && v > 0) return { points: v, raw: m[0].trim() };
    }
    return null;
  }

  function hasKyc(text) {
    return /\bkyc\b|know your customer|identity verification/i.test(text);
  }

  function extractScope(text) {
    // Drop "out of scope" clauses first: "IOTA EVM out of scope" must
    // not count as EVM scope.
    const cleaned = String(text).replace(/[^.]*\bout of scope\b[^.]*/gi, ' ');
    const scopes = [];
    const table = [
      [/solidity|evm|ethereum|smart contract/i, 'EVM / Solidity'],
      [/\bmove\b|sui|aptos/i, 'Move (Sui / Aptos)'],
      [/\brust\b/i, 'Rust'],
      [/\bweb\b|webapp|api|frontend|backend/i, 'Web / API'],
      [/mobile|android|ios/i, 'Mobile'],
      [/hardware|firmware|device/i, 'Hardware'],
    ];
    for (const [re, label] of table) {
      if (re.test(cleaned) && scopes.indexOf(label) === -1) scopes.push(label);
    }
    return scopes;
  }

  function extractDeadline(text) {
    const m = text.match(
      /(?:deadline|ends?|closes?|until|through)[^.\n]{0,40}?((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{4}-\d{2}-\d{2})/i
    );
    return m ? m[1] : null;
  }

  function isFreeSubmit(text, fee) {
    if (fee) return false;
    return /\bfree\b|no fee|no cost|no payment|gratis|submit (?:via|by|through) (?:email|form|discord)/i.test(text);
  }

  // ------------------------------------------------------------- signals
  function extractSignals(text) {
    const t = String(text || '');
    const fee = extractFee(t);
    return {
      rewardMaxUsd: extractReward(t),
      fee: fee,
      reputationGate: extractReputationGate(t),
      kyc: hasKyc(t),
      scope: extractScope(t),
      deadline: extractDeadline(t),
      freeSubmit: isFreeSubmit(t, fee),
    };
  }

  // -------------------------------------------------------------- scoring
  // Transparent additive model. Every adjustment appends a reason so the
  // verdict is explainable — the hunter sees WHY, not just a number.
  function scoreProgram(signals) {
    let score = 50;
    const reasons = [];

    if (signals.fee) {
      const penalty = signals.fee.amountUsd >= 50 ? -35 : -25;
      score += penalty;
      reasons.push(
        'Submit fee ' + penalty + ' pts: costs $' + signals.fee.amountUsd +
        ' before any finding is accepted (' + signals.fee.raw + ').'
      );
    } else if (signals.freeSubmit) {
      score += 20;
      reasons.push('+20 pts: free submission, nothing to pay up front.');
    }

    if (signals.reputationGate) {
      const penalty = signals.reputationGate.points >= 100 ? -25 : -20;
      score += penalty;
      reasons.push(
        'Reputation gate ' + penalty + ' pts: needs ' + signals.reputationGate.points +
        '+ reputation points to submit.'
      );
    }

    if (signals.kyc) {
      score -= 5;
      reasons.push('-5 pts: KYC / identity verification required at payout.');
    }

    const r = signals.rewardMaxUsd;
    if (r === null || r === 0) {
      score -= 5;
      reasons.push('-5 pts: no reward amount found in the program text.');
    } else if (r >= 10000) {
      score += 15;
      reasons.push('+15 pts: max reward $' + r.toLocaleString('en-US') + ' — high ceiling.');
    } else if (r >= 1000) {
      score += 10;
      reasons.push('+10 pts: max reward $' + r.toLocaleString('en-US') + '.');
    } else if (r >= 100) {
      score += 5;
      reasons.push('+5 pts: max reward $' + r.toLocaleString('en-US') + '.');
    }

    if (signals.scope.indexOf('EVM / Solidity') !== -1) {
      score += 10;
      reasons.push('+10 pts: EVM / Solidity scope matches the hunter\'s stack.');
    } else if (
      signals.scope.indexOf('Move (Sui / Aptos)') !== -1 &&
      signals.scope.indexOf('EVM / Solidity') === -1
    ) {
      score -= 5;
      reasons.push('-5 pts: Move-only scope, outside the hunter\'s main stack.');
    }

    if (/\blive\b|\bnew\b|\bjust (?:launched|opened)\b/i.test(
      (signals._text || '')
    )) {
      score += 5;
      reasons.push('+5 pts: program looks live / recently opened (early).');
    }

    // Hard gates: a big entry fee blocks a free-first hunter no matter
    // how large the reward is, and a program we could not read at all
    // must never look attractive.
    if (signals.fee && signals.fee.amountUsd >= 50) {
      score = Math.min(score, 39);
      reasons.push('Hard cap: entry fee $' + signals.fee.amountUsd + ' exceeds a free-first budget — capped at SKIP.');
    }
    if (signals.reputationGate && signals.reputationGate.points >= 100) {
      score = Math.min(score, 39);
      reasons.push('Hard cap: needs ' + signals.reputationGate.points + '+ reputation to submit, a zero-reputation hunter cannot enter — capped at SKIP.');
    }
    if (
      signals.rewardMaxUsd === null &&
      signals.scope.length === 0 &&
      !signals.freeSubmit
    ) {
      score = Math.min(score, 39);
      reasons.push('Hard cap: too little information extracted — paste more of the program page.');
    }

    score = Math.max(0, Math.min(100, score));
    return { score: score, reasons: reasons };
  }

  function verdictFor(score) {
    if (score >= 70) return { verdict: 'GO', color: 'go', summary: 'Worth auditing now.' };
    if (score >= 40) return { verdict: 'CAUTION', color: 'caution', summary: 'Auditable, but mind the gates.' };
    return { verdict: 'SKIP', color: 'skip', summary: 'Not worth it for now.' };
  }

  // -------------------------------------------------------------- analyze
  function analyzeProgram(input) {
    const name = (input && input.name) || 'Untitled program';
    const text = (input && input.text) || '';
    const signals = extractSignals(text);
    signals._text = text;
    const scored = scoreProgram(signals);
    delete signals._text;
    const v = verdictFor(scored.score);
    return {
      name: name,
      url: (input && input.url) || null,
      signals: signals,
      score: scored.score,
      reasons: scored.reasons,
      verdict: v.verdict,
      verdictColor: v.color,
      summary: v.summary,
      analyzedAt: new Date().toISOString(),
    };
  }

  function briefMarkdown(report) {
    const s = report.signals;
    const lines = [];
    lines.push('# BountyScout brief — ' + report.name);
    lines.push('');
    lines.push('**Verdict: ' + report.verdict + ' (' + report.score + '/100)** — ' + report.summary);
    lines.push('');
    lines.push('## Facts extracted');
    lines.push('');
    lines.push('- Max reward: ' + (s.rewardMaxUsd !== null ? '$' + s.rewardMaxUsd.toLocaleString('en-US') : 'not found'));
    lines.push('- Submit fee: ' + (s.fee ? '$' + s.fee.amountUsd + ' (' + s.fee.raw + ')' : 'none detected'));
    lines.push('- Reputation gate: ' + (s.reputationGate ? s.reputationGate.points + '+ points' : 'none detected'));
    lines.push('- KYC: ' + (s.kyc ? 'yes' : 'not mentioned'));
    lines.push('- Scope: ' + (s.scope.length ? s.scope.join(', ') : 'not detected'));
    lines.push('- Deadline: ' + (s.deadline || 'not found'));
    lines.push('- Free submit: ' + (s.freeSubmit ? 'yes' : 'no'));
    if (report.url) lines.push('- Program URL: ' + report.url);
    lines.push('');
    lines.push('## Why');
    lines.push('');
    report.reasons.forEach(function (r) { lines.push('- ' + r); });
    lines.push('');
    lines.push('## Hunter checklist');
    lines.push('');
    lines.push('- [ ] Verify the fee / reputation gate live on the program page before auditing.');
    lines.push('- [ ] Confirm the scope addresses and the reward table.');
    lines.push('- [ ] Check whether the program is still early (few reports in).');
    lines.push('- [ ] Every finding needs a working proof of concept with real impact.');
    lines.push('');
    lines.push('_Generated by BountyScout (SLAY HACKS 2026). Facts are extracted from program text; verify live before spending time._');
    return lines.join('\n');
  }

  return {
    extractSignals: extractSignals,
    scoreProgram: scoreProgram,
    verdictFor: verdictFor,
    analyzeProgram: analyzeProgram,
    briefMarkdown: briefMarkdown,
  };
});

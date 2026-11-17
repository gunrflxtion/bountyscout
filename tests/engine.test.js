/**
 * BountyScout engine tests — run with: node tests/engine.test.js
 * No dependencies, Node's built-in assert only.
 */
'use strict';
const assert = require('assert');
const { analyzeProgram, extractSignals, briefMarkdown } = require('../engine.js');

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log('PASS  ' + name);
}

// --- Sample program texts (paraphrased from real public program pages) ---

const MOR_TEXT = [
  'Morpheus bug bounty program v2, effective 7 Aug 2026, pool up to $100,000.',
  'Critical up to $100,000, High $10,000-50,000, Medium $2,500-10,000.',
  'Submit free via email to the security team. No fee, no reputation needed.',
  'Scope: EVM smart contracts on Ethereum and Base. PoC on a fork required.',
  'Live program, just updated.',
].join(' ');

const ROYCO_TEXT = [
  'Royco on Immunefi. Max reward $250,000 USDC on Ethereum.',
  'Submit costs 100 credits = 100 USDC. Account must be verified.',
  'KYC required at payout. Scope: EVM smart contracts.',
  'Live since 2026.',
].join(' ');

const DEXE_TEXT = [
  'DeXe on HackenProof. Max reward $50,000.',
  'Submit requires reputation above 120 points and a $5 fee. KYC required.',
  'Scope: EVM smart contracts.',
].join(' ');

const NADO_TEXT = [
  'Nado on HackenProof. Max reward $500,000.',
  'Free to submit, but requires reputation over 100 points.',
  'Scope: EVM smart contracts. Live program.',
].join(' ');

const MOVE_ONLY_TEXT = [
  'IOTA bug bounty. Max rewards 5,000 USDC.',
  'Free submission. Scope: Move and Rust, IOTA L1. IOTA EVM out of scope.',
  'Coded PoC against a local network required. Live since 16 Nov 2026.',
].join(' ');

// --- Extraction ---

check('extracts max reward from pool text', () => {
  assert.strictEqual(extractSignals(MOR_TEXT).rewardMaxUsd, 100000);
});

check('extracts credit fee as USD', () => {
  const fee = extractSignals(ROYCO_TEXT).fee;
  assert.ok(fee, 'fee detected');
  assert.strictEqual(fee.amountUsd, 100);
});

check('extracts reputation gate', () => {
  const gate = extractSignals(DEXE_TEXT).reputationGate;
  assert.ok(gate, 'gate detected');
  assert.strictEqual(gate.points, 120);
});

check('detects KYC', () => {
  assert.strictEqual(extractSignals(ROYCO_TEXT).kyc, true);
  assert.strictEqual(extractSignals(MOR_TEXT).kyc, false);
});

check('detects EVM scope and Move scope', () => {
  assert.ok(extractSignals(MOR_TEXT).scope.includes('EVM / Solidity'));
  assert.ok(extractSignals(MOVE_ONLY_TEXT).scope.includes('Move (Sui / Aptos)'));
});

check('detects free submission', () => {
  assert.strictEqual(extractSignals(MOR_TEXT).freeSubmit, true);
  assert.strictEqual(extractSignals(ROYCO_TEXT).freeSubmit, false);
});

// --- Verdicts ---

check('free high-reward EVM program is GO', () => {
  const r = analyzeProgram({ name: 'MOR', text: MOR_TEXT });
  assert.strictEqual(r.verdict, 'GO');
  assert.ok(r.score >= 70, 'score ' + r.score + ' >= 70');
  assert.ok(r.reasons.length >= 3, 'reasons explain the score');
});

check('pay-to-submit program is SKIP', () => {
  const r = analyzeProgram({ name: 'Royco', text: ROYCO_TEXT });
  assert.strictEqual(r.verdict, 'SKIP');
  assert.ok(r.score < 40, 'score ' + r.score + ' < 40');
});

check('reputation gate + fee + KYC is SKIP', () => {
  const r = analyzeProgram({ name: 'DeXe', text: DEXE_TEXT });
  assert.strictEqual(r.verdict, 'SKIP');
});

check('reputation gate alone is SKIP, never GO', () => {
  const r = analyzeProgram({ name: 'Nado', text: NADO_TEXT });
  assert.strictEqual(r.verdict, 'SKIP');
});

check('Move-only program scores lower than EVM twin', () => {
  const move = analyzeProgram({ name: 'IOTA', text: MOVE_ONLY_TEXT });
  const evmTwin = analyzeProgram({
    name: 'EVM twin',
    text: MOVE_ONLY_TEXT.replace('Move and Rust, IOTA L1. IOTA EVM out of scope.', 'EVM smart contracts.'),
  });
  assert.ok(evmTwin.score > move.score, evmTwin.score + ' > ' + move.score);
});

check('empty text does not crash and is SKIP', () => {
  const r = analyzeProgram({ name: 'Empty', text: '' });
  assert.strictEqual(r.verdict, 'SKIP');
  assert.strictEqual(r.score, 39); // 50 base - 5 no reward, hard-capped (no signal)
});

// --- Brief export ---

check('brief markdown contains verdict, facts and checklist', () => {
  const r = analyzeProgram({ name: 'MOR', text: MOR_TEXT, url: 'https://mor.org/bug-bounty' });
  const md = briefMarkdown(r);
  assert.ok(md.includes('Verdict: GO'), 'verdict line');
  assert.ok(md.includes('$100,000'), 'reward line');
  assert.ok(md.includes('Hunter checklist'), 'checklist');
  assert.ok(md.includes('https://mor.org/bug-bounty'), 'url');
});

console.log('\n' + passed + ' tests passed.');

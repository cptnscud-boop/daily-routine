// Run: node tests/xp.test.js — XP, levels, streak freezes, badges
const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const src=html.slice(html.indexOf('/*XP-START*/'),html.indexOf('/*XP-END*/'));
const M=new Function(src+';return{levelFromXp,awardXp,streakWithFreeze,applyStreakFreeze,runEnding,evaluateBadges,XP_TABLE,BADGE_DEFS}')();
let fail=0;const t=(n,f)=>{try{f();console.log('PASS',n)}catch(e){fail++;console.log('FAIL',n,e.message)}};

t('levelFromXp floors every 100 XP',()=>{
  assert.deepStrictEqual(M.levelFromXp(0),{level:1,into:0,need:100,total:0,pct:0});
  assert.deepStrictEqual(M.levelFromXp(99),{level:1,into:99,need:100,total:99,pct:99});
  assert.deepStrictEqual(M.levelFromXp(100),{level:2,into:0,need:100,total:100,pct:0});
  assert.deepStrictEqual(M.levelFromXp(250),{level:3,into:50,need:100,total:250,pct:50});
});

t('awardXp grants once per key per day',()=>{
  const st={xp:0,xpAwarded:{}};
  assert.strictEqual(M.awardXp(st,'2026-10-26','check',10),10);
  assert.strictEqual(st.xp,10);
  assert.strictEqual(M.awardXp(st,'2026-10-26','check',10),0);
  assert.strictEqual(st.xp,10);
  assert.strictEqual(M.awardXp(st,'2026-10-26','meal',15),15);
  assert.strictEqual(st.xp,25);
  assert.strictEqual(M.awardXp(st,'2026-10-27','check',10),10);
  assert.strictEqual(st.xp,35);
});

t('streakWithFreeze continues through a frozen miss',()=>{
  const perfect=new Set(['2026-10-26','2026-10-25','2026-10-23','2026-10-22']);
  const isP=d=>perfect.has(d);
  // 24th missed, frozen
  const st=M.streakWithFreeze(isP,{'2026-10-24':1},0,'2026-10-26');
  assert.strictEqual(st.cur,5); // 26,25,24(freeze),23,22
  assert.strictEqual(st.bridged,1);
});

t('streakWithFreeze stops on unfrozen miss',()=>{
  const perfect=new Set(['2026-10-26','2026-10-25']);
  const st=M.streakWithFreeze(d=>perfect.has(d),{},1,'2026-10-26');
  assert.strictEqual(st.cur,2);
});

t('streakWithFreeze starts from yesterday if today incomplete',()=>{
  const perfect=new Set(['2026-10-25','2026-10-24']);
  const st=M.streakWithFreeze(d=>perfect.has(d),{},0,'2026-10-26');
  assert.strictEqual(st.cur,2);
});

t('applyStreakFreeze consumes one freeze',()=>{
  const st={freezes:2,freezeUsed:{}};
  assert.strictEqual(M.applyStreakFreeze(st,'2026-10-20'),true);
  assert.strictEqual(st.freezes,1);
  assert.strictEqual(st.freezeUsed['2026-10-20'],1);
  assert.strictEqual(M.applyStreakFreeze(st,'2026-10-20'),false); // already used
  st.freezes=0;
  assert.strictEqual(M.applyStreakFreeze(st,'2026-10-19'),false);
});

t('runEnding counts consecutive predicate days',()=>{
  const hits=new Set(['2026-10-26','2026-10-25','2026-10-24']);
  assert.strictEqual(M.runEnding(d=>hits.has(d),'2026-10-26'),3);
  assert.strictEqual(M.runEnding(d=>hits.has(d),'2026-10-27'),3); // today miss → start yesterday
});

t('evaluateBadges awards once',()=>{
  const st={badges:{}};
  const earned=M.evaluateBadges(st,{curStreak:7,bestStreak:7,proteinRun:5,waterRun:0,level:5,today:'2026-10-26'});
  const ids=earned.map(b=>b.id).sort();
  assert(ids.includes('streak7'));
  assert(ids.includes('protein5'));
  assert(ids.includes('firstPerfect'));
  assert(ids.includes('level5'));
  assert.strictEqual(M.evaluateBadges(st,{curStreak:7,bestStreak:7,proteinRun:5,waterRun:0,level:5,today:'2026-10-26'}).length,0);
});

t('XP_TABLE has expected actions',()=>{
  assert.strictEqual(M.XP_TABLE.perfect,100);
  assert.strictEqual(M.XP_TABLE.morningDone,50);
  assert.strictEqual(M.XP_TABLE.water250,5);
});

console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);

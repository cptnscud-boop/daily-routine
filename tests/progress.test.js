// Run: node tests/progress.test.js — tests weight-trend helpers extracted from index.html
const fs=require('fs'),assert=require('assert');const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const src=html.slice(html.indexOf('/*PROG-START*/'),html.indexOf('/*PROG-END*/'));
const M=new Function(src+';return{movingAvg,weightStats,goalProgress}')();
const near=(a,b,m)=>assert(Math.abs(a-b)<1e-6,`${m}: got ${a}, want ${b}`);let fail=0;
const t=(name,f)=>{try{f();console.log('PASS',name)}catch(e){fail++;console.log('FAIL',name,e.message)}};
const ws=[{date:'2026-09-10',kg:87},{date:'2026-09-01',kg:90},{date:'2026-09-03',kg:89},{date:'2026-09-05',kg:88},{date:'2026-10-12',kg:85}]; // unsorted on purpose
t('7-day moving average (trailing calendar window, sorts input)',()=>{const m=M.movingAvg(ws);assert.deepStrictEqual(m.map(x=>x.date),['2026-09-01','2026-09-03','2026-09-05','2026-09-10','2026-10-12']);
 near(m[0].kg,90,'09-01');near(m[1].kg,89.5,'09-03');near(m[2].kg,89,'09-05 (90,89,88)');near(m[3].kg,87.5,'09-10 (88,87)');near(m[4].kg,85,'10-12 alone')});
t('window edge: entry exactly 7 days back is excluded',()=>{const m=M.movingAvg([{date:'2026-01-01',kg:80},{date:'2026-01-08',kg:82}]);near(m[1].kg,82,'edge')});
t('month boundary + DST-safe day math',()=>{const m=M.movingAvg([{date:'2026-10-30',kg:80},{date:'2026-11-02',kg:82}]);near(m[1].kg,81,'across Nov DST')});
t('change since start and last 30 days',()=>{const s=M.weightStats(ws,'2026-10-12');near(s.start,90,'start');near(s.current,85,'cur');near(s.sinceStart,-5,'since start');
 assert.strictEqual(s.base30.date,'2026-09-10');near(s.last30,-2,'last30 vs latest on/before 09-12')});
t('last 30 when all entries are recent uses earliest in window',()=>{const s=M.weightStats([{date:'2026-10-01',kg:80},{date:'2026-10-10',kg:79}],'2026-10-12');near(s.last30,-1,'recent')});
t('single entry / empty',()=>{const s=M.weightStats([{date:'2026-10-01',kg:80}],'2026-10-12');near(s.sinceStart,0,'');near(s.last30,0,'');assert.strictEqual(M.weightStats([],'2026-10-12'),null)});
t('goal progress: loss, gain, overshoot, no goal',()=>{near(M.goalProgress(90,85,80),.5,'loss');near(M.goalProgress(60,63,66),.5,'gain');near(M.goalProgress(90,78,80),1,'overshoot capped');
 near(M.goalProgress(90,92,80),0,'wrong direction floors at 0');assert.strictEqual(M.goalProgress(90,85,null),null);near(M.goalProgress(80,80,80),1,'already at goal')});
console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);

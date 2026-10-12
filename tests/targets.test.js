// Run: node tests/targets.test.js  — extracts the pure calc block from index.html and checks it.
const fs=require('fs'),assert=require('assert');
const html=fs.readFileSync(__dirname+'/../index.html','utf8');
const src=html.slice(html.indexOf('/*CALC-START*/'),html.indexOf('/*CALC-END*/'));
const M=new Function(src+';return{calcTargets,ftInToCm,lbToKg,cmToFtIn,validProfile}')();
const near=(a,b,t,msg)=>assert(Math.abs(a-b)<=t,`${msg}: got ${a}, want ${b}±${t}`);
near(M.ftInToCm(5,10),177.8,0.01,'5ft10 -> cm');near(M.lbToKg(180),81.65,0.01,'180lb -> kg');
assert.deepStrictEqual(M.cmToFtIn(177.8),[5,10]);assert.deepStrictEqual(M.cmToFtIn(182.85),[6,0]);
const cases=[
 ['30 M 5\'10" 180 lb moderate maintain',{age:30,sex:'m',hcm:M.ftInToCm(5,10),wkg:M.lbToKg(180),act:2,goal:'maintain'},[2650,2780]],
 ['30 M 177.8 cm 81.65 kg (same, metric)',{age:30,sex:'m',hcm:177.8,wkg:81.65,act:2,goal:'maintain'},[2650,2780]],
 ['35 F 5\'4" 140 lb light lose',{age:35,sex:'f',hcm:M.ftInToCm(5,4),wkg:M.lbToKg(140),act:1,goal:'lose'},[1300,1500]],
 ['45 M 6\'0" 260 lb sedentary lose',{age:45,sex:'m',hcm:M.ftInToCm(6,0),wkg:M.lbToKg(260),act:0,goal:'lose'},[1800,2100]],
 ['25 F 165 cm 58 kg active gain',{age:25,sex:'f',hcm:165,wkg:58,act:3,goal:'gain'},[2570,2610]],
 ['60 M 170 cm 70 kg very active maintain',{age:60,sex:'m',hcm:170,wkg:70,act:4,goal:'maintain'},[2770,2810]],
 ['string inputs (from form) 30 M',{age:'30',sex:'m',hcm:'177.8',wkg:'81.65',act:'2',goal:'maintain'},[2650,2780]],
];
let fail=0;
for(const[name,pr,[lo,hi]] of cases){const r=M.calcTargets(pr);
 const mk=4*r.p+4*r.c+9*r.f;
 try{assert(r.kcal>=lo&&r.kcal<=hi,`kcal ${r.kcal} not in ${lo}-${hi}`);
  assert(r.p<=pr.wkg*2.20462+0.5,'protein over 1 g/lb');assert(r.p>=1.5*Math.min(pr.wkg,25*(pr.hcm/100)**2),'protein too low');
  near(r.f*9/r.kcal,0.265,0.04,'fat %');near(mk,r.kcal,15,'macro kcal sum');assert(r.water>=2.5&&r.water<=4.5,'water clamp');
  console.log('PASS',name.padEnd(42),`BMR ${r.bmr} TDEE ${r.tdee} → ${r.kcal} kcal · P ${r.p} C ${r.c} F ${r.f} · water ${r.water} L`)}
 catch(e){fail++;console.log('FAIL',name,e.message,JSON.stringify(r).slice(0,120))}}
assert.strictEqual(M.calcTargets(null).kcal,2200);
assert.deepStrictEqual(M.validProfile({age:30,hcm:70,wkg:180}),['height 120–230 cm (3′11″–7′7″)']); // inches typed into cm field
console.log(fail?fail+' FAILED':'ALL PASS');process.exit(fail?1:0);

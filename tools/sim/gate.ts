#!/usr/bin/env node
// v171 Mô phỏng thô: học bài chính thống (1 unit / ngày, 10 từ) tới khi mở Thi chuyển cấp (📘 Học ≥ 80%, 🔁 Nhớ ≥ 50%).
// Dùng FSRS thật của app (src/exam/fsrs.ts) và luật Nhớ của partsOf (≥ 70% từ của unit nhớ ra sau ≥ 3 ngày, nhớ trung bình ≥ 0,9).
// Thô: ngữ pháp / âm / chức năng đi theo tỉ lệ unit. Learner giả lập, không thay người thật. Dùng: npm run gatesim
import { newCard, review, retrievability, interval } from '../../src/exam/fsrs.ts';
// Cấp: NU unit, NG bài ngữ pháp, NP âm+chức năng, tổng nút TOT. Chính sách: ôn tối đa CAP từ/ngày; nợ ≥ BRAKE thì không học mới.
function run(o:{NU:number,NG:number,NP:number,TOT:number,U:number,CAP:number,BRAKE:number,acc:number,skip:number}){
  let rnd=11; const r=()=>((rnd=(rnd*1103515245+12345)%2147483648)/2147483648);
  type Wd={u:number,s:number,d:number,last:number,due:number,first:number,good:number};
  const words:Wd[]=[]; let lu=0, acc=0, res:any={};
  for(let t=0;t<500;t++){
    const off = o.skip>0 && t%7===6 && r()<o.skip*7/7;   // nghỉ một số ngày Chủ nhật
    if(!off){
      const due=words.filter(w=>w.due<=t).sort((a,b)=>a.due-b.due).slice(0,o.CAP);
      for(const w of due){ const R=retrievability(t-w.last,w.s), ok=r()<R*o.acc; const c=review({s:w.s,d:w.d,last:w.last,due:w.due,reps:1,lapses:0},ok?3:1,t);
        w.s=c.s; w.d=c.d; w.last=t; w.due=ok?t+interval(c.s):t+1; if(ok) w.good=t; }
      const left=words.filter(w=>w.due<=t).length;
      if(left<o.BRAKE){ acc+=o.U; while(acc>=1&&lu<o.NU){ acc--; for(let i=0;i<10;i++){ const c=newCard(3,t); words.push({u:lu,s:c.s,d:c.d,last:t,due:c.due,first:t,good:t}); } lu++; } }
    }
    let mem=0; for(let u=0;u<lu;u++){ const ws=words.slice(u*10,u*10+10); const held=ws.filter(w=>w.good-w.first>=3).length>=7; const rec=ws.reduce((a,w)=>a+retrievability(t-w.last,w.s),0)/10; if(held&&rec>=0.9) mem++; }
    const gL=Math.min(o.NG,Math.round(lu*o.NG/o.NU)), pL=Math.min(o.NP,Math.round(lu*o.NP/o.NU));
    const H=(lu+gL+pL)/o.TOT, N=(mem+Math.round(gL*(lu?mem/lu:0)))/o.TOT;
    if(!res.hit&&H>=0.8&&N>=0.5) res.hit=t+1;
    if(t+1===60||t+1===90) res['d'+(t+1)]=`H${Math.round(H*100)} N${Math.round(N*100)}`;
  }
  return res;
}
const A1={NU:87,NG:28,NP:15,TOT:130}, A2={NU:174,NG:58,NP:33,TOT:265};
for (const [name,L] of [['A1',A1],['A2 (gồm A1)',A2]] as const)
 for (const [pol,CAP,BRAKE] of [['cũ (12+lồng≈20, không phanh)',20,1e9],['mới (≤60, phanh 40)',60,40]] as const)
  for (const [who,acc,skip] of [['lý tưởng',1,0],['thực tế (đúng 90% so với dự đoán, nghỉ ~1 ngày/tuần)',0.9,1]] as const)
   console.log(name,'|',pol,'|',who,'|',JSON.stringify(run({...L,U:1,CAP,BRAKE,acc,skip})));

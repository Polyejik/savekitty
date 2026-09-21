const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const html=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8');
const start=html.indexOf('function rnd(');
const end=html.indexOf('function buildRounds(');
assert(start>=0 && end>start,'generator source block not found');

const generatorSource=html.slice(start,end);
const ctx={Math,console};
vm.createContext(ctx);
vm.runInContext('let levels=[];\n'+generatorSource+'\nthis.api={hasTripleRepeat,validPair,newLevels,getLevels:()=>levels};',ctx);
const {hasTripleRepeat,newLevels,getLevels}=ctx.api;

assert.equal(hasTripleRepeat(333),true);
assert.equal(hasTripleRepeat(444),true);
assert.equal(hasTripleRepeat(777),true);
assert.equal(hasTripleRepeat(1444),true);
assert.equal(hasTripleRepeat(7772),true);
assert.equal(hasTripleRepeat(343),false);
assert.equal(hasTripleRepeat(443),false);

for(let run=0;run<2000;run++){
  newLevels();
  const flat=getLevels().flat();
  assert.equal(flat.length,9,'nine problems per game');

  const remainderProblems=flat
    .map(([a,b],i)=>({a,b,i}))
    .filter(x=>x.a%x.b!==0);
  assert.equal(remainderProblems.length,1,'exactly one remainder problem');
  assert(remainderProblems[0].i>=3,'remainder problem must not be in first three');

  for(const [dividend,divisor] of flat){
    const quotient=Math.floor(dividend/divisor);
    assert.equal(hasTripleRepeat(dividend),false,'bad repeated digits in dividend: '+dividend);
    assert.equal(hasTripleRepeat(quotient),false,'bad repeated digits in quotient: '+quotient);
    assert(!String(quotient).includes('0'),'quotient contains zero: '+quotient);

    let cur=0,started=false;
    for(const ch of String(dividend)){
      cur=cur*10+Number(ch);
      if(!started && cur<divisor) continue;
      started=true;
      assert.equal(hasTripleRepeat(cur),false,'bad repeated digits in intermediate number: '+cur+' for '+dividend+'/'+divisor);
      cur%=divisor;
    }
  }
}

assert(!html.includes('разрез'),'old cutlet-cutting wording must not exist');
assert(html.includes('Полные коробочки собраны'),'remainder box wording missing');
assert(html.includes('Остаток = ${r}'),'explicit remainder result missing');

console.log('PASS: 2000 generated games; no 333/444/777-style triples, one late remainder, explicit remainder wording.');

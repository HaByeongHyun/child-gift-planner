/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const Module=require('node:module');const ts=require(process.cwd()+'/node_modules/typescript');const m=new Module('calc');m._compile(ts.transpileModule(fs.readFileSync('src/lib/calculator.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,'calc.cjs');const c=m.exports;
test('비용은 증여 시작일과 독립',()=>assert.deepEqual(c.calculateLumpSumExpenses('2026-06-23','2026-10-25',2.5),c.calculateLumpSumExpenses('2026-06-23','2031-10-25',2.5)));
test('등록금 2026기준 연도별 물가',()=>{let x=c.calculateLumpSumExpenses('2026-06-23','2026-10-25',0)[0];assert.equal(x.futureValueLines[0],'2,908만원');});
test('월계획액은 공제와 무관한 가족 입력',()=>{let ps=c.calculateGiftPeriods('2026-06-23','2026-10-25',123000);assert.ok(ps.every(p=>p.monthlyPlanned===123000));assert.equal(ps[0].monthlyMaxExact,undefined);});
test('120회 시작·마지막 달과 입금 합계',()=>{let p=c.calculateGiftPeriods('2026-06-23','2026-10-25',200000)[0],rows=c.generateInstallmentSchedule(p);assert.equal(rows.reduce((a,r)=>a+r.count,0),120);assert.equal(rows.reduce((a,r)=>a+r.annualAmount,0),24000000);assert.equal(p.endDate,'2036.09.25');});
test('국세청 예시 주말 연장',()=>assert.equal(c.getReportDeadline(2021,4),'2021.08.02 (잠정)'));
test('2027-01-31 일요일 보정',()=>assert.equal(c.getReportDeadline(2026,10),'2027.02.01 (잠정)'));
test('성년 전후 기준 나이',()=>{assert.equal(c.getManAge('2007-06-23','2026-06-22'),18);assert.equal(c.getManAge('2007-06-23','2026-06-23'),19);});
test('윤일 계약 마지막 날',()=>assert.equal(c.getContractEndDate(2024,3,31).formatted,'2034.02.28'));
test('아동수당 기록 칸 출생 코호트 구분',()=>{assert.equal(c.generateChildAllowanceSchedule('2026-06-23').totalCount,156);assert.equal(c.generateChildAllowanceSchedule('2016-06-23').totalCount,96);});

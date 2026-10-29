/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require(process.cwd() + '/node_modules/typescript');

const m = new Module('calc');
m._compile(
  ts.transpileModule(fs.readFileSync('src/lib/calculator.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  'calc.cjs'
);
const c = m.exports;

// 1. 기존 핵심 테스트 (9개 보존)
test('비용은 증여 시작일과 독립', () =>
  assert.deepEqual(
    c.calculateLumpSumExpenses('2026-06-23', '2026-10-25', 2.5),
    c.calculateLumpSumExpenses('2026-06-23', '2031-10-25', 2.5)
  ));

test('등록금 2026기준 연도별 물가', () => {
  const x = c.calculateLumpSumExpenses('2026-06-23', '2026-10-25', 0)[0];
  assert.equal(x.futureValueLines[0], '2,908만원');
});

test('월계획액은 공제와 무관한 가족 입력', () => {
  const ps = c.calculateGiftPeriods('2026-06-23', '2026-10-25', 123000);
  assert.ok(ps.every((p) => p.monthlyPlanned === 123000));
  assert.equal(ps[0].monthlyMaxExact, undefined);
});

test('120회 시작·마지막 달과 입금 합계', () => {
  const p = c.calculateGiftPeriods('2026-06-23', '2026-10-25', 200000)[0];
  const rows = c.generateInstallmentSchedule(p);
  assert.equal(
    rows.reduce((a, r) => a + r.count, 0),
    120
  );
  assert.equal(
    rows.reduce((a, r) => a + r.annualAmount, 0),
    24000000
  );
  assert.equal(p.endDate, '2036.09.25');
});

test('국세청 예시 주말 연장', () =>
  assert.equal(c.getReportDeadline(2021, 4), '2021.08.02 (잠정)'));

test('2027-01-31 일요일 보정', () =>
  assert.equal(c.getReportDeadline(2026, 10), '2027.02.01 (잠정)'));

test('성년 전후 기준 나이', () => {
  assert.equal(c.getManAge('2007-06-23', '2026-06-22'), 18);
  assert.equal(c.getManAge('2007-06-23', '2026-06-23'), 19);
});

test('윤일 계약 마지막 날', () =>
  assert.equal(c.getContractEndDate(2024, 3, 31).formatted, '2034.02.28'));

test('아동수당 기록 칸 출생 코호트 구분', () => {
  assert.equal(c.generateChildAllowanceSchedule('2026-06-23').totalCount, 156);
  assert.equal(c.generateChildAllowanceSchedule('2016-06-23').totalCount, 96);
});

// 2. 추가 회귀 테스트 (검토 필수 확인 사례)
test('그해 줄 돈 기간·횟수·월액 라벨(첫해·중간해·마지막 해)', () => {
  const p = c.calculateGiftPeriods('2026-06-23', '2026-11-25', 200000)[0];
  const rows = c.generateInstallmentSchedule(p);
  assert.equal(rows[0].year, 2026);
  assert.equal(rows[0].plannedSummaryLabel, '11~12월 · 2회 × 20만원');
  assert.equal(rows[1].year, 2027);
  assert.equal(rows[1].plannedSummaryLabel, '1~12월 · 12회 × 20만원');
  assert.equal(rows[rows.length - 1].year, 2036);
  assert.equal(rows[rows.length - 1].plannedSummaryLabel, '1~10월 · 10회 × 20만원');
});

test('신고기한: 2026년 확정 공휴일(삼일절·대체공휴일) 및 근로자의 날·신정 연장', () => {
  // 2025년 11월 증여 -> 3개월 후 말일 2026.02.28(토) -> 3.1(일,삼일절) -> 3.2(월,대체공휴일) -> 2026.03.03 (확정)
  assert.equal(c.getReportDeadline(2025, 11), '2026.03.03');
  // 2026년 6월 증여 -> 3개월 후 말일 2026.09.30(수) -> 2026년 공휴일 검증 완료(확정)
  assert.equal(c.getReportDeadline(2026, 6), '2026.09.30');
  // 2028년 1월 증여 -> 2028.04.30(일) -> 2028.05.01(월, 근로자의 날) -> 2028.05.02 (잠정)
  assert.equal(c.getReportDeadline(2028, 1), '2028.05.02 (잠정)');
  // 2028년 9월 증여 -> 2028.12.31(일) -> 2029.01.01(월, 신정) -> 2029.01.02 (잠정)
  assert.equal(c.getReportDeadline(2028, 9), '2029.01.02 (잠정)');
});

test('체크한 뒤 월 계획액을 바꿔도 과거 실제 입금 합계는 보존됨', () => {
  const checkedMap = {
    'installment-2026-10': true,
    'installment-2026-11': true,
  };
  // 체크 당시 월 200,000원으로 기록된 스냅샷
  const checkedAmountMap = {
    'installment-2026-10': 200000,
    'installment-2026-11': 200000,
  };
  // 이후 사용자가 월 계획액을 350,000원으로 변경한 상황
  const pAfterChange = c.calculateGiftPeriods('2026-06-23', '2026-10-25', 350000)[0];
  const row2026 = c.generateInstallmentSchedule(pAfterChange)[0];

  // 예정액(그해 줄 돈)은 3회 × 35만원 = 1,050,000원으로 바뀌지만
  assert.equal(row2026.annualAmount, 1050000);

  // 이미 체크한 2개월분의 실제 입금 합계는 당시 기록된 400,000원으로 보존됨
  const actual = c.calculateActualInstallmentRowTotal(
    2026,
    row2026.activeMonths,
    checkedMap,
    checkedAmountMap,
    pAfterChange.monthlyPlanned
  );
  assert.equal(actual.checkedCount, 2);
  assert.equal(actual.actualAmountWon, 400000);
});

test('증여 구간과 목돈 매칭: 연도만 겹치고 실제 날짜가 어긋나는 경우 구분', () => {
  // 아이 생일: 2026-06-23, 첫 증여 시작: 2026-10-25
  // 2차 구간: 2036.10.25 ~ 2046.09.25
  // 3차 구간: 2046.10.25 ~ 2056.09.25
  const periods = c.calculateGiftPeriods('2026-06-23', '2026-10-25', 200000);
  // 자취 보증금 시점을 만 20세(2046.06.23)로 설정하면:
  // 연도는 2046년이라 3차 구간 시작연도(2046년)와 같지만, 실제 날짜(2046.06.23)는 3차 시작일(2046.10.25) 이전임!
  const items = c.calculateLumpSumExpenses('2026-06-23', '2026-10-25', 2.5, {
    'dorm-deposit': { targetAge: 20 },
  });

  const matchPeriod2 = c.matchLumpSumItemsToPeriod(periods[1], items);
  const matchPeriod3 = c.matchLumpSumItemsToPeriod(periods[2], items);

  // 2차 구간(2036.10.25~2046.09.25)에는 실제 날짜가 포함됨
  assert.ok(matchPeriod2.matchedItems.some((m) => m.id === 'dorm-deposit'));
  // 3차 구간(2046.10.25~2056.09.25)에는 실제 날짜가 포함되지 않고, 연도만 겹치는 제외 항목으로 분류됨
  assert.ok(!matchPeriod3.matchedItems.some((m) => m.id === 'dorm-deposit'));
  assert.ok(
    matchPeriod3.yearOnlyMismatchItems.some((m) => m.id === 'dorm-deposit')
  );
});

test('결혼 나이·가족 지원 계획액·포함 여부 수정 반영', () => {
  const items = c.calculateLumpSumExpenses('2026-06-23', '2026-10-25', 2.5, {
    'wedding-prep': { targetAge: 30, familySupportManwon: 3000 },
    'newlywed-house': { included: false },
  });
  const wedding = items.find((i) => i.id === 'wedding-prep');
  const house = items.find((i) => i.id === 'newlywed-house');

  assert.equal(wedding.targetAge, 30);
  assert.equal(wedding.timingYearLabel, '2056년');
  assert.equal(wedding.familySupportManwon, 3000);
  assert.equal(house.included, false);
  assert.equal(house.familySupportFutureLabel, '지원 제외(0원)');
});

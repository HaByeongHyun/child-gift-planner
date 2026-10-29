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
  assert.equal(c.getReportDeadline(2025, 11), '2026.03.03');
  assert.equal(c.getReportDeadline(2026, 6), '2026.09.30');
  assert.equal(c.getReportDeadline(2028, 1), '2028.05.02 (잠정)');
  assert.equal(c.getReportDeadline(2028, 9), '2029.01.02 (잠정)');
});

test('체크한 뒤 월 계획액을 바꿔도 과거 확정 입금액은 보존되고, 금액 미기록 과거 체크는 현재 설정으로 바뀌지 않음', () => {
  const checkedMap = {
    'installment-2026-10': true, // 금액 기록 있음 (200,000원)
    'installment-2026-11': true, // 구버전 등에서 금액 없이 체크만 된 기록
  };
  const checkedAmountMap = {
    'installment-2026-10': 200000,
  };
  // 이후 사용자가 월 계획액을 500,000원으로 변경한 상황
  const pAfterChange = c.calculateGiftPeriods('2026-06-23', '2026-10-25', 500000)[0];
  const row2026 = c.generateInstallmentSchedule(pAfterChange)[0];

  assert.equal(row2026.annualAmount, 1500000);

  const actual = c.calculateActualInstallmentRowTotal(
    2026,
    row2026.activeMonths,
    checkedMap,
    checkedAmountMap
  );
  assert.equal(actual.checkedCount, 2);
  assert.equal(actual.confirmedCount, 1);
  assert.equal(actual.unverifiedCount, 1);
  assert.deepEqual(actual.unverifiedMonths, [11]);
  // 미확인 11월분이 500,000원으로 둔갑해 합산되지 않고 확정된 10월분(200,000원)만 합산됨
  assert.equal(actual.actualAmountWon, 200000);
});

test('목돈 필요 시기: 아이 생일로 날짜를 임의 지정하지 않으며 지정일 입력 시에만 날짜 판정', () => {
  const periods = c.calculateGiftPeriods('2026-12-23', '2026-12-25', 200000);
  const defaultItems = c.calculateLumpSumExpenses('2026-12-23', '2026-12-25', 2.5);
  const dormDefault = defaultItems.find((i) => i.id === 'dorm-deposit');

  // 기본 상태에서 아이 생일(2045.12.23)이 임의로 생성되지 않아야 함
  assert.equal(dormDefault.customDate, undefined);
  assert.equal(dormDefault.customDateDot, undefined);
  assert.equal(dormDefault.startYear, 2045);

  // 경계 연도(2046년)에 걸친 항목은 지정일이 없으면 경계 확인 필요(isBoundaryYearEstimate)로 표시
  const boundaryItems = c.calculateLumpSumExpenses('2026-12-23', '2026-12-25', 2.5, {
    'dorm-deposit': { targetAge: 20 }, // 2046년
  });
  const matchP3Boundary = c.matchLumpSumItemsToPeriod(periods[2], boundaryItems);
  const dormBoundaryMatch = matchP3Boundary.matchedItems.find(
    (m) => m.id === 'dorm-deposit'
  );
  assert.ok(dormBoundaryMatch);
  assert.equal(dormBoundaryMatch.isBoundaryYearEstimate, true);

  // 사용자가 실제 예정일(2046-03-02)을 직접 지정하면 실제 날짜 기준으로 2차에만 포함되고 3차(2046.12.25 시작)에서는 제외됨
  const datedItems = c.calculateLumpSumExpenses('2026-12-23', '2026-12-25', 2.5, {
    'dorm-deposit': { targetAge: 20, customDate: '2046-03-02' },
  });
  const matchP2Dated = c.matchLumpSumItemsToPeriod(periods[1], datedItems);
  const matchP3Dated = c.matchLumpSumItemsToPeriod(periods[2], datedItems);
  assert.ok(matchP2Dated.matchedItems.some((m) => m.id === 'dorm-deposit'));
  assert.ok(!matchP3Dated.matchedItems.some((m) => m.id === 'dorm-deposit'));
  assert.ok(
    matchP3Dated.yearOnlyMismatchItems.some((m) => m.id === 'dorm-deposit')
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
  assert.equal(wedding.timingYearLabel, '2056년 무렵');
  assert.equal(wedding.familySupportManwon, 3000);
  assert.equal(house.included, false);
  assert.equal(house.familySupportFutureLabel, '지원 제외(0원)');
});

test('시트 4 시작 시점 지연 비교: 동일한 만 35세 생일 기준일까지 계산하여 지연 시 횟수·금액 차이 반영', () => {
  const rows = c.calculateDelaySimulations('2026-06-23', '2026-10-25', 200000);
  assert.equal(rows[0].cutoffDateAtAge35, '2061.06.23');
  assert.equal(rows[0].monthsUntilAge35, 416);
  assert.equal(rows[0].plannedManwonUntilAge35, 8320);

  assert.equal(rows[1].monthsUntilAge35, 404);
  assert.equal(rows[1].plannedManwonUntilAge35, 8080);
  assert.equal(rows[1].diffMonthsFromBase, -12);
  assert.equal(rows[1].diffManwonFromBase, -240);

  assert.equal(rows[2].monthsUntilAge35, 392);
  assert.equal(rows[2].plannedManwonUntilAge35, 7840);
  assert.equal(rows[2].diffMonthsFromBase, -24);
  assert.equal(rows[2].diffManwonFromBase, -480);
});

test('공유 링크 쿼리 파싱: monthly=0 및 rate=0이 기본값으로 덮어써지지 않고 0으로 반영됨', () => {
  const fallback = {
    childName: '기존아이',
    blessingMessage: '기본문구',
    birthDate: '2026-06-23',
    startDate: '2026-10-25',
    monthlyGiftWon: 200000,
    inflationRate: 2.5,
  };
  const parsed = c.parseSharedLinkParams(
    '?name=%EB%91%98%EC%A7%B8&birth=2027-01-15&start=2027-03-25&monthly=0&rate=0',
    fallback
  );
  assert.equal(parsed.hasSharedParams, true);
  assert.equal(parsed.sharedInput.childName, '둘째');
  assert.equal(parsed.sharedInput.monthlyGiftWon, 0);
  assert.equal(parsed.sharedInput.inflationRate, 0);
});

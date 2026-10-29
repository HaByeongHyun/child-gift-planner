// 자녀 증여 플래너 및 미래 목돈 시뮬레이터 핵심 계산 엔진

export interface PlannerInput {
  childName: string; // 아이 이름 또는 애칭 (예: "우리아이")
  blessingMessage: string; // 응원 문구 (예: "귀한아들, 귀하게 커라 사랑한다")
  birthDate: string; // 생년월일 YYYY-MM-DD (예: "2026-06-23")
  startDate: string; // 첫 증여 시작 예정일 YYYY-MM-DD (예: "2026-10-25")
  monthlyGiftWon: number; // 가족이 정한 계획액, 공제 최대액 아님
  inflationRate: number; // 연간 물가상승률 % (예: 2.5)
}

export interface GiftPeriod {
  periodNumber: number; // 1, 2, 3, 4
  label: string; // "1차", "2차", ...
  startDate: string; // "2026.10.25"
  endDate: string; // "2036.09.25" (120개월 마지막 이체일)
  startYear: number;
  endYear: number;
  ageAtStart: number; // 그때 만 나이
  isMinor: boolean; // 만 19세 미만 여부
  deductionLimitManwon: number; // 2000 또는 5000 (만원 단위)
  deductionLabel: string; // "미성년 2,000만" | "성년 5,000만"
  monthlyPlanned: number; // 가족이 정한 월 계획액
  lumpSumMaxLabel: string; // "2,000만원" | "5,000만원"
  reportDeadline: string; // 신고 마감일 "2027.02.01 (잠정)" 또는 "2026.09.30"
  isReportDeadlineConfirmed?: boolean; // 공휴일 검증 완료 연도(2026년) 여부
}

export interface CalendarTodoItem {
  id: string;
  date: string;
  description: string;
  periodNumber?: number;
}

export interface DelaySimulationRow {
  label: string; // "입력한 날 시작" | "1년 늦추면" | "2년 늦추면"
  startDate: string;
  ageAtStart: number;
  minorPeriodCount: number;
  adultPeriodCount: number;
  totalDeductionManwon: number; // 단순 합계 참고값 (오해 방지를 위해 UI에서는 전환 시점·계획 총액 중심으로 표시)
  totalPeriodCount: number; // 만 35세 이전 시작 구간 수
  totalPlannedMonths: number; // 총 준비 개월 수 (구간 수 × 120개월)
  totalPlannedManwon: number; // 월 계획액 기준 누적 입금 예정액 (만원)
  firstAdultPeriodSummary: string; // 첫 성년 기준(만 19세 이상) 구간 시작 시점 요약
}

export interface MonthlyCheckRow {
  year: number;
  activeMonths: boolean[]; // 길이 12 (1월~12월 활성 여부)
  count: number; // 해당 연도 활성 개월 수
  annualAmount?: number; // 유기정기금 그해 줄 돈(예정 입금액, 원)
  monthRangeLabel?: string; // 예: "10~12월", "1~12월", "1~9월"
  plannedSummaryLabel?: string; // 예: "10~12월 · 3회 × 20만원"
}

export interface ExpenseItemOverride {
  targetAge?: number; // 시작 만 나이 변경 (예: 결혼 나이 기본 32 -> 수정 가능)
  familySupportManwon?: number; // 가족이 지원할 계획 금액 (2026년 현재가 기준, 만원)
  included?: boolean; // 계획 포함 여부 (선택 가정)
}

export type ExpenseOverridesMap = Record<string, ExpenseItemOverride>;

export interface LumpSumExpenseItem {
  id: string;
  title: string;
  requiredOrOptional: '선택' | '선택';
  sourceType: '공식통계(교육부 2026)' | '예산예시(가정값)';
  timingAgeLabel: string; // "만 19~22세"
  timingYearLabel: string; // "2045~2048년"
  startDateStr: string; // 실제 비교용 시작일 "2045.06.23"
  endDateStr: string; // 실제 비교용 종료일 "2048.06.23"
  defaultTargetAge: number;
  targetAge: number;
  ageSpanYears: number; // 단년도면 0, 4개년이면 3 등
  reason: string;
  presentValueLines: string[]; // 전체 참고 비용 (현재가)
  futureValueLines: string[]; // 전체 참고 비용 (물가 반영가)
  defaultSupportManwon: number; // 기본 가족 지원 가정액 (현재가, 만원)
  familySupportManwon: number; // 설정된 가족 지원 계획액 (현재가, 만원)
  familySupportFutureManwon: number; // 물가 반영 가족 지원 계획액 (만원)
  familySupportFutureLabel: string; // 포맷된 물가 반영 가족 지원액
  included: boolean; // 계획 포함 여부
}

export interface PeriodLumpSumMatchResult {
  matchedItems: {
    id: string;
    title: string;
    isPartialOverlap: boolean;
    label: string;
  }[];
  yearOnlyMismatchItems: {
    id: string;
    title: string;
    itemDateRange: string;
    reason: string;
  }[];
  summaryText: string;
}

export interface AgeYearRow {
  age: number; // 만 0세 ~ 만 35세
  isCurrentAge: boolean;
  year: number;
  birthdayStr: string; // "2026.06.23"
  schoolLabel: string; // "영유아", "어린이집·유치원", "초등 1학년" 등
  giftStatusLabel: string; // "1차 구간 시작 (2026.10.25)", "1차 구간 중" 등
  isPeriodStart: boolean;
}

// 정기금 할인 최대액은 개별 계약 평가 검증 전 제공하지 않습니다.
export const COST_BASE_YEAR = 2026;

/**
 * 우주항공청 「2026년도 월력요항」 및 「국세기본법」 제5조에 따른 2026년 공휴일·대체공휴일·근로자의 날 목록
 */
export const VERIFIED_HOLIDAYS_2026 = new Set<string>([
  '2026.01.01', // 신정
  '2026.02.16', // 설날 연휴
  '2026.02.17', // 설날
  '2026.02.18', // 설날 연휴
  '2026.03.01', // 삼일절
  '2026.03.02', // 삼일절 대체공휴일
  '2026.05.01', // 근로자의 날 (국세기본법 제5조)
  '2026.05.05', // 어린이날
  '2026.05.24', // 부처님오신날
  '2026.05.25', // 부처님오신날 대체공휴일
  '2026.06.03', // 제9회 전국동시지방선거
  '2026.06.06', // 현충일
  '2026.08.15', // 광복절
  '2026.08.17', // 광복절 대체공휴일
  '2026.09.24', // 추석 연휴
  '2026.09.25', // 추석
  '2026.09.26', // 추석 연휴
  '2026.10.03', // 개천절
  '2026.10.05', // 개천절 대체공휴일
  '2026.10.09', // 한글날
  '2026.12.25', // 기독탄신일
]);

/**
 * YYYY-MM-DD 또는 YYYY.MM.DD 문자열을 연, 월, 일 숫자로 파싱합니다.
 */
export function parseYMD(dateStr: string): { year: number; month: number; day: number } {
  const [y, m, d] = dateStr.split(/[-.]/).map(Number);
  return {
    year: y || 2026,
    month: m || 1,
    day: d || 1,
  };
}

/**
 * 연, 월, 일을 YYYY.MM.DD 형식으로 포맷팅합니다.
 */
export function formatDotYMD(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}.${mm}.${dd}`;
}

/**
 * 특정 연·월의 마지막 날짜(말일)를 반환합니다.
 */
export function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * 기준일(targetDate) 시점에서의 만 나이를 계산합니다.
 */
export function getManAge(birthDateStr: string, targetDateStr: string): number {
  const birth = parseYMD(birthDateStr);
  const target = parseYMD(targetDateStr);
  let age = target.year - birth.year;
  if (
    target.month < birth.month ||
    (target.month === birth.month && target.day < birth.day)
  ) {
    age -= 1;
  }
  return Math.max(0, age);
}

/**
 * 시작일로부터 120개월(10년 정기금 계약) 마지막 이체일을 계산합니다.
 * 예: 2026.10.25 -> 2036.09.25
 */
export function getContractEndDate(
  startYear: number,
  startMonth: number,
  startDay: number
): {
  year: number;
  month: number;
  day: number;
  formatted: string;
} {
  // 시작월 포함 120회이므로 +119개월
  const totalMonths = startYear * 12 + (startMonth - 1) + 119;
  const endYear = Math.floor(totalMonths / 12);
  const endMonth = (totalMonths % 12) + 1;
  const maxDay = getLastDayOfMonth(endYear, endMonth);
  const endDay = Math.min(startDay, maxDay);
  return {
    year: endYear,
    month: endMonth,
    day: endDay,
    formatted: formatDotYMD(endYear, endMonth, endDay),
  };
}

/**
 * 국세기본법 제5조(기한의 특례)에 따라 해당 날짜가 토요일·일요일·근로자의 날(5/1)·
 * 월초 법정 양력 공휴일(1/1 신정, 3/1 삼일절 및 대체공휴일) 또는 2026년 공식 공휴일인지 판별합니다.
 */
export function isTaxHolidayOrWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) return true;

  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const formatted = formatDotYMD(y, m, d);

  if (y === 2026 && VERIFIED_HOLIDAYS_2026.has(formatted)) {
    return true;
  }

  // 모든 연도 공통 적용: 월말에서 이월될 때 도달 가능한 법정 양력 휴일·근로자의 날
  if (m === 1 && d === 1) return true; // 1월 1일 신정
  if (m === 5 && d === 1) return true; // 5월 1일 근로자의 날 (국세기본법 제5조)
  if (m === 3 && d === 1) return true; // 3월 1일 삼일절

  // 삼일절(3월 1일) 대체공휴일: 3/1이 일요일이면 3/2(월), 3/1이 토요일이면 3/3(월)
  if (m === 3 && (d === 2 || d === 3)) {
    const marchFirstDay = new Date(y, 2, 1).getDay();
    if (marchFirstDay === 0 && d === 2) return true;
    if (marchFirstDay === 6 && d === 3) return true;
  }

  return false;
}

/**
 * 증여일이 속한 달의 말일로부터 3개월 후 말일(증여세 신고 기한)을 계산합니다.
 * - 토요일·일요일·근로자의 날(5/1)·신정(1/1)·삼일절(3/1 및 대체공휴일)은 모든 연도에서 다음 평일로 연장합니다.
 * - 공식 월력요항이 검증된 2026년 내 기한은 확정 날짜로 반환하고, 그 외 미지원/미래 연도는 '(잠정)'을 표시합니다.
 */
export function getReportDeadline(startYear: number, startMonth: number): string {
  const totalMonths = startYear * 12 + (startMonth - 1) + 3;
  const deadlineYear = Math.floor(totalMonths / 12);
  const deadlineMonth = (totalMonths % 12) + 1;
  const deadlineDay = getLastDayOfMonth(deadlineYear, deadlineMonth);
  const date = new Date(deadlineYear, deadlineMonth - 1, deadlineDay);

  while (isTaxHolidayOrWeekend(date)) {
    date.setDate(date.getDate() + 1);
  }

  const finalYear = date.getFullYear();
  const formatted = formatDotYMD(finalYear, date.getMonth() + 1, date.getDate());
  // 2026년은 공식 공휴일(월력요항)이 모두 검증된 연도이므로 확정 날짜 표시, 그 외 연도는 (잠정) 유지
  return finalYear === 2026 ? formatted : `${formatted} (잠정)`;
}

/**
 * 만 35세까지의 10년 단위 증여 준비 구간 목록을 생성합니다.
 */
export function calculateGiftPeriods(
  birthDateStr: string,
  startDateStr: string,
  monthlyGiftWon = 200000
): GiftPeriod[] {
  const start = parseYMD(startDateStr);
  const periods: GiftPeriod[] = [];

  for (let i = 0; i < 4; i++) {
    const pYear = start.year + i * 10;
    const maxDay = getLastDayOfMonth(pYear, start.month);
    const pDay = Math.min(start.day, maxDay);
    const pDateFormatted = formatDotYMD(pYear, start.month, pDay);
    const ageAtStart = getManAge(
      birthDateStr,
      `${pYear}-${String(start.month).padStart(2, '0')}-${String(pDay).padStart(2, '0')}`
    );

    // 만 35세를 초과하여 열리는 구간은 제외 (단, 최소 1차 구간은 표시)
    if (ageAtStart > 35 && i > 0) {
      break;
    }

    const isMinor = ageAtStart < 19;
    const deductionLimitManwon = isMinor ? 2000 : 5000;
    const monthlyPlanned = Number.isFinite(monthlyGiftWon)
      ? Math.max(0, Math.floor(monthlyGiftWon))
      : 0;

    const endInfo = getContractEndDate(pYear, start.month, pDay);
    const reportDeadline = getReportDeadline(pYear, start.month);

    periods.push({
      periodNumber: i + 1,
      label: `${i + 1}차`,
      startDate: pDateFormatted,
      endDate: endInfo.formatted,
      startYear: pYear,
      endYear: endInfo.year,
      ageAtStart,
      isMinor,
      deductionLimitManwon,
      deductionLabel: isMinor ? '미성년 2,000만' : '성년 5,000만',
      monthlyPlanned,
      lumpSumMaxLabel: isMinor ? '2,000만원' : '5,000만원',
      reportDeadline,
      isReportDeadlineConfirmed: !reportDeadline.includes('(잠정)'),
    });
  }

  return periods;
}

/**
 * 시트 2: 증여 날짜 달력 목록(타임라인 할 일) 생성
 */
export function generateCalendarTodos(periods: GiftPeriod[]): CalendarTodoItem[] {
  const items: CalendarTodoItem[] = [];

  periods.forEach((p, idx) => {
    items.push({
      id: `period-${p.periodNumber}-start`,
      date: p.startDate,
      description: `${p.label} 준비 구간 시작 (만 ${p.ageAtStart}세, 일반 공제 기준 ${p.deductionLabel}). 증여계약서 작성 및 이체 등록`,
      periodNumber: p.periodNumber,
    });

    items.push({
      id: `period-${p.periodNumber}-report`,
      date: p.reportDeadline,
      description: p.isReportDeadlineConfirmed
        ? `${p.label} 증여세 신고기한 (첫 증여월 말일 + 3개월, 2026년 공휴일·주말 반영)`
        : `${p.label} 증여세 신고기한 확인 (주말·근로자의 날 보정 완료, 해당 연도 공휴일 추가 확인)`,
      periodNumber: p.periodNumber,
    });

    const nextPeriod = periods[idx + 1];
    if (nextPeriod) {
      items.push({
        id: `period-${p.periodNumber}-precheck`,
        date: p.endDate,
        description: `${nextPeriod.label} 시작 전 10년 합산 점검 — 직전 10년 내 부모·조부모 증여액과 투자한 용돈 등 공제 사용액 확인`,
        periodNumber: p.periodNumber,
      });
    }

    items.push({
      id: `period-${p.periodNumber}-end`,
      date: p.endDate,
      description: `${p.label} 120회 마지막 이체일 (계약 종료일 · 공제 한도가 자동 초기화되는 날은 아님)`,
      periodNumber: p.periodNumber,
    });
  });

  items.push({
    id: 'marriage-childbirth-special',
    date: '성년 후 혼인·출산 증여 시',
    description:
      '자녀가 성년이 되어 결혼(혼인신고 전후 2년)하거나 자녀의 아이를 출산·입양(출생일로부터 2년)할 때 부모·조부모에게 받는 증여는 통합 1억원 추가 공제 가능. 신고기한은 실제 증여일이 속한 달의 말일부터 3개월 이내',
  });

  return items;
}

/**
 * 시트 4: 시작 시점 비교 시뮬레이션 (입력한 날 시작 vs 1년 늦추면 vs 2년 늦추면)
 */
export function calculateDelaySimulations(
  birthDateStr: string,
  startDateStr: string,
  monthlyGiftWon = 200000
): DelaySimulationRow[] {
  const start = parseYMD(startDateStr);
  const labels = ['입력한 날 시작', '1년 늦추면', '2년 늦추면'];
  const monthlyPlanned = Number.isFinite(monthlyGiftWon)
    ? Math.max(0, Math.floor(monthlyGiftWon))
    : 0;

  return labels.map((label, delayYears) => {
    const delayedYear = start.year + delayYears;
    const maxDay = getLastDayOfMonth(delayedYear, start.month);
    const dDay = Math.min(start.day, maxDay);
    const delayedStartStr = `${delayedYear}-${String(start.month).padStart(2, '0')}-${String(dDay).padStart(2, '0')}`;
    const periods = calculateGiftPeriods(birthDateStr, delayedStartStr, monthlyPlanned);

    const minorPeriodCount = periods.filter((p) => p.isMinor).length;
    const adultPeriodCount = periods.filter((p) => !p.isMinor).length;
    const totalDeductionManwon = periods.reduce(
      (sum, p) => sum + p.deductionLimitManwon,
      0
    );
    const totalPeriodCount = periods.length;
    const totalPlannedMonths = totalPeriodCount * 120;
    const totalPlannedManwon = Math.round(
      (totalPlannedMonths * monthlyPlanned) / 10000
    );

    const firstAdult = periods.find((p) => !p.isMinor);
    const firstAdultPeriodSummary = firstAdult
      ? `${firstAdult.label}부터 성년 기준 (${firstAdult.startYear}년 · 만 ${firstAdult.ageAtStart}세)`
      : '만 35세 이전 성년 구간 없음';

    return {
      label,
      startDate: formatDotYMD(delayedYear, start.month, dDay),
      ageAtStart: periods[0]?.ageAtStart ?? 0,
      minorPeriodCount,
      adultPeriodCount,
      totalDeductionManwon,
      totalPeriodCount,
      totalPlannedMonths,
      totalPlannedManwon,
      firstAdultPeriodSummary,
    };
  });
}

/**
 * 시트 5: 아동수당 입금 체크표 (2017년 이후 출생 156칸 / 2016년 이전 출생 96칸)
 */
export function generateChildAllowanceSchedule(birthDateStr: string): {
  startYmLabel: string;
  endYmLabel: string;
  totalCount: number;
  isExpandedCohort: boolean;
  rows: MonthlyCheckRow[];
} {
  const birth = parseYMD(birthDateStr);
  const startTotalMonth = birth.year * 12 + (birth.month - 1);
  const isExpandedCohort = birth.year >= 2017;
  // 2017년 이후 출생: 출생월부터 만 13세 생일 전월까지 156칸 / 2016년 이전 출생: 만 8세 미만 96칸
  const endTotalMonth = startTotalMonth + (isExpandedCohort ? 155 : 95);
  const endYear = Math.floor(endTotalMonth / 12);
  const endMonth = (endTotalMonth % 12) + 1;

  const rows: MonthlyCheckRow[] = [];
  for (let y = birth.year; y <= endYear; y++) {
    const activeMonths: boolean[] = [];
    const activeMonthNumbers: number[] = [];
    let count = 0;
    for (let m = 1; m <= 12; m++) {
      const currentTotal = y * 12 + (m - 1);
      const isActive =
        currentTotal >= startTotalMonth && currentTotal <= endTotalMonth;
      activeMonths.push(isActive);
      if (isActive) {
        count++;
        activeMonthNumbers.push(m);
      }
    }
    const firstM = activeMonthNumbers[0];
    const lastM = activeMonthNumbers[activeMonthNumbers.length - 1];
    const monthRangeLabel =
      firstM && lastM
        ? firstM === lastM
          ? `${firstM}월`
          : `${firstM}~${lastM}월`
        : '-';

    rows.push({
      year: y,
      activeMonths,
      count,
      monthRangeLabel,
    });
  }

  return {
    startYmLabel: `${birth.year}.${String(birth.month).padStart(2, '0')}`,
    endYmLabel: `${endYear}.${String(endMonth).padStart(2, '0')}`,
    totalCount: endTotalMonth - startTotalMonth + 1,
    isExpandedCohort,
    rows,
  };
}

/**
 * 월 금액을 읽기 쉬운 문자열("20만원" 또는 "195,000원")로 포맷합니다.
 */
export function formatMonthlyShort(won: number): string {
  if (won > 0 && won % 10000 === 0) {
    return `${(won / 10000).toLocaleString('ko-KR')}만원`;
  }
  return `${won.toLocaleString('ko-KR')}원`;
}

/**
 * 시트 6: 유기정기금 1차 구간(120회) 연도별 체크리스트 생성
 */
export function generateInstallmentSchedule(firstPeriod: GiftPeriod): MonthlyCheckRow[] {
  const start = parseYMD(firstPeriod.startDate);
  const startTotalMonth = start.year * 12 + (start.month - 1);
  const endTotalMonth = startTotalMonth + 119; // 120개월
  const endYear = Math.floor(endTotalMonth / 12);
  const monthlyLabel = formatMonthlyShort(firstPeriod.monthlyPlanned);

  const rows: MonthlyCheckRow[] = [];
  for (let y = start.year; y <= endYear; y++) {
    const activeMonths: boolean[] = [];
    const activeMonthNumbers: number[] = [];
    let count = 0;
    for (let m = 1; m <= 12; m++) {
      const currentTotal = y * 12 + (m - 1);
      const isActive =
        currentTotal >= startTotalMonth && currentTotal <= endTotalMonth;
      activeMonths.push(isActive);
      if (isActive) {
        count++;
        activeMonthNumbers.push(m);
      }
    }
    const firstM = activeMonthNumbers[0];
    const lastM = activeMonthNumbers[activeMonthNumbers.length - 1];
    const monthRangeLabel =
      firstM && lastM
        ? firstM === lastM
          ? `${firstM}월`
          : `${firstM}~${lastM}월`
        : '-';
    const plannedSummaryLabel = `${monthRangeLabel} · ${count}회 × ${monthlyLabel}`;

    rows.push({
      year: y,
      activeMonths,
      count,
      annualAmount: count * firstPeriod.monthlyPlanned,
      monthRangeLabel,
      plannedSummaryLabel,
    });
  }

  return rows;
}

/**
 * 시트 6: 특정 연도의 실제 체크된 입금 횟수와 실제 입금액 합계를 계산합니다.
 * 체크 시점에 저장된 금액(checkedAmountMap)을 우선 사용하여, 이후 월 계획액을 변경해도 과거 실제 입금액 합계가 변하지 않습니다.
 */
export function calculateActualInstallmentRowTotal(
  year: number,
  activeMonths: boolean[],
  checkedMap: Record<string, boolean>,
  checkedAmountMap: Record<string, number>,
  fallbackMonthlyWon: number
): { checkedCount: number; actualAmountWon: number } {
  let checkedCount = 0;
  let actualAmountWon = 0;

  activeMonths.forEach((isActive, idx) => {
    if (!isActive) return;
    const key = `installment-${year}-${idx + 1}`;
    if (checkedMap[key]) {
      checkedCount += 1;
      const recordedAmount = checkedAmountMap[key];
      actualAmountWon +=
        typeof recordedAmount === 'number' && Number.isFinite(recordedAmount)
          ? recordedAmount
          : fallbackMonthlyWon;
    }
  });

  return { checkedCount, actualAmountWon };
}

/**
 * 만원 단위 금액을 "1억 3,773만원" 또는 "4,789만원" 형식으로 변환합니다.
 */
export function formatManwonReadable(manwon: number): string {
  const rounded = Math.round(manwon);
  if (rounded <= 0) return '0원';
  if (rounded >= 10000) {
    const eok = Math.floor(rounded / 10000);
    const rem = rounded % 10000;
    if (rem === 0) return `${eok}억원`;
    return `${eok}억 ${rem.toLocaleString('ko-KR')}만원`;
  }
  return `${rounded.toLocaleString('ko-KR')}만원`;
}

/**
 * 시트 8: 자녀 목돈 필요 시기 체크리스트 (현재가 및 물가상승 반영 예상 금액)
 * - 기준연도 2026년 가격을 지급 연도별로 복리 상승 계산하며, 증여 시작일(startDateStr)과 독립입니다.
 * - overrides를 통해 결혼 나이, 항목 포함 여부, 가족 지원 계획액(현재가 만원)을 조정할 수 있습니다.
 */
export function calculateLumpSumExpenses(
  birthDateStr: string,
  startDateStr: string,
  inflationRate: number,
  overrides: ExpenseOverridesMap = {}
): LumpSumExpenseItem[] {
  const birth = parseYMD(birthDateStr);
  void startDateStr; // 증여일은 비용의 기준일이 아닙니다.
  const r = inflationRate / 100;

  // 기준연도 2026년 가격을 지급 연도까지 연 단위로 계산합니다.
  const getMultiplierForAge = (targetAge: number): number =>
    Math.pow(1 + r, Math.max(0, birth.year + targetAge - COST_BASE_YEAR));

  const makeAgeDateStr = (age: number): string => {
    const y = birth.year + age;
    const maxDay = getLastDayOfMonth(y, birth.month);
    return formatDotYMD(y, birth.month, Math.min(birth.day, maxDay));
  };

  // 각 항목별 설정값(나이, 가족지원액, 포함여부) 조회 헬퍼
  const resolveConfig = (
    id: string,
    defaultAge: number,
    defaultSupportManwon: number
  ) => {
    const ov = overrides[id];
    const targetAge =
      typeof ov?.targetAge === 'number' && Number.isFinite(ov.targetAge)
        ? Math.min(50, Math.max(0, Math.floor(ov.targetAge)))
        : defaultAge;
    const familySupportManwon =
      typeof ov?.familySupportManwon === 'number' &&
      Number.isFinite(ov.familySupportManwon)
        ? Math.max(0, Math.floor(ov.familySupportManwon))
        : defaultSupportManwon;
    const included = ov?.included !== undefined ? ov.included : true;
    return { targetAge, familySupportManwon, included };
  };

  // 1. 대학 등록금 (4년): 기본 만 19~22세 4개년 각각 물가 반영 후 합산
  const univCfg = resolveConfig('univ-tuition', 19, 2908);
  const univAges = [0, 1, 2, 3].map((offset) => univCfg.targetAge + offset);
  const univMultipliers = univAges.map(getMultiplierForAge);
  const univAvgMultiplier =
    univMultipliers.reduce((a, b) => a + b, 0) / univMultipliers.length;

  const univAvgFuture = Math.round(2908.12 * univAvgMultiplier);
  const univPrivateFuture = Math.round(3292.6 * univAvgMultiplier);
  const univPublicFuture = Math.round(1700 * univAvgMultiplier);
  const univSupportFuture = univCfg.included
    ? Math.round(univCfg.familySupportManwon * univAvgMultiplier)
    : 0;

  // 2. 타지역 자취 보증금 (기본 만 19세)
  const dormCfg = resolveConfig('dorm-deposit', 19, 1000);
  const dormMult = getMultiplierForAge(dormCfg.targetAge);
  const dormMinFuture = Math.round(500 * dormMult);
  const dormMaxFuture = Math.round(2000 * dormMult);
  const dormSupportFuture = dormCfg.included
    ? Math.round(dormCfg.familySupportManwon * dormMult)
    : 0;

  // 3. 어학연수·교환학생 (기본 만 20~22세, 대표연도 startAge + 1)
  const studyCfg = resolveConfig('study-abroad', 20, 1500);
  const studyAbroadMult = getMultiplierForAge(studyCfg.targetAge + 1);
  const studyMinFuture = Math.round(1000 * studyAbroadMult);
  const studyMaxFuture = Math.round(3000 * studyAbroadMult);
  const studySupportFuture = studyCfg.included
    ? Math.round(studyCfg.familySupportManwon * studyAbroadMult)
    : 0;

  // 4. 취업 준비·자격증 (기본 만 22~24세, 대표연도 startAge + 1)
  const jobCfg = resolveConfig('job-prep', 22, 300);
  const jobPrepMult = getMultiplierForAge(jobCfg.targetAge + 1);
  const jobMinFuture = Math.round(100 * jobPrepMult);
  const jobMaxFuture = Math.round(500 * jobPrepMult);
  const jobSupportFuture = jobCfg.included
    ? Math.round(jobCfg.familySupportManwon * jobPrepMult)
    : 0;

  // 5. 결혼 준비 (기본 만 32세, 선택 가정)
  const weddingCfg = resolveConfig('wedding-prep', 32, 6298);
  const weddingMult = getMultiplierForAge(weddingCfg.targetAge);
  const weddingFuture = Math.round(6298 * weddingMult);
  const weddingSupportFuture = weddingCfg.included
    ? Math.round(weddingCfg.familySupportManwon * weddingMult)
    : 0;

  // 6. 신혼집 보증금·주택자금 (기본 결혼 나이와 연동 또는 개별 설정, 선택 가정)
  const houseDefaultAge = overrides['wedding-prep']?.targetAge ?? 32;
  const houseCfg = resolveConfig('newlywed-house', houseDefaultAge, 20000);
  const houseMult = getMultiplierForAge(houseCfg.targetAge);
  const houseMinFuture = Math.round(20000 * houseMult);
  const houseMaxFuture = Math.round(30000 * houseMult);
  const houseSupportFuture = houseCfg.included
    ? Math.round(houseCfg.familySupportManwon * houseMult)
    : 0;

  return [
    {
      id: 'univ-tuition',
      title: '대학 등록금 (4년)',
      requiredOrOptional: '선택',
      sourceType: '공식통계(교육부 2026)',
      timingAgeLabel: `만 ${univCfg.targetAge}~${univCfg.targetAge + 3}세`,
      timingYearLabel: `${birth.year + univCfg.targetAge}~${birth.year + univCfg.targetAge + 3}년`,
      startDateStr: makeAgeDateStr(univCfg.targetAge),
      endDateStr: makeAgeDateStr(univCfg.targetAge + 3),
      defaultTargetAge: 19,
      targetAge: univCfg.targetAge,
      ageSpanYears: 3,
      reason: '교육부 2026년 공시 기준 · 4년제 평균 연 727만원 (사립 823만 · 국공립 425만)',
      presentValueLines: ['2,908만원', '사립대 3,293만원', '국공립대 1,700만원'],
      futureValueLines: [
        formatManwonReadable(univAvgFuture),
        `사립대 ${formatManwonReadable(univPrivateFuture)}`,
        `국공립대 ${formatManwonReadable(univPublicFuture)}`,
      ],
      defaultSupportManwon: 2908,
      familySupportManwon: univCfg.familySupportManwon,
      familySupportFutureManwon: univSupportFuture,
      familySupportFutureLabel: univCfg.included
        ? formatManwonReadable(univSupportFuture)
        : '지원 제외(0원)',
      included: univCfg.included,
    },
    {
      id: 'dorm-deposit',
      title: '타지역 자취 보증금',
      requiredOrOptional: '선택',
      sourceType: '예산예시(가정값)',
      timingAgeLabel: `대학 입학 무렵\n만 ${dormCfg.targetAge}세`,
      timingYearLabel: `${birth.year + dormCfg.targetAge}년`,
      startDateStr: makeAgeDateStr(dormCfg.targetAge),
      endDateStr: makeAgeDateStr(dormCfg.targetAge),
      defaultTargetAge: 19,
      targetAge: dormCfg.targetAge,
      ageSpanYears: 0,
      reason: '원본 예산 예시 범위(공식 평균 아님) · 통학 시 불필요',
      presentValueLines: ['500만원 ~', '2,000만원'],
      futureValueLines: [
        `${formatManwonReadable(dormMinFuture)} ~ ${formatManwonReadable(dormMaxFuture)}`,
      ],
      defaultSupportManwon: 1000,
      familySupportManwon: dormCfg.familySupportManwon,
      familySupportFutureManwon: dormSupportFuture,
      familySupportFutureLabel: dormCfg.included
        ? formatManwonReadable(dormSupportFuture)
        : '지원 제외(0원)',
      included: dormCfg.included,
    },
    {
      id: 'study-abroad',
      title: '어학연수·교환학생',
      requiredOrOptional: '선택',
      sourceType: '예산예시(가정값)',
      timingAgeLabel: `대학 재학 중\n만 ${studyCfg.targetAge}~${studyCfg.targetAge + 2}세`,
      timingYearLabel: `${birth.year + studyCfg.targetAge}~${birth.year + studyCfg.targetAge + 2}년`,
      startDateStr: makeAgeDateStr(studyCfg.targetAge),
      endDateStr: makeAgeDateStr(studyCfg.targetAge + 2),
      defaultTargetAge: 20,
      targetAge: studyCfg.targetAge,
      ageSpanYears: 2,
      reason: '원본 예산 예시 범위(공식 평균 아님) · 국가·기간별 차이 큼',
      presentValueLines: ['1,000만원 ~', '3,000만원'],
      futureValueLines: [
        `${formatManwonReadable(studyMinFuture)} ~ ${formatManwonReadable(studyMaxFuture)}`,
      ],
      defaultSupportManwon: 1500,
      familySupportManwon: studyCfg.familySupportManwon,
      familySupportFutureManwon: studySupportFuture,
      familySupportFutureLabel: studyCfg.included
        ? formatManwonReadable(studySupportFuture)
        : '지원 제외(0원)',
      included: studyCfg.included,
    },
    {
      id: 'job-prep',
      title: '취업 준비·자격증',
      requiredOrOptional: '선택',
      sourceType: '예산예시(가정값)',
      timingAgeLabel: `만 ${jobCfg.targetAge}~${jobCfg.targetAge + 2}세`,
      timingYearLabel: `${birth.year + jobCfg.targetAge}~${birth.year + jobCfg.targetAge + 2}년`,
      startDateStr: makeAgeDateStr(jobCfg.targetAge),
      endDateStr: makeAgeDateStr(jobCfg.targetAge + 2),
      defaultTargetAge: 22,
      targetAge: jobCfg.targetAge,
      ageSpanYears: 2,
      reason: '원본 예산 예시 범위(공식 평균 아님) · 졸업 전후 자격증·교육비 가정',
      presentValueLines: ['100만원 ~ 500만원'],
      futureValueLines: [
        `${formatManwonReadable(jobMinFuture)} ~ ${formatManwonReadable(jobMaxFuture)}`,
      ],
      defaultSupportManwon: 300,
      familySupportManwon: jobCfg.familySupportManwon,
      familySupportFutureManwon: jobSupportFuture,
      familySupportFutureLabel: jobCfg.included
        ? formatManwonReadable(jobSupportFuture)
        : '지원 제외(0원)',
      included: jobCfg.included,
    },
    {
      id: 'wedding-prep',
      title: '결혼 준비',
      requiredOrOptional: '선택',
      sourceType: '예산예시(가정값)',
      timingAgeLabel: `선택 가정\n만 ${weddingCfg.targetAge}세`,
      timingYearLabel: `${birth.year + weddingCfg.targetAge}년`,
      startDateStr: makeAgeDateStr(weddingCfg.targetAge),
      endDateStr: makeAgeDateStr(weddingCfg.targetAge),
      defaultTargetAge: 32,
      targetAge: weddingCfg.targetAge,
      ageSpanYears: 0,
      reason: '원본 예산 예시 6,298만원(공식 평균 아님) · 결혼 시점·지원 여부는 선택 가정',
      presentValueLines: ['6,298만원'],
      futureValueLines: [formatManwonReadable(weddingFuture)],
      defaultSupportManwon: 6298,
      familySupportManwon: weddingCfg.familySupportManwon,
      familySupportFutureManwon: weddingSupportFuture,
      familySupportFutureLabel: weddingCfg.included
        ? formatManwonReadable(weddingSupportFuture)
        : '지원 제외(0원)',
      included: weddingCfg.included,
    },
    {
      id: 'newlywed-house',
      title: '신혼집 보증금·\n주택자금',
      requiredOrOptional: '선택',
      sourceType: '예산예시(가정값)',
      timingAgeLabel: `선택 가정\n만 ${houseCfg.targetAge}세`,
      timingYearLabel: `${birth.year + houseCfg.targetAge}년`,
      startDateStr: makeAgeDateStr(houseCfg.targetAge),
      endDateStr: makeAgeDateStr(houseCfg.targetAge),
      defaultTargetAge: 32,
      targetAge: houseCfg.targetAge,
      ageSpanYears: 0,
      reason: '원본 예산 예시 2~3억원(공식 평균·필수 지출 아님) · 가족 여건에 따라 선택',
      presentValueLines: ['2억원 ~ 3억원'],
      futureValueLines: [
        `${formatManwonReadable(houseMinFuture)} ~`,
        formatManwonReadable(houseMaxFuture),
      ],
      defaultSupportManwon: 20000,
      familySupportManwon: houseCfg.familySupportManwon,
      familySupportFutureManwon: houseSupportFuture,
      familySupportFutureLabel: houseCfg.included
        ? formatManwonReadable(houseSupportFuture)
        : '지원 제외(0원)',
      included: houseCfg.included,
    },
  ];
}

/**
 * 시트 8: 증여 구간(실제 시작일~종료일)과 목돈 항목(실제 발생 날짜 구간)을 정밀 비교합니다.
 * - 단순 연도(year) 비교가 아니라 YYYY.MM.DD 실제 날짜를 기준으로 겹치는지 판별합니다.
 * - 연도는 겹치지만 실제 날짜가 구간 시작 전이거나 종료 후인 경우(연도 착시)를 별도로 분리합니다.
 */
export function matchLumpSumItemsToPeriod(
  period: GiftPeriod,
  lumpSumItems: LumpSumExpenseItem[]
): PeriodLumpSumMatchResult {
  const matchedItems: PeriodLumpSumMatchResult['matchedItems'] = [];
  const yearOnlyMismatchItems: PeriodLumpSumMatchResult['yearOnlyMismatchItems'] = [];

  lumpSumItems.forEach((item) => {
    if (!item.included) return;
    const cleanTitle = item.title.replace(/\n/g, ' ');
    const itemStartYear = parseYMD(item.startDateStr).year;
    const itemEndYear = parseYMD(item.endDateStr).year;

    const hasDateOverlap =
      item.startDateStr <= period.endDate && item.endDateStr >= period.startDate;
    const hasYearOverlap =
      itemStartYear <= period.endYear && itemEndYear >= period.startYear;

    if (hasDateOverlap) {
      const isCompletelyInside =
        item.startDateStr >= period.startDate && item.endDateStr <= period.endDate;
      const isPartialOverlap = !isCompletelyInside;
      matchedItems.push({
        id: item.id,
        title: cleanTitle,
        isPartialOverlap,
        label: isPartialOverlap
          ? `${cleanTitle} (일부 기간 걸침: ${item.startDateStr}~${item.endDateStr})`
          : cleanTitle,
      });
    } else if (hasYearOverlap) {
      const reason =
        item.endDateStr < period.startDate
          ? `${itemEndYear}년이지만 ${period.label} 시작일(${period.startDate}) 이전 발생`
          : `${itemStartYear}년이지만 ${period.label} 종료일(${period.endDate}) 이후 발생`;
      yearOnlyMismatchItems.push({
        id: item.id,
        title: cleanTitle,
        itemDateRange:
          item.startDateStr === item.endDateStr
            ? item.startDateStr
            : `${item.startDateStr}~${item.endDateStr}`,
        reason,
      });
    }
  });

  const matchedText =
    matchedItems.map((m) => m.label).join(', ') || '해당 날짜 구간에 겹치는 항목 없음';
  const mismatchNote =
    yearOnlyMismatchItems.length > 0
      ? ` (※ 연도는 같으나 날짜상 제외: ${yearOnlyMismatchItems
          .map((x) => `${x.title} [${x.reason}]`)
          .join(', ')})`
      : '';

  return {
    matchedItems,
    yearOnlyMismatchItems,
    summaryText: `${matchedText}${mismatchNote}`,
  };
}

/**
 * 시트 9: 만 0세 ~ 만 35세 나이·연도표 생성
 * 실제 증여 구간 시작일·종료일(YYYY.MM.DD)을 고려하여 연도별 상태를 표시합니다.
 */
export function generateAgeYearTable(
  birthDateStr: string,
  startDateStr: string,
  periods: GiftPeriod[]
): AgeYearRow[] {
  const birth = parseYMD(birthDateStr);
  const currentAge = getManAge(birthDateStr, startDateStr);
  const rows: AgeYearRow[] = [];

  for (let age = 0; age <= 35; age++) {
    const year = birth.year + age;
    const maxDay = getLastDayOfMonth(year, birth.month);
    const bDay = Math.min(birth.day, maxDay);
    const birthdayStr = formatDotYMD(year, birth.month, bDay);

    // 그 해 3월 기준 학교 계산 (출생연도 기준 한국 학제)
    let schoolLabel = '';
    if (age <= 2) {
      schoolLabel = '영유아';
    } else if (age <= 6) {
      schoolLabel = '어린이집·유치원';
    } else if (age <= 12) {
      schoolLabel = `초등 ${age - 6}학년`;
    } else if (age <= 15) {
      schoolLabel = `중등 ${age - 12}학년`;
    } else if (age <= 18) {
      schoolLabel = `고등 ${age - 15}학년`;
    } else if (age <= 22) {
      schoolLabel = `대학 ${age - 18}학년`;
    } else {
      schoolLabel = '';
    }

    // 증여 구간 상태 매칭 (실제 시작일·종료일 반영)
    let giftStatusLabel = '';
    let isPeriodStart = false;

    const startingPeriod = periods.find((p) => p.startYear === year);
    const endingPeriod = periods.find((p) => p.endYear === year);

    if (startingPeriod && endingPeriod && startingPeriod.periodNumber !== endingPeriod.periodNumber) {
      giftStatusLabel = `${endingPeriod.label} 종료(${endingPeriod.endDate}) · ${startingPeriod.label} 구간 시작 (${startingPeriod.startDate})`;
      isPeriodStart = true;
    } else if (startingPeriod) {
      giftStatusLabel = `${startingPeriod.label} 구간 시작 (${startingPeriod.startDate})`;
      isPeriodStart = true;
    } else if (endingPeriod) {
      giftStatusLabel = `${endingPeriod.label} 구간 종료 (${endingPeriod.endDate})`;
    } else {
      // 해당 연도가 어느 구간의 계약 기간(startYear < year < endYear)에 속하는지 확인
      const activePeriod = periods.find(
        (p) => year > p.startYear && year < p.endYear
      );
      if (activePeriod) {
        giftStatusLabel = `${activePeriod.label} 구간 중 (~${activePeriod.endDate})`;
      } else if (periods.length > 0 && year < periods[0].startYear) {
        giftStatusLabel = '증여 시작 전';
      } else {
        giftStatusLabel = '이전 구간 종료 후';
      }
    }

    rows.push({
      age,
      isCurrentAge: age === currentAge,
      year,
      birthdayStr,
      schoolLabel,
      giftStatusLabel,
      isPeriodStart,
    });
  }

  return rows;
}

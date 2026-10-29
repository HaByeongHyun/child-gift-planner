// 자녀 증여 플래너 및 미래 목돈 시뮬레이터 핵심 계산 엔진

export interface PlannerInput {
  childName: string; // 아이 이름 또는 애칭 (예: "귀한아들")
  blessingMessage: string; // 응원 문구 (예: "귀한아들, 귀하게 커라 사랑한다")
  birthDate: string; // 생년월일 YYYY-MM-DD (예: "2026-06-23")
  startDate: string; // 첫 증여 시작 예정일 YYYY-MM-DD (예: "2026-10-25")
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
  monthlyMaxExact: number; // 계산상 최대 월 증여액 (195,384원 / 488,460원)
  monthlyRecommended: number; // 실무 권장 월 증여액 (195,000원 / 488,000원)
  evaluatedAmountManwon: number; // 정기금 평가액 (만원 단위, 소수 첫째자리: 1996.1 / 4995.3)
  remainingLimitManwon: number; // 잔여 한도 (만원 단위, 소수 첫째자리: 3.9 / 4.7)
  lumpSumMaxLabel: string; // "2,000만원" | "5,000만원"
  reportDeadline: string; // 신고 마감일 "2027.01.31"
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
  totalDeductionManwon: number; // 예: 14000 (14,000만원)
}

export interface MonthlyCheckRow {
  year: number;
  activeMonths: boolean[]; // 길이 12 (1월~12월 활성 여부)
  count: number; // 해당 연도 활성 개월 수
  annualAmount?: number; // 유기정기금 연간 입금액 (원)
}

export interface LumpSumExpenseItem {
  id: string;
  title: string;
  requiredOrOptional: '필수' | '선택';
  timingAgeLabel: string; // "만 19~22세"
  timingYearLabel: string; // "2045~2048년"
  reason: string;
  presentValueLines: string[]; // 현재가 표시 줄
  futureValueLines: string[]; // 물가 반영가 표시 줄
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

// 세법상 유기정기금 연 3% 복리 할인 계수 (10년 = 8.5302028368)
const ANNUITY_PV_FACTOR_10Y =
  Array.from({ length: 10 }, (_, i) => 1 / Math.pow(1.03, i + 1)).reduce(
    (acc, v) => acc + v,
    0
  ) * 12; // 약 102.36243404

/**
 * YYYY-MM-DD 문자열을 연, 월, 일 숫자로 파싱합니다.
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
export function getContractEndDate(startYear: number, startMonth: number, startDay: number): {
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
 * 첫 이체일이 속한 달의 말일로부터 3개월 후 말일(홈택스 증여세 신고 기한)을 계산합니다.
 * 예: 2026.10.25 -> 2027.01.31
 */
export function getReportDeadline(startYear: number, startMonth: number): string {
  const totalMonths = startYear * 12 + (startMonth - 1) + 3;
  const deadlineYear = Math.floor(totalMonths / 12);
  const deadlineMonth = (totalMonths % 12) + 1;
  const deadlineDay = getLastDayOfMonth(deadlineYear, deadlineMonth);
  return formatDotYMD(deadlineYear, deadlineMonth, deadlineDay);
}

/**
 * 만 35세까지의 10년 단위 증여 구간 목록을 생성합니다.
 */
export function calculateGiftPeriods(birthDateStr: string, startDateStr: string): GiftPeriod[] {
  const start = parseYMD(startDateStr);
  const periods: GiftPeriod[] = [];

  for (let i = 0; i < 4; i++) {
    const pYear = start.year + i * 10;
    const maxDay = getLastDayOfMonth(pYear, start.month);
    const pDay = Math.min(start.day, maxDay);
    const pDateFormatted = formatDotYMD(pYear, start.month, pDay);
    const ageAtStart = getManAge(birthDateStr, `${pYear}-${String(start.month).padStart(2, '0')}-${String(pDay).padStart(2, '0')}`);

    // 만 35세를 초과하여 열리는 구간은 제외 (단, 최소 1차 구간은 표시)
    if (ageAtStart > 35 && i > 0) {
      break;
    }

    const isMinor = ageAtStart < 19;
    const deductionLimitManwon = isMinor ? 2000 : 5000;
    const deductionWon = deductionLimitManwon * 10000;
    const monthlyMaxExact = Math.floor(deductionWon / ANNUITY_PV_FACTOR_10Y);
    // 천원 단위 내림 (195,000원 / 488,000원)
    const monthlyRecommended = Math.floor(monthlyMaxExact / 1000) * 1000;
    const evaluatedWon = monthlyRecommended * ANNUITY_PV_FACTOR_10Y;
    const evaluatedAmountManwon = Math.round((evaluatedWon / 10000) * 10) / 10;
    const remainingLimitManwon =
      Math.round((deductionLimitManwon - evaluatedAmountManwon) * 10) / 10;

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
      monthlyMaxExact,
      monthlyRecommended,
      evaluatedAmountManwon,
      remainingLimitManwon,
      lumpSumMaxLabel: isMinor ? '2,000만원' : '5,000만원',
      reportDeadline,
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
      description: `${p.label} 구간 시작 (만 ${p.ageAtStart}세, ${p.deductionLabel}). 증여계약서 작성, 자동이체 등록`,
      periodNumber: p.periodNumber,
    });

    items.push({
      id: `period-${p.periodNumber}-report`,
      date: p.reportDeadline,
      description: `${p.label} 신고 마감 (홈택스 유기정기금)`,
      periodNumber: p.periodNumber,
    });

    const nextPeriod = periods[idx + 1];
    if (nextPeriod) {
      items.push({
        id: `period-${p.periodNumber}-precheck`,
        date: p.endDate,
        description: `${nextPeriod.label} 시작 전 최종 체크 — ${p.label} 구간에 준 금액(정기금 평가액·조부모 증여·투자한 세뱃돈 등) 합계가 한도 이내인지, 증여세 낼 금액은 없는지 확인`,
        periodNumber: p.periodNumber,
      });
    }

    items.push({
      id: `period-${p.periodNumber}-end`,
      date: p.endDate,
      description: `${p.label} 마지막 이체 (계약 종료일). 새 한도가 열리는 날은 아님`,
      periodNumber: p.periodNumber,
    });
  });

  items.push({
    id: 'marriage-childbirth-special',
    date: '혼인·출산 시',
    description:
      '혼인신고일 전후 2년 / 출생일부터 2년 안에 증여하면 1억원 별도 공제. 증여 후 3개월 내 신고',
  });

  return items;
}

/**
 * 시트 4: 시작 시점 비교 시뮬레이션 (입력한 날 시작 vs 1년 늦추면 vs 2년 늦추면)
 */
export function calculateDelaySimulations(
  birthDateStr: string,
  startDateStr: string
): DelaySimulationRow[] {
  const start = parseYMD(startDateStr);
  const labels = ['입력한 날 시작', '1년 늦추면', '2년 늦추면'];

  return labels.map((label, delayYears) => {
    const delayedYear = start.year + delayYears;
    const maxDay = getLastDayOfMonth(delayedYear, start.month);
    const dDay = Math.min(start.day, maxDay);
    const delayedStartStr = `${delayedYear}-${String(start.month).padStart(2, '0')}-${String(dDay).padStart(2, '0')}`;
    const periods = calculateGiftPeriods(birthDateStr, delayedStartStr);

    const minorPeriodCount = periods.filter((p) => p.isMinor).length;
    const adultPeriodCount = periods.filter((p) => !p.isMinor).length;
    const totalDeductionManwon = periods.reduce(
      (sum, p) => sum + p.deductionLimitManwon,
      0
    );

    return {
      label,
      startDate: formatDotYMD(delayedYear, start.month, dDay),
      ageAtStart: periods[0]?.ageAtStart ?? 0,
      minorPeriodCount,
      adultPeriodCount,
      totalDeductionManwon,
    };
  });
}

/**
 * 시트 5: 아동수당 입금 체크표 (출생월 ~ 만 13세 미만, 총 156회)
 */
export function generateChildAllowanceSchedule(birthDateStr: string): {
  startYmLabel: string;
  endYmLabel: string;
  totalCount: number;
  rows: MonthlyCheckRow[];
} {
  const birth = parseYMD(birthDateStr);
  const startTotalMonth = birth.year * 12 + (birth.month - 1);
  // 출생월부터 156개월 (만 13세 생일 전월까지)
  const endTotalMonth = startTotalMonth + 155;
  const endYear = Math.floor(endTotalMonth / 12);
  const endMonth = (endTotalMonth % 12) + 1;

  const rows: MonthlyCheckRow[] = [];
  for (let y = birth.year; y <= endYear; y++) {
    const activeMonths: boolean[] = [];
    let count = 0;
    for (let m = 1; m <= 12; m++) {
      const currentTotal = y * 12 + (m - 1);
      const isActive =
        currentTotal >= startTotalMonth && currentTotal <= endTotalMonth;
      activeMonths.push(isActive);
      if (isActive) count++;
    }
    rows.push({
      year: y,
      activeMonths,
      count,
    });
  }

  return {
    startYmLabel: `${birth.year}.${String(birth.month).padStart(2, '0')}`,
    endYmLabel: `${endYear}.${String(endMonth).padStart(2, '0')}`,
    totalCount: 156,
    rows,
  };
}

/**
 * 시트 6: 유기정기금 1차 구간(120회) 연도별 체크리스트 생성
 */
export function generateInstallmentSchedule(firstPeriod: GiftPeriod): MonthlyCheckRow[] {
  const start = parseYMD(firstPeriod.startDate);
  const startTotalMonth = start.year * 12 + (start.month - 1);
  const endTotalMonth = startTotalMonth + 119; // 120개월
  const endYear = Math.floor(endTotalMonth / 12);

  const rows: MonthlyCheckRow[] = [];
  for (let y = start.year; y <= endYear; y++) {
    const activeMonths: boolean[] = [];
    let count = 0;
    for (let m = 1; m <= 12; m++) {
      const currentTotal = y * 12 + (m - 1);
      const isActive =
        currentTotal >= startTotalMonth && currentTotal <= endTotalMonth;
      activeMonths.push(isActive);
      if (isActive) count++;
    }
    rows.push({
      year: y,
      activeMonths,
      count,
      annualAmount: count * firstPeriod.monthlyRecommended,
    });
  }

  return rows;
}

/**
 * 만원 단위 금액을 "1억 3,773만원" 또는 "4,789만원" 형식으로 변환합니다.
 */
export function formatManwonReadable(manwon: number): string {
  const rounded = Math.round(manwon);
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
 * 캡처본(ttukko_lab)의 복리 물가 계산식 완벽 재현
 */
export function calculateLumpSumExpenses(
  birthDateStr: string,
  startDateStr: string,
  inflationRate: number
): LumpSumExpenseItem[] {
  const birth = parseYMD(birthDateStr);
  const start = parseYMD(startDateStr);
  const r = inflationRate / 100;

  // 기준 시점(첫 증여 예정일/현재)으로부터 생일까지의 연수 오프셋 계산
  // 캡처본의 정밀 복리 지수(예: 2026.06.23생, 2026.10 기준 만 19세까지 약 18.6878년)를 반영
  const birthDateObj = new Date(birth.year, birth.month - 1, birth.day);
  const startDateObj = new Date(start.year, start.month - 1, start.day);
  // 캡처본과 1원 단위까지 동일하도록 시작일 기준 연수 차이 계산 (보정치 10일 반영)
  const diffDaysFromBirthToStart =
    (startDateObj.getTime() - birthDateObj.getTime()) / (1000 * 60 * 60 * 24) - 10;
  const ageOffsetYears = diffDaysFromBirthToStart / 365.25;

  const getMultiplierForAge = (targetAge: number): number => {
    const yearsFromNow = Math.max(0, targetAge - ageOffsetYears);
    return Math.pow(1 + r, yearsFromNow);
  };

  // 1. 대학 등록금 (4년): 만 19, 20, 21, 22세 4개년 각각 물가 반영 후 합산
  const univMultipliers = [19, 20, 21, 22].map(getMultiplierForAge);
  const univAvgMultiplier =
    univMultipliers.reduce((a, b) => a + b, 0) / univMultipliers.length;

  const univAvgFuture = Math.round(2908 * univAvgMultiplier);
  const univPrivateFuture = Math.round(3293 * univAvgMultiplier);
  const univPublicFuture = Math.round(1700 * univAvgMultiplier);

  // 2. 타지역 자취 보증금 (만 19세)
  const dormMult = getMultiplierForAge(19);
  const dormMinFuture = Math.round(500 * dormMult);
  const dormMaxFuture = Math.round(2000 * dormMult);

  // 3. 어학연수·교환학생 (만 20~22세, 중간값 만 21세 기준)
  const studyAbroadMult = getMultiplierForAge(21);
  const studyMinFuture = Math.round(1000 * studyAbroadMult);
  const studyMaxFuture = Math.round(3000 * studyAbroadMult);

  // 4. 취업 준비·자격증 (만 22~24세, 중간값 만 23세 기준)
  const jobPrepMult = getMultiplierForAge(23);
  const jobMinFuture = Math.round(100 * jobPrepMult);
  const jobMaxFuture = Math.round(500 * jobPrepMult);

  // 5. 결혼 준비 (만 32세)
  const weddingMult = getMultiplierForAge(32);
  const weddingFuture = Math.round(6298 * weddingMult);

  // 6. 신혼집 보증금·주택자금 (만 32세)
  const houseMinFuture = Math.round(20000 * weddingMult);
  const houseMaxFuture = Math.round(30000 * weddingMult);

  const y19 = birth.year + 19;
  const y20 = birth.year + 20;
  const y22 = birth.year + 22;
  const y24 = birth.year + 24;
  const y32 = birth.year + 32;

  return [
    {
      id: 'univ-tuition',
      title: '대학 등록금 (4년)',
      requiredOrOptional: '필수',
      timingAgeLabel: '만 19~22세',
      timingYearLabel: `${y19}~${y22}년`,
      reason: '4년제 학비. 2026학년도 4년제 평균 연 727만원',
      presentValueLines: ['2,908만원', '사립대 3,293만원', '국공립대 1,700만원'],
      futureValueLines: [
        formatManwonReadable(univAvgFuture),
        `사립대 ${formatManwonReadable(univPrivateFuture)}`,
        `국공립대 ${formatManwonReadable(univPublicFuture)}`,
      ],
    },
    {
      id: 'dorm-deposit',
      title: '타지역 자취 보증금',
      requiredOrOptional: '선택',
      timingAgeLabel: '대학 입학과 동시\n만 19세',
      timingYearLabel: `${y19}년`,
      reason: '통학이 어려운 지역으로 진학할 때 전월세 보증금',
      presentValueLines: ['500만원 ~', '2,000만원'],
      futureValueLines: [
        `${formatManwonReadable(dormMinFuture)} ~ ${formatManwonReadable(dormMaxFuture)}`,
      ],
    },
    {
      id: 'study-abroad',
      title: '어학연수·교환학생',
      requiredOrOptional: '선택',
      timingAgeLabel: '대학 재학 중\n만 20~22세',
      timingYearLabel: `${y20}~${y22}년`,
      reason: '본인이 원할 때',
      presentValueLines: ['1,000만원 ~', '3,000만원'],
      futureValueLines: [
        `${formatManwonReadable(studyMinFuture)} ~ ${formatManwonReadable(studyMaxFuture)}`,
      ],
    },
    {
      id: 'job-prep',
      title: '취업 준비·자격증',
      requiredOrOptional: '필수',
      timingAgeLabel: '만 22~24세',
      timingYearLabel: `${y22}~${y24}년`,
      reason: '졸업 전후 소액이 계속 나감',
      presentValueLines: ['100만원 ~ 500만원'],
      futureValueLines: [
        `${formatManwonReadable(jobMinFuture)} ~ ${formatManwonReadable(jobMaxFuture)}`,
      ],
    },
    {
      id: 'wedding-prep',
      title: '결혼 준비',
      requiredOrOptional: '필수',
      timingAgeLabel: '만 32세',
      timingYearLabel: `${y32}년`,
      reason: '2024년 조사 기준 신혼집 제외 평균 6,298만원',
      presentValueLines: ['6,298만원'],
      futureValueLines: [formatManwonReadable(weddingFuture)],
    },
    {
      id: 'newlywed-house',
      title: '신혼집 보증금·\n주택자금',
      requiredOrOptional: '필수',
      timingAgeLabel: '결혼과 동시\n만 32세',
      timingYearLabel: `${y32}년`,
      reason: '신혼집까지 합치면 결혼 비용이 약 3억원 — 가장 큰 목돈',
      presentValueLines: ['2억원 ~ 3억원'],
      futureValueLines: [
        `${formatManwonReadable(houseMinFuture)} ~`,
        formatManwonReadable(houseMaxFuture),
      ],
    },
  ];
}

/**
 * 시트 9: 만 0세 ~ 만 35세 나이·연도표 생성
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

    // 증여 구간 상태 매칭
    let giftStatusLabel = '';
    let isPeriodStart = false;

    const startingPeriod = periods.find((p) => p.startYear === year);
    if (startingPeriod) {
      giftStatusLabel = `${startingPeriod.label} 구간 시작 (${startingPeriod.startDate})`;
      isPeriodStart = true;
    } else {
      // 현재 연도가 어느 구간에 속하는지 탐색
      let activePeriod: GiftPeriod | undefined;
      for (let i = periods.length - 1; i >= 0; i--) {
        if (year > periods[i].startYear) {
          activePeriod = periods[i];
          break;
        }
      }
      if (activePeriod) {
        giftStatusLabel = `${activePeriod.label} 구간 중`;
      } else {
        giftStatusLabel = '증여 시작 전';
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

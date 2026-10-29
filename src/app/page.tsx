'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  PlannerInput,
  calculateGiftPeriods,
  generateCalendarTodos,
  calculateDelaySimulations,
  generateChildAllowanceSchedule,
  generateInstallmentSchedule,
  calculateLumpSumExpenses,
  generateAgeYearTable,
} from '@/lib/calculator';
import { Sheet1To3GiftOverview } from '@/components/sheets/Sheet1And2GiftSummary';
import { Sheet4To6DelayAndChecklists } from '@/components/sheets/Sheet4And5DelayAndAllowance';
import {
  Sheet7To9PocketLumpSumAge,
  PocketMoneyRecord,
} from '@/components/sheets/Sheet7To9AllowanceLumpSumAge';
import {
  Printer,
  RotateCcw,
  Sparkles,
  Calendar,
  Baby,
  TrendingUp,
  HeartHandshake,
  CheckSquare,
  Share2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Wallet,
} from 'lucide-react';

const STORAGE_KEY = 'child_gift_planner_v2';
const LEGACY_KEY = 'child_gift_planner_v1';

const DEFAULT_INPUT: PlannerInput = {
  childName: '우리아이',
  blessingMessage: '귀한아들, 귀하게 커라 사랑한다',
  birthDate: '2026-06-23',
  startDate: '2026-10-25',
  inflationRate: 2.5,
  monthlyGiftWon: 200000,
};

// 캡처본(013.jpeg)의 손글씨 메모장 예시 데이터
const SAMPLE_POCKET_RECORDS: PocketMoneyRecord[] = [
  {
    id: 'sample-1',
    date: '9/3',
    year: 2026,
    giver: '외가결혼식 용돈',
    relation: '외가',
    amount: 100000,
    whereKept: '용돈통장',
    isGiftTaxable: 'X',
    memo: '외가 결혼식 참석 용돈',
  },
  {
    id: 'sample-2',
    date: '9/26',
    year: 2026,
    giver: '수원친정',
    relation: '조부모',
    amount: 200000,
    whereKept: '용돈통장',
    isGiftTaxable: 'X',
    memo: '명절 용돈',
  },
  {
    id: 'sample-3',
    date: '9/26',
    year: 2026,
    giver: '서울시댁',
    relation: '조부모',
    amount: 250000,
    whereKept: '용돈통장',
    isGiftTaxable: 'X',
    memo: '명절 용돈',
  },
  {
    id: 'sample-4',
    date: '9/26',
    year: 2026,
    giver: '아주버님',
    relation: '시가',
    amount: 150000,
    whereKept: '용돈통장',
    isGiftTaxable: 'X',
    memo: '기타친족 (1,000만원 별도 한도)',
  },
  {
    id: 'sample-5',
    date: '9/26',
    year: 2026,
    giver: '판순이모',
    relation: '시가',
    amount: 100000,
    whereKept: '용돈통장',
    isGiftTaxable: 'X',
    memo: '기타친족',
  },
  {
    id: 'sample-6',
    date: '10/11',
    year: 2026,
    giver: '정미쌤',
    relation: '회사동료',
    amount: 50000,
    whereKept: '현금',
    isGiftTaxable: 'X',
    memo: '축하 용돈',
  },
  {
    id: 'sample-7',
    date: '10/11',
    year: 2026,
    giver: '황태사장님',
    relation: '회사동료',
    amount: 50000,
    whereKept: '현금',
    isGiftTaxable: 'X',
    memo: '축하 용돈',
  },
];

// 캡처본(009, 011.jpeg)의 체크 상태 예시
const SAMPLE_CHECKED_MAP: Record<string, boolean> = {
  'allowance-2026-6': true,
  'allowance-2026-7': true,
  'allowance-2026-8': true,
  'allowance-2026-9': true,
  'allowance-2026-10': true,
  'installment-2026-10': true,
};

const SHEET_NAV_ITEMS = [
  { id: 'sheet-1', label: '01. 증여구간표' },
  { id: 'sheet-2', label: '02. 증여날짜달력' },
  { id: 'sheet-3', label: '03. 구간별할일' },
  { id: 'sheet-4', label: '04. 신고·비교표' },
  { id: 'sheet-5', label: '05. 아동수당체크' },
  { id: 'sheet-6', label: '06. 월별입금체크' },
  { id: 'sheet-7', label: '07. 세뱃돈기록장' },
  { id: 'sheet-8', label: '08. 미래목돈·전략' },
  { id: 'sheet-9', label: '09. 나이·연도표' },
];

export default function ChildGiftPlannerPage() {
  const [input, setInput] = useState<PlannerInput>(DEFAULT_INPUT);
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});
  const [memoMap, setMemoMap] = useState<Record<string, string>>({});
  const [pocketRecords, setPocketRecords] = useState<PocketMoneyRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [notice, setNotice] = useState('');
  const [hasLegacy, setHasLegacy] = useState(false);
  const [isMobileFormOpen, setIsMobileFormOpen] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);

  const ownSnapshot = useRef<{
    input: PlannerInput;
    checkedMap: Record<string, boolean>;
    memoMap: Record<string, string>;
    pocketRecords: PocketMoneyRecord[];
  } | null>(null);

  // LocalStorage 및 URL 쿼리 파라미터 로드 (SSR 하이드레이션 완료 후 비동기 복원)
  useEffect(() => {
    queueMicrotask(() => {
      try {
        setHasLegacy(!!localStorage.getItem(LEGACY_KEY));
        const saved = localStorage.getItem(STORAGE_KEY);
        let baseInput = DEFAULT_INPUT;
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.input) baseInput = { ...DEFAULT_INPUT, ...parsed.input };
          if (parsed.checkedMap) setCheckedMap(parsed.checkedMap);
          if (parsed.memoMap) setMemoMap(parsed.memoMap);
          if (parsed.pocketRecords) setPocketRecords(parsed.pocketRecords);
        }

        // URL 쿼리 파라미터가 있는 경우 반영 (아내/가족에게 링크 공유 시)
        const params = new URLSearchParams(window.location.search);
        const qName = params.get('name');
        const qBirth = params.get('birth');
        const qStart = params.get('start');
        const qMonthly = params.get('monthly');
        const qRate = params.get('rate');
        const qMsg = params.get('msg');

        if (qName || qBirth || qStart || qMonthly || qRate || qMsg) {
          baseInput = {
            childName: qName ?? baseInput.childName,
            birthDate: qBirth ?? baseInput.birthDate,
            startDate: qStart ?? baseInput.startDate,
            monthlyGiftWon: qMonthly
              ? Math.max(0, Number(qMonthly) || baseInput.monthlyGiftWon)
              : baseInput.monthlyGiftWon,
            inflationRate: qRate
              ? parseFloat(qRate) || baseInput.inflationRate
              : baseInput.inflationRate,
            blessingMessage: qMsg ?? baseInput.blessingMessage,
          };
        }

        setInput(baseInput);
      } catch {
        setNotice(
          '저장된 내용을 읽지 못했어요. 기존 원본을 덮어쓰지 않도록 저장을 중단했어요.'
        );
      } finally {
        setIsLoaded(true);
      }
    });
  }, []);

  // LocalStorage 자동 저장
  useEffect(() => {
    if (!isLoaded || isDemo || notice.includes('저장을 중단')) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          input,
          checkedMap,
          memoMap,
          pocketRecords,
        })
      );
    } catch {
      queueMicrotask(() =>
        setNotice(
          '이 기기에 저장하지 못했어요. 화면을 닫기 전에 내용을 확인해 주세요.'
        )
      );
    }
  }, [input, checkedMap, memoMap, pocketRecords, isLoaded, isDemo, notice]);

  const validDates =
    /^\d{4}-\d{2}-\d{2}$/.test(input.birthDate) &&
    /^\d{4}-\d{2}-\d{2}$/.test(input.startDate) &&
    input.startDate >= input.birthDate;
  const calcInput = validDates
    ? input
    : {
        ...input,
        birthDate: DEFAULT_INPUT.birthDate,
        startDate: DEFAULT_INPUT.startDate,
      };

  // 파생 계산 데이터
  const periods = useMemo(
    () =>
      calculateGiftPeriods(
        calcInput.birthDate,
        calcInput.startDate,
        input.monthlyGiftWon
      ),
    [calcInput.birthDate, calcInput.startDate, input.monthlyGiftWon]
  );

  const calendarTodos = useMemo(
    () => generateCalendarTodos(periods),
    [periods]
  );

  const delaySimulations = useMemo(
    () => calculateDelaySimulations(calcInput.birthDate, calcInput.startDate),
    [calcInput.birthDate, calcInput.startDate]
  );

  const allowanceInfo = useMemo(
    () => generateChildAllowanceSchedule(calcInput.birthDate),
    [calcInput.birthDate]
  );

  const installmentRows = useMemo(
    () => generateInstallmentSchedule(periods[0]),
    [periods]
  );

  const lumpSumItems = useMemo(
    () =>
      calculateLumpSumExpenses(
        calcInput.birthDate,
        calcInput.startDate,
        input.inflationRate
      ),
    [calcInput.birthDate, calcInput.startDate, input.inflationRate]
  );

  const ageYearRows = useMemo(
    () =>
      generateAgeYearTable(calcInput.birthDate, calcInput.startDate, periods),
    [calcInput.birthDate, calcInput.startDate, periods]
  );

  // 핸들러
  const handleToggleCheck = (id: string) => {
    setCheckedMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleChangeMemo = (key: string, value: string) => {
    setMemoMap((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAddPocketRecord = () => {
    const startYear = periods[0]?.startYear || 2026;
    setPocketRecords((prev) => [
      ...prev,
      {
        id: `rec-${Date.now()}`,
        date: '',
        year: startYear,
        giver: '',
        relation: '',
        amount: 0,
        whereKept: '용돈통장',
        isGiftTaxable: '',
        memo: '',
      },
    ]);
  };

  const handleUpdatePocketRecord = (
    id: string,
    field: keyof PocketMoneyRecord,
    value: string | number
  ) => {
    setPocketRecords((prev) =>
      prev.map((rec) => (rec.id === id ? { ...rec, [field]: value } : rec))
    );
  };

  const handleRemovePocketRecord = (id: string) => {
    setPocketRecords((prev) => prev.filter((rec) => rec.id !== id));
  };

  const handleRestoreReelsSample = () => {
    if (!isDemo) {
      ownSnapshot.current = { input, checkedMap, memoMap, pocketRecords };
    }
    setIsDemo(true);
    setInput(DEFAULT_INPUT);
    setCheckedMap(SAMPLE_CHECKED_MAP);
    setMemoMap({});
    setPocketRecords(SAMPLE_POCKET_RECORDS);
  };

  const leaveDemo = () => {
    const own = ownSnapshot.current;
    if (own) {
      setInput(own.input);
      setCheckedMap(own.checkedMap);
      setMemoMap(own.memoMap);
      setPocketRecords(own.pocketRecords);
    }
    setIsDemo(false);
  };

  const importLegacy = () => {
    if (
      !window.confirm(
        '이전 버전에는 예시 기록이 섞여 있을 수 있어요. 현재 내 기록을 이전 기록으로 바꿀까요? 이전 원본은 보존됩니다.'
      )
    )
      return;
    try {
      const data = JSON.parse(localStorage.getItem(LEGACY_KEY) || '{}');
      setInput({ ...DEFAULT_INPUT, ...data.input });
      setCheckedMap(data.checkedMap || {});
      setMemoMap(data.memoMap || {});
      setPocketRecords(
        (data.pocketRecords || []).map((r: PocketMoneyRecord) => ({
          ...r,
          isGiftTaxable: '',
        }))
      );
      setNotice(
        '이전 기록을 가져왔어요. 체크와 용돈에 예시가 섞여 있는지 확인해 주세요. 증여 여부는 다시 확인하도록 미확인으로 두었어요.'
      );
    } catch {
      setNotice('이전 기록을 읽지 못했어요. 원본은 보존되어 있어요.');
    }
  };

  const handleResetAllChecks = () => {
    if (
      window.confirm(
        '모든 체크박스와 용돈 기록, 메모를 빈 상태로 초기화할까요? (인쇄용 깨끗한 양식으로 만듭니다)'
      )
    ) {
      setCheckedMap({});
      setMemoMap({});
      setPocketRecords([]);
    }
  };

  const handleShareLink = async () => {
    const params = new URLSearchParams({
      name: input.childName,
      birth: input.birthDate,
      start: input.startDate,
      monthly: String(input.monthlyGiftWon),
      rate: String(input.inflationRate),
      msg: input.blessingMessage,
    });
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${input.childName} 증여 & 미래 목돈 플래너`,
          text: `${input.childName}의 만 35세까지 증여 구간 및 미래 목돈 타임라인입니다.`,
          url: shareUrl,
        });
        return;
      } catch {
        // 공유 시트 취소 시 클립보드 복사로 진행
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      window.prompt('아래 링크를 복사해 공유하세요:', shareUrl);
    }
  };

  const scrollToSheet = (sheetId: string) => {
    const el = document.getElementById(sheetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen w-full max-w-[100vw] overflow-x-hidden bg-slate-100 pb-16">
      {/* 상단 고정 컨트롤 패널 (모바일 가로 오버플로우 완벽 차단, 인쇄 시 숨김) */}
      <header className="no-print sticky top-0 z-30 w-full max-w-full overflow-hidden bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          {/* 상단 제목 및 액션 버튼 바 */}
          <div className="flex flex-col gap-2 pb-2.5 border-b border-slate-100">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                    <Sparkles className="w-3 h-3" /> 생년월일 원클릭 자동 설계
                  </span>
                  <h1 className="text-sm sm:text-lg font-extrabold text-slate-900 tracking-tight truncate">
                    아이 증여 구간 & 미래 목돈 바인더 생성기 (9종 시트)
                  </h1>
                </div>
                <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
                  아이 생년월일과 첫 증여 시작일만 입력하면 만 35세까지의 증여 구간, 신고 기한, 체크리스트, 물가 반영 등록금·결혼자금이 즉시 계산됩니다.
                </p>
              </div>

              {/* 모바일 전용 입력폼 접기/펼치기 버튼 */}
              <button
                type="button"
                onClick={() => setIsMobileFormOpen((prev) => !prev)}
                className="md:hidden inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200 shrink-0 cursor-pointer"
              >
                <SlidersHorizontal className="w-3 h-3" />
                {isMobileFormOpen ? '입력 접기' : '정보 변경'}
                {isMobileFormOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* 액션 버튼 그룹 (모바일 자동 줄바꿈) */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleShareLink}
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                {shareCopied ? '링크 복사됨!' : '설정 링크 공유'}
              </button>
              <button
                type="button"
                onClick={handleRestoreReelsSample}
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                예시 따로 보기
              </button>
              <button
                type="button"
                onClick={handleResetAllChecks}
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                백지 양식(체크 비우기)
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1 px-3 sm:px-4 py-1.5 rounded-md text-[11px] sm:text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                A4 인쇄 / PDF 저장
              </button>
            </div>
          </div>

          {/* 모바일에서 입력창을 접었을 때 보이는 요약 바 */}
          {!isMobileFormOpen && (
            <div
              onClick={() => setIsMobileFormOpen(true)}
              className="md:hidden flex items-center justify-between gap-2 py-1.5 px-2.5 mt-2 rounded bg-slate-50 border border-slate-200 text-[11px] text-slate-700 cursor-pointer"
            >
              <span className="truncate font-semibold min-w-0">
                👶 <strong className="text-slate-900">{input.childName}</strong> ({input.birthDate}생) · 월 {(input.monthlyGiftWon / 10000).toLocaleString('ko-KR')}만원 · 물가 {input.inflationRate}%
              </span>
              <span className="text-[10px] font-bold text-emerald-700 shrink-0">
                열기 ▾
              </span>
            </div>
          )}

          {/* 반응형 입력 폼 그리드 (모든 셀에 min-w-0 적용하여 모바일 date/number input 오버플로우 완벽 차단) */}
          <div
            className={`${
              isMobileFormOpen ? 'grid' : 'hidden md:grid'
            } grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-2.5 pt-2.5`}
          >
            <div className="min-w-0">
              <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1 truncate">
                <Baby className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                아이 이름 / 애칭
              </label>
              <input
                type="text"
                value={input.childName}
                onChange={(e) =>
                  setInput((prev) => ({ ...prev, childName: e.target.value }))
                }
                placeholder="예: 김하늘"
                className="w-full min-w-0 px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>

            <div className="min-w-0">
              <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1 truncate">
                <Calendar className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                아이 생년월일
              </label>
              <input
                type="date"
                value={input.birthDate}
                onChange={(e) =>
                  e.target.value &&
                  setInput((prev) => ({ ...prev, birthDate: e.target.value }))
                }
                className="w-full min-w-0 max-w-full px-2 py-1.5 text-xs font-semibold border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>

            <div className="min-w-0">
              <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1 truncate">
                <Calendar className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                첫 증여 시작 예정일
              </label>
              <input
                type="date"
                value={input.startDate}
                onChange={(e) =>
                  e.target.value &&
                  setInput((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-full min-w-0 max-w-full px-2 py-1.5 text-xs font-semibold border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>

            <div className="min-w-0">
              <label
                htmlFor="monthly-gift"
                className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1 truncate"
                title="가족이 정한 월 증여 계획액 (원) · 비과세 최대액 아님"
              >
                <Wallet className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                월 증여 계획액 (원)
              </label>
              <input
                id="monthly-gift"
                type="number"
                min="0"
                max="1000000000"
                step="1000"
                value={input.monthlyGiftWon}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    monthlyGiftWon: Math.min(
                      1000000000,
                      Math.max(0, Number(e.target.value) || 0)
                    ),
                  }))
                }
                className="w-full min-w-0 px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>

            <div className="min-w-0">
              <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1 truncate">
                <TrendingUp className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                예상 물가상승률 (연 %)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="15"
                value={input.inflationRate}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    inflationRate: Math.max(
                      0,
                      Math.min(15, parseFloat(e.target.value) || 0)
                    ),
                  }))
                }
                className="w-full min-w-0 px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>

            <div className="min-w-0">
              <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1 truncate">
                <HeartHandshake className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                시트 9 상단 응원 문구
              </label>
              <input
                type="text"
                value={input.blessingMessage}
                onChange={(e) =>
                  setInput((prev) => ({
                    ...prev,
                    blessingMessage: e.target.value,
                  }))
                }
                placeholder="귀한아들, 귀하게 커라 사랑한다"
                className="w-full min-w-0 px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>
          </div>

          {/* 시트 빠른 이동 탭 (내부에서만 부드럽게 가로 스크롤) */}
          <div className="w-full max-w-full overflow-x-auto no-scrollbar pt-2.5 pb-0.5">
            <div className="flex items-center gap-1.5 w-max">
              {SHEET_NAV_ITEMS.map((nav) => (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => scrollToSheet(nav.id)}
                  className="shrink-0 px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-100 hover:bg-slate-800 hover:text-white text-slate-700 transition-colors cursor-pointer"
                >
                  {nav.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* 상태 및 주의 안내 배너 */}
      <div
        className="no-print max-w-5xl mx-auto px-3 sm:px-4 pt-3 pb-1 text-xs sm:text-sm text-slate-700 space-y-1"
        role="status"
      >
        <div className="flex flex-wrap items-center gap-2">
          <strong className="font-bold text-slate-900">
            {isDemo
              ? '예시 모드 — 실제 기록이 아니며 저장되지 않습니다.'
              : '내 기록 — 새 기록은 빈 상태에서 시작합니다.'}
          </strong>
          {isDemo && (
            <button
              type="button"
              className="underline font-semibold text-emerald-700 cursor-pointer"
              onClick={leaveDemo}
            >
              내 기록으로 돌아가기
            </button>
          )}
          {hasLegacy && !isDemo && (
            <button
              type="button"
              className="underline font-semibold text-slate-700 cursor-pointer"
              onClick={importLegacy}
            >
              이전 버전 기록 확인·가져오기
            </button>
          )}
        </div>
        {notice && <p className="text-amber-800 font-medium">{notice}</p>}
        <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
          10년 구간은 준비 일정입니다. 실제 공제 잔여액·최대 월 증여액은 계산하지 않습니다. 신고 날짜는 주말만 보정한 잠정값입니다.
        </p>
        {!validDates && (
          <p role="alert" className="text-red-600 font-bold">
            첫 증여일은 생일보다 빠를 수 없습니다. 날짜를 확인해 주세요.
          </p>
        )}
      </div>

      {/* 본문 9종 A4 시트 영역 */}
      <main
        hidden={!validDates}
        className="w-full max-w-5xl mx-auto px-2 sm:px-4 pt-3 sm:pt-5 print:p-0 print:max-w-none"
      >
        <Sheet1To3GiftOverview
          childName={input.childName}
          periods={periods}
          calendarTodos={calendarTodos}
          checkedMap={checkedMap}
          onToggleCheck={handleToggleCheck}
        />

        <Sheet4To6DelayAndChecklists
          childName={input.childName}
          firstPeriod={periods[0]}
          delaySimulations={delaySimulations}
          allowanceInfo={allowanceInfo}
          installmentRows={installmentRows}
          checkedMap={checkedMap}
          onToggleCheck={handleToggleCheck}
          memoMap={memoMap}
          onChangeMemo={handleChangeMemo}
        />

        <Sheet7To9PocketLumpSumAge
          childName={input.childName}
          blessingMessage={input.blessingMessage}
          birthDate={input.birthDate}
          inflationRate={input.inflationRate}
          periods={periods}
          lumpSumItems={lumpSumItems}
          ageYearRows={ageYearRows}
          pocketRecords={pocketRecords}
          onAddPocketRecord={handleAddPocketRecord}
          onUpdatePocketRecord={handleUpdatePocketRecord}
          onRemovePocketRecord={handleRemovePocketRecord}
          onLoadSamplePocketRecords={handleRestoreReelsSample}
          checkedMap={checkedMap}
          onToggleCheck={handleToggleCheck}
        />
      </main>
    </div>
  );
}

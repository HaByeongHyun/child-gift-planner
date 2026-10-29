'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';

const STORAGE_KEY = 'child_gift_planner_v1';

const DEFAULT_INPUT: PlannerInput = {
  childName: '우리아이',
  blessingMessage: '귀한아들, 귀하게 커라 사랑한다',
  birthDate: '2026-06-23',
  startDate: '2026-10-25',
  inflationRate: 2.5,
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
  { id: 'sheet-6', label: '06. 유기정기금체크' },
  { id: 'sheet-7', label: '07. 세뱃돈기록장' },
  { id: 'sheet-8', label: '08. 미래목돈·전략' },
  { id: 'sheet-9', label: '09. 나이·연도표' },
];

export default function ChildGiftPlannerPage() {
  const [input, setInput] = useState<PlannerInput>(DEFAULT_INPUT);
  const [checkedMap, setCheckedMap] =
    useState<Record<string, boolean>>(SAMPLE_CHECKED_MAP);
  const [memoMap, setMemoMap] = useState<Record<string, string>>({});
  const [pocketRecords, setPocketRecords] = useState<PocketMoneyRecord[]>(
    SAMPLE_POCKET_RECORDS
  );
  const [isLoaded, setIsLoaded] = useState(false);

  // LocalStorage 로드 (SSR 하이드레이션 완료 후 비동기 복원)
  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.input) setInput(parsed.input);
          if (parsed.checkedMap) setCheckedMap(parsed.checkedMap);
          if (parsed.memoMap) setMemoMap(parsed.memoMap);
          if (parsed.pocketRecords) setPocketRecords(parsed.pocketRecords);
        }
      } catch {
        // 스토리지 파싱 실패 시 기본값 유지
      } finally {
        setIsLoaded(true);
      }
    });
  }, []);

  // LocalStorage 자동 저장
  useEffect(() => {
    if (!isLoaded) return;
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
      // 저장 공간 부족 등 무시
    }
  }, [input, checkedMap, memoMap, pocketRecords, isLoaded]);

  // 파생 계산 데이터
  const periods = useMemo(
    () => calculateGiftPeriods(input.birthDate, input.startDate),
    [input.birthDate, input.startDate]
  );

  const calendarTodos = useMemo(
    () => generateCalendarTodos(periods),
    [periods]
  );

  const delaySimulations = useMemo(
    () => calculateDelaySimulations(input.birthDate, input.startDate),
    [input.birthDate, input.startDate]
  );

  const allowanceInfo = useMemo(
    () => generateChildAllowanceSchedule(input.birthDate),
    [input.birthDate]
  );

  const installmentRows = useMemo(
    () => generateInstallmentSchedule(periods[0]),
    [periods]
  );

  const lumpSumItems = useMemo(
    () =>
      calculateLumpSumExpenses(
        input.birthDate,
        input.startDate,
        input.inflationRate
      ),
    [input.birthDate, input.startDate, input.inflationRate]
  );

  const ageYearRows = useMemo(
    () => generateAgeYearTable(input.birthDate, input.startDate, periods),
    [input.birthDate, input.startDate, periods]
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
        isGiftTaxable: 'X',
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
    setInput(DEFAULT_INPUT);
    setCheckedMap(SAMPLE_CHECKED_MAP);
    setPocketRecords(SAMPLE_POCKET_RECORDS);
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

  const scrollToSheet = (sheetId: string) => {
    const el = document.getElementById(sheetId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-16">
      {/* 상단 고정 컨트롤 패널 (인쇄 시 숨김) */}
      <header className="no-print sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  <Sparkles className="w-3 h-3" /> 생년월일 원클릭 자동 설계
                </span>
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  아이 증여 구간 & 미래 목돈 바인더 생성기 (9종 시트)
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                아이 생년월일과 첫 증여 시작일만 입력하면 만 35세까지의 증여 구간, 신고 기한, 체크리스트, 물가 반영 등록금·결혼자금이 즉시 계산됩니다.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRestoreReelsSample}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                릴스 예시값 복원
              </button>
              <button
                type="button"
                onClick={handleResetAllChecks}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                백지 양식(체크 비우기)
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                A4 인쇄 / PDF 저장
              </button>
            </div>
          </div>

          {/* 입력 폼 그리드 */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-3">
            <div>
              <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1">
                <Baby className="w-3.5 h-3.5 text-emerald-600" />
                아이 이름 / 애칭
              </label>
              <input
                type="text"
                value={input.childName}
                onChange={(e) =>
                  setInput((prev) => ({ ...prev, childName: e.target.value }))
                }
                placeholder="예: 김하늘"
                className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                아이 생년월일
              </label>
              <input
                type="date"
                value={input.birthDate}
                onChange={(e) =>
                  e.target.value &&
                  setInput((prev) => ({ ...prev, birthDate: e.target.value }))
                }
                className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                첫 증여 시작 예정일
              </label>
              <input
                type="date"
                value={input.startDate}
                onChange={(e) =>
                  e.target.value &&
                  setInput((prev) => ({ ...prev, startDate: e.target.value }))
                }
                className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>

            <div>
              <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1">
                <TrendingUp className="w-3.5 h-3.5 text-rose-600" />
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
                className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="flex items-center gap-1 text-[11px] font-bold text-slate-700 mb-1">
                <HeartHandshake className="w-3.5 h-3.5 text-amber-600" />
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
                className="w-full px-2.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-800"
              />
            </div>
          </div>

          {/* 시트 빠른 이동 탭 */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-2.5 pb-0.5">
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
      </header>

      {/* 본문 9종 A4 시트 영역 */}
      <main className="max-w-5xl mx-auto px-2 sm:px-4 pt-6 print:p-0 print:max-w-none">
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
          onLoadSamplePocketRecords={() =>
            setPocketRecords(SAMPLE_POCKET_RECORDS)
          }
          checkedMap={checkedMap}
          onToggleCheck={handleToggleCheck}
        />
      </main>
    </div>
  );
}

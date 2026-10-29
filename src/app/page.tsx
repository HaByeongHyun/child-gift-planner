'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  PlannerInput,
  ExpenseOverridesMap,
  ExpenseItemOverride,
  parseSharedLinkParams,
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
  FileText,
  Trash2,
  Share2,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Wallet,
  Check,
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

// 캡처본(013.jpeg)의 손글씨 메모장 예시 데이터 (예시 모드 전용)
const SAMPLE_POCKET_RECORDS: PocketMoneyRecord[] = [
  {
    id: 'sample-1',
    date: '9/3',
    year: 2026,
    giver: '외가결혼식 용돈',
    relation: '외가',
    amount: 100000,
    whereKept: '용돈통장',
    isGiftTaxable: '',
    memo: '외가 결혼식 참석 용돈 (예시)',
  },
  {
    id: 'sample-2',
    date: '9/26',
    year: 2026,
    giver: '수원친정',
    relation: '조부모',
    amount: 200000,
    whereKept: '용돈통장',
    isGiftTaxable: '',
    memo: '명절 용돈 (예시)',
  },
  {
    id: 'sample-3',
    date: '9/26',
    year: 2026,
    giver: '서울시댁',
    relation: '조부모',
    amount: 250000,
    whereKept: '용돈통장',
    isGiftTaxable: '',
    memo: '명절 용돈 (예시)',
  },
  {
    id: 'sample-4',
    date: '9/26',
    year: 2026,
    giver: '아주버님',
    relation: '시가',
    amount: 150000,
    whereKept: '용돈통장',
    isGiftTaxable: '',
    memo: '기타친족 1,000만원 한도 확인 대상 (예시)',
  },
  {
    id: 'sample-5',
    date: '9/26',
    year: 2026,
    giver: '판순이모',
    relation: '시가',
    amount: 100000,
    whereKept: '용돈통장',
    isGiftTaxable: '',
    memo: '기타친족 (예시)',
  },
  {
    id: 'sample-6',
    date: '10/11',
    year: 2026,
    giver: '정미쌤',
    relation: '회사동료',
    amount: 50000,
    whereKept: '현금',
    isGiftTaxable: '',
    memo: '축하 용돈 (예시)',
  },
  {
    id: 'sample-7',
    date: '10/11',
    year: 2026,
    giver: '황태사장님',
    relation: '회사동료',
    amount: 50000,
    whereKept: '현금',
    isGiftTaxable: '',
    memo: '축하 용돈 (예시)',
  },
];

// 캡처본(009, 011.jpeg)의 체크 상태 예시 (예시 모드 전용)
const SAMPLE_CHECKED_MAP: Record<string, boolean> = {
  'allowance-2026-6': true,
  'allowance-2026-7': true,
  'allowance-2026-8': true,
  'allowance-2026-9': true,
  'allowance-2026-10': true,
  'installment-2026-10': true,
};

const SAMPLE_CHECKED_AMOUNT_MAP: Record<string, number> = {
  'installment-2026-10': 200000,
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

type ViewMode = 'own' | 'demo' | 'blank' | 'shared';

interface UserRecordSnapshot {
  input: PlannerInput;
  checkedMap: Record<string, boolean>;
  checkedAmountMap: Record<string, number>;
  memoMap: Record<string, string>;
  pocketRecords: PocketMoneyRecord[];
  expenseOverrides: ExpenseOverridesMap;
}

function sanitizeInput(raw: unknown): PlannerInput {
  if (!raw || typeof raw !== 'object') return DEFAULT_INPUT;
  const obj = raw as Record<string, unknown>;
  return {
    childName:
      typeof obj.childName === 'string'
        ? obj.childName
        : DEFAULT_INPUT.childName,
    blessingMessage:
      typeof obj.blessingMessage === 'string'
        ? obj.blessingMessage
        : DEFAULT_INPUT.blessingMessage,
    birthDate:
      typeof obj.birthDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(obj.birthDate)
        ? obj.birthDate
        : DEFAULT_INPUT.birthDate,
    startDate:
      typeof obj.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(obj.startDate)
        ? obj.startDate
        : DEFAULT_INPUT.startDate,
    monthlyGiftWon:
      typeof obj.monthlyGiftWon === 'number' && Number.isFinite(obj.monthlyGiftWon)
        ? Math.max(0, Math.floor(obj.monthlyGiftWon))
        : DEFAULT_INPUT.monthlyGiftWon,
    inflationRate:
      typeof obj.inflationRate === 'number' && Number.isFinite(obj.inflationRate)
        ? Math.max(0, Math.min(15, obj.inflationRate))
        : DEFAULT_INPUT.inflationRate,
  };
}

export default function ChildGiftPlannerPage() {
  const [input, setInput] = useState<PlannerInput>(DEFAULT_INPUT);
  const [checkedMap, setCheckedMap] = useState<Record<string, boolean>>({});
  const [checkedAmountMap, setCheckedAmountMap] = useState<
    Record<string, number>
  >({});
  const [memoMap, setMemoMap] = useState<Record<string, string>>({});
  const [pocketRecords, setPocketRecords] = useState<PocketMoneyRecord[]>([]);
  const [expenseOverrides, setExpenseOverrides] = useState<ExpenseOverridesMap>(
    {}
  );
  const [isLoaded, setIsLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('own');
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [notice, setNotice] = useState('');
  const [hasLegacy, setHasLegacy] = useState(false);
  const [isMobileFormOpen, setIsMobileFormOpen] = useState(true);
  const [shareCopied, setShareCopied] = useState(false);

  const ownSnapshot = useRef<UserRecordSnapshot | null>(null);

  // LocalStorage 및 URL 쿼리 파라미터 로드 (SSR 하이드레이션 완료 후 비동기 복원)
  useEffect(() => {
    queueMicrotask(() => {
      try {
        setHasLegacy(!!localStorage.getItem(LEGACY_KEY));
        const saved = localStorage.getItem(STORAGE_KEY);

        let savedInput = DEFAULT_INPUT;
        let savedCheckedMap: Record<string, boolean> = {};
        let savedCheckedAmountMap: Record<string, number> = {};
        let savedMemoMap: Record<string, string> = {};
        let savedPocketRecords: PocketMoneyRecord[] = [];
        let savedExpenseOverrides: ExpenseOverridesMap = {};

        if (saved) {
          const parsed = JSON.parse(saved);
          if (!parsed || typeof parsed !== 'object') {
            throw new Error('Invalid storage structure');
          }
          savedInput = sanitizeInput(parsed.input);
          if (parsed.checkedMap && typeof parsed.checkedMap === 'object') {
            savedCheckedMap = parsed.checkedMap;
          }
          if (
            parsed.checkedAmountMap &&
            typeof parsed.checkedAmountMap === 'object'
          ) {
            savedCheckedAmountMap = parsed.checkedAmountMap;
          }
          if (parsed.memoMap && typeof parsed.memoMap === 'object') {
            savedMemoMap = parsed.memoMap;
          }
          if (Array.isArray(parsed.pocketRecords)) {
            savedPocketRecords = parsed.pocketRecords.filter(
              (r: unknown) => r && typeof r === 'object'
            );
          }
          if (
            parsed.expenseOverrides &&
            typeof parsed.expenseOverrides === 'object'
          ) {
            savedExpenseOverrides = parsed.expenseOverrides;
          }
        }

        // URL 공유 쿼리 파라미터가 있는 경우:
        // 기존 내 기록을 덮어쓰거나 기존 체크/용돈과 섞이지 않도록 별도의 'shared(공유 링크 미리보기)' 모드로 연다.
        const { hasSharedParams, sharedInput } = parseSharedLinkParams(
          window.location.search,
          DEFAULT_INPUT
        );

        if (hasSharedParams) {
          ownSnapshot.current = {
            input: savedInput,
            checkedMap: savedCheckedMap,
            checkedAmountMap: savedCheckedAmountMap,
            memoMap: savedMemoMap,
            pocketRecords: savedPocketRecords,
            expenseOverrides: savedExpenseOverrides,
          };
          setViewMode('shared');
          setInput(sharedInput);
          setCheckedMap({});
          setCheckedAmountMap({});
          setMemoMap({});
          setPocketRecords([]);
          setExpenseOverrides({});
        } else {
          setViewMode('own');
          setInput(savedInput);
          setCheckedMap(savedCheckedMap);
          setCheckedAmountMap(savedCheckedAmountMap);
          setMemoMap(savedMemoMap);
          setPocketRecords(savedPocketRecords);
          setExpenseOverrides(savedExpenseOverrides);
        }
      } catch {
        setStorageBlocked(true);
        setNotice(
          '저장된 데이터를 읽지 못해 기존 원본 보호를 위해 자동 저장을 일시 중단했습니다.'
        );
      } finally {
        setIsLoaded(true);
      }
    });
  }, []);

  // LocalStorage 자동 저장 (예시·백지·공유 미리보기 모드 및 저장 차단 상태에서는 절대 덮어쓰지 않음)
  useEffect(() => {
    if (!isLoaded || viewMode !== 'own' || storageBlocked) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          input,
          checkedMap,
          checkedAmountMap,
          memoMap,
          pocketRecords,
          expenseOverrides,
        })
      );
    } catch {
      queueMicrotask(() =>
        setNotice(
          '이 기기 브라우저 저장소에 기록하지 못했습니다. 창을 닫기 전에 인쇄 또는 PDF로 보관해 주세요.'
        )
      );
    }
  }, [
    input,
    checkedMap,
    checkedAmountMap,
    memoMap,
    pocketRecords,
    expenseOverrides,
    isLoaded,
    viewMode,
    storageBlocked,
  ]);

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
    () =>
      calculateDelaySimulations(
        calcInput.birthDate,
        calcInput.startDate,
        input.monthlyGiftWon
      ),
    [calcInput.birthDate, calcInput.startDate, input.monthlyGiftWon]
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
        input.inflationRate,
        expenseOverrides
      ),
    [calcInput.birthDate, calcInput.startDate, input.inflationRate, expenseOverrides]
  );

  const ageYearRows = useMemo(
    () =>
      generateAgeYearTable(calcInput.birthDate, calcInput.startDate, periods),
    [calcInput.birthDate, calcInput.startDate, periods]
  );

  // 핸들러: 체크 시점에 월 입금액 스냅샷을 함께 저장하여 추후 월 계획액 변경 시 과거 입금 기록 변조 방지
  const handleToggleCheck = (id: string) => {
    const willBeChecked = !checkedMap[id];
    setCheckedMap((prev) => ({
      ...prev,
      [id]: willBeChecked,
    }));

    if (id.startsWith('installment-')) {
      setCheckedAmountMap((prev) => {
        const next = { ...prev };
        if (willBeChecked) {
          next[id] = input.monthlyGiftWon;
        } else {
          delete next[id];
        }
        return next;
      });
    }
  };

  // 금액 없이 체크만 저장된 과거 항목에 대해 사용자가 입력한 실제 입금액을 일괄 확정
  const handleConfirmUnverifiedAmounts = (amountWon: number) => {
    setCheckedAmountMap((prev) => {
      const next = { ...prev };
      Object.keys(checkedMap).forEach((key) => {
        if (
          key.startsWith('installment-') &&
          checkedMap[key] &&
          typeof next[key] !== 'number'
        ) {
          next[key] = amountWon;
        }
      });
      return next;
    });
    setNotice(
      `금액 미확인 체크 항목을 월 ${amountWon.toLocaleString('ko-KR')}원으로 확정했습니다.`
    );
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

  const handleUpdateExpenseOverride = (
    itemId: string,
    patch: Partial<ExpenseItemOverride>
  ) => {
    setExpenseOverrides((prev) => ({
      ...prev,
      [itemId]: {
        ...(prev[itemId] || {}),
        ...patch,
      },
    }));
  };

  const handleResetExpenseOverrides = () => {
    setExpenseOverrides({});
  };

  // 현재 실제 기록을 스냅샷으로 보존하는 헬퍼
  const saveOwnSnapshotIfNeeded = () => {
    if (viewMode === 'own') {
      ownSnapshot.current = {
        input: { ...input },
        checkedMap: { ...checkedMap },
        checkedAmountMap: { ...checkedAmountMap },
        memoMap: { ...memoMap },
        pocketRecords: pocketRecords.map((r) => ({ ...r })),
        expenseOverrides: { ...expenseOverrides },
      };
    }
  };

  // 예시 보기 진입
  const handleEnterDemo = () => {
    saveOwnSnapshotIfNeeded();
    setViewMode('demo');
    setInput(DEFAULT_INPUT);
    setCheckedMap(SAMPLE_CHECKED_MAP);
    setCheckedAmountMap(SAMPLE_CHECKED_AMOUNT_MAP);
    setMemoMap({});
    setPocketRecords(SAMPLE_POCKET_RECORDS.map((r) => ({ ...r })));
    setExpenseOverrides({});
    setNotice('');
  };

  // 백지 양식 미리보기 진입 (내 실제 저장 기록은 삭제하지 않고 화면만 깨끗한 빈 양식으로 전환)
  const handleEnterBlankPreview = () => {
    saveOwnSnapshotIfNeeded();
    setViewMode('blank');
    setCheckedMap({});
    setCheckedAmountMap({});
    setMemoMap({});
    setPocketRecords([]);
    setNotice('');
  };

  // 예시·백지·공유 미리보기 모드에서 원래 내 실제 기록으로 복귀
  const handleReturnToOwnRecord = () => {
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    const own = ownSnapshot.current;
    if (own) {
      setInput(own.input);
      setCheckedMap(own.checkedMap);
      setCheckedAmountMap(own.checkedAmountMap);
      setMemoMap(own.memoMap);
      setPocketRecords(own.pocketRecords);
      setExpenseOverrides(own.expenseOverrides);
    }
    setViewMode('own');
  };

  // 공유 링크 미리보기의 설정을 내 기록으로 명시적 적용 (기존 다른 아이 체크 기록과 섞이지 않도록 새 기록으로 적용)
  const handleApplySharedLinkToOwn = () => {
    if (
      !window.confirm(
        '현재 공유 링크의 아이 정보와 계획 설정을 내 기록으로 적용할까요?\n(기존에 저장된 다른 기록과 섞이지 않도록 체크·용돈·메모 칸은 빈 상태로 새로 시작합니다.)'
      )
    ) {
      return;
    }
    if (typeof window !== 'undefined' && window.location.search) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    setCheckedMap({});
    setCheckedAmountMap({});
    setMemoMap({});
    setPocketRecords([]);
    setExpenseOverrides({});
    ownSnapshot.current = null;
    setViewMode('own');
    setNotice('공유 링크의 설정을 내 기록으로 적용했습니다.');
  };

  // 내 실제 기록 초기화 (명시적 확인 후 실제 저장 기록만 비움, v1 원본은 보존)
  const handleClearOwnRecord = () => {
    if (viewMode !== 'own') {
      handleReturnToOwnRecord();
      return;
    }
    if (
      window.confirm(
        '현재 기기에 저장된 내 실제 기록(입금 체크, 용돈 기록, 메모, 목돈 설정)을 모두 비울까요?\n※ 인쇄만 빈 양식으로 하시려면 [백지 양식 보기] 버튼을 이용해 주세요.'
      )
    ) {
      setCheckedMap({});
      setCheckedAmountMap({});
      setMemoMap({});
      setPocketRecords([]);
      setExpenseOverrides({});
      setStorageBlocked(false);
      setNotice('내 기록을 빈 상태로 초기화했습니다.');
    }
  };

  // 구버전(v1) 기록 명시적 가져오기 (원본 보존 + 증여 여부 미확인 전환)
  const importLegacy = () => {
    if (
      !window.confirm(
        '이전 버전(v1) 저장 데이터에는 초기 예시 기록이 섞여 있을 수 있습니다.\n가져오기를 실행하면 현재 화면의 내 기록이 이전 버전 데이터로 대체됩니다(기존 v1 원본은 삭제되지 않고 그대로 보존됩니다). 진행할까요?'
      )
    )
      return;
    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (!raw) {
        setNotice('가져올 이전 버전 기록이 없습니다.');
        return;
      }
      const data = JSON.parse(raw);
      if (!data || typeof data !== 'object') {
        throw new Error('Malformed legacy data');
      }
      setViewMode('own');
      setStorageBlocked(false);
      setInput(sanitizeInput(data.input));
      setCheckedMap(
        data.checkedMap && typeof data.checkedMap === 'object'
          ? data.checkedMap
          : {}
      );
      setCheckedAmountMap({});
      setMemoMap(
        data.memoMap && typeof data.memoMap === 'object' ? data.memoMap : {}
      );
      setPocketRecords(
        Array.isArray(data.pocketRecords)
          ? data.pocketRecords
              .filter((r: unknown) => r && typeof r === 'object')
              .map((r: PocketMoneyRecord) => ({
                ...r,
                isGiftTaxable: '',
              }))
          : []
      );
      setNotice(
        '이전 버전(v1) 기록을 가져왔습니다. 과거 체크 항목은 당시 입금액을 확인해 주시고, 용돈의 증여 해당 여부는 계좌 기준 오판을 막기 위해 모두 ‘미확인’으로 전환했습니다.'
      );
    } catch {
      setNotice(
        '이전 버전(v1) 데이터를 읽는 중 오류가 발생했습니다. 기존 v1 원본은 삭제하지 않고 그대로 보존했습니다.'
      );
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
          text: `${input.childName}의 만 35세까지 증여 준비 구간 및 미래 목돈 계획표입니다.`,
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
      {/* 상단 고정 컨트롤 패널 (모바일 가로 오버플로우 차단, 인쇄 시 숨김) */}
      <header className="no-print sticky top-0 z-30 w-full max-w-full overflow-hidden bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
          {/* 상단 제목 및 액션 버튼 바 */}
          <div className="flex flex-col gap-2 pb-2.5 border-b border-slate-100">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                    <Sparkles className="w-3 h-3" /> 가족 증여·목돈 계획 도구
                  </span>
                  <h1 className="text-sm sm:text-lg font-extrabold text-slate-900 tracking-tight truncate">
                    아이 증여 구간 & 미래 목돈 바인더 (9종 시트)
                  </h1>
                </div>
                <p className="hidden sm:block text-xs text-slate-500 mt-0.5">
                  생년월일과 월 증여 계획액을 입력하면 만 35세까지의 10년 단위 준비 일정, 신고기한, 입금 체크표, 미래 목돈 시나리오를 정리합니다.
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

            {/* 액션 버튼 그룹 */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleShareLink}
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                {shareCopied ? '링크 복사됨!' : '설정 링크 공유'}
              </button>

              {viewMode === 'demo' ? (
                <button
                  type="button"
                  onClick={handleReturnToOwnRecord}
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  예시 닫기 (내 기록 복원)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleEnterDemo}
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  title="내 기록을 덮어쓰지 않고 작성 예시를 별도 화면으로 확인합니다"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  예시 보기
                </button>
              )}

              {viewMode === 'blank' ? (
                <button
                  type="button"
                  onClick={handleReturnToOwnRecord}
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  백지 닫기 (내 기록 복원)
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleEnterBlankPreview}
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-semibold bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 transition-colors cursor-pointer"
                  title="저장된 내 기록을 지우지 않고 인쇄용 빈 양식 화면으로 전환합니다"
                >
                  <FileText className="w-3.5 h-3.5" />
                  백지 양식 보기(인쇄용)
                </button>
              )}

              {viewMode === 'shared' && (
                <>
                  <button
                    type="button"
                    onClick={handleApplySharedLinkToOwn}
                    className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />이 공유 설정을 내 기록으로 적용
                  </button>
                  <button
                    type="button"
                    onClick={handleReturnToOwnRecord}
                    className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />내 실제 기록으로 돌아가기
                  </button>
                </>
              )}

              {viewMode === 'own' && (
                <button
                  type="button"
                  onClick={handleClearOwnRecord}
                  className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-md text-[11px] sm:text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors cursor-pointer"
                  title="기기에 저장된 내 체크·용돈·메모 기록을 실제로 비웁니다"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  내 기록 초기화
                </button>
              )}

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

          {/* 반응형 입력 폼 그리드 */}
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
                onChange={(e) => {
                  const num = Number(e.target.value);
                  setInput((prev) => ({
                    ...prev,
                    monthlyGiftWon: Number.isFinite(num)
                      ? Math.min(1000000000, Math.max(0, Math.floor(num)))
                      : 0,
                  }));
                }}
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
                onChange={(e) => {
                  const num = parseFloat(e.target.value);
                  setInput((prev) => ({
                    ...prev,
                    inflationRate: Number.isFinite(num)
                      ? Math.max(0, Math.min(15, num))
                      : 0,
                  }));
                }}
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

          {/* 시트 빠른 이동 탭 */}
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
            {viewMode === 'demo'
              ? '예시 보기 모드 — 지금 화면에서 수정해도 내 실제 기록에는 저장되지 않습니다.'
              : viewMode === 'blank'
              ? '백지 양식 미리보기 모드 — 내 실제 기록은 안전하게 보관 중이며, 현재 화면만 빈 양식으로 표시합니다.'
              : viewMode === 'shared'
              ? '공유 링크 미리보기 모드 — 공유받은 계획 조건을 보고 있으며, 내 기존 기록은 덮어쓰지 않고 보관 중입니다.'
              : '내 기록 모드 — 입력한 체크·메모·용돈 기록이 이 기기에만 자동 저장됩니다.'}
          </strong>
          {viewMode === 'shared' && (
            <>
              <button
                type="button"
                className="underline font-bold text-indigo-700 cursor-pointer"
                onClick={handleApplySharedLinkToOwn}
              >
                이 공유 설정을 내 기록으로 적용
              </button>
              <button
                type="button"
                className="underline font-bold text-emerald-700 cursor-pointer"
                onClick={handleReturnToOwnRecord}
              >
                내 실제 기록으로 돌아가기
              </button>
            </>
          )}
          {(viewMode === 'demo' || viewMode === 'blank') && (
            <button
              type="button"
              className="underline font-bold text-emerald-700 cursor-pointer"
              onClick={handleReturnToOwnRecord}
            >
              내 실제 기록으로 돌아가기
            </button>
          )}
          {hasLegacy && viewMode === 'own' && (
            <button
              type="button"
              className="underline font-semibold text-slate-700 cursor-pointer"
              onClick={importLegacy}
            >
              이전 버전(v1) 기록 확인·가져오기
            </button>
          )}
        </div>
        {notice && <p className="text-amber-800 font-medium">{notice}</p>}
        <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed">
          생년월일·시작일·월 계획액을 변경해도 이미 체크한 입금 내역과 용돈 기록은 삭제되지 않습니다.
        </p>
        {!validDates && (
          <p role="alert" className="text-red-600 font-bold">
            첫 증여일은 아이 생년월일보다 빠를 수 없습니다. 날짜를 확인해 주세요.
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
          checkedAmountMap={checkedAmountMap}
          onToggleCheck={handleToggleCheck}
          onConfirmUnverifiedAmounts={handleConfirmUnverifiedAmounts}
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
          onLoadSamplePocketRecords={handleEnterDemo}
          checkedMap={checkedMap}
          onToggleCheck={handleToggleCheck}
          onUpdateExpenseOverride={handleUpdateExpenseOverride}
          onResetExpenseOverrides={handleResetExpenseOverrides}
          hasCustomExpenseOverrides={Object.keys(expenseOverrides).length > 0}
        />
      </main>
    </div>
  );
}

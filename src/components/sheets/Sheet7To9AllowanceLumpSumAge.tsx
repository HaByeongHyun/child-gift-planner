'use client';

import React from 'react';
import {
  GiftPeriod,
  LumpSumExpenseItem,
  ExpenseItemOverride,
  AgeYearRow,
  parseYMD,
  formatDotYMD,
  matchLumpSumItemsToPeriod,
} from '@/lib/calculator';
import { SquareCheckbox } from '@/components/SquareCheckbox';
import { Plus, Trash2, Sparkles, RotateCcw } from 'lucide-react';

export interface PocketMoneyRecord {
  id: string;
  date: string; // 예: "2026-09-03" 또는 "9/3"
  year: number; // 집계 기준 연도
  giver: string; // 준 사람
  relation: string; // 관계
  amount: number; // 금액 (원)
  whereKept: string; // 현금 | 용돈통장 | 증권계좌
  isGiftTaxable: 'O' | 'X' | ''; // 증여 해당 여부
  memo: string;
}

interface Sheet7To9Props {
  childName: string;
  blessingMessage: string;
  birthDate: string;
  inflationRate: number;
  periods: GiftPeriod[];
  lumpSumItems: LumpSumExpenseItem[];
  ageYearRows: AgeYearRow[];
  pocketRecords: PocketMoneyRecord[];
  onAddPocketRecord: () => void;
  onUpdatePocketRecord: (
    id: string,
    field: keyof PocketMoneyRecord,
    value: string | number
  ) => void;
  onRemovePocketRecord: (id: string) => void;
  onLoadSamplePocketRecords: () => void;
  checkedMap: Record<string, boolean>;
  onToggleCheck: (id: string) => void;
  onUpdateExpenseOverride: (
    itemId: string,
    patch: Partial<ExpenseItemOverride>
  ) => void;
  onResetExpenseOverrides: () => void;
  hasCustomExpenseOverrides: boolean;
}

export function Sheet7To9PocketLumpSumAge({
  childName,
  blessingMessage,
  birthDate,
  inflationRate,
  periods,
  lumpSumItems,
  ageYearRows,
  pocketRecords,
  onAddPocketRecord,
  onUpdatePocketRecord,
  onRemovePocketRecord,
  onLoadSamplePocketRecords,
  checkedMap,
  onToggleCheck,
  onUpdateExpenseOverride,
  onResetExpenseOverrides,
  hasCustomExpenseOverrides,
}: Sheet7To9Props) {
  const firstPeriod = periods[0];
  const birthParsed = parseYMD(birthDate);
  const birthFormatted = formatDotYMD(
    birthParsed.year,
    birthParsed.month,
    birthParsed.day
  );

  // 1차 구간의 연도 목록 (예: 2026 ~ 2036, 11개 연도)
  const period1Years = Array.from(
    { length: firstPeriod.endYear - firstPeriod.startYear + 1 },
    (_, i) => firstPeriod.startYear + i
  );

  // 연도별 증여 해당(O) 합계 계산 (시작일을 바꿔도 전체 실제 기록 누적합은 보존)
  const yearlyTaxableTotals: Record<number, number> = {};
  period1Years.forEach((y) => {
    const sum = pocketRecords
      .filter((r) => r.year === y && r.isGiftTaxable === 'O')
      .reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
    yearlyTaxableTotals[y] = sum;
  });
  const cumulativeTaxableTotal = pocketRecords
    .filter((r) => r.isGiftTaxable === 'O')
    .reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);

  // 인쇄 시 총 16행이 보이도록 빈 줄 채움
  const blankRowCount = Math.max(0, 16 - pocketRecords.length);

  return (
    <>
      {/* ==================== 시트 7: 세뱃돈·용돈 입금 기록 ==================== */}
      <section id="sheet-7" className="a4-sheet">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-800 pb-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="inline-block bg-lime-200 border border-lime-400 px-2 py-0.5 text-xs font-extrabold text-slate-900 rounded-xs shrink-0">
              {childName || '우리아이'}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
              세뱃돈·용돈 입금 기록
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={onLoadSamplePocketRecords}
              className="no-print inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              예시 보기 (저장 안 됨)
            </button>
            <button
              type="button"
              onClick={onAddPocketRecord}
              className="no-print inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />행 추가
            </button>
            <span className="text-[10px] text-slate-400 font-medium shrink-0">
              Sheet 07 · 세뱃돈·용돈 기록장
            </span>
          </div>
        </div>

        <div className="border border-slate-400 bg-slate-50/60 p-2.5 sm:p-3 text-[11.5px] sm:text-xs leading-relaxed mb-3 text-slate-800">
          <strong className="font-bold">작성 원칙:</strong> 받은 날짜·연도·준 사람·금액·보관처와 사용 목적을 함께 적으세요. 현금이나 용돈통장에 보관한다는 이유만으로 자동 비과세가 되지 않으며, 증권계좌에 넣었다고 무조건 과세되는 것도 아닙니다. 증여 해당 여부는 기본 <strong className="font-semibold">‘미확인’</strong>으로 두고, 세무 요건을 확인한 경우에만 직접 <strong className="font-semibold">O(증여 합산)</strong> 또는 <strong className="font-semibold">X(비과세 확인)</strong>를 선택하세요.
        </div>

        <div className="sm:hidden text-right text-[10px] text-slate-400 mb-1 no-print">
          ← 표를 좌우로 밀어서 입력/확인하세요 →
        </div>
        <div className="table-scroll-wrap mb-2">
          <table className="sheet-table sheet-table-compact text-center min-w-[580px]">
            <thead>
              <tr>
                <th className="w-14">연도</th>
                <th className="w-14">날짜</th>
                <th className="w-24">준 사람</th>
                <th className="w-18">관계</th>
                <th className="w-24">금액</th>
                <th className="w-22">보관 계좌·장소</th>
                <th className="w-18">
                  증여
                  <br />
                  해당
                </th>
                <th>메모 (사용 목적·신고 여부)</th>
                <th className="w-8 no-print">삭제</th>
              </tr>
            </thead>
            <tbody>
              {pocketRecords.map((rec) => (
                <tr key={rec.id}>
                  <td className="p-0">
                    <input
                      type="number"
                      value={rec.year || ''}
                      onChange={(e) =>
                        onUpdatePocketRecord(
                          rec.id,
                          'year',
                          Number(e.target.value) || firstPeriod.startYear
                        )
                      }
                      aria-label="용돈 수령 연도"
                      className="w-full px-1 py-1 text-center text-[11px] bg-transparent focus:outline-none focus:bg-yellow-50"
                    />
                  </td>
                  <td className="p-0">
                    <input
                      type="text"
                      value={rec.date}
                      onChange={(e) =>
                        onUpdatePocketRecord(rec.id, 'date', e.target.value)
                      }
                      placeholder="9/26"
                      aria-label="용돈 수령 날짜"
                      className="w-full px-1 py-1 text-center text-[11px] bg-transparent focus:outline-none focus:bg-yellow-50"
                    />
                  </td>
                  <td className="p-0">
                    <input
                      type="text"
                      value={rec.giver}
                      onChange={(e) =>
                        onUpdatePocketRecord(rec.id, 'giver', e.target.value)
                      }
                      placeholder="수원친정"
                      aria-label="준 사람"
                      className="w-full px-1.5 py-1 text-center text-[11px] font-medium bg-transparent focus:outline-none focus:bg-yellow-50"
                    />
                  </td>
                  <td className="p-0">
                    <input
                      type="text"
                      value={rec.relation}
                      onChange={(e) =>
                        onUpdatePocketRecord(rec.id, 'relation', e.target.value)
                      }
                      placeholder="조부모"
                      aria-label="관계"
                      className="w-full px-1 py-1 text-center text-[11px] bg-transparent focus:outline-none focus:bg-yellow-50"
                    />
                  </td>
                  <td className="p-0">
                    <input
                      type="text"
                      value={
                        rec.amount ? rec.amount.toLocaleString('ko-KR') + '원' : ''
                      }
                      onChange={(e) => {
                        const numeric = Number(
                          e.target.value.replace(/[^0-9]/g, '')
                        );
                        onUpdatePocketRecord(rec.id, 'amount', numeric);
                      }}
                      placeholder="100,000원"
                      aria-label="용돈 금액"
                      className="w-full px-1.5 py-1 text-right text-[11px] font-semibold bg-transparent focus:outline-none focus:bg-yellow-50"
                    />
                  </td>
                  <td className="p-0">
                    <select
                      value={rec.whereKept}
                      onChange={(e) =>
                        onUpdatePocketRecord(rec.id, 'whereKept', e.target.value)
                      }
                      aria-label="보관 계좌 또는 장소"
                      className="w-full px-1 py-1 text-center text-[11px] bg-transparent focus:outline-none"
                    >
                      <option value="">선택</option>
                      <option value="현금">현금</option>
                      <option value="용돈통장">용돈통장</option>
                      <option value="증권계좌">증권계좌</option>
                    </select>
                  </td>
                  <td className="p-0">
                    <select
                      value={rec.isGiftTaxable}
                      onChange={(e) =>
                        onUpdatePocketRecord(
                          rec.id,
                          'isGiftTaxable',
                          e.target.value
                        )
                      }
                      aria-label="증여 해당 여부"
                      className="w-full px-1 py-1 text-center text-[11px] font-bold bg-transparent focus:outline-none"
                    >
                      <option value="">미확인</option>
                      <option value="X">X</option>
                      <option value="O">O</option>
                    </select>
                  </td>
                  <td className="p-0">
                    <input
                      type="text"
                      value={rec.memo}
                      onChange={(e) =>
                        onUpdatePocketRecord(rec.id, 'memo', e.target.value)
                      }
                      placeholder=""
                      aria-label="용돈 메모"
                      className="w-full px-1.5 py-1 text-left text-[11px] bg-transparent focus:outline-none focus:bg-yellow-50"
                    />
                  </td>
                  <td className="no-print">
                    <button
                      type="button"
                      onClick={() => onRemovePocketRecord(rec.id)}
                      className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                      title="행 삭제"
                      aria-label="행 삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {Array.from({ length: blankRowCount }, (_, i) => (
                <tr key={`blank-${i}`} className="h-6">
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td className="no-print"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[10.5px] text-slate-600 mb-2 leading-relaxed">
          <strong className="font-semibold">보관 계좌·장소</strong> — 현금 / 용돈통장 / 증권계좌 &nbsp;|&nbsp;{' '}
          <strong className="font-semibold">증여 해당</strong> — 미확인(기본) / X(사회통념상 비과세 확인) / O(증여 합산 확인). 보관 계좌만으로 자동 판정하지 않습니다.
        </p>

        {/* 연도별 합계 (증여 해당 O 만 집계) */}
        <h3 className="text-xs font-extrabold text-slate-900 mb-1.5">
          연도별 합계 (내가 ‘증여 해당 O’로 표시한 금액만 집계)
        </h3>
        <div className="table-scroll-wrap mb-2">
          <table className="sheet-table sheet-table-compact text-center min-w-[480px]">
            <thead>
              <tr>
                {period1Years.map((y) => (
                  <th key={y}>{y}</th>
                ))}
                <th className="bg-slate-200">전체 O 누적</th>
              </tr>
            </thead>
            <tbody>
              <tr className="h-7">
                {period1Years.map((y) => (
                  <td key={y} className="text-[10.5px] font-semibold">
                    {yearlyTaxableTotals[y] > 0
                      ? `${yearlyTaxableTotals[y].toLocaleString('ko-KR')}`
                      : ''}
                  </td>
                ))}
                <td className="text-[10.5px] font-extrabold text-slate-900 bg-slate-50">
                  {cumulativeTaxableTotal > 0
                    ? `${cumulativeTaxableTotal.toLocaleString('ko-KR')}`
                    : ''}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-[10.5px] text-slate-600 leading-relaxed">
          직계존속(부모·조부모)에게 받은 증여는 합산해 10년 공제 한도를 확인합니다. 위 표는 ‘O’로 직접 선택한 기록의 단순 합계이며, 남은 공제 한도나 납부세액을 자동 확정하지 않습니다.
        </p>
      </section>

      {/* ==================== 시트 8: 자녀 목돈 필요 시기 체크리스트 & 자금 대응 전략 ==================== */}
      <section id="sheet-8" className="a4-sheet">
        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b-2 border-slate-800 pb-2 mb-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="inline-block bg-lime-200 border border-lime-400 px-2 py-0.5 text-xs font-extrabold text-slate-900 rounded-xs shrink-0">
              {childName || '우리아이'}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
              자녀 목돈 필요 시기 체크리스트
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {hasCustomExpenseOverrides && (
              <button
                type="button"
                onClick={onResetExpenseOverrides}
                className="no-print inline-flex items-center gap-1 text-[10.5px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                시기·지원액 기본값 복원
              </button>
            )}
            <span className="text-[10px] text-slate-400 font-medium shrink-0">
              Sheet 08 · 목돈 시점 & 가족 지원 계획
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-700 leading-relaxed mb-2">
          {birthFormatted}생 · 기준연도는 <strong className="font-bold">2026년</strong>(증여 시작일과 무관)이며, 오른쪽에 <strong className="font-bold">연 {inflationRate}% 물가상승률</strong>을 반영한 예상 금액을 함께 표시합니다. <strong className="font-bold">전체 참고 비용</strong>과 <strong className="font-bold">우리 가족 지원 계획액</strong>을 구분했으며, 결혼 나이·지원 여부·지원 금액을 가족 상황에 맞게 직접 수정할 수 있습니다.
        </p>

        <div className="sm:hidden text-right text-[10px] text-slate-400 mb-1 no-print">
          ← 좌우로 밀어서 전체 참고 비용과 가족 지원 계획액을 확인·수정하세요 →
        </div>
        <div className="table-scroll-wrap mb-2">
          <table className="sheet-table sheet-table-compact min-w-[640px]">
            <thead>
              <tr className="text-center">
                <th className="w-26">항목 · 출처 구분</th>
                <th className="w-22">
                  예상 시점
                  <br />
                  <span className="text-[9.5px] font-normal">(만 나이 수정)</span>
                </th>
                <th>기준 설명 및 가정 조건</th>
                <th className="w-26">
                  전체 참고 비용
                  <br />
                  <span className="text-[9.5px] font-normal">2026년 기준 참고</span>
                </th>
                <th className="w-28">
                  참고 비용 물가반영
                  <br />
                  <span className="text-[9.5px] font-normal">
                    연 {inflationRate}% 가정
                  </span>
                </th>
                <th className="w-32">
                  우리 가족 지원 계획
                  <br />
                  <span className="text-[9.5px] font-normal">현재가 입력 → 물가반영</span>
                </th>
                <th className="w-9">준비</th>
              </tr>
            </thead>
            <tbody>
              {lumpSumItems.map((item) => (
                <tr
                  key={item.id}
                  className={item.included ? '' : 'opacity-55 bg-slate-50'}
                >
                  <td className="font-bold text-slate-900 whitespace-pre-line align-top">
                    <div className="flex items-start justify-between gap-1">
                      <span>{item.title}</span>
                    </div>
                    <div className="mt-0.5">
                      <span
                        className={`inline-block px-1 py-0.2 rounded text-[9px] font-semibold ${
                          item.sourceType.startsWith('공식통계')
                            ? 'bg-blue-100 text-blue-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {item.sourceType}
                      </span>
                    </div>
                    <label className="no-print mt-1 inline-flex items-center gap-1 text-[9.5px] font-medium text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.included}
                        onChange={(e) =>
                          onUpdateExpenseOverride(item.id, {
                            included: e.target.checked,
                          })
                        }
                        className="rounded border-slate-400"
                      />
                      {item.included ? '계획 포함' : '제외됨'}
                    </label>
                  </td>
                  <td className="text-center text-[10.5px] leading-snug whitespace-nowrap align-middle">
                    <div className="whitespace-pre-line font-semibold">
                      {item.timingAgeLabel}
                    </div>
                    <div className="text-slate-600">{item.timingYearLabel}</div>
                    <div className="no-print mt-1 flex flex-col items-center gap-1 text-[9.5px] text-slate-600">
                      {!item.customDate && (
                        <div className="flex items-center justify-center gap-0.5">
                          <span>만</span>
                          <input
                            type="number"
                            min={0}
                            max={45}
                            value={item.targetAge}
                            onChange={(e) =>
                              onUpdateExpenseOverride(item.id, {
                                targetAge: Math.max(
                                  0,
                                  Math.min(45, Number(e.target.value) || 0)
                                ),
                              })
                            }
                            aria-label={`${item.title.replace(/\n/g, ' ')} 예상 시작 만 나이`}
                            className="w-10 px-1 py-0.5 text-center font-bold border border-slate-300 rounded bg-white"
                          />
                          <span>세경</span>
                        </div>
                      )}
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[9px] font-semibold text-slate-500">
                          {item.ageSpanYears > 0
                            ? '첫 납부 예정일'
                            : '예정일 직접 지정'}
                        </span>
                        <input
                          type="date"
                          min={birthDate}
                          value={item.customDate || ''}
                          onChange={(e) =>
                            onUpdateExpenseOverride(item.id, {
                              customDate: e.target.value || undefined,
                            })
                          }
                          title={
                            item.ageSpanYears > 0
                              ? '여러 해에 걸치는 항목은 첫 납부 예정일을 선택하세요 (비워두면 예상 나이 기준으로 계산)'
                              : '정확한 예정일이 정해진 경우에만 선택하세요 (비워두면 예상 나이 기준으로 계산)'
                          }
                          aria-label={`${item.title.replace(/\n/g, ' ')} ${
                            item.ageSpanYears > 0
                              ? '첫 납부 예정일'
                              : '직접 지정 예정일(선택)'
                          }`}
                          className="w-26 px-1 py-0.5 text-[9px] border border-slate-200 rounded bg-white text-slate-600"
                        />
                        {item.customDate && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateExpenseOverride(item.id, {
                                customDate: undefined,
                              })
                            }
                            aria-label={`${item.title.replace(/\n/g, ' ')} 지정일 지우기`}
                            className="text-[9px] font-semibold text-indigo-700 underline cursor-pointer"
                          >
                            지정일 지우기(나이 기준 복원)
                          </button>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-[10.5px] text-slate-700 leading-snug align-middle">
                    {item.reason}
                  </td>
                  <td className="text-center text-[10.5px] leading-snug whitespace-nowrap align-middle">
                    {item.presentValueLines.map((line, i) => (
                      <div
                        key={i}
                        className={
                          i === 0 ? 'font-bold text-slate-900' : 'text-slate-600'
                        }
                      >
                        {line}
                      </div>
                    ))}
                  </td>
                  <td className="text-center text-[10.5px] leading-snug bg-sky-50/40 whitespace-nowrap align-middle">
                    {item.futureValueLines.map((line, i) => (
                      <div
                        key={i}
                        className={
                          i === 0
                            ? 'font-extrabold text-slate-950'
                            : 'font-medium text-slate-700'
                        }
                      >
                        {line}
                      </div>
                    ))}
                  </td>
                  <td className="text-center text-[10.5px] leading-snug bg-emerald-50/30 whitespace-nowrap align-middle">
                    <div className="no-print flex items-center justify-center gap-0.5 mb-0.5">
                      <input
                        type="number"
                        min={0}
                        max={1000000}
                        step={100}
                        disabled={!item.included}
                        value={item.familySupportManwon}
                        onChange={(e) =>
                          onUpdateExpenseOverride(item.id, {
                            familySupportManwon: Math.max(
                              0,
                              Number(e.target.value) || 0
                            ),
                          })
                        }
                        aria-label={`${item.title.replace(/\n/g, ' ')} 가족 지원 계획액(현재가 만원)`}
                        className="w-16 px-1 py-0.5 text-right text-[10.5px] font-bold border border-slate-300 rounded bg-white disabled:bg-slate-100"
                      />
                      <span className="text-[9.5px] text-slate-600">만원</span>
                    </div>
                    <div className="hidden print:block text-[9.5px] text-slate-600">
                      현재가 {item.familySupportManwon.toLocaleString('ko-KR')}만원 기준
                    </div>
                    <div className="font-extrabold text-emerald-900">
                      → {item.familySupportFutureLabel}
                    </div>
                  </td>
                  <td className="text-center align-middle">
                    <SquareCheckbox
                      size="sm"
                      checked={!!checkedMap[`lump-${item.id}`]}
                      onChange={() => onToggleCheck(`lump-${item.id}`)}
                      label={item.title}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border border-slate-400 rounded-sm bg-slate-50 px-2.5 py-2 text-[10.5px] text-slate-700 leading-relaxed mb-3.5">
          • <strong className="font-semibold">대학 등록금:</strong> 교육부 2026년 대학정보공시(4년제 평균 연 727.03만원, 사립 823.15만원, 국공립 425만원) 원금을 기준으로 재학 4개년 각각 물가상승률을 반영해 합산했습니다.{' '}
          <a
            href="https://www.moe.go.kr/boardCnts/viewRenew.do?boardID=294&boardSeq=106020&lev=0&m=020402&s=moe"
            target="_blank"
            rel="noreferrer"
            className="underline font-semibold"
          >
            교육부 공시 출처
          </a>
          <br />• <strong className="font-semibold">그 외 항목(예산 예시):</strong> 자취 보증금·어학연수·취업 준비·결혼 준비·신혼집 금액은 국가 공식 평균이나 필수 비용이 아니라 원본 바인더의 참고 예산 예시입니다. 결혼 시점과 주거 지원 여부는 선택 가능한 가정으로 두었습니다.
        </div>

        {/* 증여 구간과 겹쳐보면 (연도 추정 및 지정일 비교) */}
        <h3 className="text-sm font-extrabold text-slate-900 mb-1.5">
          증여 구간과 겹쳐보면 (예상 시기 · 구간 경계 비교)
        </h3>
        <div className="table-scroll-wrap mb-2">
          <table className="sheet-table sheet-table-compact">
            <thead>
              <tr className="text-center">
                <th className="w-14 sm:w-18">증여 구간</th>
                <th className="w-28 sm:w-36">실제 계약 기간</th>
                <th className="w-18 sm:w-22">공제 기준</th>
                <th className="text-left">그 10년 구간과 겹치는 목돈 예상 시기</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => {
                const matchResult = matchLumpSumItemsToPeriod(p, lumpSumItems);
                return (
                  <tr key={p.periodNumber} className="text-center">
                    <td className="font-bold bg-slate-50 whitespace-nowrap">
                      {p.label}
                    </td>
                    <td className="text-[10px] whitespace-nowrap leading-tight">
                      <div className="font-semibold">
                        {p.startDate} ~ {p.endDate}
                      </div>
                      <div className="text-slate-500">
                        시작 시 만 {p.ageAtStart}세
                      </div>
                    </td>
                    <td className="font-semibold whitespace-nowrap">
                      {p.deductionLimitManwon.toLocaleString('ko-KR')}만
                    </td>
                    <td className="text-left font-medium text-slate-800 leading-snug text-[10.5px]">
                      <div>{matchResult.summaryText}</div>
                    </td>
                  </tr>
                );
              })}
              <tr className="text-center">
                <td className="font-bold bg-slate-50 whitespace-nowrap">
                  혼인·출산
                </td>
                <td className="text-[10px] whitespace-nowrap">
                  자녀 혼인 전후 2년 /<br />자녀의 아이 출산 후 2년
                </td>
                <td className="font-semibold whitespace-nowrap">통합 1억</td>
                <td className="text-left font-medium text-slate-800 leading-snug text-[10.5px]">
                  결혼 준비·신혼집 자금 일부 보완 가능 (실제 혼인·출산 요건 및 이전 공제 내역 확인 필요)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[10.5px] text-slate-600 mb-3.5 leading-relaxed">
          ※ 목돈 필요 시기는 기본적으로 연도 단위로만 추정하며(아이 생일로 임의 고정하지 않음), 구간이 바뀌는 경계 연도에 걸친 항목은 실제 납부월(예: 3월 입학 등)이 계약 기간({firstPeriod.startDate}~) 안인지 확인하세요. 위 표에서 예정일을 직접 지정하면 실제 날짜 기준으로 정확히 비교합니다.
        </p>

        {/* 자금 대응 전략 체크리스트 */}
        <h3 className="text-sm font-extrabold text-slate-900 mb-1.5">
          자금 대응 전략 체크리스트
        </h3>
        <div className="border border-slate-400 rounded-sm divide-y divide-slate-300 text-[11px] leading-snug">
          {[
            {
              id: 'strategy-1',
              bold: '실제 지출 날짜와 증여 구간 종료일 대조 —',
              text: '같은 연도라도 몇 월에 돈이 필요한지 확인해 구간 만기 전에 미리 준비하세요.',
            },
            {
              id: 'strategy-2',
              bold: '누적 입금액과 현재 계좌 잔액 구분 —',
              text: '등록금·어학연수로 이미 지출한 금액을 이후 결혼·주거 자금에 중복 계산하지 마세요.',
            },
            {
              id: 'strategy-3',
              bold: '혼인·출산 공제는 실제 요건 충족 시에만 반영 —',
              text: '미래 가정만으로 확정 합산하지 말고, 실제 혼인신고일·출생일 기준 2년 요건을 확인하세요.',
            },
            {
              id: 'strategy-4',
              bold: '전체 참고 비용과 우리 가족 지원 한도 분리 —',
              text: '신혼집 2~3억원 등은 참고 예시일 뿐이며, 부모 노후자금을 해치지 않는 범위에서 지원 계획액을 설정하세요.',
            },
            {
              id: 'strategy-5',
              bold: '주택청약 통장 인정 기준 확인 —',
              text: '청약 가입기간·납입 인정 금액은 제도 개편에 따라 달라지므로 시점별 청약홈 공고를 확인하세요.',
            },
            {
              id: 'strategy-6',
              bold: '직계존속(부모·조부모) 과거 10년 증여 합산 점검 —',
              text: '목돈을 추가 지원하기 전에 직전 10년 내 부모·조부모 증여 공제 사용액을 먼저 확인하세요.',
            },
            {
              id: 'strategy-7',
              bold: '3~5년 주기 물가 및 등록금 재점검 —',
              text: '실제 물가상승률과 교육부 공시 등록금 변화에 맞춰 계획표를 주기적으로 업데이트하세요.',
            },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => onToggleCheck(item.id)}
              className="flex items-start gap-2.5 px-2.5 py-1.5 hover:bg-slate-50 cursor-pointer"
            >
              <div className="pt-0.5 shrink-0">
                <SquareCheckbox
                  size="sm"
                  checked={!!checkedMap[item.id]}
                  onChange={() => onToggleCheck(item.id)}
                  label={item.bold}
                />
              </div>
              <span className="text-slate-800">
                <strong className="font-bold text-slate-950">{item.bold}</strong>{' '}
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== 시트 9: 나이·연도표 (만 0세 ~ 만 35세) ==================== */}
      <section id="sheet-9" className="a4-sheet">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-800 pb-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="inline-block bg-lime-200 border border-lime-400 px-2 py-0.5 text-xs font-extrabold text-slate-900 rounded-xs shrink-0">
              {childName || '우리아이'}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
              나이 · 연도표
            </h2>
          </div>

          <span className="text-[10px] text-slate-400 font-medium shrink-0">
            Sheet 09 · 만 35세 나이·학교·증여구간표
          </span>
        </div>

        {blessingMessage && (
          <div className="text-center font-serif italic font-bold text-slate-800 text-xs sm:text-sm px-3 py-1.5 mb-2 bg-amber-50/70 border border-amber-200 rounded">
            “{blessingMessage}”
          </div>
        )}

        <p className="text-[10.5px] text-slate-600 mb-2 leading-relaxed">
          {birthFormatted}생 · 생일이 지나야 만 나이가 올라갑니다. 학교 학년은 출생연도(그 해 3월 입학 가정) 참고 기준이며, 증여 구간은 실제 시작일·종료일을 함께 표시했습니다.
        </p>

        <div className="table-scroll-wrap">
          <table className="sheet-table text-center text-[10px] sm:text-[10.5px] leading-tight">
            <thead>
              <tr>
                <th className="w-16 sm:w-20 py-1">만 나이</th>
                <th className="w-14 sm:w-20 py-1">연도</th>
                <th className="w-20 sm:w-28 py-1">그날(생일)</th>
                <th className="w-24 sm:w-36 py-1">그 해 학교(참고)</th>
                <th className="text-left pl-2 sm:pl-3 py-1">증여 준비 구간 (시작·종료일)</th>
              </tr>
            </thead>
            <tbody>
              {ageYearRows.map((row) => (
                <tr
                  key={row.age}
                  className={
                    row.isPeriodStart
                      ? 'bg-sky-50/80 font-bold'
                      : row.isCurrentAge
                      ? 'bg-yellow-50/60'
                      : ''
                  }
                >
                  <td className="font-bold py-[2.5px] bg-slate-50/70 whitespace-nowrap">
                    만 {row.age}세{row.isCurrentAge ? ' (시작 나이)' : ''}
                  </td>
                  <td className="py-[2.5px] whitespace-nowrap">{row.year}년</td>
                  <td className="py-[2.5px] text-slate-700 whitespace-nowrap">
                    {row.birthdayStr}
                  </td>
                  <td className="py-[2.5px] font-medium text-slate-800 whitespace-nowrap">
                    {row.schoolLabel}
                  </td>
                  <td
                    className={`py-[2.5px] text-left pl-2 sm:pl-3 whitespace-nowrap ${
                      row.isPeriodStart
                        ? 'font-extrabold text-slate-950'
                        : 'text-slate-700'
                    }`}
                  >
                    {row.giftStatusLabel}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

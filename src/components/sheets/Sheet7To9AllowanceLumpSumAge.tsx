'use client';

import React from 'react';
import {
  GiftPeriod,
  LumpSumExpenseItem,
  AgeYearRow,
  parseYMD,
  formatDotYMD,
} from '@/lib/calculator';
import { SquareCheckbox } from '@/components/SquareCheckbox';
import { Plus, Trash2, Sparkles } from 'lucide-react';

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

  // 연도별 증여 해당(O) 합계 계산
  const yearlyTaxableTotals: Record<number, number> = {};
  let cumulativeTaxableTotal = 0;
  period1Years.forEach((y) => {
    const sum = pocketRecords
      .filter((r) => r.year === y && r.isGiftTaxable === 'O')
      .reduce((acc, cur) => acc + (Number(cur.amount) || 0), 0);
    yearlyTaxableTotals[y] = sum;
    cumulativeTaxableTotal += sum;
  });

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
              예시 따로 보기
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

        <div className="border border-slate-400 p-2.5 sm:p-3 text-[11.5px] sm:text-xs leading-relaxed mb-3">
          받은 날짜·사람·금액·사용 목적과 신고 내역을 함께 적으세요. 현금이나 용돈통장에 보관한다고 자동으로 비과세가 되는 것은 아닙니다. 생활비·교육비 비과세는 사용 목적 등 요건을 확인해야 합니다. 증여 여부는 기본 ‘미확인’으로 두고 확인한 경우에만 선택하세요. 남은 공제액은 여기서 계산하지 않습니다.
        </div>

        <div className="sm:hidden text-right text-[10px] text-slate-400 mb-1 no-print">
          ← 표를 좌우로 밀어서 입력/확인하세요 →
        </div>
        <div className="table-scroll-wrap mb-2">
          <table className="sheet-table sheet-table-compact text-center min-w-[540px]">
            <thead>
              <tr>
                <th className="w-14">날짜</th>
                <th className="w-26">준 사람</th>
                <th className="w-18">관계</th>
                <th className="w-24">금액</th>
                <th className="w-22">어디에 넣었나</th>
                <th className="w-16">
                  증여
                  <br />
                  해당
                </th>
                <th>메모</th>
                <th className="w-8 no-print">삭제</th>
              </tr>
            </thead>
            <tbody>
              {pocketRecords.map((rec) => (
                <tr key={rec.id}>
                  <td className="p-0">
                    <input
                      type="text"
                      value={rec.date}
                      onChange={(e) =>
                        onUpdatePocketRecord(rec.id, 'date', e.target.value)
                      }
                      placeholder="9/26"
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
                      className="w-full px-1.5 py-1 text-right text-[11px] font-semibold bg-transparent focus:outline-none focus:bg-yellow-50"
                    />
                  </td>
                  <td className="p-0">
                    <select
                      value={rec.whereKept}
                      onChange={(e) =>
                        onUpdatePocketRecord(rec.id, 'whereKept', e.target.value)
                      }
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
                      className="w-full px-1.5 py-1 text-left text-[11px] bg-transparent focus:outline-none focus:bg-yellow-50"
                    />
                  </td>
                  <td className="no-print">
                    <button
                      type="button"
                      onClick={() => onRemovePocketRecord(rec.id)}
                      className="text-slate-400 hover:text-red-600 p-0.5 cursor-pointer"
                      title="행 삭제"
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
                  <td className="no-print"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[10.5px] text-slate-600 mb-2 leading-relaxed">
          <strong className="font-semibold">어디에 넣었나</strong> — 현금 / 용돈통장 / 증권계좌 &nbsp;|&nbsp;{' '}
          <strong className="font-semibold">증여 해당</strong> — 미확인 / X(비과세 확인) / O(증여 확인). 계좌 종류로 자동 판정하지 않음
        </p>

        {/* 연도별 합계 (증여 해당 O 만 집계) */}
        <h3 className="text-xs font-extrabold text-slate-900 mb-1.5">
          연도별 합계 (증여 해당 O 만 집계)
        </h3>
        <div className="table-scroll-wrap mb-2">
          <table className="sheet-table sheet-table-compact text-center min-w-[480px]">
            <thead>
              <tr>
                {period1Years.map((y) => (
                  <th key={y}>{y}</th>
                ))}
                <th className="bg-slate-200">누적</th>
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
          부모·조부모의 일반 공제 사용액은 함께 확인합니다. 이 기록의 O 합계는 확인 표시한 금액의 합계일 뿐 개인별 남은 공제액이나 납부세액을 뜻하지 않습니다.
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
          <span className="text-[10px] text-slate-400 font-medium shrink-0">
            Sheet 08 · 목돈 시점 & 자금 대응 전략
          </span>
        </div>

        <p className="text-[11px] text-slate-700 leading-relaxed mb-2">
          {birthFormatted}생 · 금액은 지금 가격(현재가) 기준이고, 오른쪽에{' '}
          <strong className="font-bold">물가상승률 {inflationRate}%</strong>를 반영한 금액을 같이 적었습니다. 준비가 끝난 항목은 □에 체크하세요.
        </p>

        <div className="sm:hidden text-right text-[10px] text-slate-400 mb-1 no-print">
          ← 좌우로 밀어서 물가 반영 금액을 확인하세요 →
        </div>
        <div className="table-scroll-wrap mb-2">
          <table className="sheet-table sheet-table-compact min-w-[540px]">
            <thead>
              <tr className="text-center">
                <th className="w-24">항목</th>
                <th className="w-11">
                  필수/
                  <br />
                  선택
                </th>
                <th className="w-22">시점</th>
                <th>이유</th>
                <th className="w-28">
                  예상 금액
                  <br />
                  <span className="text-[10px] font-normal">현재가</span>
                </th>
                <th className="w-32">
                  물가 반영
                  <br />
                  <span className="text-[10px] font-normal">
                    연 {inflationRate}% 기준
                  </span>
                </th>
                <th className="w-9">준비</th>
              </tr>
            </thead>
            <tbody>
              {lumpSumItems.map((item) => (
                <tr key={item.id}>
                  <td className="font-bold text-slate-900 whitespace-pre-line">
                    {item.title}
                  </td>
                  <td className="text-center font-semibold whitespace-nowrap">
                    {item.requiredOrOptional}
                  </td>
                  <td className="text-center text-[10.5px] leading-snug whitespace-nowrap">
                    <div className="whitespace-pre-line font-semibold">
                      {item.timingAgeLabel}
                    </div>
                    <div className="text-slate-600">{item.timingYearLabel}</div>
                  </td>
                  <td className="text-[10.5px] text-slate-700 leading-snug">
                    {item.reason}
                  </td>
                  <td className="text-center text-[10.5px] leading-snug whitespace-nowrap">
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
                  <td className="text-center text-[10.5px] leading-snug bg-sky-50/40 whitespace-nowrap">
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
                  <td className="text-center">
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
          등록금은 교육부 2026년 자료이며 그 외 금액은 원본의 가상 예산으로 공식 평균을 확인한 값이 아닙니다. 모든 입력 가격을 2026년 기준 계획값으로 두고 해당 연도까지 매년 {inflationRate}%씩 오른다고 계산했어요(등록금은 해마다 따로). 물가상승률은 위 설정에서 바꿀 수 있고(결혼은 만 32세의 선택 시나리오), 항목마다 따로 필요한 돈이라 단순히 더하지는 않았습니다.
        </div>

        {/* 증여 구간과 겹쳐보면 */}
        <h3 className="text-sm font-extrabold text-slate-900 mb-1.5">
          증여 구간과 겹쳐보면
        </h3>
        <div className="table-scroll-wrap mb-2">
          <table className="sheet-table sheet-table-compact">
            <thead>
              <tr className="text-center">
                <th className="w-16 sm:w-20">증여 구간</th>
                <th className="w-22 sm:w-28">시점</th>
                <th className="w-16 sm:w-20">공제</th>
                <th className="text-left">그 10년 안에 필요한 목돈</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => {
                const neededText =
                  lumpSumItems
                    .filter((item) => {
                      const years =
                        item.timingYearLabel.match(/\d{4}/g)?.map(Number) ?? [];
                      return (
                        years.length > 0 &&
                        years[0] <= p.endYear &&
                        years[years.length - 1] >= p.startYear
                      );
                    })
                    .map((item) => item.title.replace('\n', ' '))
                    .join(', ') || '해당 시기의 예시 항목 없음';
                return (
                  <tr key={p.periodNumber} className="text-center">
                    <td className="font-bold bg-slate-50 whitespace-nowrap">
                      {p.label}
                    </td>
                    <td className="text-[10.5px] whitespace-nowrap">
                      <div>만 {p.ageAtStart}세</div>
                      <div className="text-slate-600">{p.startDate}~</div>
                    </td>
                    <td className="font-semibold whitespace-nowrap">
                      {p.deductionLimitManwon.toLocaleString('ko-KR')}만
                    </td>
                    <td className="text-left font-medium text-slate-800 leading-snug">
                      {neededText}
                    </td>
                  </tr>
                );
              })}
              <tr className="text-center">
                <td className="font-bold bg-slate-50 whitespace-nowrap">
                  혼인·출산
                </td>
                <td className="text-[10.5px] whitespace-nowrap">
                  혼인 전후 2년
                </td>
                <td className="font-semibold whitespace-nowrap">1억</td>
                <td className="text-left font-medium text-slate-800 leading-snug">
                  결혼 준비·신혼집 일부 (실제 요건·기존 사용액 확인 필요)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[10.5px] text-slate-600 mb-3.5 leading-relaxed">
          구간은 10년 단위 준비 일정이라 나이 구간과 딱 맞지 않을 수 있어요. 신혼집은 증여 한도만으로는 부족한 규모라 별도 저축·청약·대출 계획이 필요합니다. 5년마다 이 표의 금액을 새로 점검하세요.
        </p>

        {/* 자금 대응 전략 체크리스트 */}
        <h3 className="text-sm font-extrabold text-slate-900 mb-1.5">
          자금 대응 전략 체크리스트
        </h3>
        <div className="border border-slate-400 rounded-sm divide-y divide-slate-300 text-[11px] leading-snug">
          {[
            {
              id: 'strategy-1',
              bold: '필요한 날짜부터 확인 —',
              text: '등록금·보증금이 필요한 때와 입금 일정을 비교하세요.',
            },
            {
              id: 'strategy-2',
              bold: '입금 합계와 현재 잔액 구분 —',
              text: '이미 쓴 돈을 다음 목표에 다시 배정하지 마세요.',
            },
            {
              id: 'strategy-3',
              bold: '혼인·출산 공제 —',
              text: '미래 계획만으로 한도에 더하지 않고 실제 사건과 조건을 확인하세요.',
            },
            {
              id: 'strategy-4',
              bold: '주거 지원은 가족 상황에 맞게 —',
              text: '표의 2~3억원은 원본 예산 가정이며 필수 지출이나 공식 평균이 아닙니다.',
            },
            {
              id: 'strategy-5',
              bold: '청약을 준비할 때 —',
              text: '가입기간·납입 인정액은 그 시점의 청약홈·은행 안내를 확인하세요.',
            },
            {
              id: 'strategy-6',
              bold: '과거 증여 내역 확인 —',
              text: '부모·조부모에게 받은 돈과 신고 내용을 함께 확인하세요.',
            },
            {
              id: 'strategy-7',
              bold: '비용 계획 다시 점검 —',
              text: '참고 가격과 가족의 지원 계획을 정기적으로 갱신하세요.',
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
          {birthFormatted}생 · 생일이 지나야 만 나이가 올라가요. 학교는 그 해 3월 기준으로 계산했고, 학교 입학 시기는 개인마다 다를 수 있어요.
        </p>

        <div className="table-scroll-wrap">
          <table className="sheet-table text-center text-[10px] sm:text-[10.5px] leading-tight">
            <thead>
              <tr>
                <th className="w-16 sm:w-20 py-1">만 나이</th>
                <th className="w-14 sm:w-20 py-1">연도</th>
                <th className="w-20 sm:w-28 py-1">그날(생일)</th>
                <th className="w-24 sm:w-36 py-1">그 해 학교</th>
                <th className="text-left pl-2 sm:pl-3 py-1">증여 구간</th>
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
                    만 {row.age}세{row.isCurrentAge ? ' (지금)' : ''}
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

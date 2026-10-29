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

  // 인쇄 시 총 18행이 보이도록 빈 줄 채움
  const blankRowCount = Math.max(0, 16 - pocketRecords.length);

  return (
    <>
      {/* ==================== 시트 7: 세뱃돈·용돈 입금 기록 ==================== */}
      <section id="sheet-7" className="a4-sheet">
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-block bg-lime-200 border border-lime-400 px-2 py-0.5 text-xs font-extrabold text-slate-900 rounded-xs">
              {childName || '우리아이'}
            </span>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
              세뱃돈·용돈 입금 기록
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLoadSamplePocketRecords}
              className="no-print inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3" />
              릴스 예시 용돈 불러오기
            </button>
            <button
              type="button"
              onClick={onAddPocketRecord}
              className="no-print inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-3 h-3" />행 추가
            </button>
            <span className="text-[10px] text-slate-400 font-medium">
              Sheet 07 · 세뱃돈·용돈 기록장
            </span>
          </div>
        </div>

        {/* 기록 원칙 박스 (013~014.jpeg 완벽 재현) */}
        <div className="border border-slate-400 rounded-sm bg-slate-50/70 p-3 text-[11px] leading-relaxed text-slate-800 space-y-1.5 mb-3">
          <div className="font-extrabold text-slate-900 text-xs mb-1">
            기록 원칙
          </div>
          <p>
            <strong className="font-bold">① 받은 즉시 적는다.</strong> 나중에 기억하려 하면 누가 얼마 줬는지 잊어버려요.
          </p>
          <div>
            <strong className="font-bold">
              ② 정기금 외에 친족에게 받은 돈도 투자하면 증여로 볼 수 있어요.
            </strong>
            <ul className="list-disc pl-4 mt-0.5 space-y-0.5 text-slate-700">
              <li>받을 때마다 날짜·금액·준 사람을 적는다.</li>
              <li>현금이나 용돈통장에 모아 둔다.</li>
              <li>정한 날(예: 연 1회)에 증권계좌로 한 번에 옮긴다.</li>
              <li>입금한 달 말일부터 3개월 안에 증여신고한다.</li>
            </ul>
            <p className="text-slate-600 mt-0.5">
              ※ 부모·조부모 돈은 정기금 {firstPeriod.monthlyRecommended.toLocaleString('ko-KR')}원 외에 여유가 약{' '}
              <strong className="font-bold text-slate-900">
                {firstPeriod.remainingLimitManwon}만원
              </strong>
              뿐이고, 삼촌·이모·고모 등 기타친족은 부모·조부모와 따로{' '}
              <strong className="font-bold text-slate-900">1,000만원 한도</strong>로 봐요. (세무사 확인)
            </p>
          </div>
          <p>
            <strong className="font-bold">
              ③ 현금 보관 또는 용돈통장에 넣고, 아이 증권계좌에 합치지 마세요.
            </strong>
            <br />
            <span className="font-semibold text-slate-900">
              현재 1차 구간 한도 : {firstPeriod.deductionLimitManwon.toLocaleString('ko-KR')}만원 - 정기금 평가액{' '}
              {firstPeriod.evaluatedAmountManwon.toLocaleString('ko-KR')}만원 = 여유 약{' '}
              {firstPeriod.remainingLimitManwon}만원
            </span>
          </p>
        </div>

        {/* 용돈 입금 기록 표 */}
        <div className="overflow-x-auto mb-2">
          <table className="sheet-table sheet-table-compact text-center">
            <thead>
              <tr>
                <th className="w-16">날짜</th>
                <th className="w-28">준 사람</th>
                <th className="w-20">관계</th>
                <th className="w-24">금액</th>
                <th className="w-24">어디에 넣었나</th>
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
                      <option value=""></option>
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

        <p className="text-[10.5px] text-slate-600 mb-2">
          <strong className="font-semibold">어디에 넣었나</strong> — 현금 / 용돈통장 / 증권계좌 &nbsp;|&nbsp;{' '}
          <strong className="font-semibold">증여 해당</strong> — 현금·용돈통장이면 X, 증권계좌에 넣어 투자했으면 O
        </p>

        {/* 연도별 합계 (증여 해당 O 만 집계) */}
        <h3 className="text-xs font-extrabold text-slate-900 mb-1.5">
          연도별 합계 (증여 해당 O 만 집계)
        </h3>
        <div className="overflow-x-auto mb-2">
          <table className="sheet-table sheet-table-compact text-center">
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
          조부모·친척이 준 돈도 같은 칸에 적습니다. 증여세는 부모·조부모를 합쳐서 계산하므로, 할머니가 아이 계좌로 직접 넣어도 별도 한도가 생기지 않습니다. 증여 해당 O의 누적이 여유 약{' '}
          {firstPeriod.remainingLimitManwon}만원에 가까워지면 그때부터는 현금 보관만 하세요.
        </p>
      </section>

      {/* ==================== 시트 8: 자녀 목돈 필요 시기 체크리스트 & 자금 대응 전략 ==================== */}
      <section id="sheet-8" className="a4-sheet">
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-block bg-lime-200 border border-lime-400 px-2 py-0.5 text-xs font-extrabold text-slate-900 rounded-xs">
              {childName || '우리아이'}
            </span>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
              자녀 목돈 필요 시기 체크리스트
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Sheet 08 · 목돈 시점 & 자금 대응 전략
          </span>
        </div>

        <p className="text-[11px] text-slate-700 leading-relaxed mb-2.5">
          {birthFormatted}생 · 금액은 지금 가격(현재가) 기준이고, 오른쪽에{' '}
          <strong className="font-bold">물가상승률 {inflationRate}%</strong>를 반영한 금액을 같이 적었습니다. 준비가 끝난 항목은 □에 체크하세요.
        </p>

        <table className="sheet-table sheet-table-compact mb-2">
          <thead>
            <tr className="text-center">
              <th className="w-28">항목</th>
              <th className="w-12">
                필수/
                <br />
                선택
              </th>
              <th className="w-24">시점</th>
              <th>이유</th>
              <th className="w-32">
                예상 금액
                <br />
                <span className="text-[10px] font-normal">현재가</span>
              </th>
              <th className="w-36">
                물가 반영
                <br />
                <span className="text-[10px] font-normal">
                  연 {inflationRate}% 기준
                </span>
              </th>
              <th className="w-10">준비</th>
            </tr>
          </thead>
          <tbody>
            {lumpSumItems.map((item) => (
              <tr key={item.id}>
                <td className="font-bold text-slate-900 whitespace-pre-line">
                  {item.title}
                </td>
                <td className="text-center font-semibold">
                  {item.requiredOrOptional}
                </td>
                <td className="text-center text-[10.5px] leading-snug">
                  <div className="whitespace-pre-line font-semibold">
                    {item.timingAgeLabel}
                  </div>
                  <div className="text-slate-600">{item.timingYearLabel}</div>
                </td>
                <td className="text-[10.5px] text-slate-700 leading-snug">
                  {item.reason}
                </td>
                <td className="text-center text-[10.5px] leading-snug">
                  {item.presentValueLines.map((line, i) => (
                    <div
                      key={i}
                      className={i === 0 ? 'font-bold text-slate-900' : 'text-slate-600'}
                    >
                      {line}
                    </div>
                  ))}
                </td>
                <td className="text-center text-[10.5px] leading-snug bg-sky-50/40">
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

        <div className="border border-slate-400 rounded-sm bg-slate-50 px-2.5 py-2 text-[10.5px] text-slate-700 leading-relaxed mb-3.5">
          금액은 평균·범위 값이라 실제와 다를 수 있습니다. 물가 반영 금액은 오늘부터 해당 시점까지 매년 {inflationRate}%씩 오른다고 계산했어요(등록금은 해마다 따로). 물가상승률은 위 설정에서 바꿀 수 있고(결혼은 만 32세 기준), 항목마다 따로 필요한 돈이라 단순히 더하지는 않았습니다.
        </div>

        {/* 증여 구간과 겹쳐보면 */}
        <h3 className="text-sm font-extrabold text-slate-900 mb-1.5">
          증여 구간과 겹쳐보면
        </h3>
        <table className="sheet-table sheet-table-compact mb-2">
          <thead>
            <tr className="text-center">
              <th className="w-20">증여 구간</th>
              <th className="w-28">시점</th>
              <th className="w-20">공제</th>
              <th className="text-left">그 10년 안에 필요한 목돈</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => {
              let neededText = '-';
              if (p.periodNumber === 2) {
                neededText = '대학 등록금 (4년), 타지역 자취 보증금';
              } else if (p.periodNumber === 3) {
                neededText = '어학연수·교환학생, 취업 준비·자격증';
              } else if (p.periodNumber === 4) {
                neededText = '결혼 준비, 신혼집 보증금·주택자금';
              }
              return (
                <tr key={p.periodNumber} className="text-center">
                  <td className="font-bold bg-slate-50">{p.label}</td>
                  <td className="text-[10.5px]">
                    <div>만 {p.ageAtStart}세</div>
                    <div className="text-slate-600">{p.startDate}~</div>
                  </td>
                  <td className="font-semibold">
                    {p.deductionLimitManwon.toLocaleString('ko-KR')}만
                  </td>
                  <td className="text-left font-medium text-slate-800">
                    {neededText}
                  </td>
                </tr>
              );
            })}
            <tr className="text-center">
              <td className="font-bold bg-slate-50">혼인·출산</td>
              <td className="text-[10.5px]">혼인 전후 2년</td>
              <td className="font-semibold">1억</td>
              <td className="text-left font-medium text-slate-800">
                결혼 준비·신혼집 일부 (위 구간 한도에 더해 쓸 수 있음)
              </td>
            </tr>
          </tbody>
        </table>
        <p className="text-[10.5px] text-slate-600 mb-3.5">
          구간은 첫 증여일부터 열려 나이 구간과 딱 맞지 않을 수 있어요. 신혼집은 증여 한도만으로는 부족한 규모라 별도 저축·청약·대출 계획이 필요합니다. 5년마다 이 표의 금액을 새로 점검하세요.
        </p>

        {/* 자금 대응 전략 체크리스트 (017~018.jpeg 완벽 재현) */}
        <h3 className="text-sm font-extrabold text-slate-900 mb-1.5">
          자금 대응 전략 체크리스트
        </h3>
        <div className="border border-slate-400 rounded-sm divide-y divide-slate-300 text-[11px] leading-snug">
          {[
            {
              id: 'strategy-1',
              bold: `2차 구간 (만 ${periods[1]?.ageAtStart ?? 10}세에 시작, 2,000만) —`,
              text: '이 구간에 넣은 돈으로 대학 등록금 (4년)(만 19세), 타지역 자취 보증금(만 19세)에 쓸 수 있어요. 쓸 때가 가까워지면 원금 보존 위주 운용으로 바꾸는 것을 검토',
            },
            {
              id: 'strategy-2',
              bold: `3차 구간 (만 ${periods[2]?.ageAtStart ?? 20}세에 시작, 5,000만) —`,
              text: '이 구간에 넣은 돈으로 어학연수·교환학생(만 21세), 취업 준비·자격증(만 23세)에 쓸 수 있어요. 쓸 때가 가까워지면 원금 보존 위주 운용으로 바꾸는 것을 검토',
            },
            {
              id: 'strategy-3',
              bold: `4차 구간 (만 ${periods[3]?.ageAtStart ?? 30}세에 시작, 5,000만) + 혼인·출산 공제 1억원 —`,
              text: '이 구간에 넣은 돈으로 결혼 준비(만 32세), 신혼집 보증금·주택자금(만 32세)에 쓸 수 있어요. 쓸 때가 가까워지면 원금 보존 위주 운용으로 바꾸는 것을 검토',
            },
            {
              id: 'strategy-4',
              bold: '신혼집 자금은 증여 한도 밖 —',
              text: '아이 본인 저축·청약통장·대출 계획이 따로 필요',
            },
            {
              id: 'strategy-5',
              bold: `청약통장: 만 14세(${birthParsed.year + 14}년)부터 월 25만원씩 —`,
              text: '미성년 때 납입은 민영주택 가입기간 최대 5년, 국민주택 납입 최대 60회(회차당 25만원까지) 인정, 신혼집 청약에 활용',
            },
            {
              id: 'strategy-6',
              bold: '청약 제도는 바뀔 수 있어요 —',
              text: `만 13세쯤(${birthParsed.year + 13}년) 최신 납입 인정 기준을 청약홈·은행에서 다시 확인하고 가입하기. 통장은 미리 열어 둬도 되지만, 미성년 인정 한도(5년·60회)를 넘는 기간은 인정되지 않을 수 있어요`,
            },
            {
              id: 'strategy-7',
              bold: '물가·결혼 비용은 일반 물가보다 빠르게 오르는 편 —',
              text: '5년마다 이 표 금액을 새로 점검',
            },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => onToggleCheck(item.id)}
              className="flex items-start gap-2.5 px-2.5 py-1.5 hover:bg-slate-50 cursor-pointer"
            >
              <div className="pt-0.5">
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
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-block bg-lime-200 border border-lime-400 px-2 py-0.5 text-xs font-extrabold text-slate-900 rounded-xs">
              {childName || '우리아이'}
            </span>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
              나이 · 연도표
            </h2>
          </div>

          {blessingMessage && (
            <div className="text-center font-serif italic font-bold text-slate-800 text-sm sm:text-base px-3 py-0.5 bg-amber-50/70 border border-amber-200 rounded">
              “{blessingMessage}”
            </div>
          )}

          <span className="text-[10px] text-slate-400 font-medium">
            Sheet 09 · 만 35세 나이·학교·증여구간표
          </span>
        </div>

        <p className="text-[10.5px] text-slate-600 mb-2">
          {birthFormatted}생 · 생일이 지나야 만 나이가 올라가요. 학교는 그 해 3월 기준으로 계산했고, 학교 입학 시기는 개인마다 다를 수 있어요.
        </p>

        <table className="sheet-table text-center text-[10.5px] leading-tight">
          <thead>
            <tr>
              <th className="w-20 py-1">만 나이</th>
              <th className="w-20 py-1">연도</th>
              <th className="w-28 py-1">그날(생일)</th>
              <th className="w-36 py-1">그 해 학교</th>
              <th className="text-left pl-3 py-1">증여 구간</th>
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
                <td className="font-bold py-[2.5px] bg-slate-50/70">
                  만 {row.age}세{row.isCurrentAge ? ' (지금)' : ''}
                </td>
                <td className="py-[2.5px]">{row.year}년</td>
                <td className="py-[2.5px] text-slate-700">{row.birthdayStr}</td>
                <td className="py-[2.5px] font-medium text-slate-800">
                  {row.schoolLabel}
                </td>
                <td
                  className={`py-[2.5px] text-left pl-3 ${
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
      </section>
    </>
  );
}

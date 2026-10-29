'use client';

import React from 'react';
import {
  GiftPeriod,
  DelaySimulationRow,
  MonthlyCheckRow,
  calculateActualInstallmentRowTotal,
} from '@/lib/calculator';
import { SquareCheckbox } from '@/components/SquareCheckbox';

interface Sheet4To6Props {
  childName: string;
  firstPeriod: GiftPeriod;
  delaySimulations: DelaySimulationRow[];
  allowanceInfo: {
    startYmLabel: string;
    endYmLabel: string;
    totalCount: number;
    isExpandedCohort?: boolean;
    rows: MonthlyCheckRow[];
  };
  installmentRows: MonthlyCheckRow[];
  checkedMap: Record<string, boolean>;
  checkedAmountMap: Record<string, number>;
  onToggleCheck: (id: string) => void;
  memoMap: Record<string, string>;
  onChangeMemo: (key: string, value: string) => void;
}

export function Sheet4To6DelayAndChecklists({
  childName,
  firstPeriod,
  delaySimulations,
  allowanceInfo,
  installmentRows,
  checkedMap,
  checkedAmountMap,
  onToggleCheck,
  memoMap,
  onChangeMemo,
}: Sheet4To6Props) {
  // 시트 5: 실제 체크된 아동수당 수령 횟수 집계
  const checkedAllowanceCount = allowanceInfo.rows.reduce((acc, row) => {
    const rowChecked = row.activeMonths.reduce((mAcc, isActive, mIdx) => {
      if (!isActive) return mAcc;
      return mAcc + (checkedMap[`allowance-${row.year}-${mIdx + 1}`] ? 1 : 0);
    }, 0);
    return acc + rowChecked;
  }, 0);

  // 시트 6: 전체 예정 합계 및 실제 체크 입금 합계 집계
  const totalPlannedWon = installmentRows.reduce(
    (sum, r) => sum + (r.annualAmount || 0),
    0
  );
  const totalActualInfo = installmentRows.reduce(
    (acc, row) => {
      const info = calculateActualInstallmentRowTotal(
        row.year,
        row.activeMonths,
        checkedMap,
        checkedAmountMap,
        firstPeriod.monthlyPlanned
      );
      return {
        checkedCount: acc.checkedCount + info.checkedCount,
        actualAmountWon: acc.actualAmountWon + info.actualAmountWon,
      };
    },
    { checkedCount: 0, actualAmountWon: 0 }
  );

  return (
    <>
      {/* ==================== 시트 4: 신고 기한, 시작을 미루면 어떻게 달라질까, 증여 구간 한눈에 보기 ==================== */}
      <section id="sheet-4" className="a4-sheet">
        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b-2 border-slate-800 pb-2 mb-3">
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
            신고 기한: 증여한 달 말일부터 3개월 이내
          </h2>
          <span className="text-[10px] text-slate-400 font-medium shrink-0">
            Sheet 04 · 신고 기한 & 시작 시점 비교
          </span>
        </div>

        <p className="text-[11.5px] sm:text-xs text-slate-700 leading-relaxed mb-2.5">
          <strong className="font-bold text-slate-900">결론:</strong> 증여세 신고기한은 재산을 증여받은 날이 속하는 달의 말일부터 3개월 이내입니다(상속세 및 증여세법 제68조). 만료일이 토요일·일요일·공휴일(대체공휴일 포함) 또는 근로자의 날(5월 1일)이면 그 다음 평일로 연장됩니다(국세기본법 제5조). 2026년 내 만료일은 공식 월력요항 공휴일을 반영한 확정 날짜이며, 2027년 이후 미래 기한은 주말·근로자의 날·월초 양력 공휴일(신정·삼일절)만 먼저 보정한 <strong className="font-semibold">‘잠정’</strong> 날짜입니다.
        </p>

        <div className="border border-slate-400 rounded-sm bg-slate-50 px-2.5 sm:px-3 py-2.5 text-[11.5px] sm:text-xs text-slate-800 leading-relaxed mb-5">
          예) <strong className="font-bold">{firstPeriod.startDate}</strong>에 첫 증여(이체) →{' '}
          <strong className="font-bold">{firstPeriod.reportDeadline}</strong>까지 신고. 공제 한도 이내라 세금이 0원이어도 신고해 두면 나중에 자금 출처를 입증하는 공식 근거가 됩니다. 다만 단순 자동이체만 걸어두고 정기금 약정·신고 요건을 갖추지 않으면 매월 개별 증여로 볼 수 있으므로 주의하세요.
        </div>

        {/* 시작 전 준비 */}
        <h3 className="text-sm font-extrabold text-slate-900 mb-2">
          시작 전 핵심 체크포인트
        </h3>
        <ul className="list-disc pl-4 text-[11.5px] sm:text-xs text-slate-800 space-y-1.5 mb-5">
          <li>
            첫 시작일은 <strong className="font-bold">가족의 준비 일정을 10년 단위로 나누는 기준일</strong>입니다. 세법상 공제 한도는 고정된 10년마다 자동 초기화되지 않고, 매번 새로 증여하는 날로부터 과거 10년 이내 공제 사용액을 합산해 판단합니다.
          </li>
          <li>
            미성년 공제 기준(2,000만원)은 <strong className="font-bold">증여일 현재 만 19세 미만</strong>일 때 적용되며, 만 19세 생일 이후 증여분부터 성년 기준(5,000만원)이 적용됩니다.
          </li>
          <li>
            아이 명의 계좌 개설 → 증여계약서 작성 → 첫 이체 → 기한 내 증여세 신고 순서로 진행합니다.
          </li>
        </ul>

        {/* 시작을 미루면 어떻게 달라질까 */}
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-sm font-extrabold text-slate-900">
            시작을 미루면 준비 일정이 어떻게 달라질까
          </h3>
          <span className="sm:hidden text-[10px] text-slate-400 no-print">
            ← 좌우 스크롤 →
          </span>
        </div>
        <div className="table-scroll-wrap mb-2.5">
          <table className="sheet-table text-center min-w-[520px]">
            <thead>
              <tr>
                <th className="w-24">시작 시점</th>
                <th className="w-22">첫 시작일</th>
                <th className="w-16">시작 나이</th>
                <th className="w-18">미성년 구간</th>
                <th className="w-18">성년 구간</th>
                <th>성년 기준 전환 시점 · 계획 입금 총액</th>
              </tr>
            </thead>
            <tbody>
              {delaySimulations.map((row, idx) => (
                <tr
                  key={row.label}
                  className={idx === 0 ? 'bg-sky-50/40 font-semibold' : ''}
                >
                  <td className="font-bold text-left pl-2.5 whitespace-nowrap">
                    {row.label}
                  </td>
                  <td className="whitespace-nowrap">{row.startDate}</td>
                  <td className="whitespace-nowrap">만 {row.ageAtStart}세</td>
                  <td className="whitespace-nowrap">{row.minorPeriodCount}구간</td>
                  <td className="whitespace-nowrap">{row.adultPeriodCount}구간</td>
                  <td className="text-left px-2.5 py-1.5 leading-snug whitespace-nowrap">
                    <div className="font-extrabold text-slate-900 text-[11px]">
                      {row.firstAdultPeriodSummary}
                    </div>
                    <div className="text-[10px] text-slate-600 font-medium">
                      만 35세 이전 {row.totalPeriodCount}구간({row.totalPlannedMonths}회) · 계획액 합계{' '}
                      {row.totalPlannedManwon.toLocaleString('ko-KR')}만원
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border border-slate-400 rounded-sm bg-slate-50 px-2.5 sm:px-3 py-2 text-[11px] sm:text-[11.5px] text-slate-700 leading-relaxed mb-5">
          ※ 시작 시점을 늦추면 <strong className="font-semibold">성년(만 19세 이상, 5,000만원 기준) 구간이 시작되는 연도·나이</strong>와 만 35세까지 실행할 수 있는 준비 구간 수가 달라집니다. 각 구간의 법정 공제 기준액(2,000만·5,000만)을 단순 합산한 금액은 실제 보장된 비과세 총액이 아니므로, 오해를 막기 위해 실제 전환 시점과 가족 계획 입금액 기준으로 비교했습니다.
        </div>

        {/* 증여 구간 한눈에 보기 */}
        <h3 className="text-sm font-extrabold text-slate-900 mb-2">
          관계·상황별 증여재산 공제 기준 한눈에 보기
        </h3>
        <div className="table-scroll-wrap mb-3">
          <table className="sheet-table">
            <thead>
              <tr>
                <th className="w-16 sm:w-20 text-center">구분</th>
                <th className="w-18 sm:w-24 text-center">
                  수증자 나이
                  <br />
                  <span className="text-[9.5px] font-normal">(증여일 기준)</span>
                </th>
                <th className="w-22 sm:w-28 text-center">
                  10년 공제 한도
                  <br />
                  <span className="text-[9.5px] font-normal">(법정 기준액)</span>
                </th>
                <th className="text-left">적용 조건 및 주의할 점</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-center font-bold bg-slate-50 whitespace-nowrap">
                  직계존속
                  <br />
                  <span className="text-[10px] font-normal">(미성년)</span>
                </td>
                <td className="text-center whitespace-nowrap">
                  만 0세 ~<br />만 18세
                </td>
                <td className="text-center font-bold whitespace-nowrap">
                  10년간
                  <br />
                  2,000만원
                </td>
                <td className="text-slate-800 leading-snug">
                  부모·조부모·외조부모 등 직계존속에게 받은 증여를 모두 합산해 직전 10년 이내 2,000만원까지 공제합니다.
                </td>
              </tr>
              <tr>
                <td className="text-center font-bold bg-slate-50 whitespace-nowrap">
                  직계존속
                  <br />
                  <span className="text-[10px] font-normal">(성년)</span>
                </td>
                <td className="text-center whitespace-nowrap">
                  만 19세
                  <br />
                  이상
                </td>
                <td className="text-center font-bold whitespace-nowrap">
                  10년간
                  <br />
                  5,000만원
                </td>
                <td className="text-slate-800 leading-snug">
                  만 19세 생일부터 성년 한도(5,000만원)가 적용되나, 이번 증여 전 10년 이내에 미성년으로서 공제받은 금액이 있다면 그 금액을 차감하고 남은 한도를 계산합니다.
                </td>
              </tr>
              <tr>
                <td className="text-center font-bold bg-slate-50 whitespace-nowrap">
                  혼인·출산
                  <br />
                  <span className="text-[10px] font-normal">(특례)</span>
                </td>
                <td className="text-center whitespace-nowrap">
                  자녀 본인의
                  <br />
                  혼인·출산 시
                </td>
                <td className="text-center font-bold whitespace-nowrap">
                  통합 1억원
                  <br />
                  <span className="text-[10px] font-normal">(일반공제 별도)</span>
                </td>
                <td className="text-slate-800 leading-snug">
                  증여받는 자녀 본인이 결혼(혼인신고일 전후 2년 이내)하거나 자녀 본인의 아이를 출산·입양(출생일로부터 2년 이내)할 때 직계존속에게 받는 증여에 통합 1억원이 추가 공제됩니다. (아이 본인의 출생 시점이 아님)
                </td>
              </tr>
              <tr>
                <td className="text-center font-bold bg-slate-50 whitespace-nowrap">
                  기타친족
                </td>
                <td className="text-center whitespace-nowrap">나이 무관</td>
                <td className="text-center font-bold whitespace-nowrap">
                  10년간
                  <br />
                  1,000만원
                </td>
                <td className="text-slate-800 leading-snug">
                  6촌 이내 혈족·4촌 이내 인척(삼촌·이모·고모·조부모 외 친족 등) 전체를 합산해 직전 10년 이내 1,000만원 한도를 적용합니다.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ==================== 시트 5: 아동수당 입금 체크표 ==================== */}
      <section id="sheet-5" className="a4-sheet">
        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b-2 border-slate-800 pb-2 mb-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="inline-block bg-lime-200 border border-lime-400 px-2 py-0.5 text-xs font-extrabold text-slate-900 rounded-xs shrink-0">
              {childName || '우리아이'}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
              아동수당 입금 체크표
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-medium shrink-0">
            Sheet 05 · 아동수당 입금 기록표
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 mb-2 text-[11px] text-slate-800">
          <div>
            <strong className="font-bold">기록 가능한 월 칸:</strong>{' '}
            {allowanceInfo.startYmLabel} ~ {allowanceInfo.endYmLabel} (총{' '}
            <strong className="font-bold">{allowanceInfo.totalCount}칸</strong> ·{' '}
            {allowanceInfo.isExpandedCohort !== false
              ? '2017년 이후 출생 만 13세 미만 확대 기준'
              : '2016년 이전 출생 만 8세 미만 기준'}
            )
          </div>
          <div className="font-bold text-emerald-800">
            현재 체크한 수령 횟수: {checkedAllowanceCount}회 / 기록 칸 {allowanceInfo.totalCount}칸
          </div>
        </div>

        <p className="text-[11px] text-slate-700 leading-relaxed mb-2">
          <strong className="font-bold">주의:</strong> 표의 칸 수({allowanceInfo.totalCount}칸)는 기록 가능한 기간일 뿐 실제 지급을 보장하는 횟수가 아닙니다. 출생 후 60일 이내 신청 여부, 국내 거주·국적 요건, 90일 이상 해외 체류 시 정지, 지자체별 추가 지급 여부에 따라 실제 수령액이 달라지므로 실제로 입금받은 달에만 체크하고 금액을 적으세요.{' '}
          <a
            href="https://www.129.go.kr/faq/faq03.do?searchConsultingKeyword=B12"
            target="_blank"
            rel="noreferrer"
            className="underline font-semibold"
          >
            보건복지상담센터(129) 안내 확인
          </a>
        </p>

        <div className="sm:hidden text-right text-[10px] text-slate-400 mb-1 no-print">
          ← 표를 좌우로 밀어서 1~12월 및 입금액을 확인하세요 →
        </div>
        <div className="table-scroll-wrap">
          <table className="sheet-table sheet-table-compact text-center min-w-[560px]">
            <thead>
              <tr>
                <th className="w-11">연도</th>
                {Array.from({ length: 12 }, (_, i) => (
                  <th key={i} className="w-7">
                    {i + 1}월
                  </th>
                ))}
                <th className="w-14">기록칸</th>
                <th className="w-22">실제 받은 금액</th>
                <th className="w-26">기타·특이사항</th>
              </tr>
            </thead>
            <tbody>
              {allowanceInfo.rows.map((row) => (
                <tr key={row.year}>
                  <td className="font-bold bg-slate-50 whitespace-nowrap">
                    {row.year}
                  </td>
                  {row.activeMonths.map((isActive, mIdx) => {
                    const checkId = `allowance-${row.year}-${mIdx + 1}`;
                    return (
                      <td
                        key={mIdx}
                        className={
                          isActive
                            ? 'bg-white'
                            : 'bg-sky-100/70 text-slate-300'
                        }
                      >
                        {isActive ? (
                          <SquareCheckbox
                            size="sm"
                            checked={!!checkedMap[checkId]}
                            onChange={() => onToggleCheck(checkId)}
                            label={`${row.year}년 ${mIdx + 1}월 아동수당`}
                          />
                        ) : null}
                      </td>
                    );
                  })}
                  <td className="font-semibold text-slate-700 whitespace-nowrap text-[10px]">
                    {row.count}칸
                  </td>
                  <td className="p-0">
                    <input
                      type="text"
                      value={memoMap[`allowance-amt-${row.year}`] || ''}
                      onChange={(e) =>
                        onChangeMemo(`allowance-amt-${row.year}`, e.target.value)
                      }
                      placeholder="직접 입력"
                      aria-label={`${row.year}년 아동수당 실제 수령액`}
                      className="w-full h-full px-1 py-1 text-center text-[11px] bg-transparent focus:outline-none focus:bg-yellow-50 placeholder:text-slate-300"
                    />
                  </td>
                  <td className="p-0">
                    <input
                      type="text"
                      value={memoMap[`allowance-note-${row.year}`] || ''}
                      onChange={(e) =>
                        onChangeMemo(`allowance-note-${row.year}`, e.target.value)
                      }
                      placeholder=""
                      aria-label={`${row.year}년 아동수당 특이사항`}
                      className="w-full h-full px-1 py-1 text-left text-[11px] bg-transparent focus:outline-none focus:bg-yellow-50"
                    />
                  </td>
                </tr>
              ))}
              <tr>
                <td className="font-bold bg-slate-50 py-5">메모</td>
                <td colSpan={15} className="p-0">
                  <textarea
                    rows={2}
                    value={memoMap['allowance-bottom-memo'] || ''}
                    onChange={(e) =>
                      onChangeMemo('allowance-bottom-memo', e.target.value)
                    }
                    placeholder="수령 계좌번호, 신청일, 지역 추가 수당 여부 등 실제 수급 조건을 메모해 두세요."
                    className="w-full h-full p-2 text-xs bg-transparent resize-none focus:outline-none focus:bg-yellow-50"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ==================== 시트 6: 유기정기금 체크리스트 ==================== */}
      <section id="sheet-6" className="a4-sheet">
        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b-2 border-slate-800 pb-2 mb-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="inline-block bg-lime-200 border border-lime-400 px-2 py-0.5 text-xs font-extrabold text-slate-900 rounded-xs shrink-0">
              {childName || '우리아이'}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
              월별 증여 입금 체크표 (1차 120회)
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-medium shrink-0">
            Sheet 06 · 120회 예정액 & 실제 입금 기록표
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 border border-slate-300 rounded px-2.5 py-1.5 mb-2 text-[11px] text-slate-800">
          <div>
            <strong className="font-bold">120회 예정 총액:</strong>{' '}
            {firstPeriod.startDate} ~ {firstPeriod.endDate} ·{' '}
            <strong className="font-bold">
              {totalPlannedWon.toLocaleString('ko-KR')}원
            </strong>{' '}
            (현재 월 계획액 {firstPeriod.monthlyPlanned.toLocaleString('ko-KR')}원 기준)
          </div>
          <div className="font-bold text-emerald-800">
            실제 입금 체크 합계: {totalActualInfo.actualAmountWon.toLocaleString('ko-KR')}원 ({totalActualInfo.checkedCount}/120회 완료)
          </div>
        </div>

        <p className="text-[11px] text-slate-700 leading-relaxed mb-2">
          매월 {firstPeriod.startDate.split('.')[2]}일 이체 후 해당 월을 체크하세요. <strong className="font-bold">‘그해 줄 돈(예정)’</strong>은 현재 설정한 월 계획액 기준이며, <strong className="font-bold">‘실제 입금 확인’</strong>은 체크할 당시의 월 금액으로 별도 저장되어 이후 월 계획액을 변경해도 과거 실제 입금 합계가 바뀌지 않습니다.
        </p>

        <div className="sm:hidden text-right text-[10px] text-slate-400 mb-1 no-print">
          ← 표를 좌우로 밀어서 그해 줄 돈과 실제 입금 확인액을 보세요 →
        </div>
        <div className="table-scroll-wrap">
          <table className="sheet-table sheet-table-compact text-center min-w-[620px]">
            <thead>
              <tr>
                <th className="w-10">연도</th>
                {Array.from({ length: 12 }, (_, i) => (
                  <th key={i} className="w-6">
                    {i + 1}월
                  </th>
                ))}
                <th className="w-36">
                  그해 줄 돈 (예정)
                  <br />
                  <span className="text-[9.5px] font-normal">기간 · 횟수 × 월 계획액</span>
                </th>
                <th className="w-26">
                  실제 입금 확인
                  <br />
                  <span className="text-[9.5px] font-normal">체크 시점 금액 합산</span>
                </th>
                <th className="w-22">비고·메모</th>
              </tr>
            </thead>
            <tbody>
              {installmentRows.map((row) => {
                const actualRow = calculateActualInstallmentRowTotal(
                  row.year,
                  row.activeMonths,
                  checkedMap,
                  checkedAmountMap,
                  firstPeriod.monthlyPlanned
                );
                return (
                  <tr key={row.year}>
                    <td className="font-bold bg-slate-50 whitespace-nowrap">
                      {row.year}
                    </td>
                    {row.activeMonths.map((isActive, mIdx) => {
                      const checkId = `installment-${row.year}-${mIdx + 1}`;
                      return (
                        <td
                          key={mIdx}
                          className={
                            isActive
                              ? 'bg-white'
                              : 'bg-sky-100/70 text-slate-300'
                          }
                        >
                          {isActive ? (
                            <SquareCheckbox
                              size="sm"
                              checked={!!checkedMap[checkId]}
                              onChange={() => onToggleCheck(checkId)}
                              label={`${row.year}년 ${mIdx + 1}월 정기금`}
                            />
                          ) : null}
                        </td>
                      );
                    })}
                    <td className="text-right px-1.5 whitespace-nowrap leading-tight">
                      <div className="text-[9.5px] text-slate-600 font-medium">
                        {row.plannedSummaryLabel}
                      </div>
                      <div className="font-bold text-slate-900 text-[10.5px]">
                        {(row.annualAmount || 0).toLocaleString('ko-KR')}원
                      </div>
                    </td>
                    <td className="text-right px-1.5 whitespace-nowrap leading-tight bg-emerald-50/30">
                      <div className="font-extrabold text-emerald-900 text-[10.5px]">
                        {actualRow.actualAmountWon.toLocaleString('ko-KR')}원
                      </div>
                      <div className="text-[9.5px] text-slate-500">
                        {actualRow.checkedCount}/{row.count}회 체크
                      </div>
                    </td>
                    <td className="p-0">
                      <input
                        type="text"
                        value={memoMap[`installment-note-${row.year}`] || ''}
                        onChange={(e) =>
                          onChangeMemo(
                            `installment-note-${row.year}`,
                            e.target.value
                          )
                        }
                        placeholder=""
                        aria-label={`${row.year}년 정기금 비고`}
                        className="w-full h-full px-1 py-1 text-left text-[11px] bg-transparent focus:outline-none focus:bg-yellow-50"
                      />
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td className="font-bold bg-slate-50 py-4">메모</td>
                <td colSpan={15} className="p-0">
                  <textarea
                    rows={3}
                    value={memoMap['installment-bottom-memo'] || ''}
                    onChange={(e) =>
                      onChangeMemo('installment-bottom-memo', e.target.value)
                    }
                    placeholder="증여계약일, 홈택스 증여세 신고 접수번호, 계좌 정보 등을 기록해 두세요."
                    className="w-full h-full p-2 text-xs bg-transparent resize-none focus:outline-none focus:bg-yellow-50"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

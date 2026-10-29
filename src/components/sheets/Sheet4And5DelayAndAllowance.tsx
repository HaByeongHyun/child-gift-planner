'use client';

import React from 'react';
import {
  GiftPeriod,
  DelaySimulationRow,
  MonthlyCheckRow,
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
    rows: MonthlyCheckRow[];
  };
  installmentRows: MonthlyCheckRow[];
  checkedMap: Record<string, boolean>;
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
  onToggleCheck,
  memoMap,
  onChangeMemo,
}: Sheet4To6Props) {
  return (
    <>
      {/* ==================== 시트 4: 신고 기한, 시작을 미루면 어떻게 달라질까, 증여 구간 한눈에 보기 ==================== */}
      <section id="sheet-4" className="a4-sheet">
        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b-2 border-slate-800 pb-2 mb-3">
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
            신고 기한: 증여한 달 말일부터 3개월
          </h2>
          <span className="text-[10px] text-slate-400 font-medium shrink-0">
            Sheet 04 · 신고 기한 & 시작 시점 비교
          </span>
        </div>

        <p className="text-[11.5px] sm:text-xs text-slate-700 leading-relaxed mb-2.5">
          일반 증여 신고기한은 증여한 달 말일부터 3개월입니다. 표의 날짜는 주말만 보정한 잠정값이며 공휴일·근로자의 날을 추가로 확인해야 합니다. 정기금은 약정·신고 조건을 충족했는지 별도 확인해야 하며, 단순한 매월 이체를 한 번만 신고하는 것으로 처리하지 않습니다.
        </p>

        <div className="border border-slate-400 rounded-sm bg-slate-50 px-2.5 sm:px-3 py-2.5 text-[11.5px] sm:text-xs text-slate-800 leading-relaxed mb-5">
          예) <strong className="font-bold">{firstPeriod.startDate}</strong>에 첫 이체 →{' '}
          <strong className="font-bold">{firstPeriod.reportDeadline}</strong>까지 신고. 세금이 0원이어도 신고를 권합니다. 신고 기록이 나중에 자금 출처를 설명하는 근거가 됩니다. 2차 구간 이후 마감일은 위 구간표에 있습니다.
        </div>

        {/* 시작 전 준비 */}
        <h3 className="text-sm font-extrabold text-slate-900 mb-2">
          시작 전 준비
        </h3>
        <ul className="list-disc pl-4 text-[11.5px] sm:text-xs text-slate-800 space-y-1.5 mb-5">
          <li>
            시작일을 정하면 <strong className="font-bold">준비 일정을 10년씩 나누는 기준</strong>입니다. 실제 공제는 매 증여 시점에 다시 확인합니다.
          </li>
          <li>
            미성년 공제(2,000만원)는 <strong className="font-bold">증여일에 만 19세 미만</strong>일 때만 적용됩니다.
          </li>
          <li>
            아이 이름 계좌(입출금·증권)를 먼저 열고, 증여계약서를 쓴 뒤 첫 이체를 합니다.
          </li>
        </ul>

        {/* 시작을 미루면 어떻게 달라질까 */}
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-sm font-extrabold text-slate-900">
            시작을 미루면 어떻게 달라질까
          </h3>
          <span className="sm:hidden text-[10px] text-slate-400 no-print">
            ← 좌우 스크롤 →
          </span>
        </div>
        <div className="table-scroll-wrap mb-2.5">
          <table className="sheet-table text-center min-w-[460px]">
            <thead>
              <tr>
                <th className="w-24">시작 시점</th>
                <th className="w-24">시작일</th>
                <th className="w-18">그때 나이</th>
                <th className="w-20">미성년 구간</th>
                <th className="w-20">성년 구간</th>
                <th>일반 공제 기준액의 단순 합계</th>
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
                  <td className="whitespace-nowrap">{row.minorPeriodCount}번</td>
                  <td className="whitespace-nowrap">{row.adultPeriodCount}번</td>
                  <td className="font-extrabold text-slate-900 whitespace-nowrap">
                    {row.totalDeductionManwon.toLocaleString('ko-KR')}만원
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border border-slate-400 rounded-sm bg-slate-50 px-2.5 sm:px-3 py-2.5 text-[11px] sm:text-[11.5px] text-slate-700 leading-relaxed mb-5">
          이 표는 시작 시점을 바꿨을 때의 나이와 준비 일정 비교입니다. 마지막 열은 각 시작 나이의 일반 공제 기준액을 단순 합산한 참고값이며, 실제로 사용 가능한 공제나 공제 기준 줄 수 있는 총액이 아닙니다. 실제 증여 때마다 과거 10년 내 공제 사용액을 확인해야 합니다.
        </div>

        {/* 증여 구간 한눈에 보기 */}
        <h3 className="text-sm font-extrabold text-slate-900 mb-2">
          증여 구간 한눈에 보기
        </h3>
        <div className="table-scroll-wrap mb-3">
          <table className="sheet-table">
            <thead>
              <tr>
                <th className="w-14 sm:w-20 text-center">구분</th>
                <th className="w-16 sm:w-24 text-center">
                  나이
                  <br />
                  <span className="text-[9.5px] font-normal">(증여일 기준)</span>
                </th>
                <th className="w-20 sm:w-28 text-center">
                  공제 기준
                  <br />
                  참고 금액
                </th>
                <th className="text-left">알아둘 점</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="text-center font-bold bg-slate-50 whitespace-nowrap">
                  미성년
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
                  증여일에 만 19세 미만이어야 합니다.
                </td>
              </tr>
              <tr>
                <td className="text-center font-bold bg-slate-50 whitespace-nowrap">
                  성년
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
                  이번 증여 전 10년 이내 공제 사용액을 확인합니다. 성년이 되어도 그 기간 안에 미성년 때 사용한 공제가 초기화되지 않습니다.</td>
              </tr>
              <tr>
                <td className="text-center font-bold bg-slate-50 whitespace-nowrap">
                  혼인·출산
                </td>
                <td className="text-center whitespace-nowrap">성년 이후</td>
                <td className="text-center font-bold whitespace-nowrap">
                  1억원 (추가)
                </td>
                <td className="text-slate-800 leading-snug">
                  거주자가 직계존속에게 받는 증여로 혼인신고일 전후 2년 또는 본인 자녀 출생·입양일부터 2년 내 등 요건 확인. 혼인과 출산을 합쳐 1억원 한도이며 일반 공제와 별도입니다.
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
                  <br />
                  <span className="text-[10px] font-normal">(별도)</span>
                </td>
                <td className="text-slate-800 leading-snug">
                  기타 친족 공제도 관계 요건과 이전 10년 내 공제 사용액을 확인해야 합니다. 이 표는 관계별 일반 기준 안내이며 개별 비과세 판정이 아닙니다.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="text-xs">부모·조부모에게 받은 일반 공제는 함께 확인합니다. 정확한 10년 경계일은 별도 확인 대상으로 두며 이 도구에서 새 한도가 열리는 날을 확정하지 않습니다. 초과금액이 바로 납부세액은 아닙니다.</p>
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

        <p className="text-[11px] text-slate-700 leading-relaxed mb-2">
          2026년 보건복지부 안내에 따라 2017년 이후 출생자는 13세 생일 전달까지의 기록 칸을 제공합니다. 2026년은 9세 미만부터 단계적으로 확대됩니다. 2016년 이전 출생자는 기존 8세 미만 기록 칸이며 과거 실제 수급 여부는 별도 확인하세요. 표의 칸 수가 지급을 보장하는 횟수는 아닙니다. 신청·거주·국적·중단 조건에 따라 실제 받은 금액을 적으세요. ({allowanceInfo.startYmLabel}~{allowanceInfo.endYmLabel}, 기록 칸 {allowanceInfo.totalCount}개)
          <a href="https://www.129.go.kr/faq/faq03.do?searchConsultingKeyword=B12" className="underline"> 보건복지상담센터 근거</a>
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
                <th className="w-11">횟수</th>
                <th className="w-22">입금액</th>
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
                  <td className="font-semibold text-slate-700 whitespace-nowrap">
                    {row.count}회
                  </td>
                  <td className="p-0">
                    <input
                      type="text"
                      value={memoMap[`allowance-amt-${row.year}`] || ''}
                      onChange={(e) =>
                        onChangeMemo(`allowance-amt-${row.year}`, e.target.value)
                      }
                      placeholder=""
                      className="w-full h-full px-1 py-1 text-center text-[11px] bg-transparent focus:outline-none focus:bg-yellow-50"
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
                    placeholder="입금액 칸에는 그해 실제로 받은 금액을 적으세요."
                    className="w-full h-full p-2 text-xs bg-transparent resize-none focus:outline-none focus:bg-yellow-50"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[10.5px] text-slate-500 mt-1.5">
          입금액 칸에는 그해 실제로 받은 금액을 적으세요.
        </p>
      </section>

      {/* ==================== 시트 6: 유기정기금 체크리스트 ==================== */}
      <section id="sheet-6" className="a4-sheet">
        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b-2 border-slate-800 pb-2 mb-2">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="inline-block bg-lime-200 border border-lime-400 px-2 py-0.5 text-xs font-extrabold text-slate-900 rounded-xs shrink-0">
              {childName || '우리아이'}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
              유기정기금 이체 체크표 (1차 정기금)
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-medium shrink-0">
            Sheet 06 · 유기정기금 120회 체크리스트
          </span>
        </div>

        <p className="text-[11px] text-slate-700 leading-relaxed mb-2">
          매월 {firstPeriod.startDate.split('.')[2]}일 이체한 뒤 체크하세요. 하늘색 칸은 계약 기간 밖입니다. 총 120회 ·{' '}
          {firstPeriod.startDate} ~ {firstPeriod.endDate} · 월{' '}
          {firstPeriod.monthlyPlanned.toLocaleString('ko-KR')}원. 은행 앱 이체 메모에도 &quot;정기금 증여&quot;라고 적어 두면 좋아요.
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
                <th className="w-11">횟수</th>
                <th className="w-24">입금액</th>
                <th className="w-26">기타·특이사항</th>
              </tr>
            </thead>
            <tbody>
              {installmentRows.map((row) => (
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
                  <td className="font-semibold text-slate-700 whitespace-nowrap">
                    {row.count}회
                  </td>
                  <td className="font-bold text-slate-900 whitespace-nowrap">
                    {(row.annualAmount || 0).toLocaleString('ko-KR')}원
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
                      className="w-full h-full px-1 py-1 text-left text-[11px] bg-transparent focus:outline-none focus:bg-yellow-50"
                    />
                  </td>
                </tr>
              ))}
              <tr>
                <td className="font-bold bg-slate-50 py-5">메모</td>
                <td colSpan={15} className="p-0">
                  <textarea
                    rows={3}
                    value={memoMap['installment-bottom-memo'] || ''}
                    onChange={(e) =>
                      onChangeMemo('installment-bottom-memo', e.target.value)
                    }
                    placeholder="특이사항이나 증여 신고 접수번호 등을 기록해 두세요."
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

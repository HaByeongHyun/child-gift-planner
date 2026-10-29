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
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-3">
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
            신고 기한: 입금 후 3개월 이내
          </h2>
          <span className="text-[10px] text-slate-400 font-medium">
            Sheet 04 · 신고 기한 & 시작 시점 비교
          </span>
        </div>

        <p className="text-xs text-slate-700 leading-relaxed mb-2.5">
          유기정기금은 첫 이체일이 속한 달의 말일부터 3개월 이내에 홈택스로 신고합니다. 구간마다 한 번만 신고하고, 같은 구간 안에서는 매달 다시 신고하지 않습니다.
        </p>

        <div className="border border-slate-400 rounded-sm bg-slate-50 px-3 py-2.5 text-xs text-slate-800 leading-relaxed mb-5">
          예) <strong className="font-bold">{firstPeriod.startDate}</strong>에 첫 이체 →{' '}
          <strong className="font-bold">{firstPeriod.reportDeadline}</strong>까지 신고. 세금이 0원이어도 신고를 권합니다. 신고 기록이 나중에 자금 출처를 설명하는 근거가 됩니다. 2차 구간 이후 마감일은 위 구간표에 있습니다.
        </div>

        {/* 시작 전 준비 */}
        <h3 className="text-sm font-extrabold text-slate-900 mb-2">
          시작 전 준비
        </h3>
        <ul className="list-disc pl-4 text-xs text-slate-800 space-y-1.5 mb-5">
          <li>
            시작일을 정하면 <strong className="font-bold">그날부터 10년이 한 구간</strong>입니다. 시작일이 늦어질수록 구간도 같이 밀립니다.
          </li>
          <li>
            미성년 공제(2,000만원)는 <strong className="font-bold">증여일에 만 19세 미만</strong>일 때만 적용됩니다.
          </li>
          <li>
            아이 이름 계좌(입출금·증권)를 먼저 열고, 증여계약서를 쓴 뒤 첫 이체를 합니다.
          </li>
        </ul>

        {/* 시작을 미루면 어떻게 달라질까 */}
        <h3 className="text-sm font-extrabold text-slate-900 mb-2">
          시작을 미루면 어떻게 달라질까
        </h3>
        <table className="sheet-table text-center mb-2.5">
          <thead>
            <tr>
              <th className="w-28">시작 시점</th>
              <th className="w-28">시작일</th>
              <th className="w-20">그때 나이</th>
              <th className="w-24">미성년 구간</th>
              <th className="w-24">성년 구간</th>
              <th>만 35세까지 쓸 수 있는 공제 합계</th>
            </tr>
          </thead>
          <tbody>
            {delaySimulations.map((row, idx) => (
              <tr key={row.label} className={idx === 0 ? 'bg-sky-50/40 font-semibold' : ''}>
                <td className="font-bold text-left pl-3">{row.label}</td>
                <td>{row.startDate}</td>
                <td>만 {row.ageAtStart}세</td>
                <td>{row.minorPeriodCount}번</td>
                <td>{row.adultPeriodCount}번</td>
                <td className="font-extrabold text-slate-900">
                  {row.totalDeductionManwon.toLocaleString('ko-KR')}만원
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border border-slate-400 rounded-sm bg-slate-50 px-3 py-2.5 text-[11.5px] text-slate-700 leading-relaxed mb-5">
          이 경우 구간 수와 공제 합계가 같아서, 늦게 시작해도 쓸 수 있는 한도의 총량은 같습니다. 계약을 짧게 하거나 일시금으로 하면 구간마다 한도를 다 쓸 수 있어요. 다만 첫 한도가 늦게 열리는 만큼 투자 기간은 줄어듭니다. 공제 합계는 만 35세까지 열리는 구간의 한도(2,000만원 또는 5,000만원)를 모두 더한 값이에요. 실제로 준 금액이 아니라 세금 없이 줄 수 있는 최대 총량입니다.
        </div>

        {/* 증여 구간 한눈에 보기 */}
        <h3 className="text-sm font-extrabold text-slate-900 mb-2">
          증여 구간 한눈에 보기
        </h3>
        <table className="sheet-table mb-3">
          <thead>
            <tr>
              <th className="w-20 text-center">구분</th>
              <th className="w-24 text-center">
                나이
                <br />
                <span className="text-[10px] font-normal">(증여일 기준)</span>
              </th>
              <th className="w-28 text-center">
                세금 없이
                <br />
                가능한 금액
              </th>
              <th className="text-left">알아둘 점</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-center font-bold bg-slate-50">미성년</td>
              <td className="text-center">
                만 0세 ~<br />만 18세
              </td>
              <td className="text-center font-bold">
                10년간
                <br />
                2,000만원
              </td>
              <td className="text-slate-800">증여일에 만 19세 미만이어야 합니다.</td>
            </tr>
            <tr>
              <td className="text-center font-bold bg-slate-50">성년</td>
              <td className="text-center">
                만 19세
                <br />
                이상
              </td>
              <td className="text-center font-bold">
                10년간
                <br />
                5,000만원
              </td>
              <td className="text-slate-800 leading-snug">
                첫 증여로부터 10년 안에 이미 준 돈(미성년 때 준 돈 포함)은 모두 더해서 이 한도에서 뺍니다. 예: 만 15세에 2,000만원을 줬다면, 10년 안인 만 20세에는 5,000만원 - 2,000만원 = 3,000만원까지만 세금 없이 줄 수 있어요. 첫 증여로부터 10년이 지나면 이전 증여는 더하지 않고 새 한도가 열립니다.
              </td>
            </tr>
            <tr>
              <td className="text-center font-bold bg-slate-50">혼인·출산</td>
              <td className="text-center">성년 이후</td>
              <td className="text-center font-bold">1억원 (추가)</td>
              <td className="text-slate-800">
                혼인신고일 전후 2년, 또는 자녀 출생일부터 2년 안에 받은 증여. 성년 5,000만원과 별도로 적용됩니다.
              </td>
            </tr>
            <tr>
              <td className="text-center font-bold bg-slate-50">기타친족</td>
              <td className="text-center">나이 무관</td>
              <td className="text-center font-bold">
                10년간
                <br />
                1,000만원
                <br />
                <span className="text-[10px] font-normal">(별도)</span>
              </td>
              <td className="text-slate-800 leading-snug">
                삼촌·이모·고모 등 친척이 줄 때 쓰는 한도입니다(부모·조부모가 아닌 6촌 이내 혈족·4촌 이내 인척). 부모·조부모 한도와 합치지 않고 따로 계산합니다. 줄 수 있는 돈이 막히는 게 아니라, 이 한도 안이면 세금 없이 줄 수 있다는 뜻입니다. 나이와 상관없이(미성년이든 성년이든) 같은 한도이고, 친척에게서 처음 받은 날부터 10년이 한 구간입니다. 10년이 지나면 새 1,000만원이 열립니다.
              </td>
            </tr>
          </tbody>
        </table>

        <ul className="list-disc pl-4 text-[11px] text-slate-800 space-y-1 leading-relaxed">
          <li>
            부모와 조부모는 모두 <strong className="font-bold">직계존속</strong>이라 미성년 2,000만원·성년 5,000만원 한도를 <strong className="font-bold">함께 씁니다.</strong>
          </li>
          <li>
            <strong className="font-bold">한도는 10년 단위로 합산</strong>하고, 구간은 <strong className="font-bold">첫 증여일부터 10년</strong>입니다.
            <br />
            <span className="font-semibold">예시 ①</span> 새 구간은 &quot;첫 증여일 + 10년&quot;에 열립니다. 만 18세에 첫 증여로 2,000만원을 다 썼다면, 새 구간은 만 28세에 열려요. 그때는 성년이라 새 한도는 5,000만원입니다.
            <br />
            <span className="font-semibold">예시 ②</span> 한도를 다 쓴 날이 기준이 아니에요. 만 15세에 첫 증여를 하고 만 18세에 한도를 다 썼어도, 새 구간은 만 18세 + 10년이 아니라 만 25세(첫 증여일 + 10년)에 열려요.
          </li>
          <li>
            한도를 넘기면 넘은 금액에 증여세(10~50%)가 붙습니다. 단, <strong className="font-bold">넘은 금액이 50만원 미만이면 과세하지 않습니다</strong>(합산은 됩니다).
          </li>
        </ul>
      </section>

      {/* ==================== 시트 5: 아동수당 입금 체크표 ==================== */}
      <section id="sheet-5" className="a4-sheet">
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-block bg-lime-200 border border-lime-400 px-2 py-0.5 text-xs font-extrabold text-slate-900 rounded-xs">
              {childName || '우리아이'}
            </span>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
              아동수당 입금 체크표
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Sheet 05 · 아동수당 156회 입금 확인표
          </span>
        </div>

        <p className="text-[11px] text-slate-700 leading-relaxed mb-3">
          아이 이름 계좌로 직접 받는 아동수당은 증여로 보지 않아 한도에 합산하지 않아요. 지급 연령이 늘어날 수 있어 출생월부터 만 13세 미만(약{' '}
          {allowanceInfo.startYmLabel}~{allowanceInfo.endYmLabel}분까지,{' '}
          {allowanceInfo.totalCount}회)으로 넉넉히 만들었습니다. 실제 지급 기간과 금액은 복지로·주민센터에서 확인하고, 해당 없는 칸은 비워 두세요.
        </p>

        <div className="overflow-x-auto">
          <table className="sheet-table sheet-table-compact text-center">
            <thead>
              <tr>
                <th className="w-12">연도</th>
                {Array.from({ length: 12 }, (_, i) => (
                  <th key={i} className="w-7">
                    {i + 1}월
                  </th>
                ))}
                <th className="w-11">횟수</th>
                <th className="w-24">입금액</th>
                <th className="w-28">기타·특이사항</th>
              </tr>
            </thead>
            <tbody>
              {allowanceInfo.rows.map((row) => (
                <tr key={row.year}>
                  <td className="font-bold bg-slate-50">{row.year}</td>
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
                  <td className="font-semibold text-slate-700">{row.count}회</td>
                  <td className="p-0">
                    <input
                      type="text"
                      value={memoMap[`allowance-amt-${row.year}`] || ''}
                      onChange={(e) =>
                        onChangeMemo(`allowance-amt-${row.year}`, e.target.value)
                      }
                      placeholder=""
                      className="w-full h-full px-1.5 py-1 text-center text-[11px] bg-transparent focus:outline-none focus:bg-yellow-50"
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
                      className="w-full h-full px-1.5 py-1 text-left text-[11px] bg-transparent focus:outline-none focus:bg-yellow-50"
                    />
                  </td>
                </tr>
              ))}
              <tr>
                <td className="font-bold bg-slate-50 py-6">메모</td>
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
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="inline-block bg-lime-200 border border-lime-400 px-2 py-0.5 text-xs font-extrabold text-slate-900 rounded-xs">
              {childName || '우리아이'}
            </span>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
              유기정기금 이체 체크표 (1차 정기금)
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Sheet 06 · 유기정기금 120회 체크리스트
          </span>
        </div>

        <p className="text-[11px] text-slate-700 leading-relaxed mb-3">
          매월 {firstPeriod.startDate.split('.')[2]}일 이체한 뒤 체크하세요. 하늘색 칸은 계약 기간 밖입니다. 총 120회 ·{' '}
          {firstPeriod.startDate} ~ {firstPeriod.endDate} · 월{' '}
          {firstPeriod.monthlyRecommended.toLocaleString('ko-KR')}원. 은행 앱 이체 메모에도 &quot;정기금 증여&quot;라고 적어 두면 좋아요.
        </p>

        <div className="overflow-x-auto">
          <table className="sheet-table sheet-table-compact text-center">
            <thead>
              <tr>
                <th className="w-12">연도</th>
                {Array.from({ length: 12 }, (_, i) => (
                  <th key={i} className="w-7">
                    {i + 1}월
                  </th>
                ))}
                <th className="w-11">횟수</th>
                <th className="w-24">입금액</th>
                <th className="w-28">기타·특이사항</th>
              </tr>
            </thead>
            <tbody>
              {installmentRows.map((row) => (
                <tr key={row.year}>
                  <td className="font-bold bg-slate-50">{row.year}</td>
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
                  <td className="font-semibold text-slate-700">{row.count}회</td>
                  <td className="font-bold text-slate-900">
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
                      className="w-full h-full px-1.5 py-1 text-left text-[11px] bg-transparent focus:outline-none focus:bg-yellow-50"
                    />
                  </td>
                </tr>
              ))}
              <tr>
                <td className="font-bold bg-slate-50 py-6">메모</td>
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

'use client';

import React from 'react';
import {
  GiftPeriod,
  CalendarTodoItem,
  parseYMD,
} from '@/lib/calculator';
import { SquareCheckbox } from '@/components/SquareCheckbox';

interface Sheet1To3Props {
  childName: string;
  periods: GiftPeriod[];
  calendarTodos: CalendarTodoItem[];
  checkedMap: Record<string, boolean>;
  onToggleCheck: (id: string) => void;
}

export function Sheet1To3GiftOverview({
  childName,
  periods,
  calendarTodos,
  checkedMap,
  onToggleCheck,
}: Sheet1To3Props) {
  const firstPeriod = periods[0];
  const secondPeriod = periods[1];
  const startParsed = parseYMD(firstPeriod.startDate);

  return (
    <>
      {/* ==================== 시트 1: 증여 구간 요약 & 증여 구간표 ==================== */}
      <section id="sheet-1" className="a4-sheet">
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="inline-block bg-lime-200 border border-lime-400 px-2.5 py-0.5 text-sm font-extrabold text-slate-900 rounded-xs">
              {childName || '우리아이'}
            </span>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
              맞춤형 증여 구간 리포트 (만 35세까지)
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            Sheet 01 · 증여 구간 총괄표
          </span>
        </div>

        {/* 상단 요약 카드 4개 (001~002.jpeg 완벽 재현) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
          <div className="border border-slate-400 rounded-md p-3 bg-slate-50/70">
            <div className="text-[11px] font-semibold text-slate-600 mb-1">
              1차 구간 공제 한도
            </div>
            <div className="text-xl font-extrabold text-slate-900 mb-1">
              {firstPeriod.deductionLimitManwon.toLocaleString('ko-KR')}만원
            </div>
            <div className="text-[11px] text-slate-600">
              {firstPeriod.isMinor ? '미성년' : '성년'} · 만 {firstPeriod.ageAtStart}세에 시작
            </div>
          </div>

          <div className="border border-slate-400 rounded-md p-3 bg-slate-50/70">
            <div className="text-[11px] font-semibold text-slate-600 mb-1">
              1차 월 증여 최대
            </div>
            <div className="text-xl font-extrabold text-slate-900 mb-1">
              {firstPeriod.monthlyRecommended.toLocaleString('ko-KR')}원
            </div>
            <div className="text-[10.5px] text-slate-600 leading-tight">
              120개월 기준 · 계산상 최대{' '}
              {firstPeriod.monthlyMaxExact.toLocaleString('ko-KR')}원
            </div>
          </div>

          <div className="border border-slate-400 rounded-md p-3 bg-slate-50/70">
            <div className="text-[11px] font-semibold text-slate-600 mb-1">
              1차 신고 마감
            </div>
            <div className="text-xl font-extrabold text-slate-900 mb-1">
              {firstPeriod.reportDeadline}
            </div>
            <div className="text-[10.5px] text-slate-600 leading-tight">
              시작 예정일 기준 · 이체 달 말일부터 3개월
            </div>
          </div>

          <div className="border border-slate-400 rounded-md p-3 bg-slate-50/70">
            <div className="text-[11px] font-semibold text-slate-600 mb-1">
              2차 구간 시작
            </div>
            <div className="text-xl font-extrabold text-slate-900 mb-1">
              {secondPeriod ? secondPeriod.startDate : '-'}
            </div>
            <div className="text-[11px] text-slate-600">시작일 + 10년</div>
          </div>
        </div>

        {/* 한도 안내 배너 */}
        <div className="border border-slate-400 rounded-sm bg-sky-50/60 px-3 py-2 text-xs text-slate-800 mb-4 font-medium">
          한도 안 최대 금액{' '}
          <strong className="font-extrabold text-slate-950">
            {firstPeriod.monthlyRecommended.toLocaleString('ko-KR')}원
          </strong>
          으로 시작하면 평가액은{' '}
          <strong className="font-extrabold text-slate-950">
            {firstPeriod.evaluatedAmountManwon.toLocaleString('ko-KR')}만원
          </strong>
          , 한도까지{' '}
          <strong className="font-extrabold text-slate-950">
            {firstPeriod.remainingLimitManwon}만원
          </strong>{' '}
          남습니다.
        </div>

        {/* 증여 구간표 (만 35세까지) */}
        <h3 className="text-base font-extrabold text-slate-900 mb-2">
          증여 구간표 (만 35세까지)
        </h3>
        <div className="overflow-x-auto mb-4">
          <table className="sheet-table text-center">
            <thead>
              <tr>
                <th className="w-12">구간</th>
                <th className="w-24">시작일</th>
                <th className="w-20">그때 나이</th>
                <th className="w-28">적용 공제</th>
                <th className="w-32">계약 기간</th>
                <th className="w-36">
                  월 증여
                  <br />
                  <span className="text-[10px] font-normal">정기금으로 매달</span>
                </th>
                <th className="w-28">
                  일시금이면
                  <br />
                  <span className="text-[10px] font-normal">한 번에 최대</span>
                </th>
                <th className="w-24">신고 마감</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p, idx) => (
                <tr key={p.periodNumber}>
                  <td className="font-bold bg-slate-50">{p.label}</td>
                  <td className="font-semibold">{p.startDate}</td>
                  <td>만 {p.ageAtStart}세</td>
                  <td className="font-semibold">{p.deductionLabel}</td>
                  <td className="text-[11px] leading-snug">
                    <div className="font-bold">120개월</div>
                    <div>~ {p.endDate}</div>
                    {idx > 0 && (
                      <div className="text-[10px] text-slate-500">
                        10년 기준 참고
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="text-[10px] text-slate-600">
                      한도 안 최대 금액
                    </div>
                    <div className="text-sm font-extrabold text-slate-900">
                      {p.monthlyRecommended.toLocaleString('ko-KR')}원
                    </div>
                  </td>
                  <td className="font-bold">{p.lumpSumMaxLabel}</td>
                  <td className="font-semibold">{p.reportDeadline}</td>
                </tr>
              ))}
              <tr>
                <td className="font-bold bg-slate-50">별도</td>
                <td className="font-semibold">혼인·출산 시</td>
                <td>해당 시</td>
                <td className="font-semibold">혼인·출산 1억</td>
                <td>-</td>
                <td>-</td>
                <td className="font-bold">1억원</td>
                <td className="text-[11px] font-medium">사유일 + 3개월</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 핵심 설명 박스 (001~002.jpeg 하단 문구 완벽 재현) */}
        <div className="border border-slate-400 rounded-sm p-3.5 bg-slate-50/50 text-xs space-y-2.5 leading-relaxed text-slate-800">
          <p className="font-bold text-slate-900">
            쉽게 말해, 공제 한도(미성년 2,000만원·성년 5,000만원)는 &quot;10년짜리 한도 통장&quot;이에요.
          </p>
          <div>
            <div className="font-bold text-slate-900">
              구간은 시작일부터 10년 단위로 바뀝니다
            </div>
            <div className="text-slate-700">
              = 새 증여 구간(새 한도)은 시작일({firstPeriod.startDate}) + 10년마다 열려요.
            </div>
          </div>
          <div>
            <div className="font-bold text-slate-900">
              신고서에 적은 종료일이 기준이 아닙니다
            </div>
            <div className="text-slate-700">
              = 계약을 5년으로 끝내든 20년으로 하든, 새 증여 구간이 열리는 날은 바뀌지 않아요.
              <br />
              새 증여 구간이 열리기 전에 더 주면 지금 증여 구간에서 쓴 금액과 합산됩니다. 정확히 10년째 되는 날은 해석 여지가 있으니 세무서·세무사에 확인하세요.
            </div>
          </div>
          <ul className="list-disc pl-4 space-y-1.5 pt-1 border-t border-slate-300 text-[11.5px]">
            <li>
              <strong className="font-bold text-slate-900">
                정기금 대신 한 번에(일시금) 줄 수도 있어요.
              </strong>{' '}
              일시금은 준 금액이 그대로 평가액이라 한도 전액(미성년 2,000만원, 성년 5,000만원)을 줄 수 있습니다. 대신 정기금의 3% 할인 이득은 없어요. 일시금도 준 뒤 3개월 안에 신고합니다.
            </li>
            <li>
              <strong className="font-bold text-slate-900">
                2차 이후 월 증여액은 10년 계약 기준 참고값입니다.
              </strong>{' '}
              그때가 되면 아이 나이와 그동안 준 금액을 보고 다시 계산하세요.
            </li>
            <li>
              <strong className="font-bold text-slate-900">
                계약이 일찍 끝나 한도가 남아도
              </strong>{' '}
              남은 한도는 같은 10년 안에서만 쓸 수 있어요. 새로 줄 때는 앞에서 쓴 금액과 합쳐서 한도 안이어야 합니다. 예: 한도 2,000만원 중 1,777만원을 썼다면 같은 구간 안에서는 223만원 안에서만 추가로 줄 수 있어요.
            </li>
          </ul>
        </div>
      </section>

      {/* ==================== 시트 2: 증여 날짜 달력 목록 ==================== */}
      <section id="sheet-2" className="a4-sheet">
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-2">
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
            증여 날짜 달력 목록
          </h2>
          <span className="text-[10px] text-slate-400 font-medium">
            Sheet 02 · 증여 타임라인 체크리스트
          </span>
        </div>
        <p className="text-xs text-slate-700 mb-3">
          구간은 첫 증여일({firstPeriod.startDate})부터 10년마다 열려요. 매월{' '}
          {startParsed.day}일 이체, 매년 {startParsed.month}월에는 통장 거래내역서를 뽑아 보관하세요.
        </p>

        <table className="sheet-table">
          <thead>
            <tr>
              <th className="w-28 text-center">날짜</th>
              <th className="text-left">할 일</th>
              <th className="w-12 text-center">확인</th>
            </tr>
          </thead>
          <tbody>
            {calendarTodos.map((item) => (
              <tr
                key={item.id}
                className={
                  item.id.endsWith('-start')
                    ? 'bg-sky-50/50 font-semibold'
                    : ''
                }
              >
                <td className="text-center font-bold text-slate-900">
                  {item.date}
                </td>
                <td className="text-slate-800 py-2">{item.description}</td>
                <td className="text-center">
                  <SquareCheckbox
                    checked={!!checkedMap[item.id]}
                    onChange={() => onToggleCheck(item.id)}
                    label={item.description}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* ==================== 시트 3: 구간 시작 때 할 일 & 매달 체크리스트 ==================== */}
      <section id="sheet-3" className="a4-sheet">
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 mb-3">
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
            구간 시작 때 할 일
          </h2>
          <span className="text-[10px] text-slate-400 font-medium">
            Sheet 03 · 구간별 실행 & 주의사항 체크리스트
          </span>
        </div>
        <p className="text-xs text-slate-600 mb-2.5">
          구간마다 같은 순서로 합니다.
        </p>

        <div className="border border-slate-400 rounded-sm divide-y divide-slate-300 text-xs mb-4">
          {[
            {
              id: 'step-1-cancel-prev',
              text: '이전 구간 자동이체 해지 (1차는 해당 없음)',
            },
            {
              id: 'step-2-contract',
              text: '증여계약서 작성 (시작일·종료일·금액)',
            },
            {
              id: 'step-3-autotransfer',
              text: `매월 ${startParsed.day}일 자동이체 등록`,
            },
            {
              id: 'step-4-hometax',
              text: '첫 이체 후 3개월 내 홈택스에 유기정기금 신고 (마감일은 아래 표)',
            },
            {
              id: 'step-5-adult-account',
              text: '성년 구간(3차~)은 아이 본인 명의로 진행, 계좌 운용권도 넘기기',
            },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => onToggleCheck(item.id)}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer"
            >
              <SquareCheckbox
                checked={!!checkedMap[item.id]}
                onChange={() => onToggleCheck(item.id)}
                label={item.text}
              />
              <span className="font-medium text-slate-800">{item.text}</span>
            </div>
          ))}
        </div>

        {/* 구간별 요약 표 */}
        <table className="sheet-table text-center mb-5">
          <thead>
            <tr>
              <th className="w-14">구간</th>
              <th className="w-28">시작일</th>
              <th>그때 나이 · 공제</th>
              <th className="w-36">월 증여액</th>
              <th className="w-28">신고 마감</th>
              <th className="w-14">완료</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((p, idx) => (
              <tr key={p.periodNumber}>
                <td className="font-bold bg-slate-50">{p.label}</td>
                <td className="font-semibold">{p.startDate}</td>
                <td>
                  만 {p.ageAtStart}세 ·{' '}
                  {p.deductionLimitManwon.toLocaleString('ko-KR')}만
                </td>
                <td>
                  <div className="font-bold">
                    {p.monthlyRecommended.toLocaleString('ko-KR')}원
                  </div>
                  {idx > 0 && (
                    <div className="text-[10px] text-slate-500">
                      10년 기준 참고
                    </div>
                  )}
                </td>
                <td className="font-semibold">{p.reportDeadline}</td>
                <td>
                  <SquareCheckbox
                    checked={!!checkedMap[`period-done-${p.periodNumber}`]}
                    onChange={() =>
                      onToggleCheck(`period-done-${p.periodNumber}`)
                    }
                    label={`${p.label} 완료`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 매달 이체일 체크리스트 */}
        <h3 className="text-sm font-extrabold text-slate-900 mb-2">
          매달 {startParsed.day}일
        </h3>
        <div className="border border-slate-400 rounded-sm divide-y divide-slate-300 text-xs mb-4">
          {[
            {
              id: 'monthly-check-1',
              text: '정해진 날짜·금액대로 이체됐는지 확인 (적요에 "증여")',
            },
            {
              id: 'monthly-check-2',
              text: '빠진 달이 있으면 계약 금액대로 보충하고 기록',
            },
            {
              id: 'monthly-check-3',
              text: '아이 계좌에서 부모가 꺼내 쓰지 않기',
            },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => onToggleCheck(item.id)}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer"
            >
              <SquareCheckbox
                checked={!!checkedMap[item.id]}
                onChange={() => onToggleCheck(item.id)}
                label={item.text}
              />
              <span className="font-medium text-slate-800">{item.text}</span>
            </div>
          ))}
        </div>

        {/* 주의 사항 */}
        <h3 className="text-sm font-extrabold text-slate-900 mb-2">
          주의 사항
        </h3>
        <div className="border border-slate-400 rounded-sm divide-y divide-slate-300 text-xs mb-4">
          {[
            {
              id: 'caution-check-1',
              text: '연 1회 통장 거래내역서 뽑아서 보관하기 (나중에 증여 소명용)',
            },
            {
              id: 'caution-check-2',
              text: '아이 통장으로 입금할 때 통장 표시(메모) 칸에 기록하기 — 누가 준 돈인지 적기 (예: 설날 세뱃돈, ○○ 용돈, 어린이날 ○○)',
            },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => onToggleCheck(item.id)}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer"
            >
              <SquareCheckbox
                checked={!!checkedMap[item.id]}
                onChange={() => onToggleCheck(item.id)}
                label={item.text}
              />
              <span className="font-medium text-slate-800">{item.text}</span>
            </div>
          ))}
        </div>

        {/* 정기금 외에 들어오는 돈 */}
        <h3 className="text-sm font-extrabold text-slate-900 mb-2">
          정기금 외에 들어오는 돈
        </h3>
        <div className="border border-slate-400 rounded-sm divide-y divide-slate-300 text-xs">
          {[
            {
              id: 'extra-money-1',
              bold: '아동수당:',
              text: '아이 명의 계좌로 직접 받으면 증여가 아닙니다',
            },
            {
              id: 'extra-money-2',
              bold: '교육비:',
              text: '학교·학원에 부모가 직접 내면 증여세 대상이 아닙니다',
            },
            {
              id: 'extra-money-3',
              bold: '세뱃돈·용돈·조부모 증여:',
              text: '모아서 투자하면 증여로 볼 수 있고 한도에 합산돼요. 날짜·금액·보낸 사람을 기록해 두세요',
            },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => onToggleCheck(item.id)}
              className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer"
            >
              <SquareCheckbox
                checked={!!checkedMap[item.id]}
                onChange={() => onToggleCheck(item.id)}
                label={item.text}
              />
              <span className="text-slate-800">
                <strong className="font-bold text-slate-950">{item.bold}</strong>{' '}
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

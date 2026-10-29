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
        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b-2 border-slate-800 pb-2 mb-3.5">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <span className="inline-block bg-lime-200 border border-lime-400 px-2 py-0.5 text-xs sm:text-sm font-extrabold text-slate-900 rounded-xs shrink-0">
              {childName || '우리아이'}
            </span>
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
              맞춤형 증여 구간 리포트 (만 35세까지)
            </h2>
          </div>
          <span className="text-[10px] text-slate-400 font-medium shrink-0">
            Sheet 01 · 증여 구간 총괄표
          </span>
        </div>

        {/* 상단 요약 카드 4개 (모바일 2x2, 태블릿 이상 4열 반응형) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 mb-3">
          <div className="min-w-0 border border-slate-400 rounded-md p-2.5 sm:p-3 bg-slate-50/70">
            <div className="text-[11px] font-semibold text-slate-600 mb-0.5">
              일반 공제 기준액
            </div>
            <div className="text-base sm:text-xl font-extrabold text-slate-900 mb-0.5 truncate">
              {firstPeriod.deductionLimitManwon.toLocaleString('ko-KR')}만원
            </div>
            <div className="text-[10.5px] sm:text-[11px] text-slate-600">
              {firstPeriod.isMinor ? '미성년' : '성년'} · 만 {firstPeriod.ageAtStart}세에 시작
            </div>
          </div>

          <div className="min-w-0 border border-slate-400 rounded-md p-2.5 sm:p-3 bg-slate-50/70">
            <div className="text-[11px] font-semibold text-slate-600 mb-0.5">
              월 증여 계획액
            </div>
            <div className="text-base sm:text-xl font-extrabold text-slate-900 mb-0.5 truncate">
              {firstPeriod.monthlyPlanned.toLocaleString('ko-KR')}원
            </div>
            <div className="text-[10px] sm:text-[10.5px] text-slate-600 leading-tight">
              120회 계획 · 비과세 최대액 아님
            </div>
          </div>

          <div className="min-w-0 border border-slate-400 rounded-md p-2.5 sm:p-3 bg-slate-50/70">
            <div className="text-[11px] font-semibold text-slate-600 mb-0.5">
              첫 증여 신고기한 (잠정)
            </div>
            <div className="text-base sm:text-xl font-extrabold text-slate-900 mb-0.5 truncate">
              {firstPeriod.reportDeadline}
            </div>
            <div className="text-[10px] sm:text-[10.5px] text-slate-600 leading-tight">
              시작 예정일 기준 · 이체 달 말일부터 3개월
            </div>
          </div>

          <div className="min-w-0 border border-slate-400 rounded-md p-2.5 sm:p-3 bg-slate-50/70">
            <div className="text-[11px] font-semibold text-slate-600 mb-0.5">
              2차 구간 시작
            </div>
            <div className="text-base sm:text-xl font-extrabold text-slate-900 mb-0.5 truncate">
              {secondPeriod ? secondPeriod.startDate : '-'}
            </div>
            <div className="text-[10.5px] sm:text-[11px] text-slate-600">
              시작일 + 10년
            </div>
          </div>
        </div>

        <p className="border border-slate-400 p-3 mb-4 text-xs">표의 구간은 10년씩 나눈 준비 일정입니다. 공제가 자동으로 초기화되는 날짜가 아닙니다. 과거 증여·공제 사용 내역을 입력받지 않으므로 실제 남은 한도와 비과세 최대액은 계산하지 않습니다. 월 금액은 가족이 정한 계획액입니다.</p>
        {/* 증여 구간표 (만 35세까지) */}
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
            증여 구간표 (만 35세까지)
          </h3>
          <span className="sm:hidden text-[10px] text-slate-400 no-print">
            ← 좌우로 밀어서 전체 열 확인 →
          </span>
        </div>
        <div className="table-scroll-wrap mb-4">
          <table className="sheet-table text-center min-w-[580px]">
            <thead>
              <tr>
                <th className="w-11">구간</th>
                <th className="w-22">시작일</th>
                <th className="w-16">그때 나이</th>
                <th className="w-24">일반 공제 기준</th>
                <th className="w-28">계약 기간</th>
                <th className="w-32">
                  월 증여
                  <br />
                  <span className="text-[10px] font-normal">예정 입금액</span>
                </th>
                <th className="w-24">
                  일시금이면
                  <br />
                  <span className="text-[10px] font-normal">공제 기준액 참고</span>
                </th>
                <th className="w-22">신고 마감</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p, idx) => (
                <tr key={p.periodNumber}>
                  <td className="font-bold bg-slate-50 whitespace-nowrap">
                    {p.label}
                  </td>
                  <td className="font-semibold whitespace-nowrap">
                    {p.startDate}
                  </td>
                  <td className="whitespace-nowrap">만 {p.ageAtStart}세</td>
                  <td className="font-semibold whitespace-nowrap">
                    {p.deductionLabel}
                  </td>
                  <td className="text-[10.5px] sm:text-[11px] leading-snug whitespace-nowrap">
                    <div className="font-bold">120개월</div>
                    <div>~ {p.endDate}</div>
                    {idx > 0 && (
                      <div className="text-[9.5px] text-slate-500">
                        10년 기준 참고
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="text-[10px] text-slate-600">
                      가족이 정한 계획액
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                      {p.monthlyPlanned.toLocaleString('ko-KR')}원
                    </div>
                  </td>
                  <td className="font-bold whitespace-nowrap">
                    {p.lumpSumMaxLabel}
                  </td>
                  <td className="font-semibold whitespace-nowrap">
                    {p.reportDeadline}
                  </td>
                </tr>
              ))}
              <tr>
                <td className="font-bold bg-slate-50 whitespace-nowrap">별도</td>
                <td className="font-semibold whitespace-nowrap">혼인·출산 시</td>
                <td className="whitespace-nowrap">해당 시</td>
                <td className="font-semibold whitespace-nowrap">
                  혼인·출산 1억
                </td>
                <td>-</td>
                <td>-</td>
                <td className="font-bold whitespace-nowrap">1억원</td>
                <td className="text-[11px] font-medium whitespace-nowrap">
                  증여한 달 말일 + 3개월 (휴일 확인)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border border-slate-400 p-3 text-xs space-y-2">
          <p>일반 공제는 거주자가 직계존속에게 받을 때 미성년 2,000만원, 성년 5,000만원을 기준으로 해당 증여 전 10년 이내 공제 사용액을 확인합니다. 부모·조부모가 각각 별도 한도를 갖는 것은 아닙니다.</p>
          <p>정기금 약정·신고 및 평가 조건은 별도 확인이 필요합니다. 자동이체만으로 할인 평가가 적용되지 않습니다. 이 도구는 할인 최대 월액·세액을 산출하지 않습니다.</p>
          <p>신고 날짜는 주말만 보정한 잠정값입니다. 공휴일·대체공휴일·근로자의 날과 연장 공지를 국세청에서 확인하세요. 일반 현금 증여를 매달 한다면 각 증여일 기준 확인이 필요합니다.</p>
          <a href="https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&amp;lsJoLnkSeq=1029615597" className="underline">공제 근거: 상속세 및 증여세법 제53조</a>
        </div>
      </section>

      {/* ==================== 시트 2: 증여 날짜 달력 목록 ==================== */}
      <section id="sheet-2" className="a4-sheet">
        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b-2 border-slate-800 pb-2 mb-2">
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
            증여 날짜 달력 목록
          </h2>
          <span className="text-[10px] text-slate-400 font-medium shrink-0">
            Sheet 02 · 증여 타임라인 체크리스트
          </span>
        </div>
        <p className="text-[11.5px] sm:text-xs text-slate-700 mb-3 leading-relaxed">
          준비 일정은 첫 예정일({firstPeriod.startDate})부터 10년 단위로 나눴어요. 매월{' '}
          {startParsed.day}일 이체, 매년 {startParsed.month}월에는 통장 거래내역서를 뽑아 보관하세요.
        </p>

        <div className="table-scroll-wrap">
          <table className="sheet-table">
            <thead>
              <tr>
                <th className="w-22 sm:w-28 text-center">날짜</th>
                <th className="text-left">할 일</th>
                <th className="w-10 sm:w-12 text-center">확인</th>
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
                  <td className="text-center font-bold text-slate-900 whitespace-nowrap text-[10.5px] sm:text-[11.5px]">
                    {item.date}
                  </td>
                  <td className="text-slate-800 py-1.5 sm:py-2 leading-snug">
                    {item.description}
                  </td>
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
        </div>
      </section>

      {/* ==================== 시트 3: 구간 시작 때 할 일 & 매달 체크리스트 ==================== */}
      <section id="sheet-3" className="a4-sheet">
        <div className="flex flex-wrap items-center justify-between gap-1.5 border-b-2 border-slate-800 pb-2 mb-3">
          <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900">
            구간 시작 때 할 일
          </h2>
          <span className="text-[10px] text-slate-400 font-medium shrink-0">
            Sheet 03 · 구간별 실행 & 주의사항 체크리스트
          </span>
        </div>
        <p className="text-xs text-slate-600 mb-2.5">
          구간마다 같은 순서로 합니다.
        </p>

        <div className="border border-slate-400 rounded-sm divide-y divide-slate-300 text-[11.5px] sm:text-xs mb-4">
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
              text: '정기금 약정·평가·신고 조건 확인 (표의 날짜는 잠정)',
            },
            {
              id: 'step-5-adult-account',
              text: '성년 구간(3차~)은 아이 본인 명의로 진행, 계좌 운용권도 넘기기',
            },
          ].map((item) => (
            <div
              key={item.id}
              onClick={() => onToggleCheck(item.id)}
              className="flex items-start sm:items-center gap-2.5 px-2.5 sm:px-3 py-2 hover:bg-slate-50 cursor-pointer"
            >
              <div className="pt-0.5 sm:pt-0 shrink-0">
                <SquareCheckbox
                  checked={!!checkedMap[item.id]}
                  onChange={() => onToggleCheck(item.id)}
                  label={item.text}
                />
              </div>
              <span className="font-medium text-slate-800 leading-snug">
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* 구간별 요약 표 */}
        <div className="table-scroll-wrap mb-5">
          <table className="sheet-table text-center min-w-[440px]">
            <thead>
              <tr>
                <th className="w-12">구간</th>
                <th className="w-24">시작일</th>
                <th>그때 나이 · 공제</th>
                <th className="w-32">월 증여액</th>
                <th className="w-24">신고 마감</th>
                <th className="w-12">완료</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p, idx) => (
                <tr key={p.periodNumber}>
                  <td className="font-bold bg-slate-50 whitespace-nowrap">
                    {p.label}
                  </td>
                  <td className="font-semibold whitespace-nowrap">
                    {p.startDate}
                  </td>
                  <td className="whitespace-nowrap">
                    만 {p.ageAtStart}세 ·{' '}
                    {p.deductionLimitManwon.toLocaleString('ko-KR')}만
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="font-bold">
                      {p.monthlyPlanned.toLocaleString('ko-KR')}원
                    </div>
                    {idx > 0 && (
                      <div className="text-[10px] text-slate-500">
                        10년 기준 참고
                      </div>
                    )}
                  </td>
                  <td className="font-semibold whitespace-nowrap">
                    {p.reportDeadline}
                  </td>
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
        </div>

        {/* 매달 이체일 체크리스트 */}
        <h3 className="text-sm font-extrabold text-slate-900 mb-2">
          매달 {startParsed.day}일
        </h3>
        <div className="border border-slate-400 rounded-sm divide-y divide-slate-300 text-[11.5px] sm:text-xs mb-4">
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
              className="flex items-start sm:items-center gap-2.5 px-2.5 sm:px-3 py-2 hover:bg-slate-50 cursor-pointer"
            >
              <div className="pt-0.5 sm:pt-0 shrink-0">
                <SquareCheckbox
                  checked={!!checkedMap[item.id]}
                  onChange={() => onToggleCheck(item.id)}
                  label={item.text}
                />
              </div>
              <span className="font-medium text-slate-800 leading-snug">
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* 주의 사항 */}
        <h3 className="text-sm font-extrabold text-slate-900 mb-2">
          주의 사항
        </h3>
        <div className="border border-slate-400 rounded-sm divide-y divide-slate-300 text-[11.5px] sm:text-xs mb-4">
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
              className="flex items-start sm:items-center gap-2.5 px-2.5 sm:px-3 py-2 hover:bg-slate-50 cursor-pointer"
            >
              <div className="pt-0.5 sm:pt-0 shrink-0">
                <SquareCheckbox
                  checked={!!checkedMap[item.id]}
                  onChange={() => onToggleCheck(item.id)}
                  label={item.text}
                />
              </div>
              <span className="font-medium text-slate-800 leading-snug">
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* 정기금 외에 들어오는 돈 */}
        <h3 className="text-sm font-extrabold text-slate-900 mb-2">
          정기금 외에 들어오는 돈
        </h3>
        <div className="border border-slate-400 rounded-sm divide-y divide-slate-300 text-[11.5px] sm:text-xs">
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
              className="flex items-start sm:items-center gap-2.5 px-2.5 sm:px-3 py-2 hover:bg-slate-50 cursor-pointer"
            >
              <div className="pt-0.5 sm:pt-0 shrink-0">
                <SquareCheckbox
                  checked={!!checkedMap[item.id]}
                  onChange={() => onToggleCheck(item.id)}
                  label={item.text}
                />
              </div>
              <span className="text-slate-800 leading-snug">
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

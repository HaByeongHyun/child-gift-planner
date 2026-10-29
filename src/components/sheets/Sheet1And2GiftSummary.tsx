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
              1차 세금 없는 기본 한도(공제)
            </div>
            <div className="text-base sm:text-xl font-extrabold text-slate-900 mb-0.5 truncate">
              {firstPeriod.deductionLimitManwon.toLocaleString('ko-KR')}만원
            </div>
            <div className="text-[10.5px] sm:text-[11px] text-slate-600 leading-tight">
              {firstPeriod.isMinor ? '미성년(만 19세 미만)' : '성년(만 19세 이상)'} · 만 {firstPeriod.ageAtStart}세 시작
            </div>
          </div>

          <div className="min-w-0 border border-slate-400 rounded-md p-2.5 sm:p-3 bg-slate-50/70">
            <div className="text-[11px] font-semibold text-slate-600 mb-0.5">
              우리 가족 월 증여 계획액
            </div>
            <div className="text-base sm:text-xl font-extrabold text-slate-900 mb-0.5 truncate">
              {firstPeriod.monthlyPlanned.toLocaleString('ko-KR')}원
            </div>
            <div className="text-[10px] sm:text-[10.5px] text-slate-600 leading-tight">
              10년(120회) 총 {((firstPeriod.monthlyPlanned * 120) / 10000).toLocaleString('ko-KR')}만원 · 직접 정한 금액
            </div>
          </div>

          <div className="min-w-0 border border-slate-400 rounded-md p-2.5 sm:p-3 bg-slate-50/70">
            <div className="text-[11px] font-semibold text-slate-600 mb-0.5">
              첫 증여세 신고 마감일 {firstPeriod.isReportDeadlineConfirmed ? '(확정)' : '(잠정)'}
            </div>
            <div className="text-base sm:text-xl font-extrabold text-slate-900 mb-0.5 truncate">
              {firstPeriod.reportDeadline}
            </div>
            <div className="text-[10px] sm:text-[10.5px] text-slate-600 leading-tight">
              첫 이체한 달의 말일 + 3개월 (주말·공휴일 연장)
            </div>
          </div>

          <div className="min-w-0 border border-slate-400 rounded-md p-2.5 sm:p-3 bg-slate-50/70">
            <div className="text-[11px] font-semibold text-slate-600 mb-0.5">
              다음 10년(2차) 준비 시작일
            </div>
            <div className="text-base sm:text-xl font-extrabold text-slate-900 mb-0.5 truncate">
              {secondPeriod ? secondPeriod.startDate : '-'}
            </div>
            <div className="text-[10.5px] sm:text-[11px] text-slate-600 leading-tight">
              첫 시작일로부터 10년 뒤 점검일
            </div>
          </div>
        </div>

        <p className="border border-slate-400 bg-slate-50/60 p-2.5 sm:p-3 mb-4 text-xs text-slate-800 leading-relaxed">
          <strong className="font-bold">💡 처음 보시는 부모님을 위한 핵심 안내:</strong> 아래 1~4차 구간은 아이가 자라는 동안 <strong className="font-bold">10년 단위로 미리 짜보는 우리 가족 준비 일정표</strong>입니다. 세금 없이 줄 수 있는 한도(미성년 2,000만원 / 성년 5,000만원)는 달력처럼 10년마다 자동 리셋되는 것이 아니라, <strong className="font-bold">‘새로 돈을 주는 날로부터 딱 과거 10년 동안 얼마를 줬는지’</strong>를 합산해 계산합니다. 예전에 이미 준 돈이 있는지는 가족마다 다르므로, 이 표는 세금 면제 최대치를 임의로 단정하지 않고 부모님이 직접 정한 월 계획액을 기준으로 정리합니다.
        </p>

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
                <th className="w-22">시작 예정일</th>
                <th className="w-16">그때 나이</th>
                <th className="w-24">
                  세금 없는 기본 한도
                  <br />
                  <span className="text-[10px] font-normal">(일반 공제 기준)</span>
                </th>
                <th className="w-28">준비 기간 (120회)</th>
                <th className="w-32">
                  월 증여 계획액
                  <br />
                  <span className="text-[10px] font-normal">(120회 합계)</span>
                </th>
                <th className="w-24">
                  10년 공제 기준액
                  <br />
                  <span className="text-[10px] font-normal">(법정 기본 한도)</span>
                </th>
                <th className="w-24">신고기한</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
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
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="text-xs sm:text-sm font-extrabold text-slate-900">
                      {p.monthlyPlanned.toLocaleString('ko-KR')}원
                    </div>
                    <div className="text-[10px] text-slate-600">
                      총 {((p.monthlyPlanned * 120) / 10000).toLocaleString('ko-KR')}만원 계획
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
                <td className="font-semibold whitespace-nowrap">자녀의 결혼·출산</td>
                <td className="whitespace-nowrap">성년 이후</td>
                <td className="font-semibold whitespace-nowrap">
                  통합 1억원 추가
                </td>
                <td>요건 충족 시</td>
                <td>-</td>
                <td className="font-bold whitespace-nowrap">1억원</td>
                <td className="text-[10.5px] font-medium whitespace-nowrap">
                  실제 증여월 말일 + 3개월
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="border border-slate-400 p-3 text-xs space-y-2 leading-relaxed text-slate-800">
          <p>
            • <strong className="font-bold">부모·조부모가 준 돈은 하나로 합쳐서 계산해요 (직계존속 합산):</strong> 세금 없이 줄 수 있는 한도(미성년 10년간 2,000만원, 만 19세 이상 성년 10년간 5,000만원)는 엄마·아빠·친조부모·외조부모 각자 따로가 아니라, <strong className="font-bold">돈을 받는 아이 기준으로 최근 10년 동안 부모님과 양가 조부모님에게 받은 돈을 모두 합쳐서</strong> 따집니다.
          </p>
          <p>
            • <strong className="font-bold">매달 나눠 주는 약속 증여(유기정기금)란?:</strong> 목돈을 한 번에 주는 대신 “앞으로 10년(120개월) 동안 매달 일정 금액을 주겠다”고 미리 계약서를 쓰고 첫 달 이체 후 세무서에 신고하는 방법입니다. 세법상 미래에 받을 돈을 연 3%로 할인해 주는 계산법이 있지만, 계약 방식이나 중간에 금액을 바꿀 때 세금 계산이 달라질 수 있어 이 도구는 무리한 할인 최대치 대신 가족이 정한 월 금액으로 안전하게 계획하도록 돕습니다.
          </p>
          <p>
            • <strong className="font-bold">‘혼인·출산 1억원 추가 공제’는 언제 쓰나요?:</strong> 지금 우리 아기가 태어났다고 1억원 한도가 생기는 것이 아닙니다. 나중에 우리 아이가 어른이 되어 <strong className="font-bold">결혼할 때(혼인신고일 전후 2년 이내)</strong> 또는 <strong className="font-bold">자녀의 아이(손주)를 낳거나 입양할 때(출생일로부터 2년 이내)</strong> 부모·조부모가 보태주는 자금에 기본 한도(5,000만원)와 별도로 <strong className="font-bold">합쳐서 1억원까지 세금을 더 면제</strong>해 주는 제도입니다.
          </p>
          <p className="text-[11px] text-slate-600 pt-0.5">
            공식 근거:{' '}
            <a
              href="https://www.law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1029615597"
              target="_blank"
              rel="noreferrer"
              className="underline font-semibold"
            >
              상속세 및 증여세법 제53조·제53조의2
            </a>
            {' · '}
            <a
              href="https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?cntntsId=7730&mi=2308"
              target="_blank"
              rel="noreferrer"
              className="underline font-semibold"
            >
              국세청 증여세 신고안내
            </a>
          </p>
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
          첫 예정일({firstPeriod.startDate})부터 10년 단위로 챙겨야 할 핵심 일정입니다. 매달{' '}
          {startParsed.day}일에 이체한 뒤 확인하고, 매년 {startParsed.month}월에는 1년치 통장 거래내역서를 뽑아 이 바인더에 함께 끼워 두세요. (나중에 아이가 집을 사거나 목돈을 쓸 때 정당하게 증여받아 모은 자금임을 증명하는 소중한 자료가 됩니다.)
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
          새로운 10년 준비 구간을 시작할 때마다 아래 1~5번 순서대로 차근차근 진행해 보세요.
        </p>

        <div className="border border-slate-400 rounded-sm divide-y divide-slate-300 text-[11.5px] sm:text-xs mb-4">
          {[
            {
              id: 'step-1-cancel-prev',
              text: '1단계: 이전 10년 구간 자동이체가 끝났는지 확인하기 (처음 시작하는 1차 구간은 건너뛰세요)',
            },
            {
              id: 'step-2-contract',
              text: '2단계: 증여계약서 작성하기 (주는 부모 이름 · 받는 아이 이름 · 시작일~종료일 · 매달 보낼 금액을 적고 도장/서명)',
            },
            {
              id: 'step-3-autotransfer',
              text: `3단계: 은행 앱에서 매월 ${startParsed.day}일 아이 계좌로 자동이체 등록하기`,
            },
            {
              id: 'step-4-hometax',
              text: '4단계: 첫 달 돈을 보낸 뒤, 그 달 말일로부터 3개월 안에 국세청 홈택스(또는 손택스 앱)에서 증여세 신고하기 (세금이 0원이어도 신고해 두어야 증빙이 남습니다)',
            },
            {
              id: 'step-5-adult-account',
              text: '5단계: 아이가 성년(만 19세)이 된 이후 구간부터는 아이 본인이 직접 신고하고 계좌를 관리하도록 함께 안내하기',
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
                <th>그때 나이 · 세금 없는 기본 한도</th>
                <th className="w-32">월 증여 계획액</th>
                <th className="w-24">신고기한</th>
                <th className="w-12">완료</th>
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p.periodNumber}>
                  <td className="font-bold bg-slate-50 whitespace-nowrap">
                    {p.label}
                  </td>
                  <td className="font-semibold whitespace-nowrap">
                    {p.startDate}
                  </td>
                  <td className="whitespace-nowrap">
                    만 {p.ageAtStart}세 ·{' '}
                    {p.deductionLimitManwon.toLocaleString('ko-KR')}만원 기준
                  </td>
                  <td className="whitespace-nowrap">
                    <div className="font-bold">
                      {p.monthlyPlanned.toLocaleString('ko-KR')}원
                    </div>
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
          매달 {startParsed.day}일 점검
        </h3>
        <div className="border border-slate-400 rounded-sm divide-y divide-slate-300 text-[11.5px] sm:text-xs mb-4">
          {[
            {
              id: 'monthly-check-1',
              text: '약속한 날짜와 금액대로 잘 빠져나갔는지 확인하기 (받는 아이 통장 메모에 "정기금 증여"라고 찍히게 설정하면 나중에 알아보기 쉽습니다)',
            },
            {
              id: 'monthly-check-2',
              text: '잔액 부족 등으로 못 보낸 달이 있다면 계약 내용에 맞게 보충 이체하고 시트 06 비고란에 이유 적어두기',
            },
            {
              id: 'monthly-check-3',
              text: '아이 계좌에 넣어준 돈을 부모 계좌로 다시 빼서 쓰지 않기 (부모 생활비 등으로 섞어 쓰면 세무서에서 처음부터 증여가 아니었던 것으로 오해할 수 있어요)',
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

        {/* 증빙 보관 수칙 */}
        <h3 className="text-sm font-extrabold text-slate-900 mb-2">
          증빙 보관 수칙
        </h3>
        <div className="border border-slate-400 rounded-sm divide-y divide-slate-300 text-[11.5px] sm:text-xs mb-4">
          {[
            {
              id: 'caution-check-1',
              text: '1년에 한 번은 아이 통장 거래내역서와 홈택스 증여세 신고 접수증을 종이로 뽑아 이 바인더에 함께 보관하기',
            },
            {
              id: 'caution-check-2',
              text: '아이 계좌로 돈을 넣을 때마다 누가 무슨 일로 준 돈인지 통장 메모 남기기 (예: 설날 친할머니 세뱃돈, 1차 정기금 증여)',
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
          매달 주는 증여 외에 아이에게 들어오는 돈, 세금은 어떨까요?
        </h3>
        <div className="border border-slate-400 rounded-sm divide-y divide-slate-300 text-[11.5px] sm:text-xs">
          {[
            {
              id: 'extra-money-1',
              bold: '국가·지자체 아동수당:',
              text: '정부나 지자체에서 나오는 아동수당·부모급여를 아이 명의 계좌로 바로 받으면 부모가 준 돈이 아니므로 증여세가 붙지 않습니다(비과세).',
            },
            {
              id: 'extra-money-2',
              bold: '학비·병원비·일상 생활비:',
              text: '학교 등록금, 학원비, 병원비, 평소 용돈처럼 그때그때 써서 사라지는 돈은 세금 대상이 아닙니다. 하지만 생활비 명목으로 받은 돈을 안 쓰고 모아 예금·주식·집 사는 데 쓰면 증여로 봅니다.',
            },
            {
              id: 'extra-money-3',
              bold: '세뱃돈·돌잔치 돈·조부모님 용돈:',
              text: '현금이나 일반 용돈통장에 넣어두었다고 무조건 세금이 면제되는 것은 아닙니다. 이 돈을 차곡차곡 모아 주식·예금 등 아이 자산을 불리는 데 쓰면 증여 한도에 합산될 수 있으니 시트 07에 꼭 적어 관리하세요.',
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

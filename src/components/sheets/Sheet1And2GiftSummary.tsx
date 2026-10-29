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
              1차 일반 공제 기준액
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
              가족 월 증여 계획액
            </div>
            <div className="text-base sm:text-xl font-extrabold text-slate-900 mb-0.5 truncate">
              {firstPeriod.monthlyPlanned.toLocaleString('ko-KR')}원
            </div>
            <div className="text-[10px] sm:text-[10.5px] text-slate-600 leading-tight">
              120회({((firstPeriod.monthlyPlanned * 120) / 10000).toLocaleString('ko-KR')}만원) · 비과세 최대액 아님
            </div>
          </div>

          <div className="min-w-0 border border-slate-400 rounded-md p-2.5 sm:p-3 bg-slate-50/70">
            <div className="text-[11px] font-semibold text-slate-600 mb-0.5">
              첫 증여 신고기한 {firstPeriod.isReportDeadlineConfirmed ? '(2026 공휴일 반영)' : '(잠정)'}
            </div>
            <div className="text-base sm:text-xl font-extrabold text-slate-900 mb-0.5 truncate">
              {firstPeriod.reportDeadline}
            </div>
            <div className="text-[10px] sm:text-[10.5px] text-slate-600 leading-tight">
              증여월 말일부터 3개월 · 휴일 연장 반영
            </div>
          </div>

          <div className="min-w-0 border border-slate-400 rounded-md p-2.5 sm:p-3 bg-slate-50/70">
            <div className="text-[11px] font-semibold text-slate-600 mb-0.5">
              2차 준비 구간 시작
            </div>
            <div className="text-base sm:text-xl font-extrabold text-slate-900 mb-0.5 truncate">
              {secondPeriod ? secondPeriod.startDate : '-'}
            </div>
            <div className="text-[10.5px] sm:text-[11px] text-slate-600 leading-tight">
              첫 시작일 + 10년 (준비 점검일)
            </div>
          </div>
        </div>

        <p className="border border-slate-400 bg-slate-50/60 p-2.5 sm:p-3 mb-4 text-xs text-slate-800 leading-relaxed">
          <strong className="font-bold">핵심 기준:</strong> 아래 1~4차 구간은 첫 시작일로부터 10년씩 나눈 <strong className="font-bold">가족 준비 일정</strong>이며, 고정된 날짜마다 공제 한도가 자동 초기화되지는 않습니다. 과거 증여 내역을 입력받지 않으므로 개인별 남은 공제 한도나 비과세 최대액은 산출하지 않고, 가족이 정한 월 계획액을 기준으로 일정을 정리합니다.
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
                <th className="w-24">일반 공제 기준</th>
                <th className="w-28">준비 기간 (120회)</th>
                <th className="w-32">
                  월 증여 계획액
                  <br />
                  <span className="text-[10px] font-normal">(120회 합계)</span>
                </th>
                <th className="w-24">
                  10년 공제 기준액
                  <br />
                  <span className="text-[10px] font-normal">(법정 기준 참고)</span>
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
                <td className="font-semibold whitespace-nowrap">자녀의 혼인·출산</td>
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

        <div className="border border-slate-400 p-3 text-xs space-y-1.5 leading-relaxed text-slate-800">
          <p>
            • <strong className="font-bold">직계존속(부모·조부모) 합산 규칙:</strong> 증여재산 공제는 증여받는 자녀(수증자) 기준으로 직전 10년 이내 부모·조부모에게 공제받은 금액을 합산해 미성년 2,000만원, 성년(만 19세 이상) 5,000만원 한도를 확인합니다.
          </p>
          <p>
            • <strong className="font-bold">유기정기금(기간을 정해 매달 일정 금액을 주기로 약정하는 증여):</strong> 세법상 연 3% 복리 할인 평가는 사전 증여계약과 최초 이체분 신고 등 요건을 갖춰야 하며, 중도 변경·해지 시 평가 방식이 달라지므로 이 도구는 할인 최대 월액을 확정 제시하지 않습니다.
          </p>
          <p>
            • <strong className="font-bold">혼인·출산 공제 주의:</strong> 자녀 본인이 태어났을 때가 아니라, 자녀가 자라서 <strong className="font-bold">결혼(혼인신고일 전후 2년)</strong>하거나 <strong className="font-bold">자녀의 아이를 출산·입양(출생일로부터 2년)</strong>할 때 직계존속에게 받는 증여에 통합 1억원이 추가 적용됩니다.
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
          첫 예정일({firstPeriod.startDate})부터 10년 단위로 정리한 주요 일정입니다. 매월{' '}
          {startParsed.day}일 이체 후 확인하고, 매년 {startParsed.month}월에는 통장 거래내역서를 뽑아 보관하세요.
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
          새 10년 준비 구간을 시작할 때마다 아래 순서로 점검합니다.
        </p>

        <div className="border border-slate-400 rounded-sm divide-y divide-slate-300 text-[11.5px] sm:text-xs mb-4">
          {[
            {
              id: 'step-1-cancel-prev',
              text: '이전 구간 자동이체 종료 확인 (1차는 해당 없음)',
            },
            {
              id: 'step-2-contract',
              text: '증여계약서 작성 (증여자·수증자·시작일·종료일·월 이체 금액 명시)',
            },
            {
              id: 'step-3-autotransfer',
              text: `매월 ${startParsed.day}일 자동이체 등록`,
            },
            {
              id: 'step-4-hometax',
              text: '첫 이체일이 속한 달의 말일부터 3개월 이내 홈택스 증여세 신고 진행',
            },
            {
              id: 'step-5-adult-account',
              text: '성년 구간(만 19세 이후)부터는 자녀 본인이 직접 신고·계좌 관리하도록 안내',
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
                <th>그때 나이 · 일반 공제 기준</th>
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
              text: '약정한 날짜·금액대로 이체됐는지 확인 (통장 적요에 "정기금 증여" 표시)',
            },
            {
              id: 'monthly-check-2',
              text: '미이체된 달이 있으면 약정 내용에 맞게 보충 이체 후 비고란에 사유 기록',
            },
            {
              id: 'monthly-check-3',
              text: '자녀 계좌에 입금된 돈을 부모 계좌로 다시 빼서 쓰지 않기 (혼용 주의)',
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
              text: '연 1회 통장 거래내역서와 증여세 신고서 접수증을 함께 출력해 바인더에 보관하기',
            },
            {
              id: 'caution-check-2',
              text: '아이 계좌에 입금할 때 보낸 사람과 명목을 통장 메모에 남기기 (예: 설날 조부모 용돈, 1차 정기금)',
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
          정기금 외에 들어오는 돈 구분하기
        </h3>
        <div className="border border-slate-400 rounded-sm divide-y divide-slate-300 text-[11.5px] sm:text-xs">
          {[
            {
              id: 'extra-money-1',
              bold: '아동수당:',
              text: '지자체에서 지급하는 수당을 아이 명의 계좌로 직접 수령하면 증여세 비과세 대상입니다.',
            },
            {
              id: 'extra-money-2',
              bold: '학비·생활비:',
              text: '사회통념상 인정되는 교육비·치료비 등을 필요할 때마다 직접 지출하면 비과세이나, 이를 모아 예금·주식·부동산 자금으로 쓰면 증여로 봅니다.',
            },
            {
              id: 'extra-money-3',
              bold: '세뱃돈·용돈·조부모 증여:',
              text: '현금이나 용돈통장에 두었다는 이유만으로 비과세가 되지는 않습니다. 금융투자 등에 활용하면 증여 합산 대상이 될 수 있으므로 시트 07에 기록해 관리하세요.',
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

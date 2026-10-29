import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "아이 맞춤형 증여 구간 & 미래 목돈 플래너 | 생년월일 원클릭 정리",
  description:
    "아이 생년월일과 첫 증여 시작일만 입력하면 만 35세까지의 비과세 증여 구간, 유기정기금 3% 할인 계산, 홈택스 신고 기한, 아동수당·세뱃돈 체크리스트, 물가상승률 반영 대학 등록금·결혼 비용, 연도별 나이·학교표를 한 번에 생성하고 A4로 인쇄할 수 있습니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

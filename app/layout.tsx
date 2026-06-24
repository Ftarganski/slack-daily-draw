export const metadata = {
  title: 'Daily Draw',
  description: 'Slack daily standup raffle',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

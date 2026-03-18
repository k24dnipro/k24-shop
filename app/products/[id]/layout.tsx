// ISR: ревалідація кожні 5 хвилин (300 секунд)
export const revalidate = 300;

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

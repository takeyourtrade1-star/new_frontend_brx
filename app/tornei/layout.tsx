export default function TorneiLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 z-[9998] bg-black">{children}</div>;
}

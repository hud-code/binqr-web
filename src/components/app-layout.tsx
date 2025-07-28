import { ReactNode } from "react";
import { Header, Navigation } from "./navigation";

interface AppLayoutProps {
  children: ReactNode;
  title: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="flex flex-col h-full">
      <Header title={title} />
      <main className="flex-1 overflow-auto bg-gray-50">{children}</main>
      <Navigation />
    </div>
  );
}

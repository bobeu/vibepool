"use client";

import Image from "next/image";

interface TabletFrameProps {
  children: React.ReactNode;
  backgroundSrc?: string;
}

export function TabletFrame({ children, backgroundSrc = "/vibepool-predict.png" }: TabletFrameProps) {
  return (
    <div className="hidden md:flex min-h-screen items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundSrc}
          alt=""
          fill
          className="object-cover opacity-30 blur-sm scale-105"
          priority
        />
        <div className="absolute inset-0 bg-background/80" />
      </div>

      <div className="relative z-10 w-full max-w-[820px] min-h-[90vh] max-h-[960px] flex flex-col border-[4px] border-black bg-background shadow-[8px_8px_0_#000] overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export function MobileOnly({ children }: { children: React.ReactNode }) {
  return <div className="md:hidden flex flex-col min-h-screen">{children}</div>;
}

export function TabletOnly({ children }: { children: React.ReactNode }) {
  return <div className="hidden md:flex flex-col flex-1 min-h-0">{children}</div>;
}

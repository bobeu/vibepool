"use client";

import Image from "next/image";
import { Battery, Signal, Wifi } from "lucide-react";

interface TabletFrameProps {
  children: React.ReactNode;
  backgroundSrc?: string;
}

/** Realistic tablet device chrome — rounded bezel, status bar, home indicator */
export function TabletFrame({ children, backgroundSrc = "/backgrounddark.png" }: TabletFrameProps) {
  return (
    <div className="hidden md:flex min-h-screen items-center justify-center p-8 lg:p-12 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundSrc}
          alt=""
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
      </div>

      {/* Device shadow + scale wrapper */}
      <div className="relative z-10 tablet-device-shadow">
        <div className="tablet-device">
          {/* Top bezel — front camera */}
          <div className="tablet-bezel-top">
            <div className="tablet-camera" aria-hidden />
          </div>

          {/* Screen */}
          <div className="tablet-screen">
            <TabletStatusBar />

            <div className="tablet-screen-content">{children}</div>

            <TabletHomeIndicator />
          </div>

          {/* Bottom bezel */}
          <div className="tablet-bezel-bottom" />
        </div>
      </div>
    </div>
  );
}

function TabletStatusBar() {
  const time = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <div className="tablet-status-bar">
      <span className="tablet-status-time">{time}</span>
      <div className="tablet-status-icons">
        <Signal className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
        <Wifi className="w-3.5 h-3.5" strokeWidth={2.5} aria-hidden />
        <Battery className="w-4 h-4" strokeWidth={2.5} aria-hidden />
      </div>
    </div>
  );
}

function TabletHomeIndicator() {
  return (
    <div className="tablet-home-bar" aria-hidden>
      <div className="tablet-home-indicator" />
    </div>
  );
}

export function MobileOnly({ children }: { children: React.ReactNode }) {
  return <div className="md:hidden flex flex-col min-h-screen">{children}</div>;
}

export function TabletOnly({ children }: { children: React.ReactNode }) {
  return <div className="hidden md:flex flex-col flex-1 min-h-0 h-full w-full">{children}</div>;
}

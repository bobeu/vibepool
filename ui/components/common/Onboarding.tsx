"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { startFreePlaySession } from "@/lib/auth/client";
import { cn } from "@/utils/format";

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

const AppleIcon = () => (
  <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.82M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.63.73-1.18 1.87-1.03 2.98 1.12.09 2.27-.56 2.98-1.42z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5 fill-black" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [slide, setSlide] = useState(0);
  const [launching, setLaunching] = useState(false);
  const { isConnected, address } = useAccount();

  const handleNext = () => {
    if (slide < 2) setSlide((s) => s + 1);
  };

  const handleLaunchApp = async () => {
    setLaunching(true);
    try {
      // Connected wallets sync via WalletSessionSync; guests get a free-play session.
      if (!isConnected) {
        await startFreePlaySession();
      }
      onComplete();
    } finally {
      setLaunching(false);
    }
  };

  if (slide === 0) {
    return (
      <div className="absolute inset-0 z-[200] flex flex-col justify-between bg-[#FBBF24] p-6 text-black select-none overflow-y-auto">
        <div className="flex justify-between items-center w-full">
          <span className="text-[10px] font-black tracking-widest uppercase bg-black text-white px-2 py-0.5 rounded border border-black">
            Slide 1/3
          </span>
          <button
            type="button"
            onClick={() => setSlide(2)}
            className="text-xs font-black uppercase tracking-wide hover:underline"
          >
            Skip
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center my-4 space-y-6">
          <div className="relative w-full max-w-[270px] aspect-[4/3]">
            <div className="absolute -top-4 -right-2 rotate-[12deg] bg-[#62E2F8] border-4 border-black text-black font-black px-3 py-1 text-xs uppercase shadow-[3px_3px_0_rgba(0,0,0,1)] rounded-xl z-20">
              UH OH!
            </div>
            <div className="w-full h-full rounded-2xl border-4 border-black bg-white shadow-[6px_6px_0_rgba(0,0,0,1)] overflow-hidden relative">
              <Image
                src="/prediction.png"
                alt="Prediction Game"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>

          <div className="text-center space-y-3 px-2 max-w-sm">
            <h1 className="font-black uppercase italic leading-none tracking-tight text-3xl">
              WELCOME TO NEXORA
            </h1>
            <p className="text-xs font-bold leading-relaxed text-black/80">
              Forecast CELO token price volatility and earn rewards in skill-based prediction tournaments built for MiniPay.
            </p>
          </div>
        </div>

        <div className="w-full pb-4">
          <button
            type="button"
            onClick={handleNext}
            className="w-full py-3.5 rounded-2xl bg-[#62E2F8] text-black font-black uppercase text-sm border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all hover:bg-[#48d0e7]"
          >
            NEXT
          </button>
        </div>
      </div>
    );
  }

  if (slide === 1) {
    return (
      <div className="absolute inset-0 z-[200] flex flex-col justify-between bg-[#62E2F8] p-6 text-black select-none overflow-y-auto">
        <div className="flex justify-between items-center w-full">
          <span className="text-[10px] font-black tracking-widest uppercase bg-black text-white px-2 py-0.5 rounded border border-black">
            Slide 2/3
          </span>
          <button
            type="button"
            onClick={() => setSlide(2)}
            className="text-xs font-black uppercase tracking-wide hover:underline"
          >
            Skip
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center my-4 space-y-6">
          <div className="relative w-full max-w-[270px] aspect-[4/3]">
            <div className="absolute -top-4 -right-2 rotate-[12deg] bg-[#E91E8C] border-4 border-black text-white font-black px-3 py-1 text-xs uppercase shadow-[3px_3px_0_rgba(0,0,0,1)] rounded-xl z-20">
              LET&apos;S GO!
            </div>
            <div className="w-full h-full rounded-2xl border-4 border-black bg-white shadow-[6px_6px_0_rgba(0,0,0,1)] overflow-hidden relative">
              <Image
                src="/arena.png"
                alt="Head-to-Head Arena"
                fill
                className="object-cover"
              />
            </div>
          </div>

          <div className="text-center space-y-3 px-2 max-w-sm">
            <h1 className="font-black uppercase italic leading-none tracking-tight text-3xl">
              COMPETE IN LIVE 1V1 DUELS
            </h1>
            <p className="text-xs font-bold leading-relaxed text-black/80">
              Challenge players in skill-based Arena matches. Outsmart your opponent — predict the move and win.
            </p>
          </div>
        </div>

        <div className="w-full pb-4">
          <button
            type="button"
            onClick={handleNext}
            className="w-full py-3.5 rounded-2xl bg-white text-black font-black uppercase text-sm border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all hover:bg-zinc-100"
          >
            NEXT
          </button>
        </div>
      </div>
    );
  }

  // Slide 3: Connect (optional) + Launch App
  return (
    <div className="absolute inset-0 z-[200] flex flex-col justify-between bg-white p-6 text-black select-none overflow-y-auto">
      <div className="flex justify-between items-center w-full">
        <span className="text-[10px] font-black tracking-widest uppercase bg-black text-white px-2 py-0.5 rounded border border-black">
          Slide 3/3
        </span>
      </div>

      <div className="flex-1 flex flex-col justify-center space-y-6 max-w-sm mx-auto w-full">
        <div className="text-center">
          <h1 className="font-black uppercase italic leading-none tracking-tight text-3xl mb-1">
            READY TO PLAY?
          </h1>
          <p className="text-[10px] font-black text-black/50 uppercase tracking-widest">
            Connect your wallet or jump straight in
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black tracking-wider uppercase text-black">
              Celo Wallet Address
            </label>
            <div className="w-full border-4 border-black bg-white rounded-xl px-4 py-3 text-xs font-black text-black shadow-[3px_3px_0_rgba(0,0,0,1)] truncate select-all">
              {isConnected && address ? address : "Not Connected — optional for free play"}
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black tracking-wider uppercase text-black">
              Active Network
            </label>
            <div className="w-full border-4 border-black bg-white rounded-xl px-4 py-3 text-xs font-black text-black shadow-[3px_3px_0_rgba(0,0,0,1)]">
              Celo (MiniPay ready)
            </div>
          </div>
        </div>

        {!isConnected && (
          <ConnectButton.Custom>
            {({ openConnectModal, mounted }: { openConnectModal: () => void; mounted: boolean }) => (
              <button
                onClick={openConnectModal}
                type="button"
                disabled={!mounted}
                className="w-full py-3.5 rounded-2xl bg-[#62E2F8] text-black font-black uppercase text-sm border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all hover:bg-[#48d0e7] flex items-center justify-center gap-2 disabled:opacity-60"
              >
                Connect Wallet
              </button>
            )}
          </ConnectButton.Custom>
        )}

        <button
          type="button"
          onClick={handleLaunchApp}
          disabled={launching}
          className={cn(
            "w-full py-3.5 rounded-2xl text-black font-black uppercase text-sm border-4 border-black shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all disabled:opacity-60",
            isConnected
              ? "bg-[#62E2F8] hover:bg-[#48d0e7]"
              : "bg-[#FBBF24] hover:bg-[#f5b40a]"
          )}
        >
          {launching ? "Starting…" : isConnected ? "Launch App" : "Try Free Play"}
        </button>

        {!isConnected && (
          <>
            <div className="relative flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-b-4 border-black" />
              </div>
              <span className="relative px-3 bg-white font-black text-xs uppercase text-black z-10">
                OR
              </span>
            </div>

            <div className="flex justify-center gap-4">
              <ConnectButton.Custom>
                {({ openConnectModal }: { openConnectModal: () => void }) => (
                  <button
                    type="button"
                    onClick={openConnectModal}
                    className="w-14 h-14 bg-white border-4 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all"
                    title="Login with Google"
                  >
                    <GoogleIcon />
                  </button>
                )}
              </ConnectButton.Custom>

              <ConnectButton.Custom>
                {({ openConnectModal }: { openConnectModal: () => void }) => (
                  <button
                    type="button"
                    onClick={openConnectModal}
                    className="w-14 h-14 bg-[#E91E8C] border-4 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all"
                    title="Login with Apple"
                  >
                    <AppleIcon />
                  </button>
                )}
              </ConnectButton.Custom>

              <ConnectButton.Custom>
                {({ openConnectModal }: { openConnectModal: () => void }) => (
                  <button
                    type="button"
                    onClick={openConnectModal}
                    className="w-14 h-14 bg-[#FBBF24] border-4 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_rgba(0,0,0,1)] transition-all"
                    title="Login with X"
                  >
                    <XIcon />
                  </button>
                )}
              </ConnectButton.Custom>
            </div>
          </>
        )}
      </div>

      <div className="w-full text-center pb-4">
        <p className="text-[10px] font-black text-black/70">
          Try free play first — no funds required to explore
        </p>
      </div>
    </div>
  );
}

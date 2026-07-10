import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { TournamentCard } from "@/components/tournament/TournamentCard";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { LevelProgress } from "@/components/ui/LevelProgress";
import { MissionCard } from "@/components/ui/MissionCard";
import { RewardCard } from "@/components/ui/RewardCard";

describe("TournamentCard", () => {
  it("renders tournament details", () => {
    const tournament = {
      id: "t1",
      name: "Test Tournament",
      status: "OPEN",
      startTime: new Date("2024-01-01T10:00:00Z"),
      endTime: new Date("2024-01-01T11:00:00Z"),
      rewardPool: 1000,
      asset: "USDC",
      currentPlayers: 50,
      maxPlayers: 100,
    };

    render(<TournamentCard tournament={tournament} />);
    expect(screen.getByText("Test Tournament")).toBeDefined();
    expect(screen.getByText("1,000")).toBeDefined();
  });
});

describe("CountdownTimer", () => {
  it("renders countdown", () => {
    render(<CountdownTimer endTime={new Date(Date.now() + 60_000)} />);
    expect(screen.getByText(/00:01:00/)).toBeDefined();
  });
});

describe("LevelProgress", () => {
  it("renders level and XP", () => {
    render(<LevelProgress xp={500} level={1} />);
    expect(screen.getByText("Level 1")).toBeDefined();
    expect(screen.getByText("500 / 2,000 XP")).toBeDefined();
  });
});

describe("MissionCard", () => {
  it("renders mission progress", () => {
    render(<MissionCard title="Daily Login" description="Log in today" progress={1} target={3} reward="50 XP" />);
    expect(screen.getByText("Daily Login")).toBeDefined();
    expect(screen.getByText("50 XP")).toBeDefined();
  });
});

describe("RewardCard", () => {
  it("renders reward status", () => {
    render(<RewardCard title="Tournament Reward" amount={100} asset="USDC" status="paid" />);
    expect(screen.getByText("Tournament Reward")).toBeDefined();
    expect(screen.getByText("100")).toBeDefined();
  });
});

/**
 * StatsSection Component
 * Displays Mines game statistics
 */

import { SPACING, FONT_SIZES } from "@/shared/constants/styles.js";
import type { MinesRoundData } from "@/shared/types/api";

interface StatsSectionProps {
  history: MinesRoundData[];
}

export function StatsSection({ history }: StatsSectionProps) {
  const totalRounds = history.length;
  const wins = history.filter((r) => r.won).length;
  const losses = totalRounds - wins;
  const winRate =
    totalRounds > 0 ? ((wins / totalRounds) * 100).toFixed(1) : "0.0";

  return (
    <div
      style={{
        marginBottom: SPACING.md,
        padding: SPACING.sm,
        background: "rgba(255, 255, 255, 0.05)",
        borderRadius: "6px",
      }}
    >
      <div style={{ fontSize: FONT_SIZES.sm, marginBottom: SPACING.xs }}>
        <strong>Total Rounds:</strong> {totalRounds}
      </div>
      <div
        style={{
          fontSize: FONT_SIZES.sm,
          marginBottom: SPACING.xs,
          color: "#22c55e",
        }}
      >
        <strong>Wins:</strong> {wins} ({winRate}%)
      </div>
      <div style={{ fontSize: FONT_SIZES.sm, color: "#ef4444" }}>
        <strong>Losses:</strong> {losses}
      </div>
    </div>
  );
}

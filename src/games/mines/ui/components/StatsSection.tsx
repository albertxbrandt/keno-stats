/**
 * StatsSection Component
 * Displays Mines game statistics
 */

import { COLORS } from "@/shared/constants/colors.js";
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from "@/shared/constants/styles.js";
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
        marginBottom: SPACING.lg,
        padding: SPACING.sm,
        background: COLORS.bg.dark,
        borderRadius: BORDER_RADIUS.sm,
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

/**
 * HeatmapControl Component
 * Toggle and sample size control for mine heatmap
 */

import { SPACING, FONT_SIZES } from "@/shared/constants/styles.js";
import { ToggleSwitch } from "@/shared/components/ToggleSwitch";
import { NumberInput } from "@/shared/components/NumberInput";

interface HeatmapControlProps {
  enabled: boolean;
  sampleSize: number;
  onToggle: (enabled: boolean) => void;
  onSampleSizeChange: (size: number) => void;
}

export function HeatmapControl({
  enabled,
  sampleSize,
  onToggle,
  onSampleSizeChange,
}: HeatmapControlProps) {
  return (
    <div
      style={{
        padding: SPACING.sm,
        background: "rgba(255, 255, 255, 0.05)",
        borderRadius: "6px",
      }}
    >
      {/* Toggle */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: enabled ? SPACING.sm : "0",
        }}
      >
        <span style={{ fontSize: FONT_SIZES.base }}>Mine Heatmap</span>
        <ToggleSwitch checked={enabled} onChange={() => onToggle(!enabled)} />
      </div>

      {/* Sample Size */}
      {enabled && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: SPACING.sm,
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
          }}
        >
          <span style={{ fontSize: FONT_SIZES.sm }}>Sample Size</span>
          <div style={{ width: "70px" }}>
            <NumberInput
              value={sampleSize}
              min={10}
              max={500}
              step={10}
              onChange={onSampleSizeChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}

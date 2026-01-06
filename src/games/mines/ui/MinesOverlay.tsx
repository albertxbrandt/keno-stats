/**
 * Mines Overlay Component
 * Simple draggable overlay for Mines game tracking
 */

import { render } from "preact";
import { useState, useEffect } from "preact/hooks";
import { Bomb } from "lucide-preact";
import { COLORS } from "@/shared/constants/colors.js";
import { SPACING, FONT_SIZES } from "@/shared/constants/styles.js";
import { DraggableOverlay } from "@/shared/components/DraggableOverlay";
import { getMinesHistory } from "../core/storage";
import { applyMinesHeatmap, clearMinesHeatmap } from "../utils/heatmap";
import { StatsSection } from "./components/StatsSection";
import { HeatmapControl } from "./components/HeatmapControl";
import type { MinesRoundData } from "@/shared/types/api";

interface MinesOverlayProps {
  onClose: () => void;
}

export function MinesOverlay({ onClose }: MinesOverlayProps) {
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const [sampleSize, setSampleSize] = useState(100);
  const [history, setHistory] = useState<MinesRoundData[]>([]);

  // Load history on mount
  useEffect(() => {
    getMinesHistory().then(setHistory);
  }, []);

  // Update heatmap when settings change
  useEffect(() => {
    if (heatmapEnabled) {
      applyMinesHeatmap(history, 0.3, sampleSize);
    } else {
      clearMinesHeatmap();
    }
  }, [heatmapEnabled, sampleSize, history]);

  return (
    <DraggableOverlay
      title="Mines Tracker"
      icon={<Bomb size={16} strokeWidth={2} />}
      onClose={onClose}
      isActive={true}
    >
      {/* Content */}
      <div
        style={{
          padding: SPACING.md,
          color: COLORS.text.primary,
        }}
      >
        {/* Stats */}
        <StatsSection history={history} />

        {/* Heatmap Control */}
        <HeatmapControl
          enabled={heatmapEnabled}
          sampleSize={sampleSize}
          onToggle={setHeatmapEnabled}
          onSampleSizeChange={setSampleSize}
        />

        {/* Info Text */}
        {history.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: SPACING.lg,
              color: COLORS.text.secondary,
              fontSize: FONT_SIZES.sm,
            }}
          >
            Play some rounds to see statistics
          </div>
        )}
      </div>
    </DraggableOverlay>
  );
}

/**
 * Initialize and render the Preact overlay
 * Call this function to mount the overlay to the DOM
 *
 * @param container - DOM element to render into (creates if not provided)
 * @param onClose - Callback when overlay is closed
 * @returns void
 *
 * @example
 * import { initMinesOverlay } from './MinesOverlay';
 * initMinesOverlay(null, handleClose);
 */
export function initMinesOverlay(
  container: HTMLElement | null,
  onClose: () => void
): void {
  // Create container if not provided
  let targetContainer = container;
  if (!targetContainer) {
    targetContainer = document.createElement("div");
    targetContainer.id = "mines-tracker-preact-root";
    document.body.appendChild(targetContainer);
  }

  // Render the Preact tree
  render(<MinesOverlay onClose={onClose} />, targetContainer);
}

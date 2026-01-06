/**
 * Site-wide toolbar component
 * Provides quick access to utilities and features across all Stake pages
 */

import { useState, useEffect } from "preact/hooks";
import { state } from "../../core/state.js";
import { saveToolbarSettings } from "../../core/storage.js";
import { COLORS } from "@/shared/constants/colors.js";
import { SPACING, BORDER_RADIUS } from "@/shared/constants/styles.js";
import { useUtilities } from "../../hooks/useUtilities.js";
import {
  Dices,
  Coins,
  Hash,
  Gamepad2,
  Sparkles,
  Link,
  BarChart3,
  Bomb,
} from "lucide-preact";
import { constrainToViewport } from "@/shared/utils/viewport.js";
import { ToolbarHeader } from "./ToolbarHeader";
import { ToolbarButton } from "./ToolbarButton";
import { ToolbarSection } from "./ToolbarSection";

/**
 * Main toolbar component
 */
export function Toolbar() {
  // Type assertion needed for JS hook until migrated to TS
  const { openUtility } = useUtilities() as {
    openUtility: (name: string) => void;
  };
  const [position, setPosition] = useState(state.toolbarPosition);
  const [collapsed, setCollapsed] = useState(state.toolbarCollapsed);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Save position when it changes
  useEffect(() => {
    state.toolbarPosition = position;
    saveToolbarSettings();
  }, [position]);

  // Save collapsed state when it changes
  useEffect(() => {
    state.toolbarCollapsed = collapsed;
    saveToolbarSettings();
  }, [collapsed]);

  const handleMouseDown = (e: MouseEvent | TouchEvent) => {
    if ((e.target as HTMLElement).closest(".toolbar-menu")) return; // Don't drag when clicking menu items
    setIsDragging(true);
    const clientX = "clientX" in e ? e.clientX : e.touches?.[0]?.clientX ?? 0;
    const clientY = "clientY" in e ? e.clientY : e.touches?.[0]?.clientY ?? 0;
    setDragOffset({
      x: clientX - position.x,
      y: clientY - position.y,
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    const toolbarWidth = collapsed ? 40 : 200;
    const constrained = constrainToViewport(newX, newY, toolbarWidth);
    setPosition(constrained);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      const mouseMoveHandler = handleMouseMove as unknown as EventListener;
      const mouseUpHandler = handleMouseUp as unknown as EventListener;
      window.addEventListener("mousemove", mouseMoveHandler);
      window.addEventListener("mouseup", mouseUpHandler);
      return () => {
        window.removeEventListener("mousemove", mouseMoveHandler);
        window.removeEventListener("mouseup", mouseUpHandler);
      };
    }
    return undefined;
  }, [isDragging, dragOffset]);

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const navigateToGame = (gameName: string) => {
    const currentOrigin = window.location.origin;
    window.location.href = `${currentOrigin}/casino/games/${gameName}`;
  };

  const openDashboard = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chromeApi = (globalThis as { chrome?: any }).chrome;
    if (chromeApi?.runtime) {
      const fullUrl = chromeApi.runtime.getURL("dashboard.html");
      if (chromeApi.tabs) {
        chromeApi.tabs.create({ url: fullUrl });
      } else {
        window.open(fullUrl, "_blank");
      }
    } else {
      window.open("dashboard.html", "_blank");
    }
  };

  return (
    <div
      class="stake-toolbar"
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 999999,
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
      }}
    >
      <div
        style={{
          background: COLORS.bg.darker,
          border: "1px solid #1a2c38",
          borderRadius: BORDER_RADIUS.lg,
          padding: "0",
          boxShadow: "0 4px 10px rgba(0,0,0,0.5)",
          minWidth: collapsed ? "40px" : "200px",
          transition: "all 0.2s ease",
        }}
      >
        {/* Header */}
        <ToolbarHeader
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          onMouseDown={handleMouseDown}
        />

        {/* Menu */}
        {!collapsed && (
          <div
            class="toolbar-menu"
            style={{
              padding: SPACING.sm,
              background: COLORS.bg.dark,
            }}
          >
            {/* Games Section */}
            <ToolbarSection title="Games">
              <ToolbarButton
                icon={
                  <Dices
                    size={18}
                    strokeWidth={2}
                    color={COLORS.text.primary}
                    style={{ opacity: 0.9 }}
                  />
                }
                label="Keno"
                onClick={() => navigateToGame("keno")}
              />
              <ToolbarButton
                icon={
                  <Bomb
                    size={18}
                    strokeWidth={2}
                    color={COLORS.text.primary}
                    style={{ opacity: 0.9 }}
                  />
                }
                label="Mines"
                onClick={() => navigateToGame("mines")}
              />
            </ToolbarSection>

            {/* Utilities Section */}
            <ToolbarSection title="Utilities" showTopBorder>
              <ToolbarButton
                icon={
                  <Coins
                    size={18}
                    strokeWidth={2}
                    color={COLORS.text.primary}
                    style={{ opacity: 0.9 }}
                  />
                }
                label="Coin Flipper"
                onClick={() => openUtility("coinFlipper")}
              />
              <ToolbarButton
                icon={
                  <Hash
                    size={18}
                    strokeWidth={2}
                    color={COLORS.text.primary}
                    style={{ opacity: 0.9 }}
                  />
                }
                label="Random Numbers"
                onClick={() => openUtility("randomGen")}
              />
              <ToolbarButton
                icon={
                  <Gamepad2
                    size={18}
                    strokeWidth={2}
                    color={COLORS.text.primary}
                    style={{ opacity: 0.9 }}
                  />
                }
                label="Random Game"
                onClick={() => openUtility("randomGamePicker")}
              />
              <ToolbarButton
                icon={
                  <Sparkles
                    size={18}
                    strokeWidth={2}
                    color={COLORS.text.primary}
                    style={{ opacity: 0.9 }}
                  />
                }
                label="Magic 8-Ball"
                onClick={() => openUtility("magic8Ball")}
              />
              <ToolbarButton
                icon={
                  <Link
                    size={18}
                    strokeWidth={2}
                    color={COLORS.text.primary}
                    style={{ opacity: 0.9 }}
                  />
                }
                label="Win Links"
                onClick={() => openUtility("winLinks")}
              />
            </ToolbarSection>

            {/* Dashboard Section */}
            <ToolbarSection title="Dashboard" showTopBorder>
              <ToolbarButton
                icon={
                  <BarChart3
                    size={18}
                    strokeWidth={2}
                    color={COLORS.text.primary}
                    style={{ opacity: 0.9 }}
                  />
                }
                label="View Dashboard"
                onClick={openDashboard}
              />
            </ToolbarSection>
          </div>
        )}
      </div>
    </div>
  );
}

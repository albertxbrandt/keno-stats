/**
 * VIP progress UI injection
 * Injects remaining wager information into the VIP modal
 */

import { calculateVIPProgress, formatCurrency } from "./calculations";
import type { VIPUserData } from "./types";
import { COLORS } from "@/shared/constants/colors";
import { FONT_SIZES, SPACING, BORDER_RADIUS } from "@/shared/constants/styles";

let latestVIPData: VIPUserData | null = null;

/**
 * Store VIP data from interceptor
 */
export function storeVIPData(data: VIPUserData) {
  latestVIPData = data;
  injectVIPProgress();
}

/**
 * Inject VIP progress display into the modal
 */
export function injectVIPProgress() {
  if (!latestVIPData) {
    return;
  }

  // Find the VIP modal
  const modalRoot = document.querySelector('[data-testid="modal-vip"]');

  if (!modalRoot) {
    return;
  }

  // Check if we already injected
  if (document.getElementById("stake-tools-vip-remaining")) {
    return;
  }

  const progress = calculateVIPProgress(latestVIPData);
  if (!progress) {
    return;
  }

  // Create floating display positioned to the side of modal
  const remainingDiv = document.createElement("div");
  remainingDiv.id = "stake-tools-vip-remaining";
  remainingDiv.style.cssText = `
    position: fixed;
    top: 50%;
    right: 20px;
    transform: translateY(-50%);
    padding: ${SPACING.lg};
    background: ${COLORS.bg.darker};
    border: 1px solid ${COLORS.border.light};
    border-radius: ${BORDER_RADIUS.md};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    min-width: 250px;
  `;

  // Create content
  const title = document.createElement("div");
  title.style.cssText = `
    font-size: ${FONT_SIZES.md};
    color: ${COLORS.text.primary};
    margin-bottom: ${SPACING.md};
    font-weight: 600;
  `;
  title.textContent = `Progress to ${
    progress.nextLevel ? progress.nextLevel.displayName : "Max Level"
  }`;

  const wageredRow = document.createElement("div");
  wageredRow.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${SPACING.sm};
  `;

  const wageredLabel = document.createElement("span");
  wageredLabel.style.cssText = `
    font-size: ${FONT_SIZES.sm};
    color: ${COLORS.text.secondary};
  `;
  wageredLabel.textContent = "Wagered:";

  const wageredValue = document.createElement("span");
  wageredValue.style.cssText = `
    font-size: ${FONT_SIZES.md};
    color: ${COLORS.accent.success};
    font-weight: 600;
  `;
  wageredValue.textContent = formatCurrency(progress.wagered);

  wageredRow.appendChild(wageredLabel);
  wageredRow.appendChild(wageredValue);

  const remainingRow = document.createElement("div");
  remainingRow.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;

  const remainingLabel = document.createElement("span");
  remainingLabel.style.cssText = `
    font-size: ${FONT_SIZES.sm};
    color: ${COLORS.text.secondary};
  `;
  remainingLabel.textContent = "Remaining:";

  const remainingValue = document.createElement("span");
  remainingValue.style.cssText = `
    font-size: ${FONT_SIZES.md};
    color: ${COLORS.accent.info};
    font-weight: 600;
  `;
  remainingValue.textContent = formatCurrency(progress.remaining);

  remainingRow.appendChild(remainingLabel);
  remainingRow.appendChild(remainingValue);

  // Assemble
  remainingDiv.appendChild(title);
  remainingDiv.appendChild(wageredRow);
  remainingDiv.appendChild(remainingRow);

  // Append to body (floats next to modal)
  document.body.appendChild(remainingDiv);

  // Remove when modal closes - use MutationObserver
  const modalObserver = new MutationObserver(() => {
    const modal = document.querySelector('[data-testid="modal-vip"]');
    if (!modal) {
      remainingDiv.remove();
      modalObserver.disconnect();
    }
  });

  // Observe body for modal removal
  modalObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Clean up observer when element is removed
  const originalRemove = remainingDiv.remove.bind(remainingDiv);
  remainingDiv.remove = () => {
    modalObserver.disconnect();
    originalRemove();
  };
}

/**
 * Initialize VIP progress tracking
 * Sets up observers and message listeners
 */
export function initVIPProgress() {
  // Listen for VIP data from interceptor
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (event.data.type === "VIP_DATA_FROM_PAGE") {
      storeVIPData(event.data.payload);
    }
  });

  // Observe DOM for modal opening
  const observer = new MutationObserver(() => {
    const vipModal = document.querySelector('[data-testid="modal-vip"]');
    if (vipModal && !document.getElementById("stake-tools-vip-remaining")) {
      injectVIPProgress();
    }
  });

  // Start observing the document body for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

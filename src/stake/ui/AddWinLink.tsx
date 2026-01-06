/**
 * Add Win Link Utility
 * Allows users to save bet replays by pasting bet IDs or URLs
 */

import { useState } from "preact/hooks";
import { Loader2, Link as LinkIcon } from "lucide-preact";
import { Modal } from "@/shared/components/Modal";
import { Button } from "@/shared/components/Button";
import { COLORS } from "@/shared/constants/colors.js";
import {
  SPACING,
  FONT_SIZES,
  BORDER_RADIUS,
} from "@/shared/constants/styles.js";
import { fetchBetData, parseBetId } from "@/shared/utils/stakeBetApi";
import { saveWinLink } from "@/shared/storage/winLinks";
import { BetWrapper, CasinoBet, ThirdPartyBet, isCasinoBet } from "@/shared/types/winLinks";

interface AddWinLinkProps {
  onClose: () => void;
}

export function AddWinLink({ onClose }: AddWinLinkProps) {
  const [betIdInput, setBetIdInput] = useState("");
  const [fetchedBet, setFetchedBet] = useState<BetWrapper | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleFetchBet = async () => {
    setFetchError(null);
    setSaveSuccess(false);

    const betId = parseBetId(betIdInput);
    if (!betId) {
      setFetchError("Invalid bet ID format. Use format like: house:123456789 or casino:123456789");
      return;
    }

    setIsFetching(true);
    try {
      const data = await fetchBetData(betId);
      setFetchedBet(data.data.bet);
      setFetchError(null);
    } catch (error) {
      setFetchError(
        error instanceof Error ? error.message : "Failed to fetch bet data"
      );
      setFetchedBet(null);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    if (!fetchedBet) return;

    try {
      await saveWinLink(fetchedBet);
      setSaveSuccess(true);
      setFetchError(null);

      // Close after a brief delay to show success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setFetchError(
        error instanceof Error ? error.message : "Failed to save win link"
      );
    }
  };

  const handleCancel = () => {
    setFetchedBet(null);
    setBetIdInput("");
    setFetchError(null);
    setSaveSuccess(false);
  };

  return (
    <Modal
      title="Add Win Link"
      onClose={onClose}
      icon={<LinkIcon size={20} />}
      defaultPosition={{ x: window.innerWidth / 2 - 250, y: 100 }}
      defaultSize={{ width: 500, height: 650 }}
    >
      <div style={{ minWidth: "400px", maxWidth: "600px" }}>
        {/* Input Section */}
        {!fetchedBet && !saveSuccess && (
          <div>
            <label
              style={{
                display: "block",
                marginBottom: SPACING.xs,
                fontSize: FONT_SIZES.sm,
                color: COLORS.text.secondary,
              }}
            >
              Bet ID or URL
            </label>
            <input
              type="text"
              value={betIdInput}
              onChange={(e) =>
                setBetIdInput((e.target as HTMLInputElement).value)
              }
              placeholder="house:123456789, casino:123456789, or URL"
              style={{
                width: "100%",
                background: COLORS.bg.darkest,
                border: `1px solid ${COLORS.border.default}`,
                borderRadius: BORDER_RADIUS.md,
                padding: SPACING.sm,
                color: COLORS.text.primary,
                fontSize: FONT_SIZES.sm,
                marginBottom: SPACING.md,
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isFetching) {
                  handleFetchBet();
                }
              }}
            />

            {fetchError && (
              <div
                style={{
                  padding: SPACING.sm,
                  background: "rgba(255, 68, 68, 0.1)",
                  border: `1px solid ${COLORS.accent.error}`,
                  borderRadius: BORDER_RADIUS.sm,
                  color: COLORS.accent.error,
                  fontSize: FONT_SIZES.sm,
                  marginBottom: SPACING.md,
                }}
              >
                {fetchError}
              </div>
            )}

            <Button
              variant="primary"
              size="md"
              fullWidth
              onClick={handleFetchBet}
              disabled={isFetching || !betIdInput.trim()}
              icon={
                isFetching ? (
                  <Loader2
                    size={16}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                ) : undefined
              }
              style={isFetching ? { cursor: "wait" } : undefined}
            >
              {isFetching ? "Fetching..." : "Fetch Bet Data"}
            </Button>

            <style>{`
              @keyframes spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {/* Preview Section */}
        {fetchedBet && !saveSuccess && (
          <div>
            <div
              style={{
                background: COLORS.bg.dark,
                padding: SPACING.md,
                borderRadius: BORDER_RADIUS.md,
                marginBottom: SPACING.lg,
              }}
            >
              <h4
                style={{
                  margin: `0 0 ${SPACING.md} 0`,
                  fontSize: FONT_SIZES.md,
                  color: COLORS.text.primary,
                }}
              >
                Preview
              </h4>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: SPACING.sm,
                }}
              >
                <div>
                  <span
                    style={{
                      color: COLORS.text.secondary,
                      fontSize: FONT_SIZES.xs,
                    }}
                  >
                    Game:
                  </span>
                  <span
                    style={{
                      color: COLORS.text.primary,
                      fontSize: FONT_SIZES.sm,
                      marginLeft: SPACING.xs,
                    }}
                  >
                    {isCasinoBet(fetchedBet.bet)
                      ? (fetchedBet.bet as CasinoBet).game.charAt(0).toUpperCase() + (fetchedBet.bet as CasinoBet).game.slice(1)
                      : (fetchedBet.bet as ThirdPartyBet).thirdPartyGame
                          ?.name || "Unknown"}
                  </span>
                </div>

                <div>
                  <span
                    style={{
                      color: COLORS.text.secondary,
                      fontSize: FONT_SIZES.xs,
                    }}
                  >
                    Amount:
                  </span>
                  <span
                    style={{
                      color: COLORS.text.primary,
                      fontSize: FONT_SIZES.sm,
                      marginLeft: SPACING.xs,
                    }}
                  >
                    {fetchedBet.bet.amount.toFixed(2)}{" "}
                    {fetchedBet.bet.currency.toUpperCase()}
                  </span>
                </div>

                <div>
                  <span
                    style={{
                      color: COLORS.text.secondary,
                      fontSize: FONT_SIZES.xs,
                    }}
                  >
                    Payout:
                  </span>
                  <span
                    style={{
                      color:
                        fetchedBet.bet.payout > fetchedBet.bet.amount
                          ? COLORS.accent.success
                          : COLORS.accent.error,
                      fontSize: FONT_SIZES.sm,
                      marginLeft: SPACING.xs,
                      fontWeight: "600",
                    }}
                  >
                    {fetchedBet.bet.payout.toFixed(2)}{" "}
                    {fetchedBet.bet.currency.toUpperCase()}
                  </span>
                </div>

                <div>
                  <span
                    style={{
                      color: COLORS.text.secondary,
                      fontSize: FONT_SIZES.xs,
                    }}
                  >
                    Profit:
                  </span>
                  <span
                    style={{
                      color:
                        fetchedBet.bet.payout - fetchedBet.bet.amount >= 0
                          ? COLORS.accent.success
                          : COLORS.accent.error,
                      fontSize: FONT_SIZES.sm,
                      marginLeft: SPACING.xs,
                      fontWeight: "600",
                    }}
                  >
                    {fetchedBet.bet.payout - fetchedBet.bet.amount >= 0
                      ? "+"
                      : ""}
                    {(fetchedBet.bet.payout - fetchedBet.bet.amount).toFixed(2)}{" "}
                    {fetchedBet.bet.currency.toUpperCase()}
                  </span>
                </div>

                <div>
                  <span
                    style={{
                      color: COLORS.text.secondary,
                      fontSize: FONT_SIZES.xs,
                    }}
                  >
                    Multiplier:
                  </span>
                  <span
                    style={{
                      color: COLORS.accent.info,
                      fontSize: FONT_SIZES.sm,
                      marginLeft: SPACING.xs,
                      fontWeight: "600",
                    }}
                  >
                    {fetchedBet.bet.payoutMultiplier.toFixed(2)}x
                  </span>
                </div>
              </div>
            </div>

            {fetchError && (
              <div
                style={{
                  padding: SPACING.sm,
                  background: "rgba(255, 68, 68, 0.1)",
                  border: `1px solid ${COLORS.accent.error}`,
                  borderRadius: BORDER_RADIUS.sm,
                  color: COLORS.accent.error,
                  fontSize: FONT_SIZES.sm,
                  marginBottom: SPACING.md,
                }}
              >
                {fetchError}
              </div>
            )}

            <div style={{ display: "flex", gap: SPACING.md }}>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={handleSave}
              >
                Save Win Link
              </Button>
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Success Section */}
        {saveSuccess && (
          <div
            style={{
              textAlign: "center",
              padding: SPACING.lg,
            }}
          >
            <div
              style={{
                fontSize: "48px",
                marginBottom: SPACING.md,
              }}
            >
              ✓
            </div>
            <p
              style={{
                color: COLORS.accent.success,
                fontSize: FONT_SIZES.md,
                margin: 0,
              }}
            >
              Win link saved successfully!
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}

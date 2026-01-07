// src/dashboard/sections/WinLinks.tsx
// Win links management section

import { useState, useEffect } from "preact/hooks";
import {
  Download,
  Trash2,
  Upload,
  Search,
  ExternalLink,
  Edit2,
  X,
} from "lucide-preact";
import { Button } from "@/shared/components/Button";
import {
  loadWinLinks,
  deleteWinLink,
  deleteAllWinLinks,
  importWinLinks,
  exportWinLinks,
  updateWinLink,
} from "@/shared/storage/winLinks";
import type { SavedWinLink } from "@/shared/types/winLinks";
import { COLORS } from "@/shared/constants/colors.js";
import {
  BORDER_RADIUS,
  SPACING,
  FONT_SIZES,
} from "@/shared/constants/styles.js";

/**
 * WinLinks Section
 * View and manage saved win links (bet replays)
 */
export function WinLinks() {
  const [winLinks, setWinLinks] = useState<SavedWinLink[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<SavedWinLink[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLink, setSelectedLink] = useState<SavedWinLink | null>(null);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [tagsText, setTagsText] = useState("");

  // Load win links on mount
  useEffect(() => {
    loadWinLinks().then((links) => {
      setWinLinks(links);
      setFilteredLinks(links);
    });
  }, []);

  // Filter links by search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredLinks(winLinks);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = winLinks.filter(
      (link) =>
        link.gameName.toLowerCase().includes(query) ||
        link.note?.toLowerCase().includes(query) ||
        link.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
    setFilteredLinks(filtered);
  }, [searchQuery, winLinks]);

  const handleImport = () => {
    document.getElementById("winLinksFileInput")?.click();
  };

  const handleFileUpload = async (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const count = await importWinLinks(data);
        const updatedLinks = await loadWinLinks();
        setWinLinks(updatedLinks);
        setFilteredLinks(updatedLinks);
        alert(
          `Successfully imported ${count} win link${count !== 1 ? "s" : ""}!`
        );
      } catch (err) {
        alert("Failed to import: " + (err as Error).message);
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const handleExport = async () => {
    try {
      const json = await exportWinLinks();
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `win-links-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export: " + (err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this win link?")) return;

    await deleteWinLink(id);
    const updatedLinks = await loadWinLinks();
    setWinLinks(updatedLinks);
    setFilteredLinks(updatedLinks);
  };

  const handleDeleteAll = async () => {
    if (!confirm("Delete ALL win links? This cannot be undone.")) return;

    await deleteAllWinLinks();
    setWinLinks([]);
    setFilteredLinks([]);
  };

  const handleEditNote = (link: SavedWinLink) => {
    setSelectedLink(link);
    setNoteText(link.note || "");
    setTagsText(link.tags?.join(", ") || "");
    setEditingNote(true);
  };

  const handleSaveNote = async () => {
    if (!selectedLink) return;

    const tags = tagsText
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    await updateWinLink(selectedLink.id, noteText, tags);

    const updatedLinks = await loadWinLinks();
    setWinLinks(updatedLinks);
    setFilteredLinks(updatedLinks);
    setEditingNote(false);
    setSelectedLink(null);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatProfit = (profit: number, currency: string) => {
    const sign = profit >= 0 ? "+" : "";
    return `${sign}${profit.toFixed(2)} ${currency.toUpperCase()}`;
  };

  return (
    <div>
      <h2
        style={{
          margin: `0 0 ${SPACING.lg} 0`,
          color: COLORS.text.primary,
          fontSize: "1.3em",
        }}
      >
        Saved Win Links
      </h2>

      {/* Controls */}
      <div
        style={{
          display: "flex",
          gap: SPACING.md,
          marginBottom: SPACING.lg,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="secondary"
          size="md"
          icon={<Upload size={16} />}
          iconPosition="left"
          onClick={handleImport}
        >
          Import
        </Button>

        <Button
          variant="secondary"
          size="md"
          icon={<Download size={16} />}
          iconPosition="left"
          onClick={handleExport}
        >
          Export
        </Button>

        <Button
          variant="danger"
          size="md"
          icon={<Trash2 size={16} />}
          iconPosition="left"
          onClick={handleDeleteAll}
        >
          Delete All
        </Button>

        <input
          id="winLinksFileInput"
          type="file"
          accept=".json"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
      </div>

      {/* Search */}
      <div style={{ marginBottom: SPACING.lg }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: SPACING.sm,
            background: COLORS.bg.darker,
            padding: SPACING.sm,
            borderRadius: BORDER_RADIUS.md,
            border: `1px solid ${COLORS.border.default}`,
          }}
        >
          <Search size={16} color={COLORS.text.secondary} />
          <input
            type="text"
            placeholder="Search by game name, note, or tags..."
            value={searchQuery}
            onInput={(e) =>
              setSearchQuery((e.target as HTMLInputElement).value)
            }
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              color: COLORS.text.primary,
              fontSize: FONT_SIZES.sm,
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          marginBottom: SPACING.md,
          color: COLORS.text.secondary,
          fontSize: FONT_SIZES.sm,
        }}
      >
        Total Win Links: <strong>{filteredLinks.length}</strong>
      </div>

      {/* Win Links Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: SPACING.md,
        }}
      >
        {filteredLinks.map((link) => (
          <div
            key={link.id}
            style={{
              background: COLORS.bg.darker,
              padding: SPACING.md,
              borderRadius: BORDER_RADIUS.md,
              border: `1px solid ${COLORS.border.default}`,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = COLORS.accent.info;
              e.currentTarget.style.boxShadow = `0 4px 12px ${COLORS.accent.info}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = COLORS.border.default;
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: SPACING.sm,
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: COLORS.text.primary,
                  fontSize: FONT_SIZES.md,
                  fontWeight: "600",
                }}
              >
                {link.gameName}
              </h3>
              <div style={{ display: "flex", gap: SPACING.xs }}>
                <button
                  onClick={() => handleEditNote(link)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Edit2 size={14} color={COLORS.accent.info} />
                </button>
                <button
                  onClick={() => handleDelete(link.id)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Trash2 size={14} color={COLORS.accent.error} />
                </button>
              </div>
            </div>

            {/* Profit & Multiplier */}
            <div
              style={{
                display: "flex",
                gap: SPACING.md,
                marginBottom: SPACING.sm,
              }}
            >
              <div>
                <div
                  style={{
                    color: COLORS.text.tertiary,
                    fontSize: FONT_SIZES.xs,
                  }}
                >
                  Profit
                </div>
                <div
                  style={{
                    color:
                      link.profit >= 0
                        ? COLORS.accent.success
                        : COLORS.accent.error,
                    fontWeight: "600",
                    fontSize: FONT_SIZES.sm,
                  }}
                >
                  {formatProfit(link.profit, link.betData.bet.currency)}
                </div>
              </div>
              <div>
                <div
                  style={{
                    color: COLORS.text.tertiary,
                    fontSize: FONT_SIZES.xs,
                  }}
                >
                  Multiplier
                </div>
                <div
                  style={{
                    color: COLORS.text.primary,
                    fontWeight: "600",
                    fontSize: FONT_SIZES.sm,
                  }}
                >
                  {link.multiplier.toFixed(2)}x
                </div>
              </div>
            </div>

            {/* Note */}
            {link.note && (
              <div
                style={{
                  marginBottom: SPACING.sm,
                  color: COLORS.text.secondary,
                  fontSize: FONT_SIZES.xs,
                  fontStyle: "italic",
                }}
              >
                "{link.note}"
              </div>
            )}

            {/* Tags */}
            {link.tags && link.tags.length > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: SPACING.xs,
                  flexWrap: "wrap",
                  marginBottom: SPACING.sm,
                }}
              >
                {link.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      background: COLORS.bg.darkest,
                      color: COLORS.accent.info,
                      padding: "2px 8px",
                      borderRadius: BORDER_RADIUS.sm,
                      fontSize: FONT_SIZES.xs,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Date */}
            <div
              style={{
                color: COLORS.text.tertiary,
                fontSize: FONT_SIZES.xs,
                marginBottom: SPACING.sm,
              }}
            >
              Saved: {formatDate(link.savedAt)}
            </div>

            {/* Replay Link */}
            {link.gameType === "thirdparty" &&
              "betReplay" in link.betData.bet &&
              link.betData.bet.betReplay && (
                <a
                  href={link.betData.bet.betReplay}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: SPACING.xs,
                    color: COLORS.accent.info,
                    fontSize: FONT_SIZES.xs,
                    textDecoration: "none",
                  }}
                >
                  <ExternalLink size={14} />
                  View Replay
                </a>
              )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredLinks.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: SPACING.lg,
            color: COLORS.text.tertiary,
          }}
        >
          <ExternalLink
            size={48}
            color={COLORS.text.tertiary}
            style={{ opacity: 0.5, marginBottom: SPACING.md }}
          />
          <p>No win links saved yet</p>
          <p style={{ fontSize: FONT_SIZES.xs }}>
            Import bet data from Stake to save your favorite wins!
          </p>
        </div>
      )}

      {/* Edit Note Modal */}
      {editingNote && selectedLink && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setEditingNote(false)}
        >
          <div
            style={{
              background: COLORS.bg.darker,
              padding: SPACING.lg,
              borderRadius: BORDER_RADIUS.lg,
              maxWidth: "500px",
              width: "90%",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: SPACING.lg,
              }}
            >
              <h3 style={{ margin: 0, color: COLORS.text.primary }}>
                Edit Note
              </h3>
              <button
                onClick={() => setEditingNote(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                }}
              >
                <X size={20} color={COLORS.text.secondary} />
              </button>
            </div>

            <div style={{ marginBottom: SPACING.md }}>
              <label
                style={{
                  display: "block",
                  marginBottom: SPACING.xs,
                  color: COLORS.text.secondary,
                  fontSize: FONT_SIZES.sm,
                }}
              >
                Note
              </label>
              <textarea
                value={noteText}
                onInput={(e) =>
                  setNoteText((e.target as HTMLTextAreaElement).value)
                }
                placeholder="Add a note about this win..."
                style={{
                  width: "100%",
                  minHeight: "80px",
                  background: COLORS.bg.darkest,
                  border: `1px solid ${COLORS.border.default}`,
                  borderRadius: BORDER_RADIUS.md,
                  padding: SPACING.sm,
                  color: COLORS.text.primary,
                  fontSize: FONT_SIZES.sm,
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ marginBottom: SPACING.lg }}>
              <label
                style={{
                  display: "block",
                  marginBottom: SPACING.xs,
                  color: COLORS.text.secondary,
                  fontSize: FONT_SIZES.sm,
                }}
              >
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tagsText}
                onInput={(e) =>
                  setTagsText((e.target as HTMLInputElement).value)
                }
                placeholder="big-win, keno, lucky..."
                style={{
                  width: "100%",
                  background: COLORS.bg.darkest,
                  border: `1px solid ${COLORS.border.default}`,
                  borderRadius: BORDER_RADIUS.md,
                  padding: SPACING.sm,
                  color: COLORS.text.primary,
                  fontSize: FONT_SIZES.sm,
                }}
              />
            </div>

            <div style={{ display: "flex", gap: SPACING.md }}>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={handleSaveNote}
              >
                Save
              </Button>
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setEditingNote(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

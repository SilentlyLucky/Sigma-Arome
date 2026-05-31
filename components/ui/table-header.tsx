/**
 * @buildpad-origin @buildpad/ui-table/vtable
 * @buildpad-version 0.2.0
 *
 * TableHeader Component
 * Renders the table header row with sorting, resizing, reordering, and selection controls.
 * Column reordering uses native pointer handling to keep table markup valid.
 */

import { Checkbox, Text, Tooltip } from "@mantine/core";
import { createPortal } from "react-dom";
import {
  IconArrowDown,
  IconArrowsSort,
  IconArrowUp,
  IconGripVertical,
} from "@tabler/icons-react";
import React, { useCallback, useRef, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import type { Header, ShowSelect, Sort } from "./vtable-types";
import "./table-header.css";

export interface TableHeaderProps {
  headers: Header[];
  sort: Sort;
  reordering?: boolean;
  allowHeaderReorder?: boolean;
  showSelect?: ShowSelect;
  showResize?: boolean;
  showManualSort?: boolean;
  someItemsSelected?: boolean;
  allItemsSelected?: boolean;
  fixed?: boolean;
  mustSort?: boolean;
  hasItemAppendSlot?: boolean;
  renderHeaderAppend?: () => React.ReactNode;
  manualSortKey?: string;
  renderHeader?: (header: Header) => React.ReactNode;
  renderHeaderContextMenu?: (header: Header) => React.ReactNode;
  onSortChange?: (sort: Sort) => void;
  onToggleSelectAll?: (selectAll: boolean) => void;
  onHeadersChange?: (headers: Header[]) => void;
  onReorderingChange?: (reordering: boolean) => void;
  onHeaderContextMenu?: (header: Header, event: React.MouseEvent) => void;
}

// ─── Sortable Header Cell ────────────────────────────────────────────────────

interface SortableHeaderCellProps {
  header: Header;
  allowReorder: boolean;
  showResize: boolean;
  resizing: boolean;
  sort: Sort;
  mustSort: boolean;
  renderHeader?: (header: Header) => React.ReactNode;
  renderHeaderContextMenu?: (header: Header) => React.ReactNode;
  onSort: (header: Header) => void;
  onContextMenu: (header: Header, event: React.MouseEvent) => void;
  onResizeStart: (header: Header, event: React.PointerEvent) => void;
  onReorderPointerDown: (header: Header, event: React.PointerEvent) => void;
  onReorderByDelta: (header: Header, delta: number) => void;
  getSortIcon: (header: Header) => React.ReactNode;
  getHeaderClasses: (header: Header) => string;
  /** Any truthy value blocks the next click from sorting after a reorder gesture. */
  dragHappenedRef: React.MutableRefObject<boolean>;
}

const SortableHeaderCell: React.FC<SortableHeaderCellProps> = ({
  header,
  allowReorder,
  showResize,
  resizing,
  sort,
  renderHeader: renderHeaderProp,
  onSort,
  onContextMenu,
  onResizeStart,
  onReorderPointerDown,
  onReorderByDelta,
  getSortIcon,
  getHeaderClasses,
  dragHappenedRef,
}) => {
  // Suppress sort when the user holds the mouse (drag intent) instead of doing a quick click.
  // Three independent signals — any one is enough to block sort:
  //   1. hold duration > 200 ms (left-button held = drag intent)
  //   2. pointer moved > 4 px before the click fires
  //   3. the reorder grip handled the gesture
  const pointerDownTime = useRef(0);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const wasDragGesture = useRef(false);

  return (
    <th
      data-column-value={header.value}
      className={getHeaderClasses(header)}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        pointerDownTime.current = Date.now();
        pointerDownPos.current = { x: e.clientX, y: e.clientY };
        wasDragGesture.current = false;
      }}
      onPointerMove={(e) => {
        if (!pointerDownPos.current) return;
        const dx = Math.abs(e.clientX - pointerDownPos.current.x);
        const dy = Math.abs(e.clientY - pointerDownPos.current.y);
        if (dx > 4 || dy > 4) wasDragGesture.current = true;
      }}
      onClick={() => {
        const heldMs = Date.now() - pointerDownTime.current;
        const wasHeld = heldMs > 200;
        const wasMoved = wasDragGesture.current;
        const wasReorderGesture = dragHappenedRef.current;

        wasDragGesture.current = false;
        dragHappenedRef.current = false;

        if (wasHeld || wasMoved || wasReorderGesture) return;
        onSort(header);
      }}
      onContextMenu={(e) => onContextMenu(header, e)}
      aria-sort={
        header.sortable
          ? ((sort.by === header.value
              ? sort.desc
                ? "descending"
                : "ascending"
              : "none") as "ascending" | "descending" | "none")
          : undefined
      }
    >
      <div className="header-content">
        {allowReorder && (
          <div
            className="reorder-handle"
            role="button"
            tabIndex={0}
            aria-label="Drag to reorder column"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => onReorderPointerDown(header, e)}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                e.stopPropagation();
                onReorderByDelta(header, -1);
              }
              if (e.key === "ArrowRight") {
                e.preventDefault();
                e.stopPropagation();
                onReorderByDelta(header, 1);
              }
            }}
          >
            <IconGripVertical size={14} />
          </div>
        )}

        {renderHeaderProp ? (
          renderHeaderProp(header)
        ) : (
          <Tooltip label={header.description} disabled={!header.description}>
            <Text size="sm" fw={600} truncate="end">
              {header.text}
            </Text>
          </Tooltip>
        )}

        {header.sortable && (
          <span className="sort-indicator">{getSortIcon(header)}</span>
        )}
      </div>

      {showResize && (
        <div
          className="resize-handle"
          onPointerDown={(e) => {
            e.stopPropagation();
            onResizeStart(header, e);
          }}
        />
      )}
    </th>
  );
};

// ─── TableHeader ─────────────────────────────────────────────────────────────

export const TableHeader: React.FC<TableHeaderProps> = ({
  headers,
  sort,
  reordering = false,
  allowHeaderReorder = false,
  showSelect = "none",
  showResize = false,
  showManualSort = false,
  someItemsSelected = false,
  allItemsSelected = false,
  fixed = false,
  mustSort = false,
  hasItemAppendSlot = false,
  renderHeaderAppend,
  manualSortKey,
  renderHeader,
  renderHeaderContextMenu,
  onSortChange,
  onToggleSelectAll,
  onHeadersChange,
  onReorderingChange,
  onHeaderContextMenu,
}) => {
  const [contextMenu, setContextMenu] = useState<{
    header: Header;
    x: number;
    y: number;
  } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [resizing, setResizing] = useState(false);
  const resizeRef = useRef<{
    header: Header;
    startX: number;
    startWidth: number;
    baseHeaders: Header[];
    handle: HTMLElement;
    pointerId: number;
  } | null>(null);
  // Tracks whether a column reorder drag just happened so the subsequent click doesn't trigger sort
  const dragHappenedRef = useRef(false);

  // Native pointer state for column reordering; keeps the table DOM valid.
  const reorderRef = useRef<{
    header: Header;
    startX: number;
    startY: number;
  } | null>(null);

  // ─── Context Menu ──────────────────────────────────────────────────────────

  const handleContextMenu = useCallback(
    (header: Header, event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (onHeaderContextMenu) {
        onHeaderContextMenu(header, event);
        return;
      }
      if (renderHeaderContextMenu) {
        setContextMenu({ header, x: event.clientX, y: event.clientY });
      }
    },
    [onHeaderContextMenu, renderHeaderContextMenu],
  );

  React.useEffect(() => {
    if (!contextMenu) return;
    if (contextMenuRef.current) {
      contextMenuRef.current.style.top = `${contextMenu.y}px`;
      contextMenuRef.current.style.left = `${contextMenu.x}px`;
    }
    const handleClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEsc);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEsc);
    };
  }, [contextMenu]);

  // ─── Sort ──────────────────────────────────────────────────────────────────

  const handleSort = useCallback(
    (header: Header) => {
      if (!header.sortable || resizing) return;
      // Use sortKey (dot-notation for M2O) if available, otherwise fall back to value
      const sortField = (header as Header & { sortKey?: string }).sortKey ?? header.value;
      if (header.value === sort.by) {
        if (mustSort) {
          onSortChange?.({ by: header.value, desc: !sort.desc });
        } else if (!sort.desc) {
          onSortChange?.({ by: header.value, desc: true });
        } else {
          onSortChange?.({ by: null, desc: false });
        }
      } else {
        onSortChange?.({ by: header.value, desc: false });
      }
      void sortField; // sortKey is consumed by CollectionList's handleSortChange
    },
    [sort, mustSort, resizing, onSortChange],
  );

  const handleManualSortToggle = useCallback(() => {
    if (sort.by === manualSortKey) {
      onSortChange?.({ by: null, desc: false });
    } else {
      onSortChange?.({ by: manualSortKey ?? null, desc: false });
    }
  }, [sort.by, manualSortKey, onSortChange]);

  // ─── Resize ────────────────────────────────────────────────────────────────

  const handleResizeStart = useCallback(
    (header: Header, event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const target = event.currentTarget as HTMLElement;
      const parent = target.parentElement as HTMLElement;

      const renderedWidths = new Map<string, number>();
      parent.parentElement?.querySelectorAll<HTMLElement>("th[data-column-value]").forEach((cell) => {
        const value = cell.dataset.columnValue;
        if (value) renderedWidths.set(value, cell.getBoundingClientRect().width);
      });

      // Lock every content column to its rendered width before changing the
      // target column. Native table layout otherwise redistributes extra space
      // and makes the handle jump away from the cursor.
      const baseHeaders = headers.map((h) => ({
        ...h,
        width: renderedWidths.get(h.value) ?? h.width ?? null,
      }));
      const actualWidth = renderedWidths.get(header.value) ?? parent.getBoundingClientRect().width;

      setResizing(true);
      target.setPointerCapture?.(event.pointerId);
      resizeRef.current = {
        header,
        startX: event.clientX,
        startWidth: actualWidth,
        baseHeaders,
        handle: target,
        pointerId: event.pointerId,
      };

      const handleMouseMove = (e: PointerEvent) => {
        if (!resizeRef.current) return;
        e.preventDefault();
        const deltaX = e.clientX - resizeRef.current.startX;
        const newWidth = Math.max(32, resizeRef.current.startWidth + deltaX);
        const newHeaders = resizeRef.current.baseHeaders.map((h) =>
          h.value === resizeRef.current!.header.value ? { ...h, width: newWidth } : h,
        );
        onHeadersChange?.(newHeaders);
      };

      const handleMouseUp = (e: PointerEvent) => {
        e.preventDefault();
        if (resizeRef.current?.handle.hasPointerCapture?.(resizeRef.current.pointerId)) {
          resizeRef.current.handle.releasePointerCapture(resizeRef.current.pointerId);
        }
        setResizing(false);
        resizeRef.current = null;
        window.removeEventListener("pointermove", handleMouseMove);
        window.removeEventListener("pointerup", handleMouseUp);
        window.removeEventListener("pointercancel", handleMouseUp);
      };

      window.addEventListener("pointermove", handleMouseMove);
      window.addEventListener("pointerup", handleMouseUp);
      window.addEventListener("pointercancel", handleMouseUp);
    },
    [headers, onHeadersChange],
  );

  // ─── Drag-to-Reorder ──────────────────────────────────────────────────────

  const moveHeader = useCallback(
    (header: Header, toIndex: number) => {
      const oldIndex = headers.findIndex((h) => h.value === header.value);
      if (oldIndex === -1 || toIndex === -1 || oldIndex === toIndex) return;
      onHeadersChange?.(arrayMove(headers, oldIndex, toIndex));
    },
    [headers, onHeadersChange],
  );

  const handleReorderByDelta = useCallback(
    (header: Header, delta: number) => {
      const oldIndex = headers.findIndex((h) => h.value === header.value);
      if (oldIndex === -1) return;
      const nextIndex = Math.max(0, Math.min(headers.length - 1, oldIndex + delta));
      moveHeader(header, nextIndex);
    },
    [headers, moveHeader],
  );

  const handleReorderPointerDown = useCallback(
    (header: Header, event: React.PointerEvent) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      reorderRef.current = { header, startX: event.clientX, startY: event.clientY };
      dragHappenedRef.current = true;
      onReorderingChange?.(true);

      const handlePointerMove = (e: PointerEvent) => {
        if (!reorderRef.current) return;
        const dx = Math.abs(e.clientX - reorderRef.current.startX);
        const dy = Math.abs(e.clientY - reorderRef.current.startY);
        if (dx > 4 || dy > 4) dragHappenedRef.current = true;
      };

      const handlePointerUp = (e: PointerEvent) => {
        const active = reorderRef.current;
        reorderRef.current = null;
        onReorderingChange?.(false);
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
        window.removeEventListener("pointercancel", handlePointerUp);

        if (!active) return;
        const target = document
          .elementFromPoint(e.clientX, e.clientY)
          ?.closest<HTMLElement>("th[data-column-value]");
        const targetValue = target?.dataset.columnValue;
        if (!targetValue || targetValue === active.header.value) return;
        const newIndex = headers.findIndex((h) => h.value === targetValue);
        moveHeader(active.header, newIndex);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
      window.addEventListener("pointercancel", handlePointerUp);
    },
    [headers, moveHeader, onReorderingChange],
  );

  // ─── Helpers ───────────────────────────────────────────────────────────────

  const getSortIcon = (header: Header) => {
    if (sort.by !== header.value) {
      return <IconArrowsSort size={14} className="sort-icon idle" />;
    }
    return sort.desc ? (
      <IconArrowDown size={14} className="sort-icon active" />
    ) : (
      <IconArrowUp size={14} className="sort-icon active" />
    );
  };

  const getHeaderClasses = (header: Header) => {
    const classes = ["cell", `align-${header.align}`];
    if (header.sortable) classes.push("sortable");
    if (header.width && header.width < 90) classes.push("small");
    if (sort.by === header.value) classes.push(sort.desc ? "sort-desc" : "sort-asc");
    return classes.join(" ");
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  const headerCells = headers.map((header) => (
    <SortableHeaderCell
      key={header.value}
      header={header}
      allowReorder={allowHeaderReorder}
      showResize={showResize}
      resizing={resizing}
      sort={sort}
      mustSort={mustSort}
      renderHeader={renderHeader}
      renderHeaderContextMenu={renderHeaderContextMenu}
      onSort={handleSort}
      onContextMenu={handleContextMenu}
      onResizeStart={handleResizeStart}
      onReorderPointerDown={handleReorderPointerDown}
      onReorderByDelta={handleReorderByDelta}
      getSortIcon={getSortIcon}
      getHeaderClasses={getHeaderClasses}
      dragHappenedRef={dragHappenedRef}
    />
  ));

  return (
    <>
        <thead
          className={`table-header ${resizing ? "resizing" : ""} ${reordering ? "reordering" : ""}`}
          role="rowgroup"
        >
          <tr className={fixed ? "fixed" : ""}>
            {/* Manual Sort Column */}
            {showManualSort && (
              <th
                className={`cell manual ${sort.by === manualSortKey ? "sorted-manually" : ""}`}
                onClick={handleManualSortToggle}
                scope="col"
              >
                <span className="sr-only">Toggle manual sort</span>
                <IconGripVertical size={18} aria-hidden="true" />
              </th>
            )}

            {/* Select All Checkbox */}
            {showSelect !== "none" && (
              <th className="cell select">
                {showSelect === "multiple" && (
                  <Checkbox
                    checked={allItemsSelected}
                    indeterminate={someItemsSelected && !allItemsSelected}
                    onChange={() => onToggleSelectAll?.(!allItemsSelected)}
                    aria-label="Select all"
                  />
                )}
              </th>
            )}

            {/* Column Headers (sortable) */}
            {headerCells}

            {/* Append Column — single trailing cell that matches the colgroup's
                append column. Holds the "+ add field" button (renderHeaderAppend)
                or stays empty when only rows have an append slot. NO standalone
                spacer column: native table-layout:fixed handles remaining width. */}
            {(renderHeaderAppend || hasItemAppendSlot) && (
              <th className="cell append" onClick={(e) => e.stopPropagation()}>
                {renderHeaderAppend ? renderHeaderAppend() : null}
              </th>
            )}
          </tr>
        </thead>

      {/* Context Menu Popup — rendered via portal at document.body so it is
          completely outside the table grid. Previously it was inside a <tr>
          which, with display:contents on <tr>, injected an extra grid cell
          that shifted all data row columns by one position. */}
      {contextMenu && renderHeaderContextMenu && typeof document !== 'undefined' && createPortal(
        <div
          ref={contextMenuRef}
          className="header-context-menu"
          onClick={() => setContextMenu(null)}
        >
          {renderHeaderContextMenu(contextMenu.header)}
        </div>,
        document.body
      )}
    </>
  );
};

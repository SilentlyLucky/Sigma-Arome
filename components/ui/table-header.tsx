/**
 * @buildpad-origin @buildpad/ui-table/vtable
 * @buildpad-version 0.2.0
 *
 * TableHeader Component
 * Renders the table header row with sorting, resizing, reordering, and selection controls.
 * Column reordering uses @dnd-kit horizontal list sorting.
 */

import { Checkbox, Text, Tooltip } from "@mantine/core";
import {
  IconArrowDown,
  IconArrowsSort,
  IconArrowUp,
  IconGripVertical,
} from "@tabler/icons-react";
import React, { useCallback, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  getSortIcon: (header: Header) => React.ReactNode;
  getHeaderClasses: (header: Header) => string;
  /** Ref set by DndContext onDragStart — any truthy value blocks the next click from sorting */
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
  getSortIcon,
  getHeaderClasses,
  dragHappenedRef,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: header.value, disabled: !allowReorder });

  // Track pointer movement so a drag gesture never triggers sort
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const wasDragGesture = useRef(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    position: "relative",
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={getHeaderClasses(header)}
      onPointerDown={(e) => {
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
        // Suppress sort if local pointer tracking OR dnd-kit drag detected
        if (wasDragGesture.current) { wasDragGesture.current = false; return; }
        if (dragHappenedRef.current) { dragHappenedRef.current = false; return; }
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
            aria-label="Drag to reorder column"
            {...attributes}
            {...listeners}
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
  } | null>(null);
  // Tracks whether a column reorder drag just happened so the subsequent click doesn't trigger sort
  const dragHappenedRef = useRef(false);

  // DnD sensors — require 5px movement before drag starts (prevents accidental drags on click)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

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
      if (header.value === sort.by) {
        if (mustSort) {
          onSortChange?.({ by: sort.by, desc: !sort.desc });
        } else if (!sort.desc) {
          onSortChange?.({ by: sort.by, desc: true });
        } else {
          onSortChange?.({ by: null, desc: false });
        }
      } else {
        onSortChange?.({ by: header.value, desc: false });
      }
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
      const target = event.currentTarget as HTMLElement;
      const parent = target.parentElement as HTMLElement;

      setResizing(true);
      resizeRef.current = { header, startX: event.pageX, startWidth: parent.offsetWidth };

      const handleMouseMove = (e: PointerEvent) => {
        if (!resizeRef.current) return;
        const deltaX = e.pageX - resizeRef.current.startX;
        const newWidth = Math.max(32, resizeRef.current.startWidth + deltaX);
        const newHeaders = headers.map((h) =>
          h.value === resizeRef.current!.header.value ? { ...h, width: newWidth } : h,
        );
        onHeadersChange?.(newHeaders);
      };

      const handleMouseUp = () => {
        setResizing(false);
        resizeRef.current = null;
        window.removeEventListener("pointermove", handleMouseMove);
        window.removeEventListener("pointerup", handleMouseUp);
      };

      window.addEventListener("pointermove", handleMouseMove);
      window.addEventListener("pointerup", handleMouseUp);
    },
    [headers, onHeadersChange],
  );

  // ─── Drag-to-Reorder ──────────────────────────────────────────────────────

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      onReorderingChange?.(false);
      if (!over || active.id === over.id) return;

      const oldIndex = headers.findIndex((h) => h.value === active.id);
      const newIndex = headers.findIndex((h) => h.value === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = arrayMove(headers, oldIndex, newIndex);
      onHeadersChange?.(reordered);
    },
    [headers, onHeadersChange, onReorderingChange],
  );

  const handleDragStart = useCallback(() => {
    dragHappenedRef.current = true;
    onReorderingChange?.(true);
  }, [onReorderingChange]);

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

  const headerIds = headers.map((h) => h.value);

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
      getSortIcon={getSortIcon}
      getHeaderClasses={getHeaderClasses}
      dragHappenedRef={dragHappenedRef}
    />
  ));

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      accessibility={{ container: typeof document !== 'undefined' ? document.body : undefined }}
    >
      <SortableContext items={headerIds} strategy={horizontalListSortingStrategy}>
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

            {/* Spacer */}
            <th className="cell spacer" aria-hidden="true" />

            {/* Append Column */}
            {renderHeaderAppend ? (
              <th className="cell append" onClick={(e) => e.stopPropagation()}>
                {renderHeaderAppend()}
              </th>
            ) : hasItemAppendSlot ? (
              <th className="cell spacer" aria-hidden="true" />
            ) : null}
          </tr>

          {/* Context Menu Popup */}
          {contextMenu && renderHeaderContextMenu && (
            <tr className="context-menu-row">
              <td colSpan={999} className="context-menu-cell">
                <div
                  ref={contextMenuRef}
                  className="header-context-menu"
                  onClick={() => setContextMenu(null)}
                >
                  {renderHeaderContextMenu(contextMenu.header)}
                </div>
              </td>
            </tr>
          )}
        </thead>
      </SortableContext>
    </DndContext>
  );
};

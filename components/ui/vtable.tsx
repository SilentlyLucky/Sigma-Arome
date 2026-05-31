/**
 * @buildpad-origin @buildpad/ui-table/vtable
 * @buildpad-version 0.2.0
 *
 * This file was copied from Buildpad UI Packages.
 * To update, run: npx @buildpad/cli add vtable --overwrite
 *
 * Docs: https://buildpad.dev/components/vtable
 */

/**
 * VTable Component
 * Dynamic table that renders rows based on collection data
 * Based on DaaS v-table component
 *
 * Integrates with:
 * - @buildpad/types for data types
 * - @buildpad/services for API calls and DaaS context
 * - @buildpad/hooks for data management hooks
 *
 * Features:
 * - Column sorting with ascending/descending toggle
 * - Column resizing via drag handles
 * - Column reordering via drag-and-drop
 * - Row selection (single or multiple)
 * - Manual row sorting via drag-and-drop
 * - Loading/empty states
 * - Fixed header option
 * - Inline styling option
 */

import {
  closestCenter,
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Skeleton, Stack, Text } from "@mantine/core";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TableHeader } from "./table-header";
import { TableRow } from "./table-row";
import type {
  Header,
  HeaderRaw,
  Item,
  ManualSortEvent,
  RowClickEvent,
  ShowSelect,
  Sort,
} from "./vtable-types";
import { HeaderDefaults } from "./vtable-types";
import "./vtable.css";

export interface VTableProps {
  /** Column header definitions */
  headers: HeaderRaw[];
  /** Row data items */
  items: Item[];
  /** Unique key field for items */
  itemKey?: string;
  /** Current sort state */
  sort?: Sort | null;
  /** Force at least one column to be sorted */
  mustSort?: boolean;
  /** Selection mode: none, one (radio), or multiple (checkbox) */
  showSelect?: ShowSelect;
  /** Show column resize handles */
  showResize?: boolean;
  /** Show manual sort (drag-and-drop) handles */
  showManualSort?: boolean;
  /** Field to sort by when manual sorting */
  manualSortKey?: string;
  /** Allow header column reordering */
  allowHeaderReorder?: boolean;
  /** Selected items (controlled) */
  value?: unknown[];
  /** Stick header to top on scroll */
  fixedHeader?: boolean;
  /** Show loading state */
  loading?: boolean;
  /** Loading state text */
  loadingText?: string;
  /** Empty state text */
  noItemsText?: string;
  /** Row height in pixels */
  rowHeight?: number;
  /** Use item keys instead of full items for selection */
  selectionUseKeys?: boolean;
  /** Inline table styling (with border) */
  inline?: boolean;
  /** Disable all interactions */
  disabled?: boolean;
  /** Enable row click */
  clickable?: boolean;
  /** CSS class name */
  className?: string;
  /** Custom cell renderer */
  renderCell?: (item: Item, header: Header) => React.ReactNode;
  /** Custom header renderer */
  renderHeader?: (header: Header) => React.ReactNode;
  /** Custom row append slot */
  renderRowAppend?: (item: Item) => React.ReactNode;
  /** Custom header append slot */
  renderHeaderAppend?: () => React.ReactNode;
  /** Custom header context-menu renderer (right-click on a column header) */
  renderHeaderContextMenu?: (header: Header) => React.ReactNode;
  /** Footer slot */
  renderFooter?: () => React.ReactNode;
  /** Selection change handler */
  onUpdate?: (value: unknown[]) => void;
  /** Sort change handler */
  onSortChange?: (sort: Sort | null) => void;
  /** Header right-click handler */
  onHeaderContextMenu?: (header: Header, event: React.MouseEvent) => void;
  /** Headers change handler (resize/reorder) */
  onHeadersChange?: (headers: HeaderRaw[]) => void;
  /** Items change handler (manual sort) */
  onItemsChange?: (items: Item[]) => void;
  /** Row click handler */
  onRowClick?: (event: RowClickEvent) => void;
  /** Item selected handler */
  onItemSelected?: (event: { value: boolean; item: Item }) => void;
  /** Manual sort handler */
  onManualSort?: (event: ManualSortEvent) => void;
}

/**
 * Sortable row wrapper for dnd-kit
 */
interface SortableTableRowProps {
  id: string;
  item: Item;
  headers: Header[];
  showSelect: ShowSelect;
  showManualSort: boolean;
  isSelected: boolean;
  subdued: boolean;
  sortedManually: boolean;
  hasClickListener: boolean;
  rowHeight: number;
  disabled: boolean;
  renderCell?: (item: Item, header: Header) => React.ReactNode;
  renderAppend?: (item: Item) => React.ReactNode;
  hasAppendColumn?: boolean;
  onClick?: (event: React.MouseEvent) => void;
  onSelect?: (selected: boolean) => void;
}

const SortableTableRow: React.FC<SortableTableRowProps> = ({
  id,
  item,
  headers,
  showSelect,
  showManualSort,
  isSelected,
  subdued,
  sortedManually,
  hasClickListener,
  rowHeight,
  disabled,
  renderCell,
  renderAppend,
  hasAppendColumn,
  onClick,
  onSelect,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: disabled || !sortedManually });

  const style: React.CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition,
    position: isDragging ? "relative" : undefined,
    zIndex: isDragging ? 1 : undefined,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      headers={headers}
      item={item}
      showSelect={showSelect}
      showManualSort={showManualSort}
      isSelected={isSelected}
      subdued={subdued}
      sortedManually={sortedManually}
      hasClickListener={hasClickListener}
      height={rowHeight}
      isDragging={isDragging}
      // dnd-kit's `attributes` apply role="button" + tabIndex + aria-roledescription
      // to whatever element they're spread onto. Spreading them on the <tr> made
      // it focusable in conflict with its checkbox/links AND violated the
      // tbody[role=rowgroup] children contract. Attach them to the drag handle
      // alongside the keyboard listeners — that is the element users actually
      // grab to reorder.
      dragHandleProps={{ ...attributes, ...listeners }}
      renderCell={renderCell}
      renderAppend={renderAppend}
      hasAppendColumn={hasAppendColumn}
      onClick={onClick}
      onSelect={onSelect}
    />
  );
};

/**
 * VTable - Dynamic table component
 */
export const VTable: React.FC<VTableProps> = ({
  headers: headersProp,
  items,
  itemKey = "id",
  sort: sortProp,
  mustSort = false,
  showSelect = "none",
  showResize = false,
  showManualSort = false,
  manualSortKey,
  allowHeaderReorder = false,
  value = [],
  fixedHeader = false,
  loading = false,
  loadingText = "Loading...",
  noItemsText = "No records to show",
  rowHeight = 48,
  selectionUseKeys = false,
  inline = false,
  disabled = false,
  clickable = true,
  className,
  renderCell,
  renderHeader,
  renderRowAppend,
  renderHeaderAppend,
  renderHeaderContextMenu,
  renderFooter,
  onUpdate,
  onSortChange,
  onHeaderContextMenu,
  onHeadersChange,
  onItemsChange,
  onRowClick,
  onItemSelected,
  onManualSort,
}) => {
  // Local reordering state
  const [reordering, setReordering] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  // Apply defaults to headers
  const internalHeaders = useMemo<Header[]>(() => {
    return headersProp.map((header) => ({
      ...HeaderDefaults,
      ...header,
      width: header.width && header.width < 24 ? 24 : header.width ?? null,
    })) as Header[];
  }, [headersProp]);

  // Internal sort state (fallback if not controlled)
  const internalSort = useMemo<Sort>(() => {
    return sortProp ?? { by: null, desc: false };
  }, [sortProp]);

  // Default per-column widths (px) for content columns by field key.
  // table-layout:fixed reads widths from the <colgroup>; a column with an
  // explicit header.width uses that, otherwise falls back to a sensible
  // default based on the field key, else a generic default.
  const DEFAULT_COL_WIDTH = 150;
  const COL_WIDTH_BY_KEY: Record<string, number> = {
    batch_number: 170,
    material_id: 170,
    material: 170,
    batch_type: 120,
    qty: 90,
    quantity: 90,
    unit: 80,
    status: 130,
    current_location_id: 140,
    location: 140,
    expiry_date: 150,
    date_created: 170,
    date_updated: 170,
  };

  // Build the list of <col> definitions in the exact render order:
  //   [manual?] [select?] ...content columns... [append?]
  // This guarantees the colgroup column count matches the cells per row.
  const colDefs = useMemo(() => {
    const defs: { key: string; width: number }[] = [];
    if (showManualSort) defs.push({ key: "__manual__", width: 36 });
    if (showSelect !== "none") defs.push({ key: "__select__", width: 36 });
    for (const h of internalHeaders) {
      const w = h.width ?? COL_WIDTH_BY_KEY[h.value] ?? DEFAULT_COL_WIDTH;
      defs.push({ key: h.value, width: w });
    }
    if (renderRowAppend || renderHeaderAppend) {
      defs.push({ key: "__append__", width: 44 });
    }
    return defs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [internalHeaders, showSelect, showManualSort, renderRowAppend, renderHeaderAppend]);

  const tableWidth = useMemo(
    () => colDefs.reduce((total, col) => total + col.width, 0),
    [colDefs],
  );

  // Selection helpers
  const allItemsSelected = useMemo(() => {
    return !loading && items.length > 0 && value.length === items.length;
  }, [loading, items.length, value.length]);

  const someItemsSelected = useMemo(() => {
    return value.length > 0 && !allItemsSelected;
  }, [value.length, allItemsSelected]);

  // Get item key value
  const getItemKey = useCallback(
    (item: Item): string => {
      const keyValue = item[itemKey];
      if (keyValue !== undefined && keyValue !== null) {
        return String(keyValue);
      }
      // Fallback to $index if no key
      if (item.$index !== undefined) {
        return `$index-${item.$index}`;
      }
      return `item-${Math.random()}`;
    },
    [itemKey],
  );

  // Check if item is selected
  const isItemSelected = useCallback(
    (item: Item): boolean => {
      const itemKeyValue = item[itemKey];

      // If the item has no valid PK, fall back to $index-based matching
      if (itemKeyValue === undefined || itemKeyValue === null) {
        if (item.$index !== undefined) {
          const fallbackKey = `$index-${item.$index}`;
          return value.some((selected) => {
            if (typeof selected === "object" && selected !== null) {
              const selKey = (selected as Item)[itemKey];
              if (selKey === undefined || selKey === null) {
                return (selected as Item).$index === item.$index;
              }
            }
            return selected === fallbackKey;
          });
        }
        return false;
      }

      if (selectionUseKeys) {
        return value.includes(itemKeyValue);
      }

      // Check by key match
      return value.some((selected) => {
        if (typeof selected === "object" && selected !== null) {
          return (selected as Item)[itemKey] === itemKeyValue;
        }
        return selected === itemKeyValue;
      });
    },
    [value, itemKey, selectionUseKeys],
  );

  // Handle item selection
  const handleItemSelected = useCallback(
    (item: Item, selected: boolean) => {
      if (disabled) return;

      onItemSelected?.({ value: selected, item });

      let newSelection = [...value];

      if (selected) {
        if (selectionUseKeys) {
          newSelection.push(item[itemKey]);
        } else {
          newSelection.push(item);
        }
      } else {
        const itemKeyValue = item[itemKey];
        newSelection = newSelection.filter((sel) => {
          if (selectionUseKeys) {
            return sel !== itemKeyValue;
          }
          if (typeof sel === "object" && sel !== null) {
            return (sel as Item)[itemKey] !== itemKeyValue;
          }
          return sel !== itemKeyValue;
        });
      }

      // For single selection, keep only the last selected
      if (showSelect === "one") {
        newSelection = newSelection.slice(-1);
      }

      onUpdate?.(newSelection);
    },
    [
      disabled,
      value,
      itemKey,
      selectionUseKeys,
      showSelect,
      onItemSelected,
      onUpdate,
    ],
  );

  // Handle select all toggle
  const handleToggleSelectAll = useCallback(
    (selectAll: boolean) => {
      if (disabled) return;

      if (selectAll) {
        if (selectionUseKeys) {
          onUpdate?.(items.map((item) => item[itemKey]));
        } else {
          onUpdate?.([...items]);
        }
      } else {
        onUpdate?.([]);
      }
    },
    [disabled, items, itemKey, selectionUseKeys, onUpdate],
  );

  // Handle sort change
  const handleSortChange = useCallback(
    (newSort: Sort) => {
      onSortChange?.(newSort.by ? newSort : null);
    },
    [onSortChange],
  );

  // Handle headers change (resize/reorder)
  const handleHeadersChange = useCallback(
    (newHeaders: Header[]) => {
      // Return only non-default values
      const rawHeaders = newHeaders.map((header) => {
        const result: HeaderRaw = { text: header.text, value: header.value };
        if (header.align !== "left") result.align = header.align;
        if (!header.sortable) result.sortable = header.sortable;
        if (header.width) result.width = header.width;
        if (header.description) result.description = header.description;
        return result;
      });
      onHeadersChange?.(rawHeaders);
    },
    [onHeadersChange],
  );

  // DnD sensors for manual sort
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Handle drag end for manual sort
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id) {
        const oldIndex = items.findIndex(
          (item) => getItemKey(item) === active.id,
        );
        const newIndex = items.findIndex(
          (item) => getItemKey(item) === over.id,
        );

        if (oldIndex !== -1 && newIndex !== -1) {
          const newItems = arrayMove(items, oldIndex, newIndex);
          onItemsChange?.(newItems);

          onManualSort?.({
            item: items[oldIndex][itemKey],
            to: items[newIndex][itemKey],
          });
        }
      }
    },
    [items, itemKey, getItemKey, onItemsChange, onManualSort],
  );

  // Row click handler
  const handleRowClick = useCallback(
    (item: Item, event: React.MouseEvent) => {
      if (disabled || !clickable) return;
      onRowClick?.({ item, event });
    },
    [disabled, clickable, onRowClick],
  );

  // Item IDs for sortable context
  const itemIds = useMemo(() => {
    return items.map((item) => getItemKey(item));
  }, [items, getItemKey]);

  const tableClasses = [
    "v-table",
    loading && "loading",
    inline && "inline",
    disabled && "disabled",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  // Render table content - separate from DndContext wrapper
  const renderTableContent = () => (
    <div
      ref={tableRef}
      className={tableClasses}
    >
      <table
        summary={internalHeaders.map((h) => h.text).join(", ")}
        style={{ width: `${tableWidth}px`, minWidth: "100%" }}
      >
        <colgroup>
          {colDefs.map((c) => (
            <col key={c.key} style={{ width: `${c.width}px` }} />
          ))}
        </colgroup>
        <TableHeader
          headers={internalHeaders}
          sort={internalSort}
          reordering={reordering}
          allowHeaderReorder={allowHeaderReorder}
          showSelect={disabled ? "none" : showSelect}
          showResize={showResize}
          showManualSort={showManualSort}
          someItemsSelected={someItemsSelected}
          allItemsSelected={allItemsSelected}
          fixed={fixedHeader}
          mustSort={mustSort}
          hasItemAppendSlot={!!renderRowAppend}
          manualSortKey={manualSortKey}
          renderHeader={renderHeader}
          renderHeaderAppend={renderHeaderAppend}
          renderHeaderContextMenu={renderHeaderContextMenu}
          onSortChange={handleSortChange}
          onToggleSelectAll={handleToggleSelectAll}
          onHeadersChange={handleHeadersChange}
          onReorderingChange={setReordering}
          onHeaderContextMenu={onHeaderContextMenu}
        />

        {/* Loading Indicator */}
        {loading && (
          <thead className={fixedHeader ? "sticky" : ""} aria-hidden="true">
            <tr className="loading-indicator">
              <th colSpan={colDefs.length || 1}>
                <div className="progress-bar" />
              </th>
            </tr>
          </thead>
        )}

        {/* Loading State */}
        {loading && items.length === 0 && (
          <tbody role="rowgroup" aria-busy="true">
            <tr className="loading-text">
              <td colSpan={colDefs.length || 1}>
                <Stack gap="xs" py="md">
                  <Text c="dimmed" ta="center" size="sm">
                    {loadingText}
                  </Text>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} height={rowHeight} />
                  ))}
                </Stack>
              </td>
            </tr>
          </tbody>
        )}

        {/* Empty State */}
        {!loading && items.length === 0 && (
          <tbody role="rowgroup">
            <tr className="no-items-text">
              <td colSpan={colDefs.length || 1}>
                <Text c="dimmed" ta="center" py="xl">
                  {noItemsText}
                </Text>
              </td>
            </tr>
          </tbody>
        )}

        {/* Data Rows */}
        {items.length > 0 && (
          showManualSort ? (
            // Manual sort active — use dnd-kit SortableContext + SortableTableRow
            <SortableContext
              items={itemIds}
              strategy={verticalListSortingStrategy}
            >
              <tbody role="rowgroup">
                {items.map((item) => {
                  const id = getItemKey(item);
                  return (
                    <SortableTableRow
                      key={id}
                      id={id}
                      item={item}
                      headers={internalHeaders}
                      showSelect={disabled ? "none" : showSelect}
                      showManualSort={!disabled && showManualSort}
                      isSelected={isItemSelected(item)}
                      subdued={loading || reordering}
                      sortedManually={internalSort.by === manualSortKey}
                      hasClickListener={!disabled && clickable}
                      rowHeight={rowHeight}
                      disabled={disabled || internalSort.by !== manualSortKey}
                      renderCell={renderCell}
                      renderAppend={renderRowAppend}
                      hasAppendColumn={!!(renderRowAppend || renderHeaderAppend)}
                      onClick={(e) => handleRowClick(item, e)}
                      onSelect={() =>
                        handleItemSelected(item, !isItemSelected(item))
                      }
                    />
                  );
                })}
              </tbody>
            </SortableContext>
          ) : (
            // No manual sort — plain tbody with TableRow, no dnd-kit hooks
            <tbody role="rowgroup">
              {items.map((item) => {
                const id = getItemKey(item);
                return (
                  <TableRow
                    key={id}
                    item={item}
                    headers={internalHeaders}
                    showSelect={disabled ? "none" : showSelect}
                    showManualSort={false}
                    isSelected={isItemSelected(item)}
                    subdued={loading || reordering}
                    sortedManually={false}
                    hasClickListener={!disabled && clickable}
                    height={rowHeight}
                    renderCell={renderCell}
                    renderAppend={renderRowAppend}
                    hasAppendColumn={!!(renderRowAppend || renderHeaderAppend)}
                    onClick={(e) => handleRowClick(item, e)}
                    onSelect={() =>
                      handleItemSelected(item, !isItemSelected(item))
                    }
                  />
                );
              })}
            </tbody>
          )
        )}
      </table>

      {/* Footer */}
      {renderFooter?.()}
    </div>
  );

  // Wrap in DndContext if manual sort is enabled
  if (showManualSort && items.length > 0) {
    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        {renderTableContent()}
      </DndContext>
    );
  }

  return renderTableContent();
};

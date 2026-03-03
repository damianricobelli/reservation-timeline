export function areAllItemsSelected(
  selectedIds: readonly string[],
  totalItems: number,
) {
  if (totalItems === 0) return false;
  return selectedIds.length === 0 || selectedIds.length === totalItems;
}

export function normalizeSelectionForQuery<Id extends string>(
  selectedIds: readonly Id[],
  allIds: readonly Id[],
): Id[] {
  if (allIds.length === 0) {
    return [];
  }

  if (selectedIds.length === 0) {
    return [];
  }

  const selectedSet = new Set(selectedIds);
  const normalized = allIds.filter((id) => selectedSet.has(id));

  if (normalized.length === 0 || normalized.length === allIds.length) {
    return [];
  }

  return normalized;
}

export function nextItemSelection<Id extends string>(
  selectedIds: readonly Id[],
  allIds: readonly Id[],
  itemId: Id,
  nextChecked: boolean,
) {
  const allSelected = areAllItemsSelected(selectedIds, allIds.length);
  const next = new Set(allSelected ? allIds : selectedIds);

  if (nextChecked) {
    next.add(itemId);
  } else {
    next.delete(itemId);
  }

  if (next.size === 0 || next.size === allIds.length) {
    return [];
  }

  return allIds.filter((id) => next.has(id));
}

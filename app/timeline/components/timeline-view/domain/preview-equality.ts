type ReservationPreviewLike = {
  reservation: {
    tableId: string;
    startTime: string;
    endTime: string;
  };
  valid: boolean;
  reason?: string;
};

type CreatePreviewLike = ReservationPreviewLike & {
  dateKey: string;
  table: {
    id: string;
  };
};

type RowTargetLike = {
  dateKey: string;
  tableId: string;
};

export function isReservationPreviewEqual(
  previous: ReservationPreviewLike,
  next: ReservationPreviewLike,
) {
  return (
    previous.reservation.tableId === next.reservation.tableId &&
    previous.reservation.startTime === next.reservation.startTime &&
    previous.reservation.endTime === next.reservation.endTime &&
    previous.valid === next.valid &&
    previous.reason === next.reason
  );
}

export function isCreatePreviewEqual(
  previous: CreatePreviewLike,
  next: CreatePreviewLike,
) {
  return (
    isReservationPreviewEqual(previous, next) &&
    previous.dateKey === next.dateKey &&
    previous.table.id === next.table.id
  );
}

export function isRowTargetEqual(previous: RowTargetLike, next: RowTargetLike) {
  return previous.dateKey === next.dateKey && previous.tableId === next.tableId;
}

/** Hai quyền macOS cần cho Lane A/B — xem ADR-0010. */
export type PermissionStatus = { accessibility: boolean; screenRecording: boolean };
export type PermissionKind = keyof PermissionStatus;

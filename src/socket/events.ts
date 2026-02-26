/**
 * Socket event names. Keep in sync with live_bhoomi_ui/src/socket/events.ts
 */

/** Rooms: client emits to join/leave. */
export const SOCKET_JOIN_ROOM = "joinRoom"
export const SOCKET_LEAVE_ROOM = "leaveRoom"

/** Live DB updates: server emits (e.g. from routes/services). */
export const SOCKET_LIVE_UPDATE = "live:update"

/** Chat: client emits message/typing; server broadcasts to room. */
export const SOCKET_MESSAGE = "message"
export const SOCKET_TYPING = "typing"

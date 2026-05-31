export type NexusEventType = "success" | "warning" | "info" | "processing" | "system";

export interface NexusEvent {
  type: NexusEventType;
  agent: string;
  message: string;
  detail?: string;
}

export function emitNexusEvent(event: NexusEvent) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("nexus-event", { detail: event }));
}

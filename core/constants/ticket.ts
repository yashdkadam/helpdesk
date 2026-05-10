export enum TicketStatus {
  new = "new",
  processing = "processing",
  open = "open",
  resolved = "resolved",
  closed = "closed",
  auto_resolved = "auto_resolved",
}

export enum TicketCategory {
  general_question = "general_question",
  technical_question = "technical_question",
  refund_request = "refund_request",
}

export const categoryLabel: Record<TicketCategory, string> = {
  [TicketCategory.general_question]: "General Question",
  [TicketCategory.technical_question]: "Technical Question",
  [TicketCategory.refund_request]: "Refund Request",
};

export const ReplySenderType = { agent: "agent", customer: "customer" } as const;
export type ReplySenderTypeValue = (typeof ReplySenderType)[keyof typeof ReplySenderType];

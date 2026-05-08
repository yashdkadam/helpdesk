export enum TicketStatus {
  new = "new",
  processing = "processing",
  open = "open",
  resolved = "resolved",
  closed = "closed",
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

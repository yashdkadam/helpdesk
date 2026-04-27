export type TicketStatus = "new" | "processing" | "open" | "resolved" | "closed";
export type TicketCategory =
  | "general_question"
  | "technical_question"
  | "refund_request";

export const categoryLabel: Record<TicketCategory, string> = {
  general_question: "General Question",
  technical_question: "Technical Question",
  refund_request: "Refund Request",
};

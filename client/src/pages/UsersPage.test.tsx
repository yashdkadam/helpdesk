import { screen, waitFor, fireEvent } from "@testing-library/react";
import axios from "axios";
import { vi, describe, test, expect, beforeEach } from "vitest";
import UsersPage from "./UsersPage";
import { renderWithQuery } from "@/test/render";

vi.mock("axios");

const USERS = [
  {
    id: "1",
    name: "Alice Admin",
    email: "alice@example.com",
    role: "admin" as const,
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    name: "Bob Agent",
    email: "bob@example.com",
    role: "agent" as const,
    createdAt: new Date("2024-03-20"),
  },
];

describe("UsersPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("renders the page heading", async () => {
    vi.mocked(axios, { deep: true }).get.mockResolvedValue({ data: { users: [] } });
    renderWithQuery(<UsersPage />);
    expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
  });

  test("shows 5 skeleton rows while the request is in-flight", () => {
    vi.mocked(axios, { deep: true }).get.mockReturnValue(new Promise(() => {}));
    renderWithQuery(<UsersPage />);
    expect(document.querySelectorAll("tbody tr")).toHaveLength(5);
  });

  test("renders column headers", async () => {
    vi.mocked(axios, { deep: true }).get.mockResolvedValue({ data: { users: [] } });
    renderWithQuery(<UsersPage />);
    await waitFor(() =>
      expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument()
    );
    expect(screen.getByRole("columnheader", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Role" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Joined" })).toBeInTheDocument();
  });

  test("renders a row for each user", async () => {
    vi.mocked(axios, { deep: true }).get.mockResolvedValue({ data: { users: USERS } });
    renderWithQuery(<UsersPage />);
    await waitFor(() =>
      expect(screen.getByText("Alice Admin")).toBeInTheDocument()
    );
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Bob Agent")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
  });

  test("displays the correct joined date for each user", async () => {
    vi.mocked(axios, { deep: true }).get.mockResolvedValue({ data: { users: USERS } });
    renderWithQuery(<UsersPage />);
    await waitFor(() =>
      expect(screen.getByText("Alice Admin")).toBeInTheDocument()
    );
    expect(
      screen.getByText(new Date("2024-01-15").toLocaleDateString())
    ).toBeInTheDocument();
    expect(
      screen.getByText(new Date("2024-03-20").toLocaleDateString())
    ).toBeInTheDocument();
  });

  test("renders role badges with correct labels", async () => {
    vi.mocked(axios, { deep: true }).get.mockResolvedValue({ data: { users: USERS } });
    renderWithQuery(<UsersPage />);
    await waitFor(() =>
      expect(screen.getByText("admin")).toBeInTheDocument()
    );
    expect(screen.getByText("agent")).toBeInTheDocument();
  });

  test("renders only the header row when users list is empty", async () => {
    vi.mocked(axios, { deep: true }).get.mockResolvedValue({ data: { users: [] } });
    renderWithQuery(<UsersPage />);
    // Wait for skeleton to disappear — confirms we're in the loaded state, not pending
    await waitFor(() =>
      expect(document.querySelectorAll(".animate-pulse")).toHaveLength(0)
    );
    expect(document.querySelectorAll("tbody tr")).toHaveLength(0);
  });

  test("shows an error alert when the request fails", async () => {
    vi.mocked(axios, { deep: true }).get.mockRejectedValue(new Error("Network error"));
    renderWithQuery(<UsersPage />);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toBeInTheDocument()
    );
  });

  test("shows the create user dialog when 'New User' is clicked", () => {
    vi.mocked(axios, { deep: true }).get.mockResolvedValue({ data: { users: [] } });
    renderWithQuery(<UsersPage />);

    fireEvent.click(screen.getByRole("button", { name: "New User" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  test("hides the dialog when Escape is pressed", async () => {
    vi.mocked(axios, { deep: true }).get.mockResolvedValue({ data: { users: [] } });
    renderWithQuery(<UsersPage />);

    fireEvent.click(screen.getByRole("button", { name: "New User" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fireEvent.keyDown(document.body, { key: "Escape" });

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    );
  });

});

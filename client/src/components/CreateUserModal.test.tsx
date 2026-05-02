import { screen, waitFor, fireEvent } from "@testing-library/react";
import axios from "axios";
import { vi, describe, test, expect, beforeEach } from "vitest";
import CreateUserModal from "./CreateUserModal";
import { renderWithQuery } from "@/test/render";

vi.mock("axios");

const onClose = vi.fn();

function renderModal(open = true) {
  return renderWithQuery(<CreateUserModal open={open} onClose={onClose} />);
}

function fillForm(name: string, email: string, password: string) {
  fireEvent.change(screen.getByLabelText("Name"), { target: { value: name } });
  fireEvent.change(screen.getByLabelText("Email"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Password"), { target: { value: password } });
}

describe("CreateUserModal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("is not rendered when closed", () => {
    renderModal(false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("renders name, email, and password fields", () => {
    renderModal();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
  });

  test("shows a validation error when name is too short", async () => {
    renderModal();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "ab" } });
    fireEvent.click(screen.getByRole("button", { name: "Create User" }));
    await waitFor(() =>
      expect(screen.getByText("Name must be at least 3 characters")).toBeInTheDocument()
    );
  });

  test("shows a validation error when email is invalid", async () => {
    renderModal();
    fillForm("Valid Name", "not-an-email", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Create User" }));
    await waitFor(() =>
      expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true")
    );
  });

  test("shows a validation error when password is too short", async () => {
    renderModal();
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "short" } });
    fireEvent.click(screen.getByRole("button", { name: "Create User" }));
    await waitFor(() =>
      expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument()
    );
  });

  test("submits valid data to the API", async () => {
    vi.mocked(axios, { deep: true }).post.mockResolvedValue({ data: {} });
    renderModal();
    fillForm("Alice Admin", "alice@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Create User" }));
    await waitFor(() =>
      expect(vi.mocked(axios, { deep: true }).post).toHaveBeenCalledWith("/api/users", {
        name: "Alice Admin",
        email: "alice@example.com",
        password: "password123",
      })
    );
  });

  test("disables the submit button and shows 'Creating...' while submitting", async () => {
    vi.mocked(axios, { deep: true }).post.mockReturnValue(new Promise(() => {}));
    renderModal();
    fillForm("Alice Admin", "alice@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Create User" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Creating..." })).toBeDisabled()
    );
  });

  test("shows an error alert when the request fails", async () => {
    vi.mocked(axios, { deep: true }).post.mockRejectedValue(new Error("Server error"));
    renderModal();
    fillForm("Alice Admin", "alice@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Create User" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toBeInTheDocument()
    );
  });

  test("calls onClose after successful submission", async () => {
    vi.mocked(axios, { deep: true }).post.mockResolvedValue({ data: {} });
    renderModal();
    fillForm("Alice Admin", "alice@example.com", "password123");
    fireEvent.click(screen.getByRole("button", { name: "Create User" }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  test("calls onClose when Cancel is clicked", () => {
    renderModal();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalled();
  });
});

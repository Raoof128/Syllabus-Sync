import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ExportDataDialog } from "@/features/settings/components/privacy/ExportDataDialog";
import { vi, describe, it, expect } from "vitest";

// Mock useDataExport hook
const mockExportData = vi.fn();
vi.mock("@/lib/hooks/useDataExport", () => ({
  useDataExport: () => ({
    exportData: mockExportData,
  }),
}));

describe("ExportDataDialog", () => {
  const mockT = (key: string) => key;
  const mockOnOpenChange = vi.fn();

  it("renders correctly when open", () => {
    render(
      <ExportDataDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        t={mockT}
        language="en"
      />,
    );
    expect(screen.getByTestId("export-dialog")).toBeInTheDocument();
    expect(screen.getByText("confirmExport")).toBeInTheDocument();
  });

  it("calls exportData when confirm button is clicked", async () => {
    // Reset mock before test
    mockExportData.mockClear();

    render(
      <ExportDataDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        t={mockT}
        language="en"
      />,
    );

    const confirmButton = screen.getByTestId("confirm-export-button");
    fireEvent.click(confirmButton);

    expect(mockExportData).toHaveBeenCalledTimes(1);
    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });

  it("closes dialog when cancel is clicked", () => {
    render(
      <ExportDataDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        t={mockT}
        language="en"
      />,
    );

    const cancelButton = screen.getByText("cancel");
    fireEvent.click(cancelButton);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ImageManager from "./ImageManager";
import * as portfolioService from "../services/portfolioService";

describe("ImageManager Component", () => {
  const mockCategories = [
    {
      id: 1,
      name_cs: "Svatební líčení",
      slug: "svatebni-liceni",
      display_order: 1,
      created_at: new Date(),
    },
    {
      id: 2,
      name_cs: "Líčení na plesy a večírky",
      slug: "liceni-na-plesy-a-vecirky",
      display_order: 2,
      created_at: new Date(),
    },
  ];

  const mockImages = [
    {
      id: 1,
      category_id: 1,
      filename: "image1.jpg",
      original_filename: "wedding1.jpg",
      file_path: "/uploads/svatebni-liceni/image1.jpg",
      file_size: 100000,
      mime_type: "image/jpeg",
      uploaded_by: 1,
      uploaded_at: new Date(),
      display_order: 0,
    },
    {
      id: 2,
      category_id: 1,
      filename: "image2.jpg",
      original_filename: "wedding2.jpg",
      file_path: "/uploads/svatebni-liceni/image2.jpg",
      file_size: 150000,
      mime_type: "image/jpeg",
      uploaded_by: 1,
      uploaded_at: new Date(),
      display_order: 1,
    },
    {
      id: 3,
      category_id: 2,
      filename: "image3.jpg",
      original_filename: "party1.jpg",
      file_path: "/uploads/liceni-na-plesy-a-vecirky/image3.jpg",
      file_size: 120000,
      mime_type: "image/jpeg",
      uploaded_by: 1,
      uploaded_at: new Date(),
      display_order: 0,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage for authentication
    Storage.prototype.getItem = vi.fn(() => "mock-token");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should display all images", async () => {
    vi.spyOn(portfolioService, "fetchCategories").mockResolvedValue(
      mockCategories
    );
    vi.spyOn(portfolioService, "fetchAllImages").mockResolvedValue(mockImages);

    render(<ImageManager />);

    // Wait for images to load
    await waitFor(() => {
      expect(screen.getByText("wedding1.jpg")).toBeInTheDocument();
      expect(screen.getByText("wedding2.jpg")).toBeInTheDocument();
      expect(screen.getByText("party1.jpg")).toBeInTheDocument();
    });

    // Verify all images are displayed
    const images = screen.getAllByRole("img");
    expect(images.length).toBe(3);
  });

  it("should display images organized by category", async () => {
    vi.spyOn(portfolioService, "fetchCategories").mockResolvedValue(
      mockCategories
    );
    vi.spyOn(portfolioService, "fetchAllImages").mockResolvedValue(mockImages);

    render(<ImageManager />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText(/Svatební líčení/)).toBeInTheDocument();
      expect(screen.getByText(/Líčení na plesy a večírky/)).toBeInTheDocument();
    });

    // Verify category titles show image counts
    expect(screen.getByText(/Svatební líčení \(2\)/)).toBeInTheDocument();
    expect(
      screen.getByText(/Líčení na plesy a večírky \(1\)/)
    ).toBeInTheDocument();
  });

  it("should have delete button for each image", async () => {
    vi.spyOn(portfolioService, "fetchCategories").mockResolvedValue(
      mockCategories
    );
    vi.spyOn(portfolioService, "fetchAllImages").mockResolvedValue(mockImages);

    render(<ImageManager />);

    // Wait for images to load
    await waitFor(() => {
      const deleteButtons = screen.getAllByRole("button", { name: /smazat/i });
      expect(deleteButtons.length).toBe(3);
    });

    // Verify all delete buttons are enabled
    const deleteButtons = screen.getAllByRole("button", { name: /smazat/i });
    deleteButtons.forEach((button) => {
      expect(button).toBeEnabled();
    });
  });

  it("should show confirmation dialog when delete button is clicked", async () => {
    vi.spyOn(portfolioService, "fetchCategories").mockResolvedValue(
      mockCategories
    );
    vi.spyOn(portfolioService, "fetchAllImages").mockResolvedValue(mockImages);

    render(<ImageManager />);

    // Wait for images to load
    await waitFor(() => {
      expect(screen.getByText("wedding1.jpg")).toBeInTheDocument();
    });

    // Click the first delete button
    const deleteButtons = screen.getAllByRole("button", { name: /smazat/i });
    fireEvent.click(deleteButtons[0]);

    // Verify confirmation dialog appears
    await waitFor(() => {
      expect(screen.getByText("Potvrdit smazání")).toBeInTheDocument();
      expect(
        screen.getByText(/Opravdu chcete smazat obrázek/)
      ).toBeInTheDocument();
      expect(screen.getByText(/Ano, smazat/)).toBeInTheDocument();
      expect(screen.getByText(/Zrušit/)).toBeInTheDocument();
    });
  });

  it("should remove image from UI after successful deletion", async () => {
    vi.spyOn(portfolioService, "fetchCategories").mockResolvedValue(
      mockCategories
    );
    vi.spyOn(portfolioService, "fetchAllImages").mockResolvedValue(mockImages);
    const deleteImageSpy = vi
      .spyOn(portfolioService, "deleteImage")
      .mockResolvedValue({
        success: true,
        message: "Obrázek byl úspěšně smazán",
      });

    render(<ImageManager />);

    // Wait for images to load
    await waitFor(() => {
      expect(screen.getByText("wedding1.jpg")).toBeInTheDocument();
    });

    // Click the first delete button
    const deleteButtons = screen.getAllByRole("button", { name: /smazat/i });
    fireEvent.click(deleteButtons[0]);

    // Wait for confirmation dialog
    await waitFor(() => {
      expect(screen.getByText("Potvrdit smazání")).toBeInTheDocument();
    });

    // Click confirm button
    const confirmButton = screen.getByRole("button", { name: /Ano, smazat/i });
    fireEvent.click(confirmButton);

    // Wait for deletion to complete
    await waitFor(() => {
      expect(deleteImageSpy).toHaveBeenCalledWith(1);
    });

    // Verify image is removed from UI
    await waitFor(() => {
      expect(screen.queryByText("wedding1.jpg")).not.toBeInTheDocument();
    });

    // Verify other images are still present
    expect(screen.getByText("wedding2.jpg")).toBeInTheDocument();
    expect(screen.getByText("party1.jpg")).toBeInTheDocument();
  });

  it("should display success message in Czech after deletion", async () => {
    vi.spyOn(portfolioService, "fetchCategories").mockResolvedValue(
      mockCategories
    );
    vi.spyOn(portfolioService, "fetchAllImages").mockResolvedValue(mockImages);
    vi.spyOn(portfolioService, "deleteImage").mockResolvedValue({
      success: true,
      message: "Obrázek byl úspěšně smazán",
    });

    render(<ImageManager />);

    // Wait for images to load
    await waitFor(() => {
      expect(screen.getByText("wedding1.jpg")).toBeInTheDocument();
    });

    // Click delete and confirm
    const deleteButtons = screen.getAllByRole("button", { name: /smazat/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Potvrdit smazání")).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", { name: /Ano, smazat/i });
    fireEvent.click(confirmButton);

    // Verify success message is displayed in Czech
    await waitFor(() => {
      expect(
        screen.getByText("Obrázek byl úspěšně smazán")
      ).toBeInTheDocument();
    });
  });

  it("should display error message in Czech if deletion fails", async () => {
    vi.spyOn(portfolioService, "fetchCategories").mockResolvedValue(
      mockCategories
    );
    vi.spyOn(portfolioService, "fetchAllImages").mockResolvedValue(mockImages);
    vi.spyOn(portfolioService, "deleteImage").mockRejectedValue(
      new Error("Mazání obrázku selhalo")
    );

    render(<ImageManager />);

    // Wait for images to load
    await waitFor(() => {
      expect(screen.getByText("wedding1.jpg")).toBeInTheDocument();
    });

    // Click delete and confirm
    const deleteButtons = screen.getAllByRole("button", { name: /smazat/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Potvrdit smazání")).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", { name: /Ano, smazat/i });
    fireEvent.click(confirmButton);

    // Verify error message is displayed in Czech
    await waitFor(() => {
      expect(screen.getByText("Mazání obrázku selhalo")).toBeInTheDocument();
    });
  });

  it("should close confirmation dialog when cancel is clicked", async () => {
    vi.spyOn(portfolioService, "fetchCategories").mockResolvedValue(
      mockCategories
    );
    vi.spyOn(portfolioService, "fetchAllImages").mockResolvedValue(mockImages);

    render(<ImageManager />);

    // Wait for images to load
    await waitFor(() => {
      expect(screen.getByText("wedding1.jpg")).toBeInTheDocument();
    });

    // Click delete button
    const deleteButtons = screen.getAllByRole("button", { name: /smazat/i });
    fireEvent.click(deleteButtons[0]);

    // Wait for confirmation dialog
    await waitFor(() => {
      expect(screen.getByText("Potvrdit smazání")).toBeInTheDocument();
    });

    // Click cancel button
    const cancelButton = screen.getByRole("button", { name: /Zrušit/i });
    fireEvent.click(cancelButton);

    // Verify dialog is closed
    await waitFor(() => {
      expect(screen.queryByText("Potvrdit smazání")).not.toBeInTheDocument();
    });

    // Verify image is still present
    expect(screen.getByText("wedding1.jpg")).toBeInTheDocument();
  });

  it("should display empty message when no images exist", async () => {
    vi.spyOn(portfolioService, "fetchCategories").mockResolvedValue(
      mockCategories
    );
    vi.spyOn(portfolioService, "fetchAllImages").mockResolvedValue([]);

    render(<ImageManager />);

    // Wait for empty message
    await waitFor(() => {
      expect(screen.getByText("Žádné obrázky k zobrazení")).toBeInTheDocument();
    });
  });

  it("should display loading state while fetching data", () => {
    vi.spyOn(portfolioService, "fetchCategories").mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    vi.spyOn(portfolioService, "fetchAllImages").mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<ImageManager />);

    // Verify loading message is displayed
    expect(screen.getByText("Načítání obrázků...")).toBeInTheDocument();
  });

  it("should display error message when data loading fails", async () => {
    vi.spyOn(portfolioService, "fetchCategories").mockRejectedValue(
      new Error("Chyba při načítání dat")
    );
    vi.spyOn(portfolioService, "fetchAllImages").mockRejectedValue(
      new Error("Chyba při načítání dat")
    );

    render(<ImageManager />);

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText("Chyba při načítání dat")).toBeInTheDocument();
    });
  });
});

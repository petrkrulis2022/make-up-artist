import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import * as fc from "fast-check";
import ImageGallery from "../../components/ImageGallery";
import * as portfolioService from "../../services/portfolioService";

// Feature: makeup-artist-website, Property 3: Category-based image filtering
// For any portfolio category selection, the displayed images should only include images associated with that specific category from the database
// Validates: Requirements 3.2, 3.3

describe("Property 3: Category-based image filtering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should display only images belonging to the selected category", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random category IDs and image sets
        fc.record({
          categoryId: fc.integer({ min: 1, max: 4 }),
          images: fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 10000 }),
              category_id: fc.integer({ min: 1, max: 4 }),
              filename: fc
                .string({ minLength: 5, maxLength: 20 })
                .map((s) => `${s.replace(/[^a-zA-Z0-9]/g, "_")}.jpg`),
              original_filename: fc.string({ minLength: 5, maxLength: 20 }),
              file_path: fc
                .string({ minLength: 5, maxLength: 20 })
                .map((s) => `/uploads/${s.replace(/[^a-zA-Z0-9]/g, "_")}.jpg`),
              file_size: fc.integer({ min: 1000, max: 5000000 }),
              mime_type: fc.constantFrom(
                "image/jpeg",
                "image/png",
                "image/webp"
              ),
              uploaded_by: fc.integer({ min: 1, max: 100 }),
              uploaded_at: fc.date(),
              display_order: fc.integer({ min: 0, max: 100 }),
            }),
            { minLength: 0, maxLength: 10 }
          ),
        }),
        async ({ categoryId, images }) => {
          // Filter images to only include those matching the selected category
          const filteredImages = images.filter(
            (img) => img.category_id === categoryId
          );

          // Mock the API call to return filtered images
          const fetchSpy = vi
            .spyOn(portfolioService, "fetchImagesByCategory")
            .mockResolvedValue(filteredImages);

          const { unmount } = render(<ImageGallery categoryId={categoryId} />);

          // Wait for images to load
          await waitFor(
            () => {
              expect(fetchSpy).toHaveBeenCalledWith(categoryId);
            },
            { timeout: 3000 }
          );

          if (filteredImages.length === 0) {
            // Verify empty message is displayed
            await waitFor(
              () => {
                const emptyMessage = screen.getByText("Žádné obrázky");
                expect(emptyMessage).toBeInTheDocument();
              },
              { timeout: 3000 }
            );
          } else {
            // Verify all displayed images belong to the selected category
            await waitFor(
              () => {
                const displayedImages = screen.getAllByRole("img");
                expect(displayedImages.length).toBe(filteredImages.length);

                // Verify each image src corresponds to a filtered image
                displayedImages.forEach((imgElement) => {
                  const src = imgElement.getAttribute("src");
                  const matchingImage = filteredImages.find((img) =>
                    src.includes(img.file_path)
                  );
                  expect(matchingImage).toBeDefined();
                  expect(matchingImage.category_id).toBe(categoryId);
                });
              },
              { timeout: 3000 }
            );
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should not display images from other categories", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          selectedCategoryId: fc.integer({ min: 1, max: 4 }),
          allImages: fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 10000 }),
              category_id: fc.integer({ min: 1, max: 4 }),
              filename: fc
                .string({ minLength: 5, maxLength: 20 })
                .map((s) => `${s.replace(/[^a-zA-Z0-9]/g, "_")}.jpg`),
              original_filename: fc.string({ minLength: 5, maxLength: 20 }),
              file_path: fc
                .string({ minLength: 5, maxLength: 20 })
                .map((s) => `/uploads/${s.replace(/[^a-zA-Z0-9]/g, "_")}.jpg`),
              file_size: fc.integer({ min: 1000, max: 5000000 }),
              mime_type: fc.constantFrom(
                "image/jpeg",
                "image/png",
                "image/webp"
              ),
              uploaded_by: fc.integer({ min: 1, max: 100 }),
              uploaded_at: fc.date(),
              display_order: fc.integer({ min: 0, max: 100 }),
            }),
            { minLength: 5, maxLength: 15 }
          ),
        }),
        async ({ selectedCategoryId, allImages }) => {
          // Filter to get images for selected category
          const categoryImages = allImages.filter(
            (img) => img.category_id === selectedCategoryId
          );

          // Get images from other categories
          const otherCategoryImages = allImages.filter(
            (img) => img.category_id !== selectedCategoryId
          );

          // Skip if no images from other categories
          if (otherCategoryImages.length === 0) {
            return;
          }

          // Mock the API to return only images from selected category
          const fetchSpy = vi
            .spyOn(portfolioService, "fetchImagesByCategory")
            .mockResolvedValue(categoryImages);

          const { unmount } = render(
            <ImageGallery categoryId={selectedCategoryId} />
          );

          await waitFor(
            () => {
              expect(fetchSpy).toHaveBeenCalledWith(selectedCategoryId);
            },
            { timeout: 3000 }
          );

          if (categoryImages.length > 0) {
            await waitFor(
              () => {
                const displayedImages = screen.getAllByRole("img");

                // Verify no images from other categories are displayed
                displayedImages.forEach((imgElement) => {
                  const src = imgElement.getAttribute("src");

                  // Check that this image is NOT from another category
                  otherCategoryImages.forEach((otherImg) => {
                    expect(src).not.toContain(otherImg.file_path);
                  });

                  // Verify it IS from the selected category
                  const matchingImage = categoryImages.find((img) =>
                    src.includes(img.file_path)
                  );
                  expect(matchingImage).toBeDefined();
                });
              },
              { timeout: 3000 }
            );
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

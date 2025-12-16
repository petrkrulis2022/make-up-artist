import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import * as fc from "fast-check";
import ImageManager from "../../components/ImageManager";
import * as portfolioService from "../../services/portfolioService";

// Feature: makeup-artist-website, Property 15: Delete option availability
// For any image displayed in the admin management interface, a delete option should be available
// Validates: Requirements 9.1

describe("Property 15: Delete option availability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage for authentication
    Storage.prototype.getItem = vi.fn(() => "mock-token");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should display a delete button for every image in the management interface", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random sets of images and categories
        fc.record({
          categories: fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 4 }),
              name_cs: fc.constantFrom(
                "Svatební líčení",
                "Líčení na plesy a večírky",
                "Slavnostní líčení",
                "Líčení pro focení"
              ),
              slug: fc.constantFrom(
                "svatebni-liceni",
                "liceni-na-plesy-a-vecirky",
                "slavnostni-liceni",
                "liceni-pro-foceni"
              ),
              display_order: fc.integer({ min: 1, max: 4 }),
              created_at: fc.date(),
            }),
            { minLength: 1, maxLength: 4 }
          ),
          images: fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 10000 }),
              category_id: fc.integer({ min: 1, max: 4 }),
              filename: fc
                .string({ minLength: 5, maxLength: 20 })
                .map((s) => `${s.replace(/[^a-zA-Z0-9]/g, "_")}.jpg`),
              original_filename: fc
                .string({ minLength: 5, maxLength: 20 })
                .map((s) => `${s.replace(/[^a-zA-Z0-9]/g, "_")}.jpg`),
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
            { minLength: 1, maxLength: 20 }
          ),
        }),
        async ({ categories, images }) => {
          // Ensure unique category IDs
          const uniqueCategories = Array.from(
            new Map(categories.map((cat) => [cat.id, cat])).values()
          );

          // Mock the API calls
          const fetchCategoriesSpy = vi
            .spyOn(portfolioService, "fetchCategories")
            .mockResolvedValue(uniqueCategories);

          const fetchAllImagesSpy = vi
            .spyOn(portfolioService, "fetchAllImages")
            .mockResolvedValue(images);

          const { unmount } = render(<ImageManager />);

          // Wait for data to load
          await waitFor(
            () => {
              expect(fetchCategoriesSpy).toHaveBeenCalled();
              expect(fetchAllImagesSpy).toHaveBeenCalled();
            },
            { timeout: 3000 }
          );

          // Wait for images to be rendered
          await waitFor(
            () => {
              // Find all delete buttons
              const deleteButtons = screen.getAllByRole("button", {
                name: /smazat/i,
              });

              // Verify that the number of delete buttons equals the number of images
              expect(deleteButtons.length).toBe(images.length);

              // Verify each delete button is enabled and visible
              deleteButtons.forEach((button) => {
                expect(button).toBeInTheDocument();
                expect(button).toBeEnabled();
                expect(button).toBeVisible();
              });
            },
            { timeout: 3000 }
          );

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should provide delete functionality for images across all categories", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          categories: fc
            .array(
              fc.record({
                id: fc.integer({ min: 1, max: 4 }),
                name_cs: fc.constantFrom(
                  "Svatební líčení",
                  "Líčení na plesy a večírky",
                  "Slavnostní líčení",
                  "Líčení pro focení"
                ),
                slug: fc.constantFrom(
                  "svatebni-liceni",
                  "liceni-na-plesy-a-vecirky",
                  "slavnostni-liceni",
                  "liceni-pro-foceni"
                ),
                display_order: fc.integer({ min: 1, max: 4 }),
                created_at: fc.date(),
              }),
              { minLength: 2, maxLength: 4 }
            )
            .map((cats) =>
              Array.from(new Map(cats.map((cat) => [cat.id, cat])).values())
            ),
          imagesPerCategory: fc.integer({ min: 1, max: 5 }),
        }),
        async ({ categories, imagesPerCategory }) => {
          // Create images distributed across all categories
          const images = categories.flatMap((category) =>
            Array.from({ length: imagesPerCategory }, (_, index) => ({
              id: category.id * 1000 + index,
              category_id: category.id,
              filename: `image_${category.id}_${index}.jpg`,
              original_filename: `original_${category.id}_${index}.jpg`,
              file_path: `/uploads/${category.slug}/image_${category.id}_${index}.jpg`,
              file_size: 100000 + index * 1000,
              mime_type: "image/jpeg",
              uploaded_by: 1,
              uploaded_at: new Date(),
              display_order: index,
            }))
          );

          // Mock the API calls
          vi.spyOn(portfolioService, "fetchCategories").mockResolvedValue(
            categories
          );
          vi.spyOn(portfolioService, "fetchAllImages").mockResolvedValue(
            images
          );

          const { unmount } = render(<ImageManager />);

          // Wait for data to load
          await waitFor(
            () => {
              const deleteButtons = screen.getAllByRole("button", {
                name: /smazat/i,
              });
              expect(deleteButtons.length).toBe(images.length);
            },
            { timeout: 3000 }
          );

          // Verify delete buttons exist for each category
          for (const category of categories) {
            const categoryImages = images.filter(
              (img) => img.category_id === category.id
            );

            // Verify category section exists
            await waitFor(
              () => {
                const categoryTitle = screen.getByText(
                  new RegExp(category.name_cs, "i")
                );
                expect(categoryTitle).toBeInTheDocument();
              },
              { timeout: 3000 }
            );

            // Count delete buttons (should match total images, not per category)
            const allDeleteButtons = screen.getAllByRole("button", {
              name: /smazat/i,
            });
            expect(allDeleteButtons.length).toBeGreaterThanOrEqual(
              categoryImages.length
            );
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should display delete option even when only one image exists", async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a single image
        fc.record({
          category: fc.record({
            id: fc.integer({ min: 1, max: 4 }),
            name_cs: fc.constantFrom(
              "Svatební líčení",
              "Líčení na plesy a večírky",
              "Slavnostní líčení",
              "Líčení pro focení"
            ),
            slug: fc.constantFrom(
              "svatebni-liceni",
              "liceni-na-plesy-a-vecirky",
              "slavnostni-liceni",
              "liceni-pro-foceni"
            ),
            display_order: fc.integer({ min: 1, max: 4 }),
            created_at: fc.date(),
          }),
          image: fc.record({
            id: fc.integer({ min: 1, max: 10000 }),
            category_id: fc.integer({ min: 1, max: 4 }),
            filename: fc
              .string({ minLength: 5, maxLength: 20 })
              .map((s) => `${s.replace(/[^a-zA-Z0-9]/g, "_")}.jpg`),
            original_filename: fc
              .string({ minLength: 5, maxLength: 20 })
              .map((s) => `${s.replace(/[^a-zA-Z0-9]/g, "_")}.jpg`),
            file_path: fc
              .string({ minLength: 5, maxLength: 20 })
              .map((s) => `/uploads/${s.replace(/[^a-zA-Z0-9]/g, "_")}.jpg`),
            file_size: fc.integer({ min: 1000, max: 5000000 }),
            mime_type: fc.constantFrom("image/jpeg", "image/png", "image/webp"),
            uploaded_by: fc.integer({ min: 1, max: 100 }),
            uploaded_at: fc.date(),
            display_order: fc.integer({ min: 0, max: 100 }),
          }),
        }),
        async ({ category, image }) => {
          // Ensure image belongs to the category
          const imageWithCategory = { ...image, category_id: category.id };

          // Mock the API calls
          vi.spyOn(portfolioService, "fetchCategories").mockResolvedValue([
            category,
          ]);
          vi.spyOn(portfolioService, "fetchAllImages").mockResolvedValue([
            imageWithCategory,
          ]);

          const { unmount } = render(<ImageManager />);

          // Wait for the single image to load
          await waitFor(
            () => {
              const deleteButtons = screen.getAllByRole("button", {
                name: /smazat/i,
              });

              // Verify exactly one delete button exists
              expect(deleteButtons.length).toBe(1);
              expect(deleteButtons[0]).toBeEnabled();
              expect(deleteButtons[0]).toBeVisible();
            },
            { timeout: 3000 }
          );

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

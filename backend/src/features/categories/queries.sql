-- This file is for reference, but we will define queries directly in the Repository as template literals for ease of parameterization, or we can use strings if we export them.
-- To strictly follow the "queries.sql" file request, we can define our SQL strings here or just use them inline in Repository.
-- Actually, the user asked: "Every feature must contain ... queries.sql". Let's put some documentation or maybe export SQL queries if we were to read it. But TypeScript can't import .sql easily without a loader. Wait! I can create `queries.ts` or just leave `queries.sql` as a reference file of the queries being run. 

-- GET ALL CATEGORIES
SELECT * FROM categories
WHERE (name ILIKE $1 OR slug ILIKE $1)
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- COUNT CATEGORIES
SELECT COUNT(*) FROM categories
WHERE (name ILIKE $1 OR slug ILIKE $1);

-- GET CATEGORY BY ID
SELECT * FROM categories WHERE id = $1;

-- INSERT CATEGORY
INSERT INTO categories (name, slug, description, image_url, icon_url, seo_title, seo_description, display_order, status, show_in_navigation, is_featured, created_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
RETURNING *;

-- UPDATE CATEGORY
UPDATE categories
SET name = COALESCE($2, name),
    slug = COALESCE($3, slug),
    description = COALESCE($4, description),
    image_url = COALESCE($5, image_url),
    icon_url = COALESCE($6, icon_url),
    seo_title = COALESCE($7, seo_title),
    seo_description = COALESCE($8, seo_description),
    display_order = COALESCE($9, display_order),
    status = COALESCE($10, status),
    show_in_navigation = COALESCE($11, show_in_navigation),
    is_featured = COALESCE($12, is_featured),
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- DELETE CATEGORY
DELETE FROM categories WHERE id = $1;

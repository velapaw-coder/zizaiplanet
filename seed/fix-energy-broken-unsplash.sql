-- Fix broken Unsplash photo IDs inside resource bodies (applied remotely 2026-10-27)
UPDATE resources SET body = REPLACE(body, 'photo-1484480974693-6ca0a06d8ba4', 'photo-1484480974693-6ca0a78fb36b');
UPDATE resources SET body = REPLACE(body, 'photo-1495020689067-958852a7745e', 'photo-1486312338219-ce68d2c6f44d');
UPDATE resources SET body = REPLACE(body, 'photo-1509966755954-0c19c1f8d8c4', 'photo-1558655146-d09347e92766');
UPDATE resources SET body = REPLACE(body, 'photo-1524995997945-a1c2e315a42f', 'photo-1497633762265-9d179a990aa6');

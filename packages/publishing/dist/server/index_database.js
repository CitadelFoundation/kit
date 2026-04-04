/**
 * SQLite-backed local search index for publishing content.
 *
 * @module @citadelfoundation/kit-publishing/server/index_database
 */
import { createLogger } from "../internal/logger.js";
import { Database } from "bun:sqlite";
const logger = createLogger("kit-publishing-index");
/**
 * Create the local publishing index database.
 */
export function createPublishingIndexDatabase(path) {
    const db = new Database(path, { create: true });
    db.exec(`
    CREATE TABLE IF NOT EXISTS publishing_index (
      route TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      access TEXT NOT NULL DEFAULT 'public'
    );
  `);
    const columns = db
        .query("PRAGMA table_info(publishing_index)")
        .all();
    if (!columns.some((column) => column.name === "access")) {
        db.exec("ALTER TABLE publishing_index ADD COLUMN access TEXT NOT NULL DEFAULT 'public';");
    }
    const deleteAll = db.query("DELETE FROM publishing_index");
    const insert = db.query(`
      INSERT OR REPLACE INTO publishing_index (
        route,
        kind,
        slug,
        title,
        description,
        access
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    const list = db.query(`
      SELECT route, kind, slug, title, description, access
      FROM publishing_index
      ORDER BY route ASC
    `);
    const search = db.query(`
      SELECT route, kind, slug, title, description, access
      FROM publishing_index
      WHERE lower(title) LIKE ? OR lower(description) LIKE ? OR lower(route) LIKE ?
      ORDER BY route ASC
      LIMIT ?
    `);
    return {
        rebuild(entries) {
            db.exec("BEGIN");
            try {
                deleteAll.run();
                for (const entry of entries) {
                    insert.run(entry.route, entry.kind, entry.slug, entry.title, entry.description, entry.access);
                }
                db.exec("COMMIT");
            }
            catch (error) {
                db.exec("ROLLBACK");
                throw error;
            }
            logger.info("Publishing index rebuilt", { entries: entries.length });
        },
        search(queryValue, limit = 5) {
            const token = `%${queryValue.trim().toLowerCase()}%`;
            return search.all(token, token, token, limit);
        },
        listAll() {
            return list.all();
        },
        dispose() {
            db.close();
        },
    };
}

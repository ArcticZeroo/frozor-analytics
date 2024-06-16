-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_aggregatedVisits" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "application" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "totalCount" INTEGER NOT NULL DEFAULT 0,
    "date" TEXT NOT NULL,
    CONSTRAINT "aggregatedVisits_application_fkey" FOREIGN KEY ("application") REFERENCES "application" ("name") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_aggregatedVisits" ("application", "count", "date", "id") SELECT "application", "count", "date", "id" FROM "aggregatedVisits";
DROP TABLE "aggregatedVisits";
ALTER TABLE "new_aggregatedVisits" RENAME TO "aggregatedVisits";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_aggregatedVisits" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "application" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    CONSTRAINT "aggregatedVisits_application_fkey" FOREIGN KEY ("application") REFERENCES "application" ("name") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_aggregatedVisits" ("application", "count", "date", "id") SELECT "application", "count", "date", "id" FROM "aggregatedVisits";
DROP TABLE "aggregatedVisits";
ALTER TABLE "new_aggregatedVisits" RENAME TO "aggregatedVisits";
CREATE TABLE "new_visit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" TEXT NOT NULL,
    "application" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "visit_application_fkey" FOREIGN KEY ("application") REFERENCES "application" ("name") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_visit" ("application", "id", "userId") SELECT "application", "id", "userId" FROM "visit";
DROP TABLE "visit";
ALTER TABLE "new_visit" RENAME TO "visit";
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_visit_1" ON "visit"("userId");
Pragma writable_schema=0;
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

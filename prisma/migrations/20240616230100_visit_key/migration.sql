/*
  Warnings:

  - The primary key for the `visit` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `visit` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
DROP TABLE "visit";
CREATE TABLE "visit" (
    "userId" TEXT NOT NULL,
    "application" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY ("userId", "application"),
    CONSTRAINT "visit_application_fkey" FOREIGN KEY ("application") REFERENCES "application" ("name") ON DELETE CASCADE ON UPDATE CASCADE
);
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

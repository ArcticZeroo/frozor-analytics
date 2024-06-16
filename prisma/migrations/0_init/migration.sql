-- CreateTable
CREATE TABLE "aggregatedVisits" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "application" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "date" TEXT NOT NULL,
    CONSTRAINT "aggregatedVisits_application_fkey" FOREIGN KEY ("application") REFERENCES "application" ("name") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateTable
CREATE TABLE "application" (
    "name" TEXT NOT NULL PRIMARY KEY
);

-- CreateTable
CREATE TABLE "visit" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "application" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "visit_application_fkey" FOREIGN KEY ("application") REFERENCES "application" ("name") ON DELETE NO ACTION ON UPDATE NO ACTION
);

-- CreateIndex
Pragma writable_schema=1;
CREATE UNIQUE INDEX "sqlite_autoindex_visit_1" ON "visit"("userId");
Pragma writable_schema=0;


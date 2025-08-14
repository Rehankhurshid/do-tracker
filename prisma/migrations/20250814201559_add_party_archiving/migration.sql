-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DeliveryOrder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "doNumber" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "authorizedPerson" TEXT NOT NULL,
    "validFrom" DATETIME NOT NULL,
    "validTo" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "projectApproved" BOOLEAN NOT NULL DEFAULT false,
    "cisfApproved" BOOLEAN NOT NULL DEFAULT false,
    "items" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DeliveryOrder_partyId_fkey" FOREIGN KEY ("partyId") REFERENCES "Party" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DeliveryOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_DeliveryOrder" ("authorizedPerson", "createdAt", "createdById", "doNumber", "id", "items", "notes", "partyId", "status", "updatedAt", "validFrom", "validTo") SELECT "authorizedPerson", "createdAt", "createdById", "doNumber", "id", "items", "notes", "partyId", "status", "updatedAt", "validFrom", "validTo" FROM "DeliveryOrder";
DROP TABLE "DeliveryOrder";
ALTER TABLE "new_DeliveryOrder" RENAME TO "DeliveryOrder";
CREATE UNIQUE INDEX "DeliveryOrder_doNumber_key" ON "DeliveryOrder"("doNumber");
CREATE TABLE "new_Party" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "contactPerson" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Party" ("address", "contactPerson", "createdAt", "email", "id", "name", "phone", "updatedAt") SELECT "address", "contactPerson", "createdAt", "email", "id", "name", "phone", "updatedAt" FROM "Party";
DROP TABLE "Party";
ALTER TABLE "new_Party" RENAME TO "Party";
CREATE UNIQUE INDEX "Party_name_key" ON "Party"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

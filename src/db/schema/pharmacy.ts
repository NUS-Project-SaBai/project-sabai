import {
  pgTable,
  serial,
  varchar,
  timestamp,
  text,
  pgEnum,
  integer,
  uuid,
} from "drizzle-orm/pg-core";

import { authUsers } from "./schema";

import { consults } from "./consults";

export const medicationStatusEnum = pgEnum("medication_status", [
  "active",
  "discarded",
  "donated",
  "dispensed",
  "reserved",
]);

export const medicationStatusValues = medicationStatusEnum.enumValues;
export const orderStatusEnum = pgEnum("order_status", [
  "APPROVED",
  "CANCELLED",
  "PENDING",
]);
export const stockChangeFieldEnum = pgEnum("stock_change_field_enum", [
  "location",
  "quantity",
  "stock_status",
  "remarks",
]);

/*
Medication Active Ingredients Table:
- id: Primary key, auto-incrementing integer
- name: Name of the active ingredient (e.g., "Paracetamol 500mg")
- unitOfMeasurement: Unit used for measuring this ingredient (e.g., "bottles", "tablets")
- fallBelow: Threshold quantity that triggers low stock alerts
- remarks: Remarks for the active ingredient
*/
export const medicationActiveIngredients = pgTable(
  "medication_active_ingredients",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    unitOfMeasurement: varchar("unit_of_measurement", {
      length: 255,
    }).notNull(),
    fallBelow: integer("fall_below").notNull(),
    remarks: text("remarks"),
  },
);

export type MedicationActiveIngredient =
  typeof medicationActiveIngredients.$inferSelect;
export type NewMedicationActiveIngredient =
  typeof medicationActiveIngredients.$inferInsert;

/*
Medication Brands Table:
- id: Primary key, auto-incrementing integer
- name: Name of the brand (e.g., "Panadol")
- activeIngredientId: ID of the active ingredient
- remarks: Remarks for the medication brand
*/
export const medicationBrands = pgTable("medication_brands", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  activeIngredientId: integer("active_ingredient_id")
    .notNull()
    .references(() => medicationActiveIngredients.id, {
      onDelete: "restrict",
    }),
  remarks: text("remarks"),
});

export type MedicationBrand = typeof medicationBrands.$inferSelect;
export type NewMedicationBrand = typeof medicationBrands.$inferInsert;

/*
Medication Stock Table:
- id: Primary key, auto-incrementing integer
- medicationBrandId: ID of the brand
- quantity: Quantity of the medication
- expiry: Expiry date of the medication
- location: Location of the medication
- state: State of the medication (e.g., 'active', 'discarded', 'donated', 'dispensed', 'reserved')
- remarks: Remarks for the medication stock
*/
export const medicationStock = pgTable("medication_stock", {
  id: serial("id").primaryKey(),
  medicationBrandId: integer("medication_brand_id")
    .notNull()
    .references(() => medicationBrands.id, {
      onDelete: "restrict",
    }),
  quantity: integer("quantity").notNull().default(0),
  expiry: timestamp("expiry").notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  stockStatus: medicationStatusEnum("stock_status").default("active").notNull(),
  remarks: text("remarks"),
});

export type MedicationStock = typeof medicationStock.$inferSelect;
export type NewMedicationStock = typeof medicationStock.$inferInsert;

/*
Stock Changes Table:
- id: Primary key, auto-incrementing integer.
- stockId: Foreign key referencing the stock that was changed.
- field: The field of the row that was changed in the medication_stock table.
- previousValue: The previous value of the changed field.
- newValue: The new value of the changed field.
- userId: Foreign key referencing the user who changed the field.
- createdAt: The timestamp of when the field was changed.
*/
export const stockChanges = pgTable("stock_changes", {
  id: serial("id").primaryKey(),
  stockId: integer("stock_id")
    .notNull()
    .references(() => medicationStock.id),
  field: stockChangeFieldEnum("field").notNull(),
  previousValue: varchar("previous_value").notNull(),
  newValue: varchar("new_value").notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type StockChange = typeof stockChanges.$inferSelect;
export type NewStockChange = typeof stockChanges.$inferInsert;

/*
Orders Table:
- id: Primary key, auto-incrementing integer.
- consultId: Foreign key referencing the consult in which the order was created.
- dosageInstructions: The dosage instructions for the order.
- status: The order status. Can be 'PENDING', 'CANCELLED', or 'APPROVED'.
- stockChangeId: Foreign key representing the entry in the stockChange table that displays stocks going from 'active' to 'reserved' state.
*/
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  consultId: integer("consult_id")
    .notNull()
    .references(() => consults.id),
  dosageInstructions: text("dosage_instructions").notNull(),
  status: orderStatusEnum("status").notNull().default("PENDING"),
  stockChangeId: integer("stock_change_id")
    .notNull()
    .references(() => stockChanges.id),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

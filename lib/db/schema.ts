import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  pgEnum,
  json,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enum for gender
export const genderEnum = pgEnum("gender", [
  "male",
  "female",
  "other",
  "prefer_not_to_say",
]);

// Users table
export const users = pgTable("users", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().default("admin"),
  gender: genderEnum("gender"),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Roles table (for role management)
export const roles = pgTable("roles", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: varchar("name", { length: 50 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// CSV Uploads table (for storing uploaded CSV data)
export const csvUploads = pgTable("csv_uploads", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  fileType: varchar("file_type", { length: 50 }).notNull(), // 'shopify', 'tiktok', 'subscription', 'pl_client1', 'pl_client2', 'sgd_transactions', 'usd_transactions'
  data: json("data").notNull(), // Store processed CSV data as JSON
  uploadedBy: text("uploaded_by")
    .notNull()
    .references(() => users.id),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email("Invalid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(1, "Password is required"),
  phone: z.string().optional(),
  address: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectUserSchema = createSelectSchema(users);

export const insertRoleSchema = createInsertSchema(roles, {
  name: z.string().min(2, "Role name must be at least 2 characters"),
  description: z.string().optional(),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const selectRoleSchema = createSelectSchema(roles);

export const insertCSVUploadSchema = createInsertSchema(csvUploads, {
  fileType: z.enum([
    "shopify",
    "tiktok",
    "subscription",
    "pl_client1",
    "pl_client2",
    "sgd_transactions",
    "usd_transactions",
  ]),
  data: z.any(),
}).omit({
  id: true,
  uploadedAt: true,
});

export const selectCSVUploadSchema = createSelectSchema(csvUploads);

// Types
export type User = typeof users.$inferSelect;
export type NewUser = z.infer<typeof insertUserSchema>;
export type Role = typeof roles.$inferSelect;
export type NewRole = z.infer<typeof insertRoleSchema>;
export type CSVUpload = typeof csvUploads.$inferSelect;
export type NewCSVUpload = z.infer<typeof insertCSVUploadSchema>;

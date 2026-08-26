/**
 * Career-ops SaaS schema — PostgreSQL via Drizzle.
 * Rewritten for Postgres; inspired by job-ops multi-tenant pattern
 * but not verbatim. better-auth manages auth tables separately
 * (user, session, account, verification) — these are app domain tables.
 */

import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// App tenants (organizations) — mirrors better-auth organization but kept minimal
// for app queries; better-auth `organization` table is source of truth, this
// is app-owned metadata (billing, quotas). FK to better-auth org id.
export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  xenditCustomerId: text("xendit_customer_id"),
  subscriptionStatus: text("subscription_status").notNull().default("free"),
  plan: text("plan").notNull().default("free"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Hosted usage quotas — per org per period per action (mirrors job-ops pattern)
export const hostedUsageCounters = pgTable(
  "hosted_usage_counters",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    period: text("period").notNull(),
    action: text("action").notNull(),
    usedUnits: integer("used_units").notNull().default(0),
    reservedUnits: integer("reserved_units").notNull().default(0),
    limitUnits: integer("limit_units").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantUserPeriodActionUnique: uniqueIndex(
      "idx_hosted_usage_counters_tenant_user_period_action_unique",
    ).on(table.tenantId, table.userId, table.period, table.action),
  }),
);

// Applications tracker — canonical SaaS replacement for data/applications.md
export const applications = pgTable(
  "applications",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    company: text("company").notNull(),
    role: text("role").notNull(),
    url: text("url"),
    score: real("score"),
    status: text("status").notNull().default("Evaluated"),
    reportPath: text("report_path"),
    pdfPath: text("pdf_path"),
    appliedAt: timestamp("applied_at", { withTimezone: true }),
    payload: jsonb("payload"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    tenantUserStatusIndex: index("idx_applications_tenant_user_status").on(
      table.tenantId,
      table.userId,
      table.status,
    ),
    tenantUrlIndex: uniqueIndex("idx_applications_tenant_user_url_unique").on(
      table.tenantId,
      table.userId,
      table.url,
    ),
  }),
);

// Pipeline inbox — replacement for data/pipeline.md
export const pipelineItems = pgTable("pipeline_items", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  url: text("url").notNull(),
  title: text("title"),
  company: text("company"),
  seenAt: timestamp("seen_at", { withTimezone: true }).notNull().defaultNow(),
  processed: boolean("processed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Status ledger — append-only, mirrors status-log.tsv
export const statusLedger = pgTable("status_ledger", {
  id: text("id").primaryKey(),
  tenantId: text("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  applicationId: text("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  note: text("note"),
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type TenantRow = typeof tenants.$inferSelect;
export type NewTenantRow = typeof tenants.$inferInsert;
export type ApplicationRow = typeof applications.$inferSelect;
export type NewApplicationRow = typeof applications.$inferInsert;

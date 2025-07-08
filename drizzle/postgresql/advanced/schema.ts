import {
  pgSchema,
  serial,
  text,
  varchar,
  integer,
  bigint,
  boolean,
  timestamp,
  decimal,
  jsonb,
  uuid,
  date,
  interval,
  inet,
  index,
  uniqueIndex,
  primaryKey,
  unique,
  check,
} from 'drizzle-orm/pg-core'
import { relations, sql } from 'drizzle-orm'

// ========================================
// 1. Multiple Schemas Testing
// ========================================

// Auth schema for user authentication
export const authSchema = pgSchema('auth')

// Public schema (default)
export const publicSchema = pgSchema('public')

// Analytics schema for reporting
export const analyticsSchema = pgSchema('analytics')

// Admin schema for administrative functions
export const adminSchema = pgSchema('admin')

// ========================================
// Auth Schema Tables
// ========================================

export const authUsers = authSchema.table('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  emailVerificationToken: text('email_verification_token'),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpiresAt: timestamp('password_reset_expires_at'),
  lastLoginAt: timestamp('last_login_at'),
  loginAttempts: integer('login_attempts').default(0).notNull(),
  lockedUntil: timestamp('locked_until'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('auth_users_email_idx').on(table.email),
  verificationTokenIdx: index('auth_users_verification_token_idx').on(table.emailVerificationToken),
  resetTokenIdx: index('auth_users_reset_token_idx').on(table.passwordResetToken),
  // Partial index for locked accounts
  lockedAccountsIdx: index('auth_users_locked_accounts_idx')
    .on(table.lockedUntil)
    .where(sql`locked_until > NOW()`),
  // CHECK constraints
  loginAttemptsCheck: check('auth_users_login_attempts_check', sql`login_attempts >= 0 AND login_attempts <= 10`),
}))

export const authSessions = authSchema.table('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => authUsers.id, {
    onDelete: 'cascade',
    onUpdate: 'cascade',
  }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('auth_sessions_user_id_idx').on(table.userId),
  tokenIdx: uniqueIndex('auth_sessions_token_idx').on(table.token),
  // Partial index for active sessions
  activeSessionsIdx: index('auth_sessions_active_idx')
    .on(table.userId, table.expiresAt)
    .where(sql`is_active = true AND expires_at > NOW()`),
  // CHECK constraint for expiration
  expirationCheck: check('auth_sessions_expiration_check', sql`expires_at > created_at`),
}))

// ========================================
// Public Schema Tables
// ========================================

export const publicEvents = publicSchema.table('events', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  // Date range simulation using start/end dates
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  // Time range simulation
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  // Price range simulation
  minPrice: decimal('min_price', { precision: 10, scale: 2 }),
  maxPrice: decimal('max_price', { precision: 10, scale: 2 }),
  // Participant count range
  minParticipants: integer('min_participants'),
  maxParticipants: integer('max_participants'),
  // Age restriction range
  minAge: integer('min_age'),
  maxAge: integer('max_age'),
  location: text('location'),
  organizerId: uuid('organizer_id').references(() => authUsers.id, {
    onDelete: 'restrict',
    onUpdate: 'cascade',
  }),
  currentParticipants: integer('current_participants').default(0).notNull(),
  isPublic: boolean('is_public').default(true).notNull(),
  tags: text('tags').array(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  // Date range indexes
  dateRangeIdx: index('events_date_range_idx').on(table.startDate, table.endDate),
  timeRangeIdx: index('events_time_range_idx').on(table.startTime, table.endTime),
  // Regular indexes
  organizerIdx: index('events_organizer_idx').on(table.organizerId),
  publicEventsIdx: index('events_public_idx')
    .on(table.isPublic)
    .where(sql`is_public = true`),
  // Array and JSONB indexes
  tagsIdx: index('events_tags_idx').on(table.tags),
  metadataIdx: index('events_metadata_idx').on(table.metadata),
  // CHECK constraints
  participantsCheck: check('events_participants_check', 
    sql`current_participants >= 0 AND (max_participants IS NULL OR current_participants <= max_participants)`),
  maxParticipantsCheck: check('events_max_participants_check', sql`max_participants IS NULL OR max_participants > 0`),
  dateRangeCheck: check('events_date_range_check', sql`end_date >= start_date`),
  timeRangeCheck: check('events_time_range_check', sql`end_time IS NULL OR start_time IS NULL OR end_time >= start_time`),
  priceRangeCheck: check('events_price_range_check', sql`max_price IS NULL OR min_price IS NULL OR max_price >= min_price`),
  ageRangeCheck: check('events_age_range_check', sql`max_age IS NULL OR min_age IS NULL OR max_age >= min_age`),
}))

export const publicBookings = publicSchema.table('bookings', {
  id: serial('id').primaryKey(),
  eventId: integer('event_id').notNull().references(() => publicEvents.id, {
    onDelete: 'cascade',
    onUpdate: 'cascade',
  }),
  userId: uuid('user_id').notNull().references(() => authUsers.id, {
    onDelete: 'restrict',
    onUpdate: 'cascade',
  }),
  // Booking time range simulation
  bookingStartTime: timestamp('booking_start_time', { withTimezone: true }).notNull(),
  bookingEndTime: timestamp('booking_end_time', { withTimezone: true }).notNull(),
  participantCount: integer('participant_count').notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  eventUserIdx: index('bookings_event_user_idx').on(table.eventId, table.userId),
  userBookingsIdx: index('bookings_user_idx').on(table.userId),
  timeRangeIdx: index('bookings_time_range_idx').on(table.bookingStartTime, table.bookingEndTime),
  statusIdx: index('bookings_status_idx').on(table.status),
  // Unique constraint to prevent double booking
  eventUserTimeUnique: unique('bookings_event_user_time_unique')
    .on(table.eventId, table.userId, table.bookingStartTime),
  // CHECK constraints
  participantCountCheck: check('bookings_participant_count_check', sql`participant_count > 0`),
  totalPriceCheck: check('bookings_total_price_check', sql`total_price >= 0`),
  timeRangeCheck: check('bookings_time_range_check', sql`booking_end_time > booking_start_time`),
}))

// ========================================
// Analytics Schema Tables
// ========================================

export const analyticsPageViews = analyticsSchema.table('page_views', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  userId: uuid('user_id').references(() => authUsers.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  sessionId: uuid('session_id').references(() => authSessions.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  url: text('url').notNull(),
  referrer: text('referrer'),
  userAgent: text('user_agent'),
  ipAddress: inet('ip_address'),
  countryCode: varchar('country_code', { length: 2 }),
  duration: interval('duration'),
  viewedAt: timestamp('viewed_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('analytics_page_views_user_id_idx').on(table.userId),
  sessionIdIdx: index('analytics_page_views_session_id_idx').on(table.sessionId),
  urlIdx: index('analytics_page_views_url_idx').on(table.url),
  viewedAtIdx: index('analytics_page_views_viewed_at_idx').on(table.viewedAt),
  countryIdx: index('analytics_page_views_country_idx').on(table.countryCode),
  // Composite index for analytics queries
  urlDateIdx: index('analytics_page_views_url_date_idx').on(table.url, table.viewedAt),
}))

// ========================================
// Admin Schema Tables
// ========================================

export const adminAuditLogs = adminSchema.table('audit_logs', {
  id: bigint('id', { mode: 'bigint' }).primaryKey(),
  userId: uuid('user_id').references(() => authUsers.id, {
    onDelete: 'restrict',
    onUpdate: 'cascade',
  }),
  action: varchar('action', { length: 100 }).notNull(),
  tableName: varchar('table_name', { length: 100 }),
  recordId: text('record_id'),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  performedAt: timestamp('performed_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('admin_audit_logs_user_id_idx').on(table.userId),
  actionIdx: index('admin_audit_logs_action_idx').on(table.action),
  tableNameIdx: index('admin_audit_logs_table_name_idx').on(table.tableName),
  performedAtIdx: index('admin_audit_logs_performed_at_idx').on(table.performedAt),
  // Composite index for table-specific queries
  tableRecordIdx: index('admin_audit_logs_table_record_idx').on(table.tableName, table.recordId),
}))

// ========================================
// Foreign Key Constraints Example
// ========================================

export const publicProjects = publicSchema.table('projects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  ownerId: uuid('owner_id').notNull().references(() => authUsers.id, {
    onDelete: 'restrict',
    onUpdate: 'cascade',
  }),
  managerId: uuid('manager_id').references(() => authUsers.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  status: varchar('status', { length: 20 }).default('planning').notNull(),
  budget: decimal('budget', { precision: 12, scale: 2 }),
  startDate: date('start_date'),
  endDate: date('end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  ownerIdx: index('projects_owner_idx').on(table.ownerId),
  managerIdx: index('projects_manager_idx').on(table.managerId),
  statusIdx: index('projects_status_idx').on(table.status),
  // CHECK constraints
  dateRangeCheck: check('projects_date_range_check', 
    sql`start_date IS NULL OR end_date IS NULL OR end_date >= start_date`),
  budgetCheck: check('projects_budget_check', sql`budget IS NULL OR budget > 0`),
}))

// ========================================
// Self-referential Tables
// ========================================

export const publicDepartments = publicSchema.table('departments', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  managerId: uuid('manager_id'),
  parentDepartmentId: integer('parent_department_id'),
  budget: decimal('budget', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  managerIdx: index('departments_manager_idx').on(table.managerId),
  parentIdx: index('departments_parent_idx').on(table.parentDepartmentId),
}))

export const publicEmployees = publicSchema.table('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => authUsers.id, {
    onDelete: 'cascade',
    onUpdate: 'cascade',
  }),
  employeeNumber: varchar('employee_number', { length: 20 }).notNull().unique(),
  departmentId: integer('department_id'),
  managerId: uuid('manager_id'),
  position: varchar('position', { length: 100 }),
  salary: decimal('salary', { precision: 10, scale: 2 }),
  hireDate: date('hire_date').notNull(),
  terminationDate: date('termination_date'),
  isActive: boolean('is_active').default(true).notNull(),
}, (table) => ({
  userIdIdx: uniqueIndex('employees_user_id_idx').on(table.userId),
  employeeNumberIdx: uniqueIndex('employees_employee_number_idx').on(table.employeeNumber),
  departmentIdx: index('employees_department_idx').on(table.departmentId),
  managerIdx: index('employees_manager_idx').on(table.managerId),
  activeIdx: index('employees_active_idx')
    .on(table.isActive)
    .where(sql`is_active = true`),
  // CHECK constraints
  salaryCheck: check('employees_salary_check', sql`salary IS NULL OR salary > 0`),
  datesCheck: check('employees_dates_check', 
    sql`termination_date IS NULL OR termination_date >= hire_date`),
}))

// ========================================
// Tables with Long Names and Reserved Words
// ========================================

// Table with very long name (near PostgreSQL limit)
export const publicVeryLongTableNameThatIsNearThePostgreSQLLimitOfSixtyThree = publicSchema.table('very_long_table_name_that_is_near_the_postgresql_limit_of_63', {
  id: serial('id').primaryKey(),
  veryLongColumnNameThatIsAlsoNearTheLimit: text('very_long_column_name_that_is_also_near_the_limit'),
})

// Table using PostgreSQL reserved words (should be quoted)
export const publicOrder = publicSchema.table('order', {
  id: serial('id').primaryKey(),
  user: text('user'), // 'user' is a reserved word
  group: text('group'), // 'group' is a reserved word
  table: text('table'), // 'table' is a reserved word
}, (table) => ({
  // Index with reserved word
  userIdx: index('order_user_idx').on(table.user),
}))

// ========================================
// Relations for Cross-Schema References
// ========================================

export const authUsersRelations = relations(authUsers, ({ many }) => ({
  sessions: many(authSessions),
  events: many(publicEvents),
  bookings: many(publicBookings),
  pageViews: many(analyticsPageViews),
  auditLogs: many(adminAuditLogs),
  ownedProjects: many(publicProjects, { relationName: 'ProjectOwner' }),
  managedProjects: many(publicProjects, { relationName: 'ProjectManager' }),
  employee: many(publicEmployees),
}))

export const authSessionsRelations = relations(authSessions, ({ one, many }) => ({
  user: one(authUsers, {
    fields: [authSessions.userId],
    references: [authUsers.id],
  }),
  pageViews: many(analyticsPageViews),
}))

export const publicEventsRelations = relations(publicEvents, ({ one, many }) => ({
  organizer: one(authUsers, {
    fields: [publicEvents.organizerId],
    references: [authUsers.id],
  }),
  bookings: many(publicBookings),
}))

export const publicBookingsRelations = relations(publicBookings, ({ one }) => ({
  event: one(publicEvents, {
    fields: [publicBookings.eventId],
    references: [publicEvents.id],
  }),
  user: one(authUsers, {
    fields: [publicBookings.userId],
    references: [authUsers.id],
  }),
}))

export const publicProjectsRelations = relations(publicProjects, ({ one }) => ({
  owner: one(authUsers, {
    fields: [publicProjects.ownerId],
    references: [authUsers.id],
    relationName: 'ProjectOwner',
  }),
  manager: one(authUsers, {
    fields: [publicProjects.managerId],
    references: [authUsers.id],
    relationName: 'ProjectManager',
  }),
}))

export const publicDepartmentsRelations = relations(publicDepartments, ({ one, many }) => ({
  parent: one(publicDepartments, {
    fields: [publicDepartments.parentDepartmentId],
    references: [publicDepartments.id],
    relationName: 'DepartmentHierarchy',
  }),
  children: many(publicDepartments, {
    relationName: 'DepartmentHierarchy',
  }),
  employees: many(publicEmployees),
}))

export const publicEmployeesRelations = relations(publicEmployees, ({ one, many }) => ({
  user: one(authUsers, {
    fields: [publicEmployees.userId],
    references: [authUsers.id],
  }),
  manager: one(publicEmployees, {
    fields: [publicEmployees.managerId],
    references: [publicEmployees.id],
    relationName: 'EmployeeHierarchy',
  }),
  subordinates: many(publicEmployees, {
    relationName: 'EmployeeHierarchy',
  }),
}))

export const analyticsPageViewsRelations = relations(analyticsPageViews, ({ one }) => ({
  user: one(authUsers, {
    fields: [analyticsPageViews.userId],
    references: [authUsers.id],
  }),
  session: one(authSessions, {
    fields: [analyticsPageViews.sessionId],
    references: [authSessions.id],
  }),
}))

export const adminAuditLogsRelations = relations(adminAuditLogs, ({ one }) => ({
  user: one(authUsers, {
    fields: [adminAuditLogs.userId],
    references: [authUsers.id],
  }),
}))
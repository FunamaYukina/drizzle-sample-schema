import {
  mysqlSchema,
  serial,
  text,
  varchar,
  int,
  bigint,
  boolean,
  timestamp,
  decimal,
  json,
  char,
  date,
  time,
  index,
  uniqueIndex,
  primaryKey,
  unique,
  check,
} from 'drizzle-orm/mysql-core'
import { relations, sql } from 'drizzle-orm'

// ========================================
// 1. Multiple Schemas Testing
// ========================================

// Auth schema for user authentication
export const authSchema = mysqlSchema('auth')

// Public schema (default)
export const publicSchema = mysqlSchema('public')

// Analytics schema for reporting
export const analyticsSchema = mysqlSchema('analytics')

// Admin schema for administrative functions
export const adminSchema = mysqlSchema('admin')

// ========================================
// Auth Schema Tables
// ========================================

export const authUsers = authSchema.table('users', {
  id: char('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  isEmailVerified: boolean('is_email_verified').default(false).notNull(),
  emailVerificationToken: text('email_verification_token'),
  passwordResetToken: text('password_reset_token'),
  passwordResetExpiresAt: timestamp('password_reset_expires_at'),
  lastLoginAt: timestamp('last_login_at'),
  loginAttempts: int('login_attempts').default(0).notNull(),
  lockedUntil: timestamp('locked_until'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow(),
}, (table) => ({
  emailIdx: uniqueIndex('auth_users_email_idx').on(table.email),
  verificationTokenIdx: index('auth_users_verification_token_idx').on(table.emailVerificationToken),
  resetTokenIdx: index('auth_users_reset_token_idx').on(table.passwordResetToken),
  // Index for locked accounts
  lockedAccountsIdx: index('auth_users_locked_accounts_idx')
    .on(table.lockedUntil),
  // CHECK constraints
  loginAttemptsCheck: check('auth_users_login_attempts_check', sql`login_attempts >= 0 AND login_attempts <= 10`),
}))

export const authSessions = authSchema.table('sessions', {
  id: char('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: char('user_id', { length: 36 }).notNull().references(() => authUsers.id, {
    onDelete: 'cascade',
    onUpdate: 'cascade',
  }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }), // IPv6 support
  userAgent: text('user_agent'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('auth_sessions_user_id_idx').on(table.userId),
  tokenIdx: uniqueIndex('auth_sessions_token_idx').on(table.token),
  // Index for active sessions
  activeSessionsIdx: index('auth_sessions_active_idx')
    .on(table.userId, table.expiresAt, table.isActive),
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
  minParticipants: int('min_participants'),
  maxParticipants: int('max_participants'),
  // Age restriction range
  minAge: int('min_age'),
  maxAge: int('max_age'),
  location: text('location'),
  organizerId: char('organizer_id', { length: 36 }).references(() => authUsers.id, {
    onDelete: 'restrict',
    onUpdate: 'cascade',
  }),
  currentParticipants: int('current_participants').default(0).notNull(),
  isPublic: boolean('is_public').default(true).notNull(),
  tags: json('tags').$type<string[]>(),
  metadata: json('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow(),
}, (table) => ({
  // Date range indexes
  dateRangeIdx: index('events_date_range_idx').on(table.startDate, table.endDate),
  timeRangeIdx: index('events_time_range_idx').on(table.startTime, table.endTime),
  // Regular indexes
  organizerIdx: index('events_organizer_idx').on(table.organizerId),
  publicEventsIdx: index('events_public_idx')
    .on(table.isPublic),
  // JSON indexes
  tagsIdx: index('events_tags_idx').on(table.tags),
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
  eventId: int('event_id').notNull().references(() => publicEvents.id, {
    onDelete: 'cascade',
    onUpdate: 'cascade',
  }),
  userId: char('user_id', { length: 36 }).notNull().references(() => authUsers.id, {
    onDelete: 'restrict',
    onUpdate: 'cascade',
  }),
  // Booking time range simulation
  bookingStartTime: timestamp('booking_start_time').notNull(),
  bookingEndTime: timestamp('booking_end_time').notNull(),
  participantCount: int('participant_count').notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow(),
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
  userId: char('user_id', { length: 36 }).references(() => authUsers.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  sessionId: char('session_id', { length: 36 }).references(() => authSessions.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  url: text('url').notNull(),
  referrer: text('referrer'),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  countryCode: varchar('country_code', { length: 2 }),
  duration: time('duration'), // MySQL doesn't have interval type
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
  userId: char('user_id', { length: 36 }).references(() => authUsers.id, {
    onDelete: 'restrict',
    onUpdate: 'cascade',
  }),
  action: varchar('action', { length: 100 }).notNull(),
  tableName: varchar('table_name', { length: 100 }),
  recordId: text('record_id'),
  oldValues: json('old_values'),
  newValues: json('new_values'),
  ipAddress: varchar('ip_address', { length: 45 }),
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
  ownerId: char('owner_id', { length: 36 }).notNull().references(() => authUsers.id, {
    onDelete: 'restrict',
    onUpdate: 'cascade',
  }),
  managerId: char('manager_id', { length: 36 }).references(() => authUsers.id, {
    onDelete: 'set null',
    onUpdate: 'cascade',
  }),
  status: varchar('status', { length: 20 }).default('planning').notNull(),
  budget: decimal('budget', { precision: 12, scale: 2 }),
  startDate: date('start_date'),
  endDate: date('end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull().onUpdateNow(),
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
  managerId: char('manager_id', { length: 36 }),
  parentDepartmentId: int('parent_department_id'),
  budget: decimal('budget', { precision: 12, scale: 2 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  managerIdx: index('departments_manager_idx').on(table.managerId),
  parentIdx: index('departments_parent_idx').on(table.parentDepartmentId),
}))

export const publicEmployees = publicSchema.table('employees', {
  id: char('id', { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: char('user_id', { length: 36 }).notNull().unique().references(() => authUsers.id, {
    onDelete: 'cascade',
    onUpdate: 'cascade',
  }),
  employeeNumber: varchar('employee_number', { length: 20 }).notNull().unique(),
  departmentId: int('department_id'),
  managerId: char('manager_id', { length: 36 }),
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
    .on(table.isActive),
  // CHECK constraints
  salaryCheck: check('employees_salary_check', sql`salary IS NULL OR salary > 0`),
  datesCheck: check('employees_dates_check', 
    sql`termination_date IS NULL OR termination_date >= hire_date`),
}))

// ========================================
// Tables with Long Names and Reserved Words
// ========================================

// Table with very long name (near MySQL limit)
export const publicVeryLongTableNameThatIsNearTheMySQLLimitOfSixtyFour = publicSchema.table('very_long_table_name_that_is_near_the_mysql_limit_of_64', {
  id: serial('id').primaryKey(),
  veryLongColumnNameThatIsAlsoNearTheLimit: text('very_long_column_name_that_is_also_near_the_limit'),
})

// Table using MySQL reserved words (should be quoted)
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
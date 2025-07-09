import { pgTable, text, integer, timestamp, primaryKey } from 'drizzle-orm/pg-core';

// Example 1: User and role relationship table (user_id + role_id)
export const userRoles = pgTable('user_roles', {
  userId: integer('user_id').notNull(),
  roleId: integer('role_id').notNull(),
  assignedAt: timestamp('assigned_at').defaultNow(),
  assignedBy: integer('assigned_by'),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.roleId] }),
  };
});

// Example 2: Order details table (order_id + product_id)
export const orderItems = pgTable('order_items', {
  orderId: integer('order_id').notNull(),
  productId: integer('product_id').notNull(),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.orderId, table.productId] }),
  };
});

// Example 3: Multilingual support table (entity_id + language_code)
export const translations = pgTable('translations', {
  entityId: integer('entity_id').notNull(),
  languageCode: text('language_code').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.entityId, table.languageCode] }),
  };
});

// Example 4: Time series data table (device_id + timestamp)
export const sensorData = pgTable('sensor_data', {
  deviceId: text('device_id').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  temperature: integer('temperature'),
  humidity: integer('humidity'),
  batteryLevel: integer('battery_level'),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.deviceId, table.timestamp] }),
  };
});

// Example 5: Three-column composite primary key
export const userProjectPermissions = pgTable('user_project_permissions', {
  userId: integer('user_id').notNull(),
  projectId: integer('project_id').notNull(),
  permission: text('permission').notNull(), // 'read', 'write', 'admin'
  grantedAt: timestamp('granted_at').defaultNow(),
  grantedBy: integer('granted_by'),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.projectId, table.permission] }),
  };
});

// Reference: Single primary key table (for comparison)
export const users = pgTable('users', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const roles = pgTable('roles', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
});

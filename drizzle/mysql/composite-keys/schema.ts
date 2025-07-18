import { mysqlTable, text, int, timestamp, primaryKey } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

// Example 1: User and role relationship table (user_id + role_id)
export const userRoles = mysqlTable('user_roles', {
  userId: int('user_id').notNull().references(() => users.id, {
    onDelete: 'cascade'
  }),
  roleId: int('role_id').notNull().references(() => roles.id, {
    onDelete: 'cascade'
  }),
  assignedAt: timestamp('assigned_at').defaultNow(),
  assignedBy: int('assigned_by').references(() => users.id, {
    onDelete: 'set null'
  }),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.roleId] }),
  };
});

// Example 2: Order details table (order_id + product_id)
export const orderItems = mysqlTable('order_items', {
  orderId: int('order_id').notNull().references(() => orders.id, {
    onDelete: 'cascade'
  }),
  productId: int('product_id').notNull().references(() => products.id, {
    onDelete: 'cascade'
  }),
  quantity: int('quantity').notNull(),
  unitPrice: int('unit_price').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.orderId, table.productId] }),
  };
});

// Example 3: Multilingual support table (entity_id + language_code)
export const translations = mysqlTable('translations', {
  entityId: int('entity_id').notNull().references(() => entities.id, {
    onDelete: 'cascade'
  }),
  languageCode: text('language_code').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.entityId, table.languageCode] }),
  };
});

// Example 4: Time series data table (device_id + timestamp)
export const sensorData = mysqlTable('sensor_data', {
  deviceId: text('device_id').notNull().references(() => devices.id, {
    onDelete: 'cascade'
  }),
  timestamp: timestamp('timestamp').notNull(),
  temperature: int('temperature'),
  humidity: int('humidity'),
  batteryLevel: int('battery_level'),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.deviceId, table.timestamp] }),
  };
});

// Example 5: Three-column composite primary key
export const userProjectPermissions = mysqlTable('user_project_permissions', {
  userId: int('user_id').notNull().references(() => users.id, {
    onDelete: 'cascade'
  }),
  projectId: int('project_id').notNull().references(() => projects.id, {
    onDelete: 'cascade'
  }),
  permission: text('permission').notNull(), // 'read', 'write', 'admin'
  grantedAt: timestamp('granted_at').defaultNow(),
  grantedBy: int('granted_by').references(() => users.id, {
    onDelete: 'set null'
  }),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.userId, table.projectId, table.permission] }),
  };
});

// Reference: Single primary key table (for comparison)
export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const roles = mysqlTable('roles', {
  id: int('id').primaryKey().autoincrement(),
  name: text('name').notNull(),
  description: text('description'),
});

// Relations definitions
export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  userProjectPermissions: many(userProjectPermissions),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  assignedByUser: one(users, {
    fields: [userRoles.assignedBy],
    references: [users.id],
  }),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const translationsRelations = relations(translations, ({ one }) => ({
  entity: one(entities, {
    fields: [translations.entityId],
    references: [entities.id],
  }),
}));

export const sensorDataRelations = relations(sensorData, ({ one }) => ({
  device: one(devices, {
    fields: [sensorData.deviceId],
    references: [devices.id],
  }),
}));

export const userProjectPermissionsRelations = relations(userProjectPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userProjectPermissions.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [userProjectPermissions.projectId],
    references: [projects.id],
  }),
  grantedByUser: one(users, {
    fields: [userProjectPermissions.grantedBy],
    references: [users.id],
  }),
}));

// Additional related tables (for demonstration)
export const orders = mysqlTable('orders', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id, {
    onDelete: 'cascade'
  }),
  total: int('total').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const products = mysqlTable('products', {
  id: int('id').primaryKey().autoincrement(),
  name: text('name').notNull(),
  price: int('price').notNull(),
});

export const entities = mysqlTable('entities', {
  id: int('id').primaryKey().autoincrement(),
  type: text('type').notNull(), // 'article', 'product', etc.
  createdAt: timestamp('created_at').defaultNow(),
});

export const devices = mysqlTable('devices', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location'),
  installedAt: timestamp('installed_at').defaultNow(),
});

export const projects = mysqlTable('projects', {
  id: int('id').primaryKey().autoincrement(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});
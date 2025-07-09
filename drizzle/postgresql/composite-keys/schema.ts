import { pgTable, text, integer, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

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
export const orders = pgTable('orders', {
  id: integer('id').primaryKey(),
  userId: integer('user_id').notNull(),
  total: integer('total').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const products = pgTable('products', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  price: integer('price').notNull(),
});

export const entities = pgTable('entities', {
  id: integer('id').primaryKey(),
  type: text('type').notNull(), // 'article', 'product', etc.
  createdAt: timestamp('created_at').defaultNow(),
});

export const devices = pgTable('devices', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  location: text('location'),
  installedAt: timestamp('installed_at').defaultNow(),
});

export const projects = pgTable('projects', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
});;

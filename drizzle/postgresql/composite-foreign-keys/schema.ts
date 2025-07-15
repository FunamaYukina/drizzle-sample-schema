import { pgTable, integer, primaryKey } from 'drizzle-orm/pg-core';

export const projectUsers = pgTable(
  'project_users',
  {
    projectId: integer('project_id').notNull(),
    userId: integer('user_id').notNull(),
  },
  (table) => ({
    pk: primaryKey(table.projectId, table.userId),
  })
);

export const projectTasks = pgTable(
  'project_tasks',
  {
    projectId: integer('project_id').notNull(),
    userId: integer('user_id').notNull(),
    taskId: integer('task_id').notNull(),
  },
  (table) => ({
    fk: {
      columns: [table.projectId, table.userId],
      foreignColumns: [projectUsers.projectId, projectUsers.userId],
    },
  })
);

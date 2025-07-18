import { mysqlTable, int, primaryKey } from 'drizzle-orm/mysql-core';

export const projectUsers = mysqlTable(
  'project_users',
  {
    projectId: int('project_id').notNull(),
    userId: int('user_id').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.projectId, table.userId] }),
  })
);

export const projectTasks = mysqlTable(
  'project_tasks',
  {
    projectId: int('project_id').notNull(),
    userId: int('user_id').notNull(),
    taskId: int('task_id').notNull(),
  },
  (table) => ({
    fk: {
      columns: [table.projectId, table.userId],
      foreignColumns: [projectUsers.projectId, projectUsers.userId],
    },
  })
);
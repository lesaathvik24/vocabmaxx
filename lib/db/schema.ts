import { pgTable, pgSchema, uuid, text, timestamp, integer, doublePrecision, boolean, jsonb, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const definitionSourceEnum = pgEnum('definition_source', ['dictionary', 'llm'])
export const importJobStatusEnum = pgEnum('import_job_status', ['pending', 'running', 'done', 'failed'])

const authSchema = pgSchema('auth')
export const authUsers = authSchema.table('users', {
    id: uuid('id').primaryKey(),
})

export const words = pgTable('words', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
    term: text('term').notNull(),
    definition: text('definition').notNull(),
    examples: jsonb('examples').$type<string[]>().notNull(),
    source: definitionSourceEnum('source').notNull(),
    addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
}, t => ({
    termUserUnique: uniqueIndex('words_user_term_idx').on(t.userId, t.term),
    userIdx: index('words_user_idx').on(t.userId),
}))

export const srsState = pgTable('srs_state', {
    wordId: uuid('word_id').primaryKey().references(() => words.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
    easeFactor: doublePrecision('ease_factor').notNull().default(2.5),
    intervalDays: integer('interval_days').notNull().default(0),
    repetitions: integer('repetitions').notNull().default(0),
    dueDate: timestamp('due_date', { withTimezone: true }).defaultNow().notNull(),
    lastReviewedAt: timestamp('last_reviewed_at', { withTimezone: true }),
}, t => ({
    dueIdx: index('srs_due_idx').on(t.userId, t.dueDate),
}))

export const reviewLog = pgTable('review_log', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
    wordId: uuid('word_id').notNull().references(() => words.id, { onDelete: 'cascade' }),
    grade: integer('grade').notNull(),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }).defaultNow().notNull(),
}, t => ({
    userTimeIdx: index('review_user_time_idx').on(t.userId, t.reviewedAt),
}))

export const importJobs = pgTable('import_jobs', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
    status: importJobStatusEnum('status').notNull().default('pending'),
    totalTerms: integer('total_terms').notNull(),
    addedCount: integer('added_count').notNull().default(0),
    failedCount: integer('failed_count').notNull().default(0),
    errors: jsonb('errors').$type<{ term: string; reason: string }[]>().notNull().default(sql`'[]'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const userPreferences = pgTable('user_preferences', {
    userId: uuid('user_id')
        .primaryKey()
        .references(() => authUsers.id, { onDelete: 'cascade' }),
    displayName: text('display_name'),
    theme: text('theme').notNull().default('dark'), // 'light' | 'dark'
    dailyDigest: boolean('daily_digest').notNull().default(false),
    digestHour: integer('digest_hour').notNull().default(14), // UTC hour 0-23
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})

export const definitionCache = pgTable('definition_cache', {
    term: text('term').primaryKey(),
    definition: text('definition').notNull(),
    examples: jsonb('examples').$type<string[]>().notNull(),
    source: definitionSourceEnum('source').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

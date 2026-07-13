import { pgTable, pgSchema, uuid, text, timestamp, integer, doublePrecision, boolean, jsonb, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import type { Sense } from '@/lib/domain/word'

export const definitionSourceEnum = pgEnum('definition_source', ['dictionary', 'llm'])
export const importJobStatusEnum = pgEnum('import_job_status', ['pending', 'running', 'done', 'failed'])
export const sidequestStatusEnum = pgEnum('sidequest_status', ['active', 'completed', 'missed'])
export const sidequestChannelEnum = pgEnum('sidequest_channel', ['irl', 'text'])

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
    phonetic: text('phonetic'),
    audioUrl: text('audio_url'),
    senses: jsonb('senses').$type<Sense[]>(),
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

export const sidequests = pgTable('sidequests', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
    wordId: uuid('word_id').notNull().references(() => words.id, { onDelete: 'cascade' }),
    term: text('term').notNull(),
    definition: text('definition').notNull(),
    scenario: text('scenario').notNull(),
    channel: sidequestChannelEnum('channel').notNull(),
    status: sidequestStatusEnum('status').notNull().default('active'),
    submission: text('submission'),
    verdictReason: text('verdict_reason'),
    xpAwarded: integer('xp_awarded').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
}, t => ({
    userStatusIdx: index('sidequests_user_status_idx').on(t.userId, t.status),
    // At most one active quest per user. Enforced at the DB so the read-then-insert
    // in the spawn path can't race two parallel renders into duplicate actives.
    oneActivePerUser: uniqueIndex('sidequests_one_active_per_user')
        .on(t.userId)
        .where(sql`${t.status} = 'active'`),
}))

export const definitionCache = pgTable('definition_cache', {
    term: text('term').primaryKey(),
    definition: text('definition').notNull(),
    examples: jsonb('examples').$type<string[]>().notNull(),
    source: definitionSourceEnum('source').notNull(),
    phonetic: text('phonetic'),
    audioUrl: text('audio_url'),
    senses: jsonb('senses').$type<Sense[]>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const pushSubscriptions = pgTable('push_subscriptions', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => authUsers.id, { onDelete: 'cascade' }),
    endpoint: text('endpoint').notNull(),
    p256dh: text('p256dh').notNull(),
    auth: text('auth').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, t => ({
    endpointUnique: uniqueIndex('push_subscriptions_endpoint_idx').on(t.endpoint),
    userIdx: index('push_subscriptions_user_idx').on(t.userId),
}))

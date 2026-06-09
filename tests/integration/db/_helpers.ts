import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL not set in test setup')

export const raw = postgres(url, { prepare: false, max: 4, connect_timeout: 10 })

export async function createAuthUser(id: string, email: string): Promise<void> {
    await raw`
        insert into auth.users (
            id, instance_id, aud, role, email,
            encrypted_password, email_confirmed_at,
            raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at, is_anonymous
        ) values (
            ${id}::uuid, '00000000-0000-0000-0000-000000000000'::uuid, 'authenticated', 'authenticated', ${email},
            '', now(),
            '{"provider":"email"}'::jsonb, '{}'::jsonb,
            now(), now(), false
        )
        on conflict (id) do nothing
    `
}

export async function cleanup(userIds: string[]): Promise<void> {
    if (userIds.length === 0) return
    await raw`delete from auth.users where id = any(${userIds}::uuid[])`
}

export async function closeRaw(): Promise<void> {
    await raw.end({ timeout: 5 })
}

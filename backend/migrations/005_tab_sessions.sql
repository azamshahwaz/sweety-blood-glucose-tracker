
CREATE TABLE IF NOT EXISTS tab_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tab_sessions_user_id
    ON tab_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_tab_sessions_expiry
    ON tab_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_tab_sessions_active
    ON tab_sessions(id, user_id)
    WHERE revoked_at IS NULL;

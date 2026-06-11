export const SQL_SCHEMA = `
    -- Broadcast groups (user-defined with description)
    CREATE TABLE IF NOT EXISTS broadcast_groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at INTEGER NOT NULL
    );

    -- Broadcast lists (synced from WhatsApp)
    CREATE TABLE IF NOT EXISTS broadcast_lists (
        id TEXT PRIMARY KEY,
        group_id TEXT,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (group_id) REFERENCES broadcast_groups(id) ON DELETE SET NULL
    );

    -- Contacts in broadcast lists
    CREATE TABLE IF NOT EXISTS list_contacts (
        list_id TEXT NOT NULL,
        contact_id TEXT NOT NULL,
        contact_name TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        PRIMARY KEY (list_id, contact_id),
        FOREIGN KEY (list_id) REFERENCES broadcast_lists(id) ON DELETE CASCADE
    );

    -- Indexes for fast conflict detection
    CREATE INDEX IF NOT EXISTS idx_contacts_phone ON list_contacts(phone_number);
    CREATE INDEX IF NOT EXISTS idx_contacts_list ON list_contacts(list_id);
    CREATE INDEX IF NOT EXISTS idx_lists_group ON broadcast_lists(group_id);
    CREATE INDEX IF NOT EXISTS idx_lists_name ON broadcast_lists(name);

    -- App settings table
    CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    );

    -- Ungrouped lists notifications
    CREATE TABLE IF NOT EXISTS ungrouped_notifications (
        list_id TEXT PRIMARY KEY,
        list_name TEXT NOT NULL,
        detected_at INTEGER NOT NULL,
        contact_count INTEGER NOT NULL
    );

    -- Insert default settings
    INSERT OR IGNORE INTO app_settings (key, value) VALUES 
        ('active_group_id', ''),
        ('floating_bubble_enabled', 'true'),
        ('push_notifications_enabled', 'true'),
        ('vibration_enabled', 'true'),
        ('sound_enabled', 'true');
`;
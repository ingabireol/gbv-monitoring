package com.gbvmonitor.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseSchemaMaintenance implements CommandLineRunner {
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        jdbcTemplate.execute("ALTER TABLE reports ALTER COLUMN description TYPE TEXT");
        jdbcTemplate.execute("ALTER TABLE reports ADD COLUMN IF NOT EXISTS submission_key VARCHAR(255)");
        jdbcTemplate.execute("ALTER TABLE reports ADD COLUMN IF NOT EXISTS incident_at TIMESTAMP");
        jdbcTemplate.execute("ALTER TABLE reports ADD COLUMN IF NOT EXISTS incident_location VARCHAR(255)");
        jdbcTemplate.execute("ALTER TABLE reports ADD COLUMN IF NOT EXISTS reporter_name VARCHAR(255)");
        jdbcTemplate.execute("ALTER TABLE reports ADD COLUMN IF NOT EXISTS reporter_contact VARCHAR(255)");
        jdbcTemplate.execute("ALTER TABLE reports ADD COLUMN IF NOT EXISTS witness_name VARCHAR(255)");
        jdbcTemplate.execute("ALTER TABLE reports ADD COLUMN IF NOT EXISTS witness_contact VARCHAR(255)");
        jdbcTemplate.execute("ALTER TABLE reports ADD COLUMN IF NOT EXISTS witness_location VARCHAR(1000)");
        jdbcTemplate.execute("ALTER TABLE reports ADD COLUMN IF NOT EXISTS witness_statement VARCHAR(2000)");
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS anonymous_chat_messages (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
                    sender VARCHAR(30) NOT NULL,
                    message VARCHAR(2000) NOT NULL,
                    field_key VARCHAR(100),
                    created_at TIMESTAMP NOT NULL
                )
                """);
        jdbcTemplate.execute("""
                CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_submission_key
                ON reports (submission_key)
                WHERE submission_key IS NOT NULL
                """);
    }
}

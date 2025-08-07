# Database Maintenance

## Data Retention

The `data_retention.sql` file contains PostgreSQL functions for cleaning up old data:

- **API Requests**: Keeps only last 90 days
- **Debug/Info Logs**: Keeps only last 30 days
- **Error/Warn Logs**: Keeps last 1 year

### Usage

```sql
-- Run the cleanup function manually
SELECT cleanup_old_data();

-- Or schedule it to run weekly (requires pg_cron extension)
SELECT cron.schedule('cleanup-old-data', '0 0 * * 0', 'SELECT cleanup_old_data();');
```

### Production Setup

1. Install pg_cron extension on your PostgreSQL instance
2. Run the data_retention.sql file to create the function
3. Schedule the cleanup function to run weekly or monthly

This prevents unbounded growth of logging tables in production.

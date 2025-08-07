-- Data retention policies to prevent unbounded growth

-- Partition api_requests by month (for large datasets)
-- This is a more advanced feature, implement when you have high volume

-- For now, add a cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Keep only last 90 days of API requests
    DELETE FROM api_requests 
    WHERE createdAt < NOW() - INTERVAL '90 days';
    
    -- Keep only last 30 days of debug/info logs
    DELETE FROM bridge_logs 
    WHERE level IN ('debug', 'info') 
    AND createdAt < NOW() - INTERVAL '30 days';
    
    -- Keep error/warn logs for 1 year
    DELETE FROM bridge_logs 
    WHERE level IN ('error', 'warn') 
    AND createdAt < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Schedule this to run weekly
-- SELECT cron.schedule('cleanup-old-data', '0 0 * * 0', 'SELECT cleanup_old_data();');

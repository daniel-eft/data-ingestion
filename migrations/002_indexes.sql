CREATE INDEX IF NOT EXISTS idx_ingested_data_email ON ingested_data(email);
CREATE INDEX IF NOT EXISTS idx_ingestion_jobs_status ON ingestion_jobs(status);
CREATE INDEX IF NOT EXISTS idx_validation_errors_job_id ON validation_errors(job_id);

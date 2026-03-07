-- Run this script in pgAdmin or PostgreSQL Query Tool
-- This will create the edunexus database

CREATE DATABASE edunexus
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    CONNECTION LIMIT = -1;

COMMENT ON DATABASE edunexus IS 'EduNexus Campus Management System Database';

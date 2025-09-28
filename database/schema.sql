-- LLM Answer Engine Database Schema
-- Multi-tenant architecture with user management

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations table (tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    domain VARCHAR(255),
    plan VARCHAR(50) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'team', 'enterprise')),
    max_users INTEGER DEFAULT 1,
    max_queries_per_month INTEGER DEFAULT 100,
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) UNIQUE NOT NULL, -- bcrypt hash of the key
    key_preview VARCHAR(20) NOT NULL, -- first few characters for display
    permissions JSONB DEFAULT '{}',
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Queries table (usage tracking)
CREATE TABLE queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    api_key_id UUID REFERENCES api_keys(id) ON DELETE SET NULL,
    query_text TEXT NOT NULL,
    query_hash VARCHAR(64), -- SHA-256 hash for deduplication
    query_type VARCHAR(50) DEFAULT 'search' CHECK (query_type IN ('search', 'function_call', 'image_generation')),
    model_used VARCHAR(100),
    response_time_ms INTEGER,
    tokens_used INTEGER,
    cost_cents INTEGER, -- cost in cents
    status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('completed', 'failed', 'timeout', 'rate_limited')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage aggregations table (for faster analytics)
CREATE TABLE usage_aggregations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    query_count INTEGER DEFAULT 0,
    total_cost_cents INTEGER DEFAULT 0,
    unique_users INTEGER DEFAULT 0,
    avg_response_time_ms DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, date)
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL,
    plan VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Billing events table
CREATE TABLE billing_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    amount_cents INTEGER,
    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Semantic cache table (for caching query results)
CREATE TABLE semantic_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    query_embedding VECTOR(1536), -- OpenAI embedding dimension
    query_text TEXT NOT NULL,
    response_data JSONB NOT NULL,
    hit_count INTEGER DEFAULT 0,
    last_hit_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_api_keys_organization_id ON api_keys(organization_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX idx_queries_organization_id ON queries(organization_id);
CREATE INDEX idx_queries_user_id ON queries(user_id);
CREATE INDEX idx_queries_created_at ON queries(created_at);
CREATE INDEX idx_queries_query_hash ON queries(query_hash);
CREATE INDEX idx_usage_aggregations_org_date ON usage_aggregations(organization_id, date);
CREATE INDEX idx_semantic_cache_organization_id ON semantic_cache(organization_id);
CREATE INDEX idx_semantic_cache_created_at ON semantic_cache(created_at);

-- Row Level Security (RLS) policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_aggregations ENABLE ROW LEVEL SECURITY;
ALTER TABLE semantic_cache ENABLE ROW LEVEL SECURITY;

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to check usage limits
CREATE OR REPLACE FUNCTION check_usage_limit(org_id UUID, query_type VARCHAR DEFAULT 'search')
RETURNS BOOLEAN AS $$
DECLARE
    org_record organizations%ROWTYPE;
    current_usage INTEGER;
BEGIN
    -- Get organization details
    SELECT * INTO org_record FROM organizations WHERE id = org_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Count current month usage
    SELECT COUNT(*) INTO current_usage
    FROM queries 
    WHERE organization_id = org_id 
    AND created_at >= DATE_TRUNC('month', NOW())
    AND status = 'completed';
    
    -- Check against plan limits
    RETURN current_usage < org_record.max_queries_per_month;
END;
$$ LANGUAGE plpgsql;

-- Function to log query usage
CREATE OR REPLACE FUNCTION log_query_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Update daily aggregation
    INSERT INTO usage_aggregations (organization_id, date, query_count, total_cost_cents)
    VALUES (NEW.organization_id, DATE(NEW.created_at), 1, COALESCE(NEW.cost_cents, 0))
    ON CONFLICT (organization_id, date) 
    DO UPDATE SET 
        query_count = usage_aggregations.query_count + 1,
        total_cost_cents = usage_aggregations.total_cost_cents + COALESCE(NEW.cost_cents, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for usage logging
CREATE TRIGGER log_query_usage_trigger 
AFTER INSERT ON queries 
FOR EACH ROW EXECUTE PROCEDURE log_query_usage();

-- Sample data for development
INSERT INTO organizations (name, slug, plan, max_queries_per_month) VALUES 
('Demo Organization', 'demo-org', 'pro', 2000),
('Enterprise Corp', 'enterprise-corp', 'enterprise', -1);

INSERT INTO users (organization_id, email, name, role) VALUES 
((SELECT id FROM organizations WHERE slug = 'demo-org'), 'demo@example.com', 'Demo User', 'owner'),
((SELECT id FROM organizations WHERE slug = 'enterprise-corp'), 'admin@enterprise.com', 'Enterprise Admin', 'owner');
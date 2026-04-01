-- ============================================================
-- SAAS BONUS DAYS IMPLEMENTATION
-- Automatically adds bonus days on the first subscription 
-- or renewal based on the plan type.
-- ============================================================

CREATE OR REPLACE FUNCTION process_subscription_payment(t_id TEXT, p_plan TEXT)
RETURNS VOID AS $$
DECLARE
    bonus_interval INTERVAL;
BEGIN
    -- Configure Bonus Days
    -- Croissance (BASIC) -> +10 days
    -- Elite / Pro (PREMIUM / ELITE) -> +15 days
    IF p_plan = 'BASIC' OR p_plan ILIKE '%croissance%' THEN
        bonus_interval := interval '10 days';
    ELSIF p_plan = 'PREMIUM' OR p_plan = 'ELITE' OR p_plan ILIKE '%elite%' THEN
        bonus_interval := interval '15 days';
    ELSE
        bonus_interval := interval '0 days';
    END IF;

    -- Update Tenant Status
    UPDATE tenants SET plan = p_plan, actif = true WHERE id = t_id::UUID;
    
    -- Update or Insert Subscription
    INSERT INTO subscriptions (tenant_id, plan, status, current_period_start, current_period_end)
    VALUES (
        t_id::UUID, 
        p_plan, 
        'active', 
        now(), 
        now() + interval '1 month' + bonus_interval -- Base 30 days + Bonus
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
        plan = p_plan,
        status = 'active',
        -- For renewals, we also add the bonus (gift per month or first month bonus?)
        -- Usually first month only, but here we'll apply it to the extension
        current_period_end = CASE 
            WHEN subscriptions.current_period_end < now() THEN now() + interval '1 month' + bonus_interval
            ELSE subscriptions.current_period_end + interval '1 month' + bonus_interval
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION process_subscription_payment TO authenticated;

NOTIFY pgrst, 'reload schema';

-- Insert Sample Tenant
INSERT INTO tenants (id, name, slug)
VALUES ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Royal Rent A Car', 'royal-rent-a-car')
ON CONFLICT (slug) DO NOTHING;

-- Insert Sample Cars
INSERT INTO cars (tenant_id, name, model, category, daily_rate, status)
VALUES 
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Toyota Corolla GLi', 2024, 'Sedan', 5000.00, 'available'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Honda Civic Oriel', 2025, 'Sedan', 8500.00, 'available'),
('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Kia Sportage', 2024, 'SUV', 12000.00, 'rented');
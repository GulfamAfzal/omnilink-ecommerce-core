-- ==========================================================
-- Global Distributed E-Commerce Order Management System
-- Azure SQL (T-SQL) Version
-- ==========================================================

-- 1. REGIONS
CREATE TABLE Regions (
    region_id INT PRIMARY KEY,
    region_name NVARCHAR(100) NOT NULL,
    country_code NVARCHAR(10),
    currency NVARCHAR(10),
    timezone NVARCHAR(50),
    status NVARCHAR(20) DEFAULT 'Active',
    CONSTRAINT chk_region_status CHECK (status IN ('Active', 'Inactive'))
);

-- 2. ROLES
CREATE TABLE ROLES (
    role_id INT PRIMARY KEY,
    role_name NVARCHAR(50) NOT NULL,
    permissions_level NVARCHAR(50)
);

-- 3. USERS (Starting at ID 206 as requested)
CREATE TABLE USERS (
    user_id INT PRIMARY KEY IDENTITY(206,1),
    username NVARCHAR(50) NOT NULL UNIQUE,
    email NVARCHAR(100) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    first_name NVARCHAR(50),
    last_name NVARCHAR(50),
    contact_number NVARCHAR(20),
    user_type NVARCHAR(20), 
    role_id INT,
    region_id INT,
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES ROLES(role_id),
    CONSTRAINT fk_user_region FOREIGN KEY (region_id) REFERENCES REGIONS(region_id)
);

-- 4. PAYMENT_METHOD
CREATE TABLE PAYMENT_METHOD (
    method_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    provider NVARCHAR(50) NOT NULL,
    account_mask NVARCHAR(20),
    expiry_date DATE,
    CONSTRAINT fk_payment_user FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);

-- 5. ADDRESS
CREATE TABLE ADDRESS (
    address_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    address_type NVARCHAR(50),
    street NVARCHAR(255) NOT NULL,
    city NVARCHAR(100) NOT NULL,
    province NVARCHAR(100),
    country NVARCHAR(100) NOT NULL,
    CONSTRAINT fk_address_user FOREIGN KEY (user_id) REFERENCES USERS(user_id)
);

-- 6. ORDERS
CREATE TABLE ORDERS (
    order_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    region_id INT NOT NULL,
    payment_id INT,
    order_date DATETIME2 DEFAULT GETDATE(),
    status NVARCHAR(20) DEFAULT 'Pending',
    total_amount DECIMAL(12, 2),
    shipping_snapshot NVARCHAR(MAX), -- Replaced CLOB
    CONSTRAINT fk_order_user FOREIGN KEY (user_id) REFERENCES USERS(user_id),
    CONSTRAINT fk_order_region FOREIGN KEY (region_id) REFERENCES REGIONS(region_id)
);

-- 7. ORDER_DETAIL (Links to NoSQL product_variant_id)
CREATE TABLE ORDER_DETAIL (
    detail_id INT PRIMARY KEY IDENTITY(1,1),
    order_id INT NOT NULL,
    product_variant_id NVARCHAR(50) NOT NULL, -- Logical link to MongoDB Atlas
    unit_price DECIMAL(10, 2) NOT NULL,
    quantity INT DEFAULT 1,
    CONSTRAINT fk_detail_order FOREIGN KEY (order_id) REFERENCES ORDERS(order_id)
);

-- 8. SHIPPING
CREATE TABLE SHIPPING (
    shipping_id INT PRIMARY KEY IDENTITY(1,1),
    order_id INT NOT NULL,
    tracking_id NVARCHAR(50) NOT NULL UNIQUE,
    courier_name NVARCHAR(100),
    status NVARCHAR(50) DEFAULT 'Pending',
    CONSTRAINT fk_shipping_order FOREIGN KEY (order_id) REFERENCES ORDERS(order_id)
);

-- 9. SHIPPING_HISTORY
CREATE TABLE SHIPPING_HISTORY (
    log_id INT PRIMARY KEY IDENTITY(1,1),
    shipping_id INT NOT NULL,
    location_name NVARCHAR(255),
    update_timestamp DATETIME2 DEFAULT GETDATE(),
    status_update NVARCHAR(100),
    CONSTRAINT fk_history_shipping FOREIGN KEY (shipping_id) REFERENCES SHIPPING(shipping_id)
);

-- 10. PAYMENT
CREATE TABLE PAYMENT (
    payment_id INT PRIMARY KEY IDENTITY(1,1),
    user_id INT NOT NULL,
    order_id INT,
    billing_id INT,
    amount DECIMAL(12, 2) NOT NULL,
    payment_date DATETIME2 DEFAULT GETDATE(),
    status NVARCHAR(50),
    CONSTRAINT fk_payment_user_acc FOREIGN KEY (user_id) REFERENCES USERS(user_id),
    CONSTRAINT fk_payment_order FOREIGN KEY (order_id) REFERENCES ORDERS(order_id)
);

-- 11. BILLINGS
CREATE TABLE BILLINGS (
    billing_id INT PRIMARY KEY IDENTITY(1,1),
    region_id INT NOT NULL,
    payment_id INT,
    store_id NVARCHAR(50) NOT NULL,
    billing_cycle NVARCHAR(20),
    total_due DECIMAL(12, 2) NOT NULL,
    status NVARCHAR(20),
    CONSTRAINT chk_billing_cycle CHECK (billing_cycle IN ('Monthly', 'Yearly')),
    CONSTRAINT fk_billing_region FOREIGN KEY (region_id) REFERENCES REGIONS(region_id),
    CONSTRAINT fk_billing_payment FOREIGN KEY (payment_id) REFERENCES PAYMENT(payment_id)
);

-- 12. TAXES
CREATE TABLE TAXES (
    tax_id INT PRIMARY KEY IDENTITY(1,1),
    region_id INT NOT NULL,
    order_id INT NOT NULL,
    detail_id INT NOT NULL, 
    billing_id INT,
    tax_type NVARCHAR(50),
    tax_amount DECIMAL(12, 2) NOT NULL,
    CONSTRAINT fk_tax_region FOREIGN KEY (region_id) REFERENCES REGIONS(region_id),
    CONSTRAINT fk_tax_order FOREIGN KEY (order_id) REFERENCES ORDERS(order_id),
    CONSTRAINT fk_tax_detail FOREIGN KEY (detail_id) REFERENCES ORDER_DETAIL(detail_id)
);
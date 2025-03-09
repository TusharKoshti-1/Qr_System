-- schema.sql
-- This script creates the necessary tables for the QR Ordering System.
-- It drops existing tables (if any) and then creates fresh ones.
-- Default data is inserted into the Role and settings tables.

-- Disable foreign key checks to allow dropping tables in any order
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `settings`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `MenuItems`;
DROP TABLE IF EXISTS `menu`;
DROP TABLE IF EXISTS `Login`;
DROP TABLE IF EXISTS `Role`;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- Create the Role table (must be created first)
-- =====================================================
CREATE TABLE `Role` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_type` varchar(100) NOT NULL,
  `created_on` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_on` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert default role data (admin)
INSERT INTO `Role` (`id`, `role_type`, `created_on`, `modified_on`, `is_deleted`)
VALUES (1, 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 0);

-- =====================================================
-- Create the Login table
-- =====================================================
CREATE TABLE `Login` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role_id` int DEFAULT NULL,
  `created_on` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_on` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `Login_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `Role` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =====================================================
-- Create the menu table
-- =====================================================
CREATE TABLE `menu` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `category` varchar(255) DEFAULT NULL,
  `create_on` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_on` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `image` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =====================================================
-- Create the MenuItems table
-- =====================================================
CREATE TABLE `MenuItems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `create_on` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_on` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  `image` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =====================================================
-- Create the orders table
-- =====================================================
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(255) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `items` json NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `payment_method` enum('Cash','Online') NOT NULL,
  `status` enum('Pending','Completed') DEFAULT 'Pending',
  `created_on` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `modified_on` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =====================================================
-- Create the settings table
-- =====================================================
CREATE TABLE `settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `restaurantName` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `operatingHours` varchar(100) DEFAULT NULL,
  `upiId` varchar(255) DEFAULT NULL,
  `isOpen` tinyint(1) DEFAULT '0',
  `profile_photo` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Insert default settings data
INSERT INTO `settings` (`id`, `restaurantName`, `address`, `phone`, `email`, `operatingHours`, `upiId`, `isOpen`, `created_at`, `updated_at`)
VALUES (1, 'My Restaurant', '123 Main Street', '123-456-7890', 'example@example.com', '9 AM - 9 PM', '12345678@ybl', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- =====================================================
-- End of schema
-- =====================================================

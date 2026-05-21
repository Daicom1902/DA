-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 20, 2026 at 06:17 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `datn_perfume`
--

-- --------------------------------------------------------

--
-- Table structure for table `brands`
--

CREATE TABLE `brands` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(120) NOT NULL,
  `slug` varchar(140) NOT NULL,
  `logo_url` varchar(500) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `brands`
--

INSERT INTO `brands` (`id`, `name`, `slug`, `logo_url`, `description`, `created_at`) VALUES
(12, 'Chanel', 'chanel', 'https://icolor.vn/wp-content/uploads/2024/08/chanel-2.png', NULL, '2026-03-05 02:32:22'),
(13, 'Dior', 'dior', 'https://mia.vn/media/uploads/tin-tuc/thuong-hieu-dior-2-1690478102.jpg', NULL, '2026-03-05 02:34:08'),
(14, 'Tom Ford', 'tom-ford', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSpFh2ooIUiWti5_KNCERMua7_WdL483nh2rg&s', NULL, '2026-03-05 02:35:02'),
(15, 'Hermes', 'hermes', 'https://athgroup.vn/upload/blocks/thumb_1920x0/ATH-kh%C3%A1m-ph%C3%A1-thi%E1%BA%BFt-k%E1%BA%BF-logo-hermes-7.png', NULL, '2026-03-05 02:35:49'),
(16, 'Versace', 'versace', 'https://file.hstatic.net/200000574619/file/lich-su-versace-2_590cf27433b346ad9f04e4dc61c7bebf_grande.jpg', NULL, '2026-03-05 02:36:48'),
(17, 'Lancome', 'lancome', 'https://mondialbrand.com/wp-content/uploads/2024/01/Lancome-logo-1.jpg', NULL, '2026-03-05 02:38:11'),
(18, 'Guerlain', 'guerlain', 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTcnXuoQ4FtYinN7-NfVd1ePr6iZrUdiLecyQ&s', NULL, '2026-03-05 02:38:55'),
(19, 'YSL', 'ysl', 'https://lh4.googleusercontent.com/proxy/2VuUp5BEMYsDWjgtrujT8wOK8P2xc0ye3gNcAOfqs-Q0rjYOiSdCbOOYhT-YxQSch4CcY9QOvtFmbVs9gaG0n_IM9-usCv7kxT4c-A', NULL, '2026-03-05 02:39:40'),
(20, 'D&G', 'dg', 'https://inkythuatso.com/uploads/images/2021/12/logo-dg-inkythuatso-08-16-54-31.jpg', NULL, '2026-03-05 02:41:14'),
(21, 'Giorgio Armani', 'giorgio-armani', 'https://i.pinimg.com/736x/6c/fb/09/6cfb09112eb8542e2e9c520df8789a1e.jpg', NULL, '2026-03-05 02:43:06'),
(23, 'Calvin Klein', 'calvin-klein', 'https://logowik.com/content/uploads/images/calvin-klein5506.jpg', NULL, '2026-03-20 06:00:17');

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `parent_id` int(10) UNSIGNED DEFAULT NULL,
  `description` text DEFAULT NULL,
  `sort_order` smallint(6) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `name`, `slug`, `parent_id`, `description`, `sort_order`, `created_at`) VALUES
(1, 'Eau de Parfum', 'eau-de-parfum', NULL, NULL, 1, '2026-02-25 02:21:28'),
(2, 'Eau de Toilette', 'eau-de-toilette', NULL, NULL, 2, '2026-02-25 02:21:28'),
(3, 'Extrait de Parfum', 'extrait-de-parfum', NULL, NULL, 3, '2026-02-25 02:21:28'),
(4, 'Cologne', 'cologne', NULL, NULL, 4, '2026-02-25 02:21:28'),
(5, 'Gift Set', 'gift-set', NULL, NULL, 5, '2026-02-25 02:21:28'),
(6, 'Home Fragrance', 'home-fragrance', NULL, NULL, 6, '2026-02-25 02:21:28');

-- --------------------------------------------------------

--
-- Table structure for table `comments`
--

CREATE TABLE `comments` (
  `id` int(10) UNSIGNED NOT NULL,
  `post_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `guest_name` varchar(120) DEFAULT NULL,
  `guest_email` varchar(191) DEFAULT NULL,
  `content` text NOT NULL,
  `is_approved` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `comments`
--

INSERT INTO `comments` (`id`, `post_id`, `user_id`, `guest_name`, `guest_email`, `content`, `is_approved`, `created_at`) VALUES
(1, 1, 1, NULL, NULL, 'ạdadjladjla', 1, '2026-02-26 01:58:42'),
(2, 1, 4, NULL, NULL, 'bgytvyt', 1, '2026-04-22 02:26:56');

-- --------------------------------------------------------

--
-- Table structure for table `concentrations`
--

CREATE TABLE `concentrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `concentrations`
--

INSERT INTO `concentrations` (`id`, `name`, `slug`, `created_at`) VALUES
(1, 'Parfum', 'parfum', '2026-03-05 03:06:24'),
(2, 'Eau de Parfum dạng xịt', 'eau-de-parfum-dang-xit', '2026-03-05 03:06:24'),
(3, 'Eau de Toilette (EDT)', 'eau-de-toilette-edt', '2026-03-05 03:06:24'),
(4, 'Eau de Cologne (EDC)', 'eau-de-cologne-edc', '2026-03-05 03:06:24'),
(5, 'Cologne', 'cologne', '2026-03-05 03:06:24'),
(6, 'EDT', 'edt', '2026-03-20 06:00:17'),
(7, 'EDP', 'edp', '2026-03-20 06:00:17');

-- --------------------------------------------------------

--
-- Table structure for table `contacts`
--

CREATE TABLE `contacts` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(120) NOT NULL,
  `email` varchar(191) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `subject` varchar(200) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `replied_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `contacts`
--

INSERT INTO `contacts` (`id`, `name`, `email`, `phone`, `subject`, `message`, `is_read`, `replied_at`, `created_at`) VALUES
(1, 'dai dao', 'dai202648@gmail.com', '0232424242', 'rwrwr', 'wrwr', 0, NULL, '2026-04-20 08:03:42');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `customer_name` varchar(120) NOT NULL,
  `customer_email` varchar(191) NOT NULL,
  `customer_phone` varchar(20) DEFAULT NULL,
  `recipient_name` varchar(120) DEFAULT NULL,
  `shipping_address` varchar(255) NOT NULL,
  `shipping_ward` varchar(100) DEFAULT NULL,
  `shipping_district` varchar(100) DEFAULT NULL,
  `shipping_city` varchar(100) NOT NULL,
  `shipping_service` varchar(100) DEFAULT NULL,
  `subtotal` decimal(15,2) NOT NULL,
  `discount_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `shipping_fee` decimal(15,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `total` decimal(15,2) NOT NULL,
  `promo_code_id` int(10) UNSIGNED DEFAULT NULL,
  `promo_code_used` varchar(50) DEFAULT NULL,
  `payment_method` enum('cod','atm_card','vietqr') NOT NULL DEFAULT 'cod',
  `payment_status` enum('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
  `status` enum('pending','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `confirmed_at` datetime DEFAULT NULL,
  `shipped_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `orders`
--

INSERT INTO `orders` (`id`, `user_id`, `customer_name`, `customer_email`, `customer_phone`, `recipient_name`, `shipping_address`, `shipping_ward`, `shipping_district`, `shipping_city`, `shipping_service`, `subtotal`, `discount_amount`, `shipping_fee`, `tax_amount`, `total`, `promo_code_id`, `promo_code_used`, `payment_method`, `payment_status`, `status`, `note`, `created_at`, `updated_at`, `confirmed_at`, `shipped_at`, `delivered_at`, `cancelled_at`) VALUES
(1, 9, 'Đào Khả Đại', '29@eaut.edu.vn', '093723727', NULL, 'Thôn 3 Xã Triệu Sơn Thanh Hóa', NULL, NULL, 'Thanh Hóa', NULL, 2999999.00, 0.00, 0.00, 0.00, 2999999.00, NULL, NULL, '', 'unpaid', 'pending', NULL, '2026-02-26 01:56:09', '2026-04-17 01:53:46', NULL, NULL, NULL, NULL),
(2, 9, 'Đào Khả Huynh', 'dai202648@gmail.com', '09876542', NULL, 'Thôn 3 ', 'Triệu Sơn', NULL, 'Thanh Hóa', NULL, 1292942.00, 0.00, 0.00, 0.00, 1292942.00, NULL, NULL, '', 'unpaid', 'pending', NULL, '2026-02-26 02:05:06', '2026-04-17 01:53:46', NULL, NULL, NULL, NULL),
(3, 9, 'Đào Khả Huynh', 'dai202648@gmail.com', '09876542', NULL, 'Thôn 2', 'Triệu Sơn', NULL, 'Thanh Hóa', NULL, 2999999.00, 0.00, 0.00, 0.00, 2999999.00, NULL, NULL, '', 'unpaid', 'pending', NULL, '2026-02-26 02:18:41', '2026-04-17 01:53:46', NULL, NULL, NULL, NULL),
(4, 9, 'Đào Khả Huynh', 'dai202648@gmail.com', '09876542', NULL, 'Thôn 2', 'Triệu Sơn', NULL, 'Thanh Hóa', NULL, 1292942.00, 0.00, 0.00, 0.00, 1292942.00, NULL, NULL, '', 'paid', '', NULL, '2026-02-26 02:19:44', '2026-04-17 01:53:46', NULL, NULL, NULL, NULL),
(5, 9, 'Đào Khả Huynh', 'dai202648@gmail.com', '09876542', NULL, 'Thôn 1', NULL, NULL, 'Thanh Hóa', NULL, 2999999.00, 0.00, 0.00, 0.00, 2999999.00, NULL, NULL, 'atm_card', 'unpaid', 'pending', NULL, '2026-02-26 02:29:51', '2026-04-17 01:53:46', NULL, NULL, NULL, NULL),
(6, 3, 'Đào Khả Huynh', 'dai202648@gmail.com', '09876542', NULL, 'Thôn 1', NULL, NULL, 'Thanh Hóa', NULL, 2999999.00, 0.00, 0.00, 0.00, 2999999.00, NULL, NULL, '', 'unpaid', 'pending', NULL, '2026-02-26 02:31:50', '2026-02-26 02:31:50', NULL, NULL, NULL, NULL),
(7, 3, 'Đào Khả Huynh', 'dai202648@gmail.com', '09876542', NULL, 'Thôn 5', NULL, NULL, 'Thanh Hoa', NULL, 2999999.00, 0.00, 0.00, 0.00, 2999999.00, NULL, NULL, 'atm_card', 'unpaid', 'pending', NULL, '2026-02-26 02:42:20', '2026-02-26 02:42:20', NULL, NULL, NULL, NULL),
(8, 3, 'Đào Khả Huynh', 'dai202648@gmail.com', '09876542', NULL, 'thôn 6', NULL, NULL, 'Thanh Hóa', NULL, 2999999.00, 0.00, 0.00, 0.00, 2999999.00, NULL, NULL, 'atm_card', 'unpaid', 'pending', NULL, '2026-02-26 02:53:04', '2026-02-26 02:53:04', NULL, NULL, NULL, NULL),
(9, 3, 'Đào Khả Huynh', 'dai202648@gmail.com', '09876542', NULL, 'Thôn 4', NULL, NULL, 'Thanh Hóa', NULL, 1292942.00, 0.00, 0.00, 0.00, 1292942.00, NULL, NULL, 'atm_card', 'unpaid', 'pending', NULL, '2026-02-26 02:56:27', '2026-02-26 02:56:27', NULL, NULL, NULL, NULL),
(10, 3, 'Đào Khả Huynh', 'dai202648@gmail.com', '09876542', NULL, 'hk', NULL, NULL, 'Thanh Hóa', NULL, 2999999.00, 0.00, 0.00, 0.00, 2999999.00, NULL, NULL, 'vietqr', 'unpaid', 'pending', NULL, '2026-02-26 03:11:04', '2026-02-26 03:11:04', NULL, NULL, NULL, NULL),
(11, 3, 'Đào Khả Huynh', 'dai202648@gmail.com', '09876542', NULL, 'iy', NULL, NULL, 'h', NULL, 2999999.00, 0.00, 0.00, 0.00, 2999999.00, NULL, NULL, 'atm_card', 'unpaid', '', NULL, '2026-02-26 03:20:19', '2026-04-17 02:55:57', '2026-04-17 09:55:57', NULL, NULL, NULL),
(12, 3, 'Đào Khả Huynh', 'dai202648@gmail.com', '09876542', NULL, 'ư', NULL, NULL, 's', NULL, 2999999.00, 0.00, 0.00, 0.00, 2999999.00, NULL, NULL, 'atm_card', 'unpaid', '', NULL, '2026-02-26 03:22:04', '2026-04-17 03:14:05', '2026-04-17 10:14:05', NULL, NULL, NULL),
(13, 3, 'Đào Khả Huynh', 'dai202648@gmail.com', '09876542', NULL, 'f', NULL, NULL, 'd', NULL, 2999999.00, 0.00, 0.00, 0.00, 2999999.00, NULL, NULL, 'atm_card', 'unpaid', 'processing', NULL, '2026-02-26 03:31:13', '2026-04-20 00:47:38', '2026-04-17 08:57:30', NULL, NULL, NULL),
(14, 3, 'Đào Khả Huynh', 'dai202648@gmail.com', '09876542', NULL, 'Số nhà 243', 'Dân lý', 'Triệu sơn', 'Thanh hóa', 'GHN', 900000.00, 0.00, 0.00, 0.00, 900000.00, NULL, NULL, 'cod', 'unpaid', 'shipped', NULL, '2026-04-16 03:10:45', '2026-04-18 09:40:27', '2026-04-17 10:14:02', '2026-04-17 10:08:35', NULL, NULL),
(15, 3, 'Đào Khả Huynh', 'dai202648@gmail.com', '09876542', NULL, 'Thôn 3', 'Dân lý  ', 'Triệu Sơn', 'Thanh Hóa', NULL, 800000.00, 0.00, 0.00, 0.00, 800000.00, NULL, NULL, 'atm_card', 'paid', 'processing', NULL, '2026-04-20 00:50:45', '2026-04-20 07:53:24', NULL, NULL, NULL, NULL),
(16, 4, 'Nguyen Van Test', 'test@gmail.com', '0901234567', NULL, '123 Test Street', 'Test Ward', 'Test District', 'Ho Chi Minh', NULL, 800000.00, 0.00, 0.00, 0.00, 800000.00, NULL, NULL, 'atm_card', 'paid', 'pending', NULL, '2026-04-20 01:14:10', '2026-04-23 09:53:04', NULL, NULL, NULL, NULL),
(17, NULL, 'Nguyen Van Test', 'test@gmail.com', '0901234567', NULL, '123 Test Street', 'Test Ward', 'Test District', 'Ho Chi Minh', NULL, 500000.00, 0.00, 0.00, 0.00, 500000.00, NULL, NULL, 'atm_card', 'unpaid', 'pending', NULL, '2026-04-20 01:22:59', '2026-04-20 01:22:59', NULL, NULL, NULL, NULL),
(18, 4, 'Test User', 'test@gmail.com', '0901234567', NULL, '123 Nguyen Hue', 'Ben Nghe', 'Quan 1', 'Ho Chi Minh', NULL, 800000.00, 0.00, 0.00, 0.00, 800000.00, NULL, NULL, 'atm_card', 'paid', 'pending', NULL, '2026-04-20 01:26:51', '2026-04-22 09:00:41', NULL, NULL, NULL, NULL),
(19, NULL, 'Test VNPay', 'test@gmail.com', '0901234567', NULL, '123 Test', 'Ward', 'District', 'HCM', NULL, 500000.00, 0.00, 0.00, 0.00, 500000.00, NULL, NULL, 'atm_card', 'unpaid', 'pending', NULL, '2026-04-20 01:45:26', '2026-05-19 05:50:05', NULL, NULL, NULL, NULL),
(20, 4, 'Test VNPay User', 'test@gmail.com', '0901234567', NULL, '123 Nguyen Hue', 'Ben Nghe', 'Quan 1', 'Ho Chi Minh', NULL, 800000.00, 0.00, 0.00, 0.00, 800000.00, NULL, NULL, 'atm_card', 'paid', 'pending', NULL, '2026-04-20 01:50:13', '2026-04-22 08:59:58', NULL, NULL, NULL, NULL),
(21, 4, 'Đào Khả Đại', '20224329@eaut.edu.vn', '0392434402', NULL, 'Thôn 3', 'Dân Lý ', 'Triệu Sơn ', 'Thanh Hóa', NULL, 1100000.00, 0.00, 0.00, 0.00, 1100000.00, NULL, NULL, 'atm_card', 'paid', 'pending', NULL, '2026-04-20 03:18:50', '2026-04-22 08:58:43', NULL, NULL, NULL, NULL),
(22, 4, 'Đào Khả Đại', '20224329@eaut.edu.vn', '09876567', NULL, 'Thôkhd', 's', 's', 's', NULL, 1800000.00, 0.00, 0.00, 0.00, 1800000.00, NULL, NULL, 'atm_card', 'paid', 'processing', NULL, '2026-04-20 03:58:47', '2026-05-19 05:50:53', NULL, NULL, NULL, NULL),
(23, 3, 'Đào Khả Huynh', 'dai202648@gmail.com', '09876542', NULL, 'fsfsf', 'sfsf', 'âf', 'âfg', NULL, 600000.00, 0.00, 0.00, 0.00, 600000.00, NULL, NULL, 'atm_card', 'unpaid', 'processing', NULL, '2026-04-21 00:49:30', '2026-04-25 00:49:08', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(10) UNSIGNED NOT NULL,
  `order_id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED DEFAULT NULL,
  `variant_id` int(10) UNSIGNED DEFAULT NULL,
  `product_name` varchar(200) NOT NULL,
  `size_label` varchar(20) DEFAULT NULL,
  `unit_price` decimal(15,2) NOT NULL,
  `quantity` smallint(5) UNSIGNED NOT NULL DEFAULT 1,
  `subtotal` decimal(15,2) NOT NULL,
  `image_url` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `variant_id`, `product_name`, `size_label`, `unit_price`, `quantity`, `subtotal`, `image_url`) VALUES
(1, 1, 2, NULL, 'hkdadad', NULL, 2999999.00, 1, 2999999.00, 'https://phucnguyen.vn/wp-content/uploads/2020/06/nong-do-trong-nuoc-hoa.jpg'),
(2, 2, 1, NULL, 'adhakha', NULL, 1292942.00, 1, 1292942.00, 'https://png.pngtree.com/thumb_back/fw800/background/20230328/pngtree-perfume-powder-purple-background-image_2120137.jpg'),
(3, 3, 2, NULL, 'hkdadad', NULL, 2999999.00, 1, 2999999.00, 'https://phucnguyen.vn/wp-content/uploads/2020/06/nong-do-trong-nuoc-hoa.jpg'),
(4, 4, 1, NULL, 'adhakha', NULL, 1292942.00, 1, 1292942.00, 'https://png.pngtree.com/thumb_back/fw800/background/20230328/pngtree-perfume-powder-purple-background-image_2120137.jpg'),
(5, 5, 2, NULL, 'hkdadad', NULL, 2999999.00, 1, 2999999.00, 'https://phucnguyen.vn/wp-content/uploads/2020/06/nong-do-trong-nuoc-hoa.jpg'),
(6, 6, 2, NULL, 'hkdadad', NULL, 2999999.00, 1, 2999999.00, 'https://phucnguyen.vn/wp-content/uploads/2020/06/nong-do-trong-nuoc-hoa.jpg'),
(7, 7, 2, NULL, 'hkdadad', NULL, 2999999.00, 1, 2999999.00, 'https://phucnguyen.vn/wp-content/uploads/2020/06/nong-do-trong-nuoc-hoa.jpg'),
(8, 8, 2, NULL, 'hkdadad', NULL, 2999999.00, 1, 2999999.00, 'https://phucnguyen.vn/wp-content/uploads/2020/06/nong-do-trong-nuoc-hoa.jpg'),
(9, 9, 1, NULL, 'adhakha', NULL, 1292942.00, 1, 1292942.00, 'https://png.pngtree.com/thumb_back/fw800/background/20230328/pngtree-perfume-powder-purple-background-image_2120137.jpg'),
(10, 10, 2, NULL, 'hkdadad', NULL, 2999999.00, 1, 2999999.00, 'https://phucnguyen.vn/wp-content/uploads/2020/06/nong-do-trong-nuoc-hoa.jpg'),
(11, 11, 2, NULL, 'hkdadad', NULL, 2999999.00, 1, 2999999.00, 'https://phucnguyen.vn/wp-content/uploads/2020/06/nong-do-trong-nuoc-hoa.jpg'),
(12, 12, 2, NULL, 'hkdadad', NULL, 2999999.00, 1, 2999999.00, 'https://phucnguyen.vn/wp-content/uploads/2020/06/nong-do-trong-nuoc-hoa.jpg'),
(13, 13, 2, NULL, 'hkdadad', NULL, 2999999.00, 1, 2999999.00, 'https://phucnguyen.vn/wp-content/uploads/2020/06/nong-do-trong-nuoc-hoa.jpg'),
(14, 14, 132, 18, 'Guerlain La Petite Robe Noire', '50ml', 900000.00, 1, 900000.00, 'https://xxivstore.com/wp-content/uploads/2020/06/La-petite-robe-noire-edp.png'),
(15, 15, 130, 11, 'Chanel No5', '30ml', 800000.00, 1, 800000.00, 'https://nuochoamc.com/upload/images/san-pham/79/chanel-no5-edp-100ml2.webp'),
(16, 16, 130, 11, 'Chanel No5', '30ml', 800000.00, 1, 800000.00, 'https://nuochoamc.com/upload/images/san-pham/79/chanel-no5-edp-100ml2.webp'),
(17, 17, 1, 1, 'Test Perfume', '100ml', 500000.00, 1, 500000.00, NULL),
(18, 18, 130, 11, 'Chanel No5', '30ml', 800000.00, 1, 800000.00, 'https://nuochoamc.com/upload/images/san-pham/79/chanel-no5-edp-100ml2.webp'),
(19, 19, 1, 1, 'Test', '100ml', 500000.00, 1, 500000.00, NULL),
(20, 20, 130, 11, 'Chanel No5', '30ml', 800000.00, 1, 800000.00, 'https://nuochoamc.com/upload/images/san-pham/79/chanel-no5-edp-100ml2.webp'),
(21, 21, 130, 12, 'Chanel No5', '50ml', 1100000.00, 1, 1100000.00, 'https://nuochoamc.com/upload/images/san-pham/79/chanel-no5-edp-100ml2.webp'),
(22, 22, 130, 13, 'Chanel No5', '100ml', 1800000.00, 1, 1800000.00, 'https://nuochoamc.com/upload/images/san-pham/79/chanel-no5-edp-100ml2.webp'),
(23, 23, 131, 15, 'Calvin Klein One', '50ml', 600000.00, 1, 600000.00, 'https://orchard.vn/wp-content/uploads/2014/06/calvin-klein-ck-one_2-1.jpg');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `otp` char(6) NOT NULL,
  `expires_at` datetime NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `type` enum('reset','verify') NOT NULL DEFAULT 'reset'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `password_reset_tokens`
--

INSERT INTO `password_reset_tokens` (`id`, `user_id`, `otp`, `expires_at`, `used`, `created_at`, `type`) VALUES
(1, 4, '656096', '2026-03-02 09:35:19', 1, '2026-03-02 02:20:19', 'reset'),
(2, 3, '920881', '2026-03-02 09:38:09', 1, '2026-03-02 02:23:09', 'reset'),
(3, 3, '137835', '2026-03-02 09:50:17', 1, '2026-03-02 02:35:17', 'reset'),
(4, 3, '923736', '2026-03-02 10:00:31', 1, '2026-03-02 02:45:31', 'reset'),
(5, 3, '311119', '2026-03-02 10:01:19', 1, '2026-03-02 02:46:19', 'reset'),
(6, 3, '923067', '2026-03-02 10:06:10', 1, '2026-03-02 02:51:10', 'reset'),
(7, 6, '188072', '2026-03-02 10:20:55', 0, '2026-03-02 03:05:55', 'verify'),
(8, 7, '972334', '2026-03-25 08:44:02', 0, '2026-03-25 01:29:02', 'verify'),
(9, 8, '151575', '2026-03-25 08:47:16', 0, '2026-03-25 01:32:16', 'verify'),
(10, 10, '491774', '2026-04-20 08:24:11', 0, '2026-04-20 01:09:11', 'verify'),
(11, 11, '349275', '2026-04-20 08:26:08', 0, '2026-04-20 01:11:08', 'verify'),
(13, 13, '535354', '2026-04-20 08:36:00', 0, '2026-04-20 01:21:00', 'verify');

-- --------------------------------------------------------

--
-- Table structure for table `posts`
--

CREATE TABLE `posts` (
  `id` int(10) UNSIGNED NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(280) NOT NULL,
  `content` longtext NOT NULL,
  `excerpt` text DEFAULT NULL,
  `cover_image` varchar(500) DEFAULT NULL,
  `author_id` int(10) UNSIGNED NOT NULL,
  `status` enum('draft','published') NOT NULL DEFAULT 'draft',
  `views` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `posts`
--

INSERT INTO `posts` (`id`, `title`, `slug`, `content`, `excerpt`, `cover_image`, `author_id`, `status`, `views`, `created_at`, `updated_at`) VALUES
(1, 'Hkahdad', 'hkahdad-1772071088322', 'skslladjlajdlajdla', 'jdsjda', 'https://img.freepik.com/premium-photo/bottle-perfume-with-flowers-pink-background_1142458-328.jpg', 1, 'published', 24, '2026-02-26 01:58:08', '2026-04-22 02:34:23');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(200) NOT NULL,
  `slug` varchar(220) NOT NULL,
  `brand_id` int(10) UNSIGNED DEFAULT NULL,
  `category_id` int(10) UNSIGNED DEFAULT NULL,
  `concentration_id` int(10) UNSIGNED DEFAULT NULL,
  `description` text DEFAULT NULL,
  `details` longtext DEFAULT NULL,
  `price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `old_price` decimal(15,2) DEFAULT NULL,
  `scent_intensity` tinyint(3) UNSIGNED DEFAULT NULL,
  `longevity` tinyint(3) UNSIGNED DEFAULT NULL,
  `sillage` tinyint(3) UNSIGNED DEFAULT NULL,
  `gender` enum('male','female','unisex') DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  `badge` varchar(50) DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT NULL,
  `review_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `slug`, `brand_id`, `category_id`, `concentration_id`, `description`, `details`, `price`, `old_price`, `scent_intensity`, `longevity`, `sillage`, `gender`, `image`, `badge`, `rating`, `review_count`, `is_active`, `is_featured`, `created_at`, `updated_at`) VALUES
(1, 'adhakha', 'adhakha-699e682074e81', NULL, NULL, NULL, 'fjkalfj', NULL, 0.00, NULL, NULL, NULL, NULL, NULL, 'https://png.pngtree.com/thumb_back/fw800/background/20230328/pngtree-perfume-powder-purple-background-image_2120137.jpg', 'NEW', 5.00, 0, 0, 0, '2026-02-24 20:10:24', '2026-03-20 06:14:06'),
(2, 'hkdadad', 'hkdadad-1772066626262', NULL, NULL, NULL, 'hđkad', NULL, 0.00, NULL, NULL, NULL, NULL, NULL, 'https://phucnguyen.vn/wp-content/uploads/2020/06/nong-do-trong-nuoc-hoa.jpg', 'SALE', 5.00, 1, 1, 0, '2026-02-26 00:43:46', '2026-03-05 02:03:20'),
(3, 'POUR MONSIEUR', 'pour-monsieur-1772681422728', 12, NULL, 2, 'Theo Gabrielle Chanel, đây là một phiên bản nam tính vượt trội. Một mùi hương chypre tươi mát vô tận. Lọ nước hoa được bao phủ bởi màu xám của vải fla-nen: thanh lịch, trang trọng, nền nã.\nĐây là loại nước hoa dành cho nam duy nhất được tạo nên bởi Mademoiselle lúc sinh thời, vào năm 1955.', 'THÀNH PHẦN\nMột mùi hương chypre thanh lịch và tinh tế.\nSự bùng nổ hương cam chanh tươi mát với những nốt hương chanh Sicily và hoa cam Tunisia, hé lộ tâm điểm hương cay nồng, sâu thẳm. Một mùi hương gỗ mộc mạc và tinh tế.\n\nCẢM HỨNG\nĐối với dòng nước hoa cho nam đầu tiên, Gabrielle Chanel lấy ý tưởng từ những người đàn ông đã đến trong cuộc đời cô.\n\nBoy Capel, Công tước Dimitri Pavlovich và Công tước xứ Westminster.\n\nBa câu chuyện tình đẹp nhất của cô. Ba người đàn ông tự nhiên, lịch lãm, chân thành, những người đã trau dồi và nuôi dưỡng trong cô nghệ thuật nội tâm độc đáo. Những người đàn ông có trái tim và thần thái.\n\nPOUR MONSIEUR truyền tải sự đơn giản tinh tế này. Đây là phong cách sang trọng kiểu Anh, một sự kết hợp giữa nét quyến rũ quý tộc và tinh tế. Hình ảnh nam tính trường tồn với thời gian.\n\nNGHỆ THUẬT NƯỚC HOA\nPhiên bản Eau de Toilette dạng xịt giúp dễ dàng sử dụng trực tiếp lên da hay quần áo.\n\nSử dụng kết hợp với các sản phẩm sữa tắm và chăm sóc da trong chu trình chăm sóc toàn diện để tăng cường và lưu giữ hương thơm.', 3950000.00, 4390000.00, NULL, NULL, NULL, 'male', 'https://www.chanel.com/images/t_one/w_0.55,h_0.55,c_crop/q_auto:good,f_autoplus,fl_lossy,dpr_1.1/w_1020/pour-monsieur-eau-de-toilette-3-4fl-oz--packshot-default-117460-9564890791966.jpg', 'HOT', 5.00, 0, 1, 0, '2026-03-05 03:30:22', '2026-03-11 03:06:11'),
(4, 'Dior Sauvage', '', 13, NULL, 6, 'Mùi hương nam tính, hoang dã, lưu hương lâu', 'Nhóm hương: Aromatic Fougère. Hương đầu: Bergamot. Hương cuối: Ambroxan, Cedar.', 800000.00, NULL, NULL, NULL, NULL, 'male', 'https://example.com/images/dior-sauvage.jpg', 'HOT', 4.80, 0, 0, 0, '2026-03-20 06:00:17', '2026-03-20 06:13:41'),
(129, 'Dior Sauvage', 'dior-sauvage-1774401933026', 13, NULL, 6, 'Mùi hương nam tính, hoang dã, lưu hương lâu', 'Nhóm hương: Aromatic Fougère. Hương đầu: Calabrian Bergamot. Hương giữa: Sichuan Pepper, Lavender. Hương cuối: Ambroxan, Cedar.', 1200000.00, NULL, NULL, NULL, NULL, 'male', 'https://xxivstore.com/wp-content/uploads/2020/05/Nuoc-hoa-Dior-Sauvage-EDT.png', 'HOT', 5.00, 1, 1, 0, '2026-03-25 01:25:33', '2026-04-22 08:50:46'),
(130, 'Chanel No5', 'chanel-no5-1774401933033', 12, NULL, 7, 'Biểu tượng nước hoa xa xỉ với hương hoa hồng và hoa nhài tinh tế', 'Nhóm hương: Floral Aldehyde. Hương đầu: Ylang-ylang, Neroli. Hương giữa: Hoa hồng, Hoa nhài. Hương cuối: Civet, Vetiver, Sandalwood.', 1800000.00, 2100000.00, NULL, NULL, NULL, 'female', 'https://nuochoamc.com/upload/images/san-pham/79/chanel-no5-edp-100ml2.webp', 'HOT', 5.00, 2, 1, 0, '2026-03-25 01:25:33', '2026-04-22 10:01:33'),
(131, 'Calvin Klein One', 'calvin-klein-one-1774401933048', 23, NULL, 6, 'Hương unisex tươi mát, trẻ trung, phù hợp mọi dịp', 'Nhóm hương: Aromatic Fougère. Hương đầu: Bergamot, Citrus. Hương giữa: Violet, Rose. Hương cuối: Sandalwood, Musk, Amber.', 900000.00, 1100000.00, NULL, NULL, NULL, 'unisex', 'https://orchard.vn/wp-content/uploads/2014/06/calvin-klein-ck-one_2-1.jpg', 'NEW', 5.00, 1, 1, 0, '2026-03-25 01:25:33', '2026-04-22 08:50:46'),
(132, 'Guerlain La Petite Robe Noire', 'guerlain-la-petite-robe-noire-1774401933056', 18, NULL, 7, 'Hương thơm nữ tính, ngọt ngào và tinh tế mang phong cách Paris', 'Nhóm hương: Floral Fruity. Hương đầu: Black Cherry, Bergamot. Hương giữa: Almond, Licorice. Hương cuối: Patchouli, Vetiver, White Musk.', 1400000.00, 1700000.00, NULL, NULL, NULL, 'female', 'https://xxivstore.com/wp-content/uploads/2020/06/La-petite-robe-noire-edp.png', 'SALE', 5.00, 1, 1, 0, '2026-03-25 01:25:33', '2026-04-22 02:17:35'),
(133, 'YSL Libre', 'ysl-libre-1774401933066', 19, NULL, 7, 'Biểu tượng của tự do và nữ quyền với hương oải hương Pháp quyến rũ', 'Nhóm hương: Floral Woody. Hương đầu: Mandarin, Petitgrain. Hương giữa: Lavender, Orange Blossom. Hương cuối: Musk, Vanilla, Cedarwood.', 1500000.00, 1800000.00, NULL, NULL, NULL, 'female', '/uploads/thiep-moi-ky-yeu-2026 (3)-1776674509905-91787231.png', 'SALE', 4.60, 0, 1, 0, '2026-03-25 01:25:33', '2026-04-20 08:42:02'),
(134, 'Tom Ford Black Orchid', 'tom-ford-black-orchid-1774401933075', 14, NULL, 7, 'Sang trọng, bí ẩn với hương lan đen quyến rũ và gỗ ấm áp', 'Nhóm hương: Oriental Floral. Hương đầu: Truffle, Ylang-ylang. Hương giữa: Black Orchid, Lotus. Hương cuối: Patchouli, Sandalwood, Vanilla.', 3000000.00, NULL, NULL, NULL, NULL, 'unisex', 'https://example.com/images/tf-black-orchid.jpg', 'NEW', 4.70, 0, 1, 0, '2026-03-25 01:25:33', '2026-03-25 01:25:33'),
(135, 'Versace Eros Flame', 'versace-eros-flame-1774401933084', 16, NULL, 7, 'Nam tính, đam mê với gỗ ấm và hương cam quýt bùng nổ', 'Nhóm hương: Woody Spicy. Hương đầu: Lemon, Neroli, Pepper. Hương giữa: Rosewood, Geranium. Hương cuối: Tonka Bean, Sandalwood, Musk.', 1400000.00, NULL, NULL, NULL, NULL, 'male', 'https://example.com/images/versace-eros.jpg', 'HOT', 4.50, 0, 1, 0, '2026-03-25 01:25:33', '2026-03-25 01:25:33'),
(136, 'Giorgio Armani Acqua di Gio', 'giorgio-armani-acqua-di-gio-1774401933094', 21, NULL, 6, 'Hương nước biển trong lành, tươi mát – lựa chọn hàng đầu cho quý ông năng động', 'Nhóm hương: Aquatic Aromatic. Hương đầu: Bergamot, Neroli, Sea Notes. Hương giữa: Rosemary, Persimmon. Hương cuối: Patchouli, White Musk.', 1100000.00, NULL, NULL, NULL, NULL, 'male', 'https://example.com/images/armani-acqua.jpg', 'HOT', 4.70, 0, 1, 0, '2026-03-25 01:25:33', '2026-03-25 01:25:33'),
(137, 'Hermes Twilly d\'Hermes', 'hermes-twilly-dhermes-1774401933102', 15, NULL, 7, 'Hương thơm tươi sáng, trẻ trung với gừng, hoa tuberose và gỗ đàn hương', 'Nhóm hương: Floral Spicy. Hương đầu: Ginger. Hương giữa: Tuberose. Hương cuối: Sandalwood.', 1900000.00, NULL, NULL, NULL, NULL, 'female', 'https://example.com/images/hermes-twilly.jpg', 'SALE', 4.50, 0, 1, 0, '2026-03-25 01:25:33', '2026-03-25 01:25:33'),
(138, 'Lancome La Vie Est Belle', 'lancome-la-vie-est-belle-1774401933129', 17, NULL, 7, 'Cuộc sống thật đẹp – hương thơm ngọt ngào hạnh phúc với praline và hoa iris', 'Nhóm hương: Floral Gourmand. Hương đầu: Pear, Blackcurrant. Hương giữa: Iris, Jasmine, Orange Blossom. Hương cuối: Praline, Vanilla, Patchouli.', 1300000.00, NULL, NULL, NULL, NULL, 'female', 'https://example.com/images/lancome-lavie.jpg', 'SALE', 4.60, 0, 1, 0, '2026-03-25 01:25:33', '2026-03-25 01:25:33');

-- --------------------------------------------------------

--
-- Table structure for table `product_images`
--

CREATE TABLE `product_images` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `url` varchar(500) NOT NULL,
  `alt_text` varchar(200) DEFAULT NULL,
  `sort_order` smallint(6) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_images`
--

INSERT INTO `product_images` (`id`, `product_id`, `url`, `alt_text`, `sort_order`) VALUES
(1, 2, 'https://img.freepik.com/premium-photo/summer-vanilla-perfume-background-photo-with-copy-space-bright-pink-vanilla-perfume-banner-summer-ai-generative_972272-1522.jpg?w=2000', 'fsfsf', 0),
(2, 2, 'https://img.freepik.com/premium-photo/photo-perfume-bottle-layout-cosmetic-product_185667-19347.jpg', 'fafa', 1),
(3, 3, 'https://www.chanel.com/images/t_one/t_fnbedito/q_auto:good,f_auto,fl_lossy,dpr_1.1/w_1020/pour-monsieur-eau-de-toilette-3-4fl-oz--packshot-alternative-v1-117460-9564955869214.jpg', NULL, 0),
(4, 129, 'https://bizweb.dktcdn.net/100/447/196/products/nuoc-hoa-nam-dior-sauvage-edt-7.jpg?v=1712133702663', NULL, 0),
(5, 129, 'https://orchard.vn/wp-content/uploads/2018/04/dior-sauvage-edp_2.jpg', NULL, 1),
(6, 129, 'https://vilip.vn/wp-content/uploads/2022/07/nuoc-hoa-nam-dior-sauvage-eau-de-parfum-8.png', NULL, 2),
(7, 130, 'https://orchard.vn/wp-content/uploads/2014/06/chanel-no5-edp_7.jpg', NULL, 0),
(9, 130, 'https://orchard.vn/wp-content/uploads/2014/06/chanel-no5-edp_4.jpg', NULL, 2),
(10, 130, 'https://hadoha.com/wp-content/uploads/2024/12/Nuoc-Hoa-Chanel-No5-EDP-cua-Phap-cho-nu-3.webp', NULL, 2),
(11, 131, 'https://media.hcdn.vn/wysiwyg/Chau/nuoc-hoa-nam-nu-calvin-klein-one-edt-50ml-1.jpg', NULL, 0),
(12, 131, 'https://nuochoamc.com/upload/images/bai-viet/66/ck-one.webp', NULL, 1),
(13, 132, 'https://cdn.vuahanghieu.com/unsafe/0x900/left/top/smart/filters:quality(90)/https://admin.vuahanghieu.com/upload/product/2024/01/nuoc-hoa-nu-guerlain-paris-la-petite-robe-noire-ma-premiere-robe-edp-100ml-65a5dcbf22c71-16012024083247.jpg', NULL, 0),
(14, 132, 'https://mfparis.vn/wp-content/uploads/2022/03/nuoc-hoa-auth-guerlain-la-petite-robe-noire-edp-100ml-271408214_471641561168147_7310494104451192607_n-mfparis.jpg', NULL, 1),
(15, 132, 'https://vongroup.vn/wp-content/uploads/2020/09/Nuoc-hoa-nu-Guerlain-La-Petite-Robe-Noire-Eau-Fraich-EDP-50ml-chinh-hang-gia-re.jpg', NULL, 2),
(16, 132, 'https://authentic-shoes.com/wp-content/uploads/2023/04/image_-_2022-01-06t133236.976_8a54486bd7bd4302ba5a39f0437c7958.png', NULL, 3);

-- --------------------------------------------------------

--
-- Table structure for table `product_variants`
--

CREATE TABLE `product_variants` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `size_label` varchar(20) NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `old_price` decimal(15,2) DEFAULT NULL,
  `stock` int(11) NOT NULL DEFAULT 0,
  `sku` varchar(80) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_variants`
--

INSERT INTO `product_variants` (`id`, `product_id`, `size_label`, `price`, `old_price`, `stock`, `sku`, `is_active`) VALUES
(1, 2, '30ml', 1000000.00, 1500000.00, 100, NULL, 1),
(2, 2, '70ml', 1790000.00, 1990000.00, 100, NULL, 1),
(3, 2, '100ml', 2500000.00, 2900000.00, 98, NULL, 1),
(4, 3, '30ml', 2890000.00, 3490000.00, 100, NULL, 1),
(5, 3, '70ml', 2890000.00, 3490000.00, 100, NULL, 1),
(6, 3, '100ml', 3950000.00, 4390000.00, 101, NULL, 1),
(7, 4, '50ml', 800000.00, 950000.00, 75, 'DIOR-SAUV-001', 0),
(8, 4, '100ml', 1200000.00, 1500000.00, 50, 'DIOR-SAUV-002', 0),
(9, 4, '200ml', 1800000.00, 2100000.00, 20, 'DIOR-SAUV-003', 0),
(11, 130, '30ml', 800000.00, 950000.00, 50, 'CHANEL-NO5-001', 1),
(12, 130, '50ml', 1100000.00, 1300000.00, 40, 'CHANEL-NO5-002', 1),
(13, 130, '100ml', 1800000.00, 2100000.00, 25, 'CHANEL-NO5-003', 1),
(14, 131, '30ml', 450000.00, 550000.00, 70, 'CK-ONE-001', 1),
(15, 131, '50ml', 600000.00, 750000.00, 60, 'CK-ONE-002', 1),
(16, 131, '100ml', 900000.00, 1100000.00, 45, 'CK-ONE-003', 1),
(17, 132, '30ml', 700000.00, 850000.00, 40, 'GUE-LPRN-001', 1),
(18, 132, '50ml', 900000.00, 1100000.00, 30, 'GUE-LPRN-002', 1),
(19, 132, '100ml', 1400000.00, 1700000.00, 20, 'GUE-LPRN-003', 1),
(20, 133, '30ml', 700000.00, 850000.00, 45, 'YSL-LIB-001', 1),
(21, 133, '50ml', 950000.00, 1150000.00, 35, 'YSL-LIB-002', 1),
(22, 133, '100ml', 1500000.00, 1800000.00, 30, 'YSL-LIB-003', 1),
(23, 134, '30ml', 1500000.00, NULL, 25, 'TF-BO-001', 1),
(24, 134, '50ml', 2000000.00, NULL, 20, 'TF-BO-002', 1),
(25, 134, '100ml', 3000000.00, NULL, 12, 'TF-BO-003', 1),
(26, 135, '30ml', 650000.00, 800000.00, 50, 'VER-ERF-001', 1),
(27, 135, '50ml', 900000.00, 1100000.00, 40, 'VER-ERF-002', 1),
(28, 135, '100ml', 1400000.00, 1700000.00, 25, 'VER-ERF-003', 1),
(29, 136, '30ml', 550000.00, 680000.00, 60, 'ARM-ADG-001', 1),
(30, 136, '50ml', 750000.00, 900000.00, 50, 'ARM-ADG-002', 1),
(31, 136, '100ml', 1100000.00, 1350000.00, 35, 'ARM-ADG-003', 1),
(32, 137, '30ml', 900000.00, 1100000.00, 30, 'HER-TWI-001', 1),
(33, 137, '50ml', 1200000.00, 1450000.00, 25, 'HER-TWI-002', 1),
(34, 137, '100ml', 1900000.00, 2300000.00, 18, 'HER-TWI-003', 1),
(35, 138, '30ml', 620000.00, 750000.00, 45, 'LAN-LVB-001', 1),
(36, 138, '50ml', 850000.00, 1000000.00, 35, 'LAN-LVB-002', 1),
(37, 138, '100ml', 1300000.00, 1600000.00, 25, 'LAN-LVB-003', 1),
(38, 129, '30ml', 900000.00, 1300000.00, 40, NULL, 1),
(39, 129, '70ml', 2290000.00, 3390000.00, 100, NULL, 1);

-- --------------------------------------------------------

--
-- Table structure for table `promo_codes`
--

CREATE TABLE `promo_codes` (
  `id` int(10) UNSIGNED NOT NULL,
  `code` varchar(50) NOT NULL,
  `discount_type` enum('percent','fixed') NOT NULL DEFAULT 'percent',
  `discount_value` decimal(10,2) NOT NULL,
  `min_order_value` decimal(15,2) DEFAULT NULL,
  `max_uses` int(11) DEFAULT NULL,
  `used_count` int(11) NOT NULL DEFAULT 0,
  `expires_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `promo_codes`
--

INSERT INTO `promo_codes` (`id`, `code`, `discount_type`, `discount_value`, `min_order_value`, `max_uses`, `used_count`, `expires_at`, `is_active`, `created_at`) VALUES
(1, 'SAVE20', 'percent', 20.00, 500000.00, NULL, 0, NULL, 1, '2026-02-25 02:21:28'),
(2, 'WELCOME10', 'percent', 10.00, 0.00, NULL, 0, NULL, 1, '2026-02-25 02:21:28'),
(3, 'FREESHIP', 'fixed', 30000.00, 0.00, NULL, 0, NULL, 1, '2026-02-25 02:21:28');

-- --------------------------------------------------------

--
-- Table structure for table `reviews`
--

CREATE TABLE `reviews` (
  `id` int(10) UNSIGNED NOT NULL,
  `product_id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED DEFAULT NULL,
  `author_name` varchar(120) NOT NULL,
  `rating` tinyint(3) UNSIGNED NOT NULL,
  `comment` text DEFAULT NULL,
  `is_approved` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ;

--
-- Dumping data for table `reviews`
--

INSERT INTO `reviews` (`id`, `product_id`, `user_id`, `author_name`, `rating`, `comment`, `is_approved`, `created_at`) VALUES
(1, 2, 3, 'Đào Khả Huynh', 5, 'rất tốt', 1, '2026-03-05 02:03:06'),
(2, 132, 4, 'Đào Khả Đại', 5, 'cưefwfwf', 1, '2026-04-22 02:17:15'),
(3, 130, 4, 'Đào Khả Đại', 5, 'hcshcskc', 1, '2026-04-22 08:20:46'),
(4, 129, 4, 'Đào Khả Đại', 5, 'scacac', 1, '2026-04-22 08:37:06'),
(7, 131, 4, 'Đào Khả Đại', 5, 'ghjghg', 1, '2026-04-22 08:50:33'),
(10, 129, 3, 'Đào Khả Huynh', 5, 'ssfsf', 1, '2026-04-22 09:51:15'),
(11, 130, 3, 'Đào Khả Huynh', 5, 'Sản phẩm rất tốt', 1, '2026-04-22 10:01:07');

-- --------------------------------------------------------

--
-- Table structure for table `shopping_carts`
--

CREATE TABLE `shopping_carts` (
  `id` int(10) UNSIGNED NOT NULL,
  `user_id` int(10) UNSIGNED NOT NULL,
  `items` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '[]' CHECK (json_valid(`items`)),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `shopping_carts`
--

INSERT INTO `shopping_carts` (`id`, `user_id`, `items`, `updated_at`) VALUES
(1, 3, '[]', '2026-05-03 09:50:36'),
(2, 4, '[{\"product_id\":129,\"variant_id\":null,\"product_name\":\"Dior Sauvage\",\"brand\":\"Dior\",\"size_label\":null,\"unit_price\":\"1200000.00\",\"image_url\":\"https://xxivstore.com/wp-content/uploads/2020/05/Nuoc-hoa-Dior-Sauvage-EDT.png\",\"quantity\":1,\"id\":1779172646166},{\"product_id\":132,\"variant_id\":18,\"product_name\":\"Guerlain La Petite Robe Noire\",\"brand\":\"Guerlain\",\"size_label\":\"50ml\",\"unit_price\":\"900000.00\",\"image_url\":\"https://xxivstore.com/wp-content/uploads/2020/06/La-petite-robe-noire-edp.png\",\"quantity\":1,\"id\":1779202414138},{\"product_id\":2,\"variant_id\":1,\"product_name\":\"hkdadad\",\"brand\":null,\"size_label\":\"30ml\",\"unit_price\":\"1000000.00\",\"image_url\":\"https://phucnguyen.vn/wp-content/uploads/2020/06/nong-do-trong-nuoc-hoa.jpg\",\"quantity\":1,\"id\":1779239887254}]', '2026-05-20 02:03:36'),
(3, 1, '[]', '2026-05-19 06:38:39'),
(4, 9, '[]', '2026-04-17 01:53:51'),
(5, 14, '[]', '2026-04-25 02:07:48');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(10) UNSIGNED NOT NULL,
  `full_name` varchar(120) NOT NULL,
  `email` varchar(191) NOT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `avatar_url` varchar(500) DEFAULT NULL,
  `role` enum('admin','manager','staff','customer') NOT NULL DEFAULT 'customer',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `google_id` varchar(255) DEFAULT NULL,
  `avatar_url_oauth` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password_hash`, `phone`, `avatar_url`, `role`, `is_active`, `created_at`, `updated_at`, `google_id`, `avatar_url_oauth`) VALUES
(1, 'Admin', 'admin@parfume.vn', '$2b$12$UkFdReTg2Mhl9NsoTqnQMe515aksUH4VO4nj2AXtuoy.EIVeKeB9S', NULL, NULL, 'admin', 1, '2026-02-25 02:21:28', '2026-04-23 02:48:21', NULL, NULL),
(2, 'Đào Khả Đại', '29@eaut.edu.vn', '$2y$12$3EZUaDAeimZAPxsmF061LOvEYeV9w6Qfn4Yg8ShU2UOvtwGMn6Uj2', '093723727', NULL, 'customer', 0, '2026-02-24 20:11:41', '2026-04-23 09:25:41', NULL, NULL),
(3, 'Đào Khả Huynh', 'dai202648@gmail.com', '$2b$12$nV5yMCjy49LbmhDZ9UmWHe8KIUmauMgLXqZvNzIH90hogwiCJ28Ge', '09876542', 'https://lh3.googleusercontent.com/a/ACg8ocKni_Bv3LnDz_aXOfoTGcDG9SXonb69ePqfCG3ZDYthuoXNZQ=s96-c', 'customer', 1, '2026-02-26 02:04:19', '2026-03-02 02:52:39', '107406928427555749785', NULL),
(4, 'Đào Khả Đại', '20224329@eaut.edu.vn', '$2b$12$wYwEm/rMZ5JOQZENj38fJOTTGF3keWsSxH0I0mzF17q0MDqM6z4bG', NULL, 'https://lh3.googleusercontent.com/a/ACg8ocINSyfvdmDlfD5KymnvljseLwL49h0024Vesm6USyIc957rQw=s96-c', 'customer', 1, '2026-03-02 02:06:59', '2026-04-23 09:31:28', '108398461368192881153', NULL),
(5, 'Khả Cường Đào', 'daokhacuong78@gmail.com', NULL, NULL, 'https://lh3.googleusercontent.com/a/ACg8ocJHeaM3jPq06vpgk-CNGQelBcG230WxmFYIk0m5SsLpDlzG4Q=s96-c', 'customer', 1, '2026-03-02 02:12:19', '2026-04-23 09:25:36', '108659664479230808509', NULL),
(6, 'Đào Khả Dung', 'dwjdwdjowd@gmail.com', '$2b$12$8tlEYg6Y0lhBIOxrqN99butIqtYky7ag1afO8SyqKpAqL4ABQY0gy', '09876545', NULL, 'customer', 0, '2026-03-02 03:05:55', '2026-03-02 03:05:55', NULL, NULL),
(7, 'Admin TesterAdmin Tester', 'admin@admin.com', '$2b$12$x8Fpf2UVEtbQcfesUc9M.ufq6qLlJSGieXF.VmK/RZRob6tpJ7Qx.', '0123456789', NULL, 'customer', 0, '2026-03-25 01:29:02', '2026-03-25 01:29:02', NULL, NULL),
(8, 'Test Admin', 'testadmin@example.com', '$2b$12$i3urkUwUkkEDR4v1hgm9Be48wjyxcwVQp/6zyTIokMHLnK3kkAXgW', '0987654321', NULL, 'customer', 0, '2026-03-25 01:32:16', '2026-03-25 01:32:16', NULL, NULL),
(9, 'Test Customer', 'test@example.com', '$2b$12$/HZo1nLuEJDjJOfR4liUNeyA9NoCBKWLUfADgbaGymSvjIzk5kkVC', '0987654321', NULL, 'customer', 1, '2026-04-17 01:52:33', '2026-04-17 01:52:33', NULL, NULL),
(10, 'Nguyen Van Test', 'testmomo@example.com', '$2b$12$UU8HT8GLOq9DYwoqM7Vn.OUe9yLr.poDMSdiuBztbFjTkqBuyBx.e', '0901234567', NULL, 'customer', 0, '2026-04-20 01:09:11', '2026-04-20 01:09:11', NULL, NULL),
(11, 'Nguyen Van Test', 'testmomo4@example.com', '$2b$12$maiUlKwFHyZfvNa08d/SH.AyIHTeZpJvF.iwBuHb.oBOvmJhiiat2', '0912345678', NULL, 'customer', 0, '2026-04-20 01:11:08', '2026-04-20 01:11:08', NULL, NULL),
(13, 'Nguyen Van Test', 'test@gmail.com', '$2b$12$F7HnfZLxGkBJ/8Sty4mGsO/x3Oc0AqcFlwRDZ2GskMe9u.wgdFiKy', '0901234567', NULL, 'customer', 0, '2026-04-20 01:21:00', '2026-04-23 09:17:13', NULL, NULL),
(14, 'Đào thu Phương', '9@eaut.edu.vn', '$2b$12$JO6fKQmqdBifzV28HX9LpOXYFtS8gPpErUejH.XXDgAYRX5LH3Pa6', '09877887668', NULL, 'staff', 1, '2026-04-23 09:49:19', '2026-04-23 09:49:19', NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `brands`
--
ALTER TABLE `brands`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_brands_slug` (`slug`);

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_categories_slug` (`slug`),
  ADD KEY `idx_categories_parent` (`parent_id`);

--
-- Indexes for table `comments`
--
ALTER TABLE `comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_comments_post` (`post_id`);

--
-- Indexes for table `concentrations`
--
ALTER TABLE `concentrations`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_concentrations_slug` (`slug`),
  ADD UNIQUE KEY `uq_concentrations_name` (`name`);

--
-- Indexes for table `contacts`
--
ALTER TABLE `contacts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_contacts_email` (`email`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_orders_user` (`user_id`),
  ADD KEY `idx_orders_status` (`status`),
  ADD KEY `idx_orders_email` (`customer_email`),
  ADD KEY `fk_orders_promo_code` (`promo_code_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_items_order` (`order_id`),
  ADD KEY `idx_order_items_product` (`product_id`),
  ADD KEY `fk_order_items_variant` (`variant_id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_prt_user` (`user_id`);

--
-- Indexes for table `posts`
--
ALTER TABLE `posts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_posts_slug` (`slug`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_products_slug` (`slug`),
  ADD KEY `idx_products_brand` (`brand_id`),
  ADD KEY `idx_products_category` (`category_id`),
  ADD KEY `idx_products_active` (`is_active`),
  ADD KEY `fk_products_concentration` (`concentration_id`),
  ADD KEY `idx_products_gender` (`gender`);

--
-- Indexes for table `product_images`
--
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_images_product` (`product_id`);

--
-- Indexes for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_variant_sku` (`sku`),
  ADD KEY `idx_variants_product` (`product_id`);

--
-- Indexes for table `promo_codes`
--
ALTER TABLE `promo_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_promo_code` (`code`);

--
-- Indexes for table `reviews`
--
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reviews_product` (`product_id`),
  ADD KEY `idx_reviews_user` (`user_id`);

--
-- Indexes for table `shopping_carts`
--
ALTER TABLE `shopping_carts`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_carts_user` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_users_email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `brands`
--
ALTER TABLE `brands`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `comments`
--
ALTER TABLE `comments`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `concentrations`
--
ALTER TABLE `concentrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `contacts`
--
ALTER TABLE `contacts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- AUTO_INCREMENT for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `posts`
--
ALTER TABLE `posts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=139;

--
-- AUTO_INCREMENT for table `product_images`
--
ALTER TABLE `product_images`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `product_variants`
--
ALTER TABLE `product_variants`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT for table `promo_codes`
--
ALTER TABLE `promo_codes`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `reviews`
--
ALTER TABLE `reviews`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `shopping_carts`
--
ALTER TABLE `shopping_carts`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_promo_code` FOREIGN KEY (`promo_code_id`) REFERENCES `promo_codes` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_order_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `fk_prt_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `products`
--
ALTER TABLE `products`
  ADD CONSTRAINT `fk_products_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_products_concentration` FOREIGN KEY (`concentration_id`) REFERENCES `concentrations` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `product_images`
--
ALTER TABLE `product_images`
  ADD CONSTRAINT `fk_product_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_variants`
--
ALTER TABLE `product_variants`
  ADD CONSTRAINT `fk_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reviews`
--
ALTER TABLE `reviews`
  ADD CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `shopping_carts`
--
ALTER TABLE `shopping_carts`
  ADD CONSTRAINT `fk_carts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

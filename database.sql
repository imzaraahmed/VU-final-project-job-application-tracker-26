-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: jat_v2
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `job_id` int NOT NULL,
  `document_name` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL,
  `file_path` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `job_id` (`job_id`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`job_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
INSERT INTO `documents` VALUES (1,3,'resume','resume','uploads/1777356673449-admit card - governer sindh program.pdf','2026-04-28 06:11:13'),(2,4,'resume','resume','uploads/1778018600831-admit card - governer sindh program.pdf','2026-05-05 22:03:20'),(3,4,'cover letter','cover_letter','uploads/1778018600862-hec-test-topics.pdf','2026-05-05 22:03:20'),(4,5,'resume','resume','uploads/1778018829592-admit card - governer sindh program.pdf','2026-05-05 22:07:09'),(5,5,'cover letter','cover_letter','uploads/1778018829624-hec-test-topics.pdf','2026-05-05 22:07:09'),(6,6,'resume','resume','uploads/1778051367707-admit card - governer sindh program.pdf','2026-05-06 07:09:27'),(7,6,'cover letter','cover_letter','uploads/1778051367740-hec-test-topics.pdf','2026-05-06 07:09:27'),(8,7,'resume','resume','uploads/1778134409680-admit card - governer sindh program.pdf','2026-05-07 06:13:29'),(9,7,'cover letter','cover_letter','uploads/1778134409713-hec-test-topics.pdf','2026-05-07 06:13:29'),(10,10,'Resume for Google','resume','uploads/1778419135556-DSTP3.0-Batch-03_UIX302_1.pdf','2026-05-10 13:18:55'),(11,10,'CoverLetter for Google','cover_letter','uploads/1778419135609-DSTP3.0-Batch-03_UIX302_1.pdf','2026-05-10 13:18:55'),(12,16,'Resume','resume','uploads/1778433556897-DSTP3.0-Batch-03_UIX302_1.pdf','2026-05-10 17:19:16'),(13,16,'Cover Letter','cover_letter','uploads/1778433569920-DSTP3.0-Batch-03_UIX302_1.pdf','2026-05-10 17:19:29');
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `job_id` int NOT NULL AUTO_INCREMENT,
  `job_title` varchar(255) NOT NULL,
  `company_name` varchar(255) NOT NULL,
  `job_location` varchar(255) DEFAULT NULL,
  `job_type` varchar(100) DEFAULT NULL,
  `salary_range` varchar(100) DEFAULT NULL,
  `job_description` text,
  `requirements` text,
  `posted_date` date DEFAULT NULL,
  `application_deadline` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(50) DEFAULT NULL,
  `user_id` int DEFAULT NULL,
  PRIMARY KEY (`job_id`),
  KEY `fk_jobs_user` (`user_id`),
  CONSTRAINT `fk_jobs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
INSERT INTO `jobs` VALUES (1,'Frontend Developer','ABC Company','Karachi','Full-time','80k-120k','Develop UI','HTML, CSS, JS','2026-04-18','2026-05-01','2026-04-18 19:10:18',NULL,NULL),(2,'designer','smit','karachi','parttime','20000','ui-ux designer','bachlore','2026-04-20','2026-12-09','2026-04-20 05:43:45',NULL,NULL),(3,'designer','hrc','karachi','parttime','20000','ggggg','jjjjj','2026-04-27','2026-04-27','2026-04-28 06:11:13','Applied',NULL),(4,'developer','rbc','karachi','parttime','20000','wwww','wwww','2026-05-06','2026-05-08','2026-05-05 22:03:20','Applied',12),(5,'designer','zz','karachi','parttime','20000','sss','sss','2026-05-06','2026-05-12','2026-05-05 22:07:09','Applied',14),(6,'ali','cc','lahore','parttime','20000','eeee','ttt','2026-05-07','2026-05-09','2026-05-06 07:09:27','Applied',14),(7,'designer','vv','karachi','parttime','20000','cc','cc','2026-05-07','2026-05-10','2026-05-07 06:13:29','Interview Call',15),(8,'designer','google','usa','remote','10','testing','degree','2026-05-10','2026-05-11','2026-05-09 19:39:45','Not Applied',16),(9,'front-end developer','google','karachi','parttime','20000',NULL,NULL,'2026-05-10','2026-05-10','2026-05-09 19:46:12','Not Applied',17),(10,'Front-End Developer','Google','usa','remote','1000','I have applied at this job','BS in computer','2026-05-08','2026-05-09','2026-05-10 13:18:55','Applied',20),(11,'Jr. Front-End Developer','Amazon','Karachi','Full Time','3000',NULL,NULL,'2026-05-10','2026-05-11','2026-05-10 14:05:05','Interview Call',20),(12,'Full-Stack Developer','Microsoft','Lahore','Internship','5000',NULL,NULL,'2026-05-10','2026-05-11','2026-05-10 14:06:56','Test Call',20),(13,'React.js devloper','VU','Lahore','Remote',NULL,NULL,NULL,'2026-05-10','2026-05-11','2026-05-10 14:41:50','Not Applied',20),(14,'Teacher','NED','Karachi','Part Time','5000',NULL,NULL,'2026-05-10','2026-05-11','2026-05-10 15:05:17','Test Call',20),(15,'Back-end developer','Awanza','Karachi','Full Time','2000',NULL,NULL,'2026-05-10','2026-05-11','2026-05-10 15:18:19','Test Call',20),(16,'Internee','Call Center','Karachi','Remote','5000',NULL,NULL,'2026-05-09','2026-05-10','2026-05-10 15:20:52','Offer Received',20);
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `reminder_id` int DEFAULT NULL,
  `job_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text,
  `is_read` tinyint(1) DEFAULT '0',
  `sent_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `reminder_id` (`reminder_id`),
  KEY `job_id` (`job_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`reminder_id`) REFERENCES `reminders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notifications_ibfk_3` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`job_id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,14,1,5,'Reminder: interview deadline','i have to give it',0,'2026-05-10 00:34:35','2026-05-09 19:34:35','2026-05-09 19:34:35'),(2,15,2,7,'Reminder: interview','vv',0,'2026-05-10 00:34:35','2026-05-09 19:34:35','2026-05-09 19:34:35'),(3,16,3,8,'Reminder: designer job','applied before 11 may',0,'2026-05-10 00:42:27','2026-05-09 19:42:27','2026-05-09 19:42:27'),(4,17,4,9,'Reminder: front-end job apply','apply before tomorrow',0,'2026-05-10 00:48:27','2026-05-09 19:48:27','2026-05-09 19:48:27'),(5,20,5,10,'Reminder: Interview Call','I have to give online interview at Monday',1,'2026-05-10 18:22:06','2026-05-10 13:22:06','2026-05-10 16:30:41'),(6,20,6,15,'Reminder: Test Call Received','I got written and coding test call, on Monday',1,'2026-05-10 20:31:55','2026-05-10 15:31:55','2026-05-10 16:30:41'),(7,20,7,13,'Reminder: Applied before Next Monday','I have to applied on this job before next monday',1,'2026-05-10 20:35:55','2026-05-10 15:35:55','2026-05-10 16:30:41'),(8,20,5,10,'Reminder: Interview Call','I have to give online interview at Monday',0,'2026-05-10 23:54:10','2026-05-10 18:54:10','2026-05-10 18:54:10'),(9,20,6,15,'Reminder: Test Call Received','I got written and coding test call, on Monday',0,'2026-05-10 23:54:10','2026-05-10 18:54:10','2026-05-10 18:54:10'),(10,20,7,13,'Reminder: Applied before Next Monday','I have to applied on this job before next monday',0,'2026-05-10 23:54:10','2026-05-10 18:54:10','2026-05-10 18:54:10'),(11,20,8,16,'Reminder: offer recieved','accept offer till monday',0,'2026-05-10 23:56:10','2026-05-10 18:56:10','2026-05-10 18:56:10'),(12,20,6,15,'Reminder: Test Call Received','I got written and coding test call, on Monday',0,'2026-05-10 23:58:10','2026-05-10 18:58:10','2026-05-10 18:58:10'),(13,20,6,15,'Reminder: Test Call Received','I got written and coding test call, on Monday',0,'2026-05-11 00:00:10','2026-05-10 19:00:10','2026-05-10 19:00:10'),(14,20,8,16,'Reminder: offer recieved','accept offer till monday',0,'2026-05-11 00:00:10','2026-05-10 19:00:10','2026-05-10 19:00:10');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reminders`
--

DROP TABLE IF EXISTS `reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reminders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `job_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `reminder_datetime` datetime NOT NULL,
  `status` enum('pending','completed','dismissed') DEFAULT 'pending',
  `snoozed_until` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reminders_user_id` (`user_id`),
  KEY `idx_reminders_job_id` (`job_id`),
  CONSTRAINT `fk_reminders_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`job_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_reminders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reminders`
--

LOCK TABLES `reminders` WRITE;
/*!40000 ALTER TABLE `reminders` DISABLE KEYS */;
INSERT INTO `reminders` VALUES (1,14,5,'interview deadline','i have to give it','2026-05-08 14:08:00','pending',NULL,'2026-05-06 07:07:14','2026-05-06 07:07:14'),(2,15,7,'interview','vv','2026-05-07 12:15:00','pending',NULL,'2026-05-07 06:14:57','2026-05-07 06:14:57'),(3,16,8,'designer job','applied before 11 may','2026-05-10 00:42:00','pending',NULL,'2026-05-09 19:40:42','2026-05-09 19:40:42'),(4,17,9,'front-end job apply','apply before tomorrow','2026-05-10 00:48:00','pending',NULL,'2026-05-09 19:47:05','2026-05-09 19:47:05'),(5,20,10,'Interview Call','I have to give online interview at Monday','2026-05-10 18:23:00','pending',NULL,'2026-05-10 13:20:06','2026-05-10 18:53:20'),(6,20,15,'Test Call Received','I got written and coding test call, on Monday','2026-05-10 23:59:00','pending',NULL,'2026-05-10 15:28:31','2026-05-10 18:58:54'),(7,20,13,'Applied before Next Monday','I have to applied on this job before next monday','2026-05-10 20:36:00','pending',NULL,'2026-05-10 15:30:55','2026-05-10 18:53:37'),(8,20,16,'offer recieved','accept offer till monday','2026-05-10 23:59:00','pending',NULL,'2026-05-10 18:54:57','2026-05-10 18:58:43');
/*!40000 ALTER TABLE `reminders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `available_start_date` date DEFAULT NULL,
  `employment_status` varchar(50) DEFAULT NULL,
  `resume` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'nasir','jamal','nasirr@gmail.com','111177777','designer','2026-03-11','Unemployed',NULL,NULL),(2,'aisha','ahmed','aisha@gmail.com','3333999999','frontend-developer','2026-03-11','Unemployed',NULL,NULL),(3,'fff','','','','','2026-03-24','',NULL,NULL),(4,'11','11','11','11','11','2026-03-25','',NULL,NULL),(5,'ww','ww','ww','ww','ww','2026-03-24','Self-Employed',NULL,NULL),(6,'44','44','55','','','2026-03-17','',NULL,NULL),(7,'zz','zz','zz','zz','','2026-03-10','',NULL,NULL),(8,'zain',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'123'),(9,'ww','','','','','2026-03-18','',NULL,NULL),(10,'lll','','','','','2026-03-18','',NULL,'lll'),(11,'alif','khan','alif@gmail.com','222222','designer','2026-04-14','Unemployed','uploads/1776148160123-Resume-Sample-1-Software-Engineer.pdf','1111111'),(12,'shazia','ahmed','shazia@gmail.com','1111','designer','2026-04-27','Unemployed','uploads/1777271785237-Resume-Sample-1-Software-Engineer.pdf','1111'),(14,'jameel','khan','jameel@gmail.com','33333','frontend-developer','2026-05-06','Self-Employed','uploads/1778018701240-Resume-Sample-1-Software-Engineer.pdf','222'),(15,'kanwal','khan','khan@gmail.com','11111','designer','2026-05-07','Student','uploads/1778134218434-Resume-Sample-1-Software-Engineer.pdf','333'),(16,'user1','','user1@gmail.com','','designer','2026-05-13','Student',NULL,'123'),(17,'zara','ahmed','imzarajam@gmail.com','','frontend-developer','2026-05-09','Unemployed',NULL,'123'),(18,'admin','','imzara@gmail.com','','','2026-05-09','',NULL,'$2b$12$f2dfxXqkd7tBdpgHoUpiG.6gFXsWtff2SConlQ2X4/XnGRLyiGxui'),(19,'test1','test1','test1@gmail.com','','','2026-05-10','',NULL,''),(20,'Zara','Ahmed','zara.ahmed.vu@gmail.com','03462667417','Front-end developer','2026-05-06','Student',NULL,'$2b$12$MIPZyG4iTMmEZZ9VQ0KdfutTO86lmXalF892URf3KnUSXBXVQJPNy'),(21,'admin','admin','admin@gmail.com','','','2026-05-10','',NULL,'$2b$12$5UaklN3h.2jKzQhtcLQZguUCfuT/01Jrpx4PiZ3dAUtav1co8D.Za');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-11  0:26:27

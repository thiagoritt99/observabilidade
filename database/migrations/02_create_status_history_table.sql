-- Migração 02: Criar tabela de histórico de status
-- Data: 2026-05-06
-- Descrição: Registra todas as mudanças de status dos serviços para análise histórica
-- Esta tabela permite verificar se houve erro nos últimos 10 minutos

CREATE TABLE IF NOT EXISTS `status_history` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID único do registro',
  `service_id` VARCHAR(36) NOT NULL COMMENT 'ID do serviço',
  `previous_status` ENUM('operational', 'unavailable', 'maintenance', 'unstable') COMMENT 'Status anterior',
  `current_status` ENUM('operational', 'unavailable', 'maintenance', 'unstable') NOT NULL COMMENT 'Status atual',
  `response_time` INT COMMENT 'Tempo de resposta em ms',
  `error_message` TEXT COMMENT 'Mensagem de erro se houver',
  `source` VARCHAR(50) DEFAULT 'n8n' COMMENT 'Origem da atualização (n8n, manual, api, webhook)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data do evento',
  FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE,
  INDEX idx_service_id (service_id),
  INDEX idx_current_status (current_status),
  INDEX idx_created_at (created_at),
  INDEX idx_service_created (service_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Criar view para verificar erros nos últimos 10 minutos
CREATE OR REPLACE VIEW `vw_errors_last_10_minutes` AS
SELECT 
  s.`id` AS service_id,
  s.`name` AS service_name,
  COUNT(sh.`id`) AS error_count,
  MAX(sh.`created_at`) AS last_error_at,
  CASE WHEN COUNT(sh.`id`) > 0 THEN TRUE ELSE FALSE END AS has_error_last_10_minutes
FROM `services` s
LEFT JOIN `status_history` sh ON s.`id` = sh.`service_id` 
  AND sh.`current_status` = 'unavailable'
  AND sh.`created_at` >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
WHERE s.`is_active` = TRUE
GROUP BY s.`id`, s.`name`;

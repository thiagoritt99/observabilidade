-- Migração 03: Criar tabela de alertas
-- Data: 2026-05-06
-- Descrição: Registra alertas disparados quando serviços ficam offline

CREATE TABLE IF NOT EXISTS `alerts` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID único do alerta',
  `service_id` VARCHAR(36) NOT NULL COMMENT 'ID do serviço',
  `alert_type` ENUM('service_down', 'service_up', 'slow_response', 'maintenance_start', 'maintenance_end') DEFAULT 'service_down' COMMENT 'Tipo de alerta',
  `severity` ENUM('critical', 'warning', 'info') DEFAULT 'critical' COMMENT 'Severidade do alerta',
  `message` TEXT NOT NULL COMMENT 'Mensagem do alerta',
  `is_acknowledged` BOOLEAN DEFAULT FALSE COMMENT 'Se o alerta foi reconhecido',
  `acknowledged_by` VARCHAR(255) COMMENT 'Usuário que reconheceu o alerta',
  `acknowledged_at` TIMESTAMP NULL COMMENT 'Data de reconhecimento',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação do alerta',
  FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE CASCADE,
  INDEX idx_service_id (service_id),
  INDEX idx_alert_type (alert_type),
  INDEX idx_severity (severity),
  INDEX idx_is_acknowledged (is_acknowledged),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

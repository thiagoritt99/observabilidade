-- Migração 04: Criar views para dashboard
-- Data: 2026-05-06
-- Descrição: Views que consolidam informações dos serviços com dados agregados para o dashboard

-- View principal para o dashboard com informações de erros nos últimos 10 minutos
CREATE OR REPLACE VIEW `vw_dashboard_services` AS
SELECT 
  s.`id`,
  s.`name`,
  s.`url`,
  s.`status`,
  s.`response_time`,
  s.`type`,
  s.`description`,
  s.`is_active`,
  s.`updated_at`,
  COUNT(DISTINCT sh.`id`) as `total_status_changes`,
  MAX(sh.`created_at`) as `last_status_change`,
  COUNT(DISTINCT CASE WHEN a.`is_acknowledged` = FALSE THEN a.`id` END) as `unacknowledged_alerts`,
  (
    SELECT COUNT(*) FROM `status_history` sh2 
    WHERE sh2.`service_id` = s.`id` 
    AND sh2.`current_status` = 'unavailable'
    AND sh2.`created_at` >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
  ) as `errors_last_10_minutes`,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM `status_history` sh3 
      WHERE sh3.`service_id` = s.`id` 
      AND sh3.`current_status` = 'unavailable'
      AND sh3.`created_at` >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
    ) > 0 THEN TRUE 
    ELSE FALSE 
  END as `has_error_last_10_minutes`,
  (
    SELECT COUNT(*) FROM `status_history` sh4 
    WHERE sh4.`service_id` = s.`id` 
    AND sh4.`current_status` = 'unavailable'
    AND sh4.`created_at` >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
  ) as `downtime_count_24h`
FROM `services` s
LEFT JOIN `status_history` sh ON s.`id` = sh.`service_id`
LEFT JOIN `alerts` a ON s.`id` = a.`service_id`
WHERE s.`is_active` = TRUE
GROUP BY s.`id`, s.`name`, s.`url`, s.`status`, s.`response_time`, s.`type`, s.`description`, s.`is_active`, s.`updated_at`
ORDER BY 
  CASE 
    WHEN s.`status` = 'unavailable' THEN 1
    WHEN s.`status` = 'maintenance' THEN 2
    WHEN s.`status` = 'unstable' THEN 3
    ELSE 4
  END,
  s.`name`;

-- View para resumo de status geral (compatível com n8n)
CREATE OR REPLACE VIEW `vw_overall_status` AS
SELECT 
  COUNT(*) as `total_services`,
  SUM(CASE WHEN `status` = 'operational' THEN 1 ELSE 0 END) as `operational_count`,
  SUM(CASE WHEN `status` = 'unavailable' THEN 1 ELSE 0 END) as `unavailable_count`,
  SUM(CASE WHEN `status` = 'maintenance' THEN 1 ELSE 0 END) as `maintenance_count`,
  SUM(CASE WHEN `status` = 'unstable' THEN 1 ELSE 0 END) as `unstable_count`,
  CASE 
    WHEN SUM(CASE WHEN `status` = 'unavailable' THEN 1 ELSE 0 END) > 0 THEN 'unavailable'
    WHEN SUM(CASE WHEN `status` = 'maintenance' THEN 1 ELSE 0 END) > 0 THEN 'maintenance'
    WHEN SUM(CASE WHEN `status` = 'unstable' THEN 1 ELSE 0 END) > 0 THEN 'unstable'
    ELSE 'operational'
  END as `overall_status`,
  AVG(`response_time`) as `avg_response_time`,
  NOW() as `last_update`
FROM `services`
WHERE `is_active` = TRUE;

-- View para formato de resposta da API de status (compatível com n8n)
CREATE OR REPLACE VIEW `vw_api_status_response` AS
SELECT 
  s.`id`,
  s.`name`,
  s.`url`,
  CASE 
    WHEN s.`status` = 'operational' THEN 'online'
    WHEN s.`status` = 'unavailable' THEN 'offline'
    ELSE s.`status`
  END as `status`,
  s.`updated_at` as `lastCheck`,
  NULL as `lastError`,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM `status_history` sh 
      WHERE sh.`service_id` = s.`id` 
      AND sh.`current_status` = 'unavailable'
      AND sh.`created_at` >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
    ) > 0 THEN TRUE 
    ELSE FALSE 
  END as `hasErrorLast10Minutes`
FROM `services` s
WHERE s.`is_active` = TRUE
ORDER BY s.`name`;

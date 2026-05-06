-- Migração 01: Criar tabela de serviços
-- Data: 2026-05-06
-- Descrição: Tabela principal para armazenar informações dos serviços monitorados
-- NOTA: WorkNow Chat foi removido. CallSys, Portal TCloud e Central do Cliente TOTVS foram adicionados.

CREATE TABLE IF NOT EXISTS `services` (
  `id` VARCHAR(36) PRIMARY KEY COMMENT 'ID único do serviço',
  `name` VARCHAR(255) NOT NULL COMMENT 'Nome do serviço',
  `url` VARCHAR(500) NOT NULL COMMENT 'URL do serviço',
  `status` ENUM('operational', 'unavailable', 'maintenance', 'unstable') DEFAULT 'operational' COMMENT 'Status atual do serviço',
  `response_time` INT DEFAULT 0 COMMENT 'Tempo de resposta em milissegundos',
  `type` VARCHAR(50) DEFAULT 'website' COMMENT 'Tipo de serviço (website, education, portal, support, cloud, etc)',
  `description` TEXT COMMENT 'Descrição do serviço',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data de criação',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data de última atualização',
  `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Se o serviço está ativo no monitoramento',
  INDEX idx_status (status),
  INDEX idx_type (type),
  INDEX idx_is_active (is_active),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir serviços padrão (lista atualizada)
INSERT INTO `services` (`id`, `name`, `url`, `type`, `status`, `response_time`) VALUES
('1', 'Portal Principal', 'https://fmp.edu.br', 'website', 'operational', 145),
('2', 'Moodle FMP', 'https://moodle.fmp.edu.br', 'education', 'operational', 230),
('3', 'ESA Moodle', 'https://esa.moodle.fmp.edu.br/', 'education', 'operational', 189),
('4', 'Pergamum FMP', 'https://biblioteca.fmp.edu.br', 'education', 'operational', 312),
('5', 'Portal do Aluno', 'https://fundacaoescola114384.rm.cloudtotvs.com.br/FrameHTML//Web/App/Edu/PortalEducacional/', 'portal', 'operational', 167),
('6', 'Meu RH - TOTVS RM', 'https://fundacaoescola114384.rm.cloudtotvs.com.br/FrameHTML/web/app/RH/PortalMeuRH/#/home', 'portal', 'operational', 98),
('7', 'Portal do Professor', 'https://fundacaoescola114384.rm.cloudtotvs.com.br/FrameHTML/web/app/edu/PortaldoProfessor/#/login', 'portal', 'operational', 256),
('8', 'Pós-Graduação', 'http://pos.fmp.edu.br', 'graduation', 'operational', 180),
('9', 'CRM Rubeus', 'https://crmfmp.apprubeus.com.br/home', 'portal', 'operational', 115),
('10', 'CallSys', 'https://omni03.espectra.com.br/pages/login', 'support', 'operational', 142),
('11', 'Portal TCloud', 'https://totvs.fluigidentity.com/cloudpass/?forward=%2Flaunchpad%2FlaunchApp%2F41nyjec30g2cicc51556045186041%2Fzf0y84vo717g8hjx', 'cloud', 'operational', 198),
('12', 'Central do Cliente TOTVS', 'https://totvs.fluigidentity.com/ui/login-saml?forward=%2FSPInitPost%2FreceiveSSORequest%2Fzf0y84vo717g8hjx%2Fxlglk8zqmzw44blf1442945918727', 'support', 'operational', 210)
ON DUPLICATE KEY UPDATE `updated_at` = CURRENT_TIMESTAMP;

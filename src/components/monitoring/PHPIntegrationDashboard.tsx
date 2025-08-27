/**
 * PHP Integration Dashboard
 * Dashboard para monitoramento da integração PHP
 */

import React, { useEffect, useState } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Cpu, 
  Database, 
  Download, 
  Eye, 
  Filter, 
  HardDrive, 
  MemoryStick,
  Network,
  RefreshCw,
  Server,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
  XCircle,
  Zap
} from 'lucide-react';
import { usePHPMonitoring } from '../../services/monitoring/phpIntegrationMonitor';
import type { MonitoringAlert, PHPError } from '../../services/monitoring/phpIntegrationMonitor';
import styles from './PHPIntegrationDashboard.module.css';

interface PHPIntegrationDashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  showDetails?: boolean;
}

export const PHPIntegrationDashboard: React.FC<PHPIntegrationDashboardProps> = ({
  autoRefresh = true,
  refreshInterval = 5000,
  showDetails = true
}) => {
  const {
    healthStatus,
    performanceMetrics,
    alerts,
    runHealthCheck,
    getIntegrationLogs,
    generateReport
  } = usePHPMonitoring();

  const [selectedTab, setSelectedTab] = useState<'overview' | 'health' | 'performance' | 'alerts' | 'logs'>('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [logsFilter, setLogsFilter] = useState<{
    level?: string;
    endpoint?: string;
    limit: number;
  }>({ limit: 50 });

  // Refresh manual
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await runHealthCheck();
    } catch (error) {
      console.error('Error refreshing health check:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Gerar e baixar relatório
  const handleDownloadReport = () => {
    const report = generateReport();
    const blob = new Blob([JSON.stringify(report, null, 2)], { 
      type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `php-integration-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Renderizar status health
  const renderHealthStatus = () => {
    const statusConfig = {
      healthy: { icon: CheckCircle, color: 'var(--color-success)', label: 'Saudável' },
      degraded: { icon: AlertTriangle, color: 'var(--color-warning)', label: 'Degradado' },
      unhealthy: { icon: XCircle, color: 'var(--color-error)', label: 'Não Saudável' },
      unknown: { icon: RefreshCw, color: 'var(--text-tertiary)', label: 'Desconhecido' }
    };

    const config = statusConfig[healthStatus.status];
    const Icon = config.icon;

    return (
      <div className={`${styles.healthStatus} ${styles[healthStatus.status]}`}>
        <div className={styles.statusIndicator}>
          <Icon size={24} style={{ color: config.color }} />
          <div className={styles.statusInfo}>
            <span className={styles.statusLabel}>{config.label}</span>
            <span className={styles.statusTime}>
              Última verificação: {formatRelativeTime(healthStatus.lastCheck)}
            </span>
          </div>
        </div>
        
        <div className={styles.statusMetrics}>
          <div className={styles.metric}>
            <Clock size={16} />
            <span>{healthStatus.responseTime}ms</span>
          </div>
          
          <div className={styles.metric}>
            <Activity size={16} />
            <span>Uptime: {formatUptime(healthStatus.uptime)}</span>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar métricas principais
  const renderMainMetrics = () => {
    return (
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <TrendingUp size={20} />
            <span>Response Time</span>
          </div>
          <div className={styles.metricValue}>
            {performanceMetrics.responseTime.average.toFixed(0)}ms
          </div>
          <div className={styles.metricSubtext}>
            P95: {performanceMetrics.responseTime.p95}ms
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <Zap size={20} />
            <span>Throughput</span>
          </div>
          <div className={styles.metricValue}>
            {performanceMetrics.throughput.requestsPerMinute.toFixed(1)}
          </div>
          <div className={styles.metricSubtext}>
            req/min
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <AlertTriangle size={20} />
            <span>Error Rate</span>
          </div>
          <div className={styles.metricValue}>
            {(performanceMetrics.errors.errorRate * 100).toFixed(2)}%
          </div>
          <div className={styles.metricSubtext}>
            {performanceMetrics.errors.totalErrors} total
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <Users size={20} />
            <span>Active Users</span>
          </div>
          <div className={styles.metricValue}>
            {performanceMetrics.resources.activeConnections}
          </div>
          <div className={styles.metricSubtext}>
            conexões
          </div>
        </div>
      </div>
    );
  };

  // Renderizar serviços
  const renderServices = () => {
    const services = Object.entries(healthStatus.services);
    
    return (
      <div className={styles.servicesGrid}>
        {services.map(([serviceName, service]) => {
          const statusIcons = {
            up: { icon: CheckCircle, color: 'var(--color-success)' },
            down: { icon: XCircle, color: 'var(--color-error)' },
            degraded: { icon: AlertTriangle, color: 'var(--color-warning)' }
          };

          const config = statusIcons[service.status];
          const Icon = config.icon;

          return (
            <div key={serviceName} className={styles.serviceCard}>
              <div className={styles.serviceHeader}>
                <Icon size={16} style={{ color: config.color }} />
                <span className={styles.serviceName}>
                  {serviceName.charAt(0).toUpperCase() + serviceName.slice(1)}
                </span>
              </div>
              
              <div className={styles.serviceDetails}>
                {service.responseTime && (
                  <span className={styles.serviceMetric}>
                    {service.responseTime}ms
                  </span>
                )}
                
                {service.errorRate && (
                  <span className={styles.serviceMetric}>
                    {(service.errorRate * 100).toFixed(1)}% errors
                  </span>
                )}
                
                {service.lastError && (
                  <span className={styles.serviceError} title={service.lastError}>
                    Último erro
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Renderizar recursos do sistema
  const renderSystemResources = () => {
    const { resources } = performanceMetrics;
    
    return (
      <div className={styles.resourcesSection}>
        <h3>Recursos do Sistema</h3>
        
        <div className={styles.resourcesGrid}>
          <div className={styles.resourceCard}>
            <div className={styles.resourceHeader}>
              <MemoryStick size={20} />
              <span>Memória</span>
            </div>
            <div className={styles.resourceBar}>
              <div 
                className={styles.resourceFill}
                style={{ 
                  width: `${resources.memoryUsage * 100}%`,
                  backgroundColor: resources.memoryUsage > 0.8 ? 'var(--color-error)' : 
                                 resources.memoryUsage > 0.6 ? 'var(--color-warning)' : 
                                 'var(--color-success)'
                }}
              />
            </div>
            <span className={styles.resourceValue}>
              {(resources.memoryUsage * 100).toFixed(1)}%
            </span>
          </div>

          <div className={styles.resourceCard}>
            <div className={styles.resourceHeader}>
              <Cpu size={20} />
              <span>CPU</span>
            </div>
            <div className={styles.resourceBar}>
              <div 
                className={styles.resourceFill}
                style={{ 
                  width: `${resources.cpuUsage * 100}%`,
                  backgroundColor: resources.cpuUsage > 0.7 ? 'var(--color-error)' : 
                                 resources.cpuUsage > 0.5 ? 'var(--color-warning)' : 
                                 'var(--color-success)'
                }}
              />
            </div>
            <span className={styles.resourceValue}>
              {(resources.cpuUsage * 100).toFixed(1)}%
            </span>
          </div>

          <div className={styles.resourceCard}>
            <div className={styles.resourceHeader}>
              <HardDrive size={20} />
              <span>Disco</span>
            </div>
            <div className={styles.resourceBar}>
              <div 
                className={styles.resourceFill}
                style={{ 
                  width: `${resources.diskSpace * 100}%`,
                  backgroundColor: resources.diskSpace > 0.9 ? 'var(--color-error)' : 
                                 resources.diskSpace > 0.7 ? 'var(--color-warning)' : 
                                 'var(--color-success)'
                }}
              />
            </div>
            <span className={styles.resourceValue}>
              {(resources.diskSpace * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Renderizar alertas
  const renderAlerts = () => {
    if (alerts.length === 0) {
      return (
        <div className={styles.emptyState}>
          <CheckCircle size={48} />
          <h3>Nenhum alerta ativo</h3>
          <p>Sistema funcionando normalmente</p>
        </div>
      );
    }

    return (
      <div className={styles.alertsList}>
        {alerts.map(alert => (
          <div key={alert.id} className={`${styles.alertCard} ${styles[alert.severity]}`}>
            <div className={styles.alertHeader}>
              <div className={styles.alertIcon}>
                <AlertTriangle size={16} />
              </div>
              
              <div className={styles.alertInfo}>
                <span className={styles.alertTitle}>{alert.title}</span>
                <span className={styles.alertTime}>
                  {formatRelativeTime(alert.timestamp)}
                </span>
              </div>

              <div className={styles.alertSeverity}>
                {alert.severity.toUpperCase()}
              </div>
            </div>
            
            <div className={styles.alertDescription}>
              {alert.description}
            </div>
            
            {alert.affectedServices.length > 0 && (
              <div className={styles.alertServices}>
                <strong>Serviços afetados:</strong> {alert.affectedServices.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Renderizar logs
  const renderLogs = () => {
    const logs = getIntegrationLogs(logsFilter);

    return (
      <div className={styles.logsSection}>
        <div className={styles.logsHeader}>
          <div className={styles.logsFilters}>
            <select 
              value={logsFilter.level || ''} 
              onChange={(e) => setLogsFilter(prev => ({ 
                ...prev, 
                level: e.target.value || undefined 
              }))}
            >
              <option value="">Todos os níveis</option>
              <option value="error">Error</option>
              <option value="warning">Warning</option>
              <option value="notice">Notice</option>
              <option value="fatal">Fatal</option>
            </select>
            
            <select 
              value={logsFilter.endpoint || ''} 
              onChange={(e) => setLogsFilter(prev => ({ 
                ...prev, 
                endpoint: e.target.value || undefined 
              }))}
            >
              <option value="">Todos os endpoints</option>
              <option value="/demandas">/demandas</option>
              <option value="/documentos">/documentos</option>
              <option value="/auth">/auth</option>
            </select>
            
            <select 
              value={logsFilter.limit} 
              onChange={(e) => setLogsFilter(prev => ({ 
                ...prev, 
                limit: parseInt(e.target.value) 
              }))}
            >
              <option value="25">25 logs</option>
              <option value="50">50 logs</option>
              <option value="100">100 logs</option>
            </select>
          </div>
        </div>

        <div className={styles.logsList}>
          {logs.length === 0 ? (
            <div className={styles.emptyState}>
              <Eye size={48} />
              <h3>Nenhum log encontrado</h3>
              <p>Tente ajustar os filtros</p>
            </div>
          ) : (
            logs.map(log => (
              <div key={log.id} className={`${styles.logEntry} ${styles[log.level]}`}>
                <div className={styles.logHeader}>
                  <span className={styles.logLevel}>{log.level.toUpperCase()}</span>
                  <span className={styles.logTime}>
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  {log.endpoint && (
                    <span className={styles.logEndpoint}>{log.endpoint}</span>
                  )}
                </div>
                
                <div className={styles.logMessage}>{log.message}</div>
                
                {log.file && (
                  <div className={styles.logFile}>
                    {log.file}:{log.line}
                  </div>
                )}
                
                {log.userId && (
                  <div className={styles.logUser}>
                    Usuário: {log.userId}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.dashboardHeader}>
        <div className={styles.title}>
          <Server size={24} />
          <h1>Monitoramento PHP</h1>
        </div>

        <div className={styles.actions}>
          <button
            className={styles.refreshButton}
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? styles.spinning : ''} />
            Atualizar
          </button>
          
          <button
            className={styles.reportButton}
            onClick={handleDownloadReport}
          >
            <Download size={16} />
            Relatório
          </button>
        </div>
      </div>

      {/* Status geral */}
      {renderHealthStatus()}

      {/* Tabs */}
      <div className={styles.tabs}>
        {[
          { key: 'overview', label: 'Visão Geral', icon: Activity },
          { key: 'health', label: 'Saúde', icon: CheckCircle },
          { key: 'performance', label: 'Performance', icon: TrendingUp },
          { key: 'alerts', label: `Alertas (${alerts.length})`, icon: AlertTriangle },
          { key: 'logs', label: 'Logs', icon: Eye }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              className={`${styles.tab} ${selectedTab === tab.key ? styles.active : ''}`}
              onClick={() => setSelectedTab(tab.key as any)}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Conteúdo das tabs */}
      <div className={styles.tabContent}>
        {selectedTab === 'overview' && (
          <div className={styles.overviewTab}>
            {renderMainMetrics()}
            {showDetails && renderServices()}
            {showDetails && renderSystemResources()}
          </div>
        )}

        {selectedTab === 'health' && (
          <div className={styles.healthTab}>
            {renderServices()}
            {renderSystemResources()}
          </div>
        )}

        {selectedTab === 'performance' && (
          <div className={styles.performanceTab}>
            {renderMainMetrics()}
            {/* Aqui poderiam ser adicionados gráficos de performance */}
          </div>
        )}

        {selectedTab === 'alerts' && (
          <div className={styles.alertsTab}>
            {renderAlerts()}
          </div>
        )}

        {selectedTab === 'logs' && (
          <div className={styles.logsTab}>
            {renderLogs()}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Funções auxiliares
 */
function formatRelativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {return `${days}d atrás`;}
  if (hours > 0) {return `${hours}h atrás`;}
  if (minutes > 0) {return `${minutes}min atrás`;}
  return 'Agora há pouco';
}

function formatUptime(uptimeSeconds: number): string {
  const days = Math.floor(uptimeSeconds / (24 * 60 * 60));
  const hours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((uptimeSeconds % (60 * 60)) / 60);

  if (days > 0) {return `${days}d ${hours}h`;}
  if (hours > 0) {return `${hours}h ${minutes}m`;}
  return `${minutes}m`;
}

export default PHPIntegrationDashboard;
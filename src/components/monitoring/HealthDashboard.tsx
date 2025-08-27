// src/components/monitoring/HealthDashboard.tsx

import { useEffect, useState } from 'react';
import { type HealthMetric, type HealthReport, healthMonitor } from '../../services/monitoring/healthCheck';
import { analytics } from '../../services/analytics/core';

const HealthDashboard: React.FC = () => {
  const [currentReport, setCurrentReport] = useState<HealthReport | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [history, setHistory] = useState<HealthReport[]>([]);
  const [selectedMetric, setSelectedMetric] = useState<HealthMetric | null>(null);

  useEffect(() => {
    const runInitialCheck = async () => {
      const report = await healthMonitor.runHealthCheck();
      setCurrentReport(report);
      setHistory(healthMonitor.getHistory());
    };

    runInitialCheck();

    // Auto-refresh every 30 seconds when dashboard is open
    const interval = setInterval(async () => {
      const report = await healthMonitor.runHealthCheck();
      setCurrentReport(report);
      setHistory(healthMonitor.getHistory());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleStartMonitoring = () => {
    healthMonitor.startMonitoring(30000);
    setIsMonitoring(true);
    analytics.track('health_monitoring_started');
  };

  const handleStopMonitoring = () => {
    healthMonitor.stopMonitoring();
    setIsMonitoring(false);
    analytics.track('health_monitoring_stopped');
  };

  const handleExportData = () => {
    const data = healthMonitor.exportHealthData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-report-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    analytics.track('health_data_exported');
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'critical': return '🚨';
      default: return '❓';
    }
  };

  if (!currentReport) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        <span className="ml-3">Loading health data...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health Dashboard</h1>
          <p className="text-gray-600">Real-time monitoring and diagnostics</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={isMonitoring ? handleStopMonitoring : handleStartMonitoring}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              isMonitoring 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
          </button>
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Export Data
          </button>
        </div>
      </div>

      {/* Overall Status */}
      <div className={`p-6 rounded-lg border-2 ${
        currentReport.overall === 'healthy' ? 'border-green-200 bg-green-50' :
        currentReport.overall === 'warning' ? 'border-yellow-200 bg-yellow-50' :
        'border-red-200 bg-red-50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{getStatusIcon(currentReport.overall)}</span>
            <div>
              <h2 className="text-xl font-semibold capitalize">{currentReport.overall}</h2>
              <p className="text-sm text-gray-600">
                Last checked: {new Date(currentReport.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">
              {currentReport.metrics.filter(m => m.status === 'critical').length} critical • {' '}
              {currentReport.metrics.filter(m => m.status === 'warning').length} warnings • {' '}
              {currentReport.metrics.filter(m => m.status === 'healthy').length} healthy
            </div>
            {currentReport.errors.length > 0 && (
              <div className="text-sm text-red-600 font-medium">
                {currentReport.errors.length} errors detected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentReport.metrics.map((metric) => (
          <div
            key={metric.name}
            className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedMetric(metric)}
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-gray-900 capitalize">
                {metric.name.replace(/_/g, ' ')}
              </h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(metric.status)}`}>
                {metric.status}
              </span>
            </div>
            
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
              {metric.unit && <span className="text-sm font-normal ml-1">{metric.unit}</span>}
            </div>

            {metric.threshold && (
              <div className="text-xs text-gray-500">
                Warning: {metric.threshold.warning} • Critical: {metric.threshold.critical}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {currentReport.recommendations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">💡 Recommendations</h3>
          <ul className="space-y-1">
            {currentReport.recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-blue-800">
                • {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Errors */}
      {currentReport.errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-900 mb-2">🚨 Errors</h3>
          <ul className="space-y-1">
            {currentReport.errors.map((error, index) => (
              <li key={index} className="text-sm text-red-800 font-mono">
                {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* History Chart */}
      {history.length > 1 && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium mb-4">Health History</h3>
          <div className="space-y-2">
            {history.slice(-10).reverse().map((report) => (
              <div key={report.timestamp} className="flex items-center space-x-3 py-2">
                <span className="text-sm text-gray-500 w-32">
                  {new Date(report.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-lg">{getStatusIcon(report.overall)}</span>
                <span className={`capitalize font-medium ${getStatusColor(report.overall).split(' ')[0]}`}>
                  {report.overall}
                </span>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      report.overall === 'healthy' ? 'bg-green-500' :
                      report.overall === 'warning' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ 
                      width: `${
                        report.overall === 'healthy' ? 100 :
                        report.overall === 'warning' ? 66 : 33
                      }%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metric Detail Modal */}
      {selectedMetric && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold capitalize">
                {selectedMetric.name.replace(/_/g, ' ')}
              </h3>
              <button
                onClick={() => setSelectedMetric(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-600">Current Value:</span>
                <div className="text-xl font-bold">
                  {typeof selectedMetric.value === 'number' 
                    ? selectedMetric.value.toLocaleString() 
                    : selectedMetric.value}
                  {selectedMetric.unit && <span className="text-sm ml-1">{selectedMetric.unit}</span>}
                </div>
              </div>

              <div>
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedMetric.status)}`}>
                  {selectedMetric.status}
                </span>
              </div>

              {selectedMetric.threshold && (
                <div>
                  <span className="text-sm text-gray-600">Thresholds:</span>
                  <div className="mt-1 text-sm">
                    <div>Warning: {selectedMetric.threshold.warning}{selectedMetric.unit}</div>
                    <div>Critical: {selectedMetric.threshold.critical}{selectedMetric.unit}</div>
                  </div>
                </div>
              )}

              <div>
                <span className="text-sm text-gray-600">Last Updated:</span>
                <div className="text-sm">
                  {new Date(selectedMetric.timestamp).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setSelectedMetric(null)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthDashboard;
// src/components/charts/AnalyticsChart.tsx

import ReactECharts from 'echarts-for-react';
import { useEffect, useMemo, useState } from 'react';
import { healthMonitor } from '../../services/monitoring/healthCheck';
import { createModuleLogger } from '../../utils/logger';

interface AnalyticsData {
  pageViews: { path: string; count: number; timestamp: number }[];
  errors: { type: string; count: number; timestamp: number }[];
  performance: { metric: string; value: number; timestamp: number }[];
  userActions: { action: string; count: number; timestamp: number }[];
}

const logger = createModuleLogger('AnalyticsChart');

const AnalyticsChart: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    pageViews: [],
    errors: [],
    performance: [],
    userActions: []
  });
  const [selectedMetric, setSelectedMetric] = useState<'pageViews' | 'errors' | 'performance' | 'userActions'>('pageViews');
  const [healthData, setHealthData] = useState(healthMonitor.getLatestReport());

  useEffect(() => {
    // Simulate fetching analytics data from localStorage or API
    const loadAnalyticsData = () => {
      try {
        // Get stored analytics events
        const storedEvents = JSON.parse(localStorage.getItem('analytics_events') ?? '[]');
        
        // Process page views
        const pageViews = storedEvents
          .filter((event: { event: string }) => event.event === 'page_view')
          .reduce((acc: { path: string; count: number; timestamp: number }[], event: { properties?: { path?: string }; timestamp: number }) => {
            const existing = acc.find(item => item.path === event.properties?.path);
            if (existing) {
              existing.count++;
            } else {
              acc.push({
                path: event.properties?.path ?? 'unknown',
                count: 1,
                timestamp: event.timestamp
              });
            }
            return acc;
          }, [])
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        // Process errors
        const errors = storedEvents
          .filter((event: { category: string }) => event.category === 'error')
          .reduce((acc: { type: string; count: number; timestamp: number }[], event: { event: string; timestamp: number }) => {
            const existing = acc.find(item => item.type === event.event);
            if (existing) {
              existing.count++;
            } else {
              acc.push({
                type: event.event,
                count: 1,
                timestamp: event.timestamp
              });
            }
            return acc;
          }, [])
          .sort((a, b) => b.count - a.count);

        // Process performance metrics
        const performance = storedEvents
          .filter((event: { category: string }) => event.category === 'performance')
          .map((event: { event: string; timestamp: number; properties?: { value?: number; duration?: number } }) => ({
            metric: event.event,
            value: event.properties?.value ?? event.properties?.duration ?? 0,
            timestamp: event.timestamp
          }))
          .slice(-20);

        // Process user actions
        const userActions = storedEvents
          .filter((event: { category: string }) => event.category === 'interaction' || event.category === 'business')
          .reduce((acc: { action: string; count: number; timestamp: number }[], event: { event: string; timestamp: number }) => {
            const existing = acc.find(item => item.action === event.event);
            if (existing) {
              existing.count++;
            } else {
              acc.push({
                action: event.event,
                count: 1,
                timestamp: event.timestamp
              });
            }
            return acc;
          }, [])
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setAnalyticsData({
          pageViews,
          errors,
          performance,
          userActions
        });

      } catch (error) {
        logger.error('Failed to load analytics data', { error });
      }
    };

    // Update health data
    const updateHealthData = async () => {
      const report = await healthMonitor.runHealthCheck();
      setHealthData(report);
    };

    loadAnalyticsData();
    updateHealthData();

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      loadAnalyticsData();
      updateHealthData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const chartOption = useMemo(() => {
    const data = analyticsData[selectedMetric];
    
    if (!data || data.length === 0) {
      return {
        title: { text: 'Nenhum dado disponível', left: 'center' },
        series: []
      };
    }

    switch (selectedMetric) {
      case 'pageViews':
        return {
          title: { text: 'Visualizações de Página', left: 'center' },
          tooltip: { trigger: 'item' },
          series: [{
            type: 'pie',
            data: (data as { path: string; count: number; timestamp: number }[]).map(item => ({
              name: item.path,
              value: item.count
            })),
            radius: '60%',
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }]
        };

      case 'errors':
        return {
          title: { text: 'Tipos de Erro', left: 'center' },
          xAxis: {
            type: 'category',
            data: (data as { type: string; count: number; timestamp: number }[]).map(item => item.type),
            axisLabel: { rotate: 45 }
          },
          yAxis: { type: 'value' },
          series: [{
            type: 'bar',
            data: (data as { type: string; count: number; timestamp: number }[]).map(item => item.count),
            itemStyle: { color: '#ef4444' }
          }],
          tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c} erros'
          }
        };

      case 'performance':
        const perfData = data as { metric: string; value: number; timestamp: number }[];
        return {
          title: { text: 'Métricas de Performance (ms)', left: 'center' },
          xAxis: {
            type: 'category',
            data: perfData.map((_, index) => `#${index + 1}`)
          },
          yAxis: { type: 'value', name: 'Tempo (ms)' },
          series: [{
            type: 'line',
            data: perfData.map(item => item.value),
            smooth: true,
            itemStyle: { color: '#3b82f6' }
          }],
          tooltip: {
            trigger: 'axis',
            formatter: (params: { dataIndex: number }[]) => {
              const dataIndex = params[0]?.dataIndex;
              if (dataIndex === undefined || !perfData[dataIndex]) return '';
              const metric = perfData[dataIndex];
              return `${metric.metric}: ${metric.value.toFixed(2)}ms`;
            }
          }
        };

      case 'userActions':
        const actionData = data as { action: string; count: number; timestamp: number }[];
        return {
          title: { text: 'Ações do Usuário', left: 'center' },
          xAxis: {
            type: 'value'
          },
          yAxis: {
            type: 'category',
            data: actionData.map(item => item.action)
          },
          series: [{
            type: 'bar',
            data: actionData.map(item => item.count),
            itemStyle: { color: '#10b981' }
          }],
          tooltip: {
            trigger: 'axis',
            formatter: '{b}: {c} vezes'
          }
        };

      default:
        return {};
    }
  }, [analyticsData, selectedMetric]);

  const getMetricColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Health Status Summary */}
      {healthData && (
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold mb-4">Status do Sistema</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className={`p-3 rounded-lg ${getMetricColor(healthData.overall)}`}>
              <div className="text-sm font-medium">Status Geral</div>
              <div className="text-lg font-bold capitalize">{healthData.overall}</div>
            </div>
            <div className="p-3 rounded-lg bg-blue-50">
              <div className="text-sm font-medium text-blue-700">Métricas Saudáveis</div>
              <div className="text-lg font-bold text-blue-900">
                {healthData.metrics.filter(m => m.status === 'healthy').length}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50">
              <div className="text-sm font-medium text-yellow-700">Avisos</div>
              <div className="text-lg font-bold text-yellow-900">
                {healthData.metrics.filter(m => m.status === 'warning').length}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-red-50">
              <div className="text-sm font-medium text-red-700">Crítico</div>
              <div className="text-lg font-bold text-red-900">
                {healthData.metrics.filter(m => m.status === 'critical').length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Analytics Dashboard</h3>
          <div className="flex space-x-2">
            {(['pageViews', 'errors', 'performance', 'userActions'] as const).map((metric) => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  selectedMetric === metric
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {metric === 'pageViews' && 'Páginas'}
                {metric === 'errors' && 'Erros'}
                {metric === 'performance' && 'Performance'}
                {metric === 'userActions' && 'Ações'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ height: '400px' }}>
          <ReactECharts
            option={chartOption}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Total de Páginas</div>
          <div className="text-2xl font-bold">{analyticsData.pageViews.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Erros Únicos</div>
          <div className="text-2xl font-bold text-red-600">{analyticsData.errors.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Métricas de Performance</div>
          <div className="text-2xl font-bold text-blue-600">{analyticsData.performance.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-sm text-gray-600">Ações do Usuário</div>
          <div className="text-2xl font-bold text-green-600">{analyticsData.userActions.length}</div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsChart;
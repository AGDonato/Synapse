import ReactECharts from 'echarts-for-react';

export default function EChartsProExamples() {
  // 1. Dashboard KPI Gauge Profissional
  const gaugeOption = {
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        center: ['50%', '75%'],
        radius: '90%',
        min: 0,
        max: 100,
        splitNumber: 8,
        axisLine: {
          lineStyle: {
            width: 6,
            color: [
              [0.25, '#FF6E76'],
              [0.5, '#FDDD60'],
              [0.75, '#58D9F9'],
              [1, '#7CFFB2']
            ]
          }
        },
        pointer: {
          icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
          length: '12%',
          width: 20,
          offsetCenter: [0, '-60%'],
          itemStyle: {
            color: 'auto'
          }
        },
        axisTick: {
          length: 12,
          lineStyle: {
            color: 'auto',
            width: 2
          }
        },
        splitLine: {
          length: 20,
          lineStyle: {
            color: 'auto',
            width: 5
          }
        },
        axisLabel: {
          color: '#464646',
          fontSize: 14,
          distance: -60,
          rotate: 'tangential',
          formatter: function (value: number) {
            if (value === 87.5) return 'Excelente';
            if (value === 62.5) return 'Bom';
            if (value === 37.5) return 'Regular';
            if (value === 12.5) return 'Ruim';
            return '';
          }
        },
        title: {
          offsetCenter: [0, '-10%'],
          fontSize: 16
        },
        detail: {
          fontSize: 30,
          offsetCenter: [0, '-35%'],
          valueAnimation: true,
          formatter: function (value: number) {
            return value.toFixed(0) + '%';
          },
          color: 'inherit'
        },
        data: [
          {
            value: 78.3,
            name: 'Taxa de Resolução'
          }
        ]
      }
    ]
  };

  // 2. Gráfico de Área Gradiente Profissional
  const areaGradientOption = {
    color: ['#80FFA5', '#00DDFF', '#37A2FF', '#FF0087', '#FFBF00'],
    title: {
      text: 'Análise de Tendências',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    legend: {
      data: ['Ofícios', 'Relatórios', 'Mídias', 'Autos', 'Circulares'],
      top: 30
    },
    toolbox: {
      feature: {
        saveAsImage: {}
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        boundaryGap: false,
        data: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul']
      }
    ],
    yAxis: [
      {
        type: 'value'
      }
    ],
    series: [
      {
        name: 'Ofícios',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 0
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: 'rgb(128, 255, 165)'
            }, {
              offset: 1,
              color: 'rgb(1, 191, 236)'
            }]
          }
        },
        emphasis: {
          focus: 'series'
        },
        data: [140, 232, 101, 264, 90, 340, 250]
      },
      {
        name: 'Relatórios',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 0
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: 'rgb(0, 221, 255)'
            }, {
              offset: 1,
              color: 'rgb(77, 119, 255)'
            }]
          }
        },
        emphasis: {
          focus: 'series'
        },
        data: [120, 282, 111, 234, 220, 340, 310]
      },
      {
        name: 'Mídias',
        type: 'line',
        stack: 'Total',
        smooth: true,
        lineStyle: {
          width: 0
        },
        showSymbol: false,
        areaStyle: {
          opacity: 0.8,
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: 'rgb(55, 162, 255)'
            }, {
              offset: 1,
              color: 'rgb(116, 21, 219)'
            }]
          }
        },
        emphasis: {
          focus: 'series'
        },
        data: [320, 132, 201, 334, 190, 130, 220]
      }
    ]
  };

  // 3. Radar Chart Profissional
  const radarOption = {
    title: {
      text: 'Análise de Desempenho por Analista',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold'
      }
    },
    legend: {
      data: ['Analista A', 'Analista B'],
      top: 30
    },
    radar: {
      indicator: [
        { name: 'Velocidade', max: 100 },
        { name: 'Qualidade', max: 100 },
        { name: 'Complexidade', max: 100 },
        { name: 'Volume', max: 100 },
        { name: 'Satisfação', max: 100 },
        { name: 'Eficiência', max: 100 }
      ],
      shape: 'circle',
      splitNumber: 5,
      axisName: {
        color: 'rgb(238, 197, 102)'
      },
      splitLine: {
        lineStyle: {
          color: [
            'rgba(238, 197, 102, 0.1)',
            'rgba(238, 197, 102, 0.2)',
            'rgba(238, 197, 102, 0.4)',
            'rgba(238, 197, 102, 0.6)',
            'rgba(238, 197, 102, 0.8)',
            'rgba(238, 197, 102, 1)'
          ].reverse()
        }
      },
      splitArea: {
        show: false
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(238, 197, 102, 0.5)'
        }
      }
    },
    series: [
      {
        name: 'Desempenho',
        type: 'radar',
        data: [
          {
            value: [85, 90, 78, 92, 88, 80],
            name: 'Analista A',
            lineStyle: {
              color: '#5470C6'
            },
            areaStyle: {
              color: 'rgba(84, 112, 198, 0.2)'
            }
          },
          {
            value: [78, 85, 93, 85, 75, 90],
            name: 'Analista B',
            lineStyle: {
              color: '#91CC75'
            },
            areaStyle: {
              color: 'rgba(145, 204, 117, 0.2)'
            }
          }
        ]
      }
    ]
  };

  // 4. Sankey Diagram Profissional
  const sankeyOption = {
    title: {
      text: 'Fluxo de Documentos',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove'
    },
    series: [
      {
        type: 'sankey',
        layout: 'none',
        emphasis: {
          focus: 'adjacency'
        },
        data: [
          { name: 'Entrada' },
          { name: 'Triagem' },
          { name: 'Análise' },
          { name: 'Processamento' },
          { name: 'Revisão' },
          { name: 'Aprovado' },
          { name: 'Rejeitado' },
          { name: 'Finalizado' }
        ],
        links: [
          { source: 'Entrada', target: 'Triagem', value: 100 },
          { source: 'Triagem', target: 'Análise', value: 85 },
          { source: 'Triagem', target: 'Rejeitado', value: 15 },
          { source: 'Análise', target: 'Processamento', value: 70 },
          { source: 'Análise', target: 'Revisão', value: 15 },
          { source: 'Processamento', target: 'Aprovado', value: 60 },
          { source: 'Processamento', target: 'Revisão', value: 10 },
          { source: 'Revisão', target: 'Aprovado', value: 20 },
          { source: 'Revisão', target: 'Rejeitado', value: 5 },
          { source: 'Aprovado', target: 'Finalizado', value: 80 }
        ],
        lineStyle: {
          color: 'gradient',
          curveness: 0.5
        }
      }
    ]
  };

  // 5. Heatmap Calendar Profissional
  const getVirtualData = () => {
    const date = +new Date('2024-01-01');
    const end = +new Date('2024-12-31');
    const dayTime = 3600 * 24 * 1000;
    const data = [];
    for (let time = date; time <= end; time += dayTime) {
      data.push([
        new Date(time).toISOString().split('T')[0],
        Math.floor(Math.random() * 100)
      ]);
    }
    return data;
  };

  const calendarOption = {
    title: {
      text: 'Atividade Anual de Demandas',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      position: 'top'
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      top: 65,
      inRange: {
        color: ['#f0f0f0', '#bae7ff', '#40a9ff', '#1890ff', '#0050b3']
      }
    },
    calendar: {
      top: 120,
      left: 30,
      right: 30,
      cellSize: ['auto', 13],
      range: '2024',
      itemStyle: {
        borderWidth: 0.5
      },
      yearLabel: { show: false }
    },
    series: {
      type: 'heatmap',
      coordinateSystem: 'calendar',
      data: getVirtualData()
    }
  };

  // 6. Gráfico 3D de Barras
  const bar3DData = [];
  for (let analista = 0; analista < 5; analista++) {
    for (let mes = 0; mes < 12; mes++) {
      bar3DData.push([mes, analista, Math.random() * 50 + 10]);
    }
  }

  /* const bar3DOption = {
    title: {
      text: 'Performance 3D: Analistas x Meses',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold'
      }
    },
    tooltip: {},
    visualMap: {
      max: 60,
      inRange: {
        color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
      }
    },
    xAxis3D: {
      type: 'category',
      data: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    },
    yAxis3D: {
      type: 'category',
      data: ['Alan', 'Maria', 'João', 'Ana', 'Pedro']
    },
    zAxis3D: {
      type: 'value'
    },
    grid3D: {
      boxWidth: 200,
      boxDepth: 80,
      viewControl: {
        // projection: 'orthographic'
      },
      light: {
        main: {
          intensity: 1.2,
          shadow: true
        },
        ambient: {
          intensity: 0.3
        }
      }
    },
    series: [{
      type: 'bar3D',
      data: bar3DData.map(function (item) {
        return {
          value: [item[0], item[1], item[2]]
        };
      }),
      shading: 'lambert',
      label: {
        fontSize: 16,
        borderWidth: 1
      },
      emphasis: {
        label: {
          fontSize: 20,
          color: '#900'
        },
        itemStyle: {
          color: '#900'
        }
      }
    }]
  }; */

  // 7. Sunburst (Hierarquia Circular)
  const sunburstOption = {
    title: {
      text: 'Distribuição Hierárquica de Demandas',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold'
      }
    },
    series: {
      type: 'sunburst',
      data: [
        {
          name: 'Total',
          children: [
            {
              name: 'Jurídico',
              value: 15,
              children: [
                { name: 'Contratos', value: 5 },
                { name: 'Processos', value: 7 },
                { name: 'Consultas', value: 3 }
              ]
            },
            {
              name: 'Técnico',
              value: 20,
              children: [
                { name: 'Análises', value: 8 },
                { name: 'Relatórios', value: 7 },
                { name: 'Perícias', value: 5 }
              ]
            },
            {
              name: 'Administrativo',
              value: 25,
              children: [
                { name: 'Ofícios', value: 10 },
                { name: 'Circulares', value: 8 },
                { name: 'Comunicados', value: 7 }
              ]
            }
          ]
        }
      ],
      radius: [60, '90%'],
      itemStyle: {
        borderRadius: 7,
        borderWidth: 2
      },
      label: {
        show: true
      }
    }
  };

  // 8. Liquid Fill (Indicador Líquido)
  const liquidOption = {
    series: [{
      type: 'gauge',
      center: ['50%', '60%'],
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max: 100,
      splitNumber: 10,
      itemStyle: {
        color: '#58D9F9'
      },
      progress: {
        show: true,
        width: 30
      },
      pointer: {
        show: false
      },
      axisLine: {
        lineStyle: {
          width: 30
        }
      },
      axisTick: {
        distance: -45,
        splitNumber: 5,
        lineStyle: {
          width: 2,
          color: '#999'
        }
      },
      splitLine: {
        distance: -52,
        length: 14,
        lineStyle: {
          width: 3,
          color: '#999'
        }
      },
      axisLabel: {
        distance: -20,
        color: '#999',
        fontSize: 12
      },
      anchor: {
        show: false
      },
      title: {
        show: false
      },
      detail: {
        valueAnimation: true,
        width: '60%',
        lineHeight: 40,
        borderRadius: 8,
        offsetCenter: [0, '-15%'],
        fontSize: 30,
        fontWeight: 'bolder',
        formatter: '{value}%',
        color: 'inherit'
      },
      data: [{
        value: 72.5,
        name: 'Meta Atingida'
      }]
    }]
  };

  return (
    <div style={{ padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h1 style={{ color: 'white', marginBottom: '30px', fontSize: '32px', fontWeight: 'bold' }}>
          Dashboard Profissional com Apache ECharts
        </h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(600px, 1fr))', gap: '30px' }}>
          
          {/* Gauge KPI */}
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <ReactECharts option={gaugeOption} style={{ height: '400px' }} />
          </div>

          {/* Area Gradient */}
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <ReactECharts option={areaGradientOption} style={{ height: '400px' }} />
          </div>

          {/* Radar */}
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <ReactECharts option={radarOption} style={{ height: '400px' }} />
          </div>

          {/* Sankey */}
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <ReactECharts option={sankeyOption} style={{ height: '400px' }} />
          </div>

          {/* Calendar Heatmap */}
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', gridColumn: 'span 2' }}>
            <ReactECharts option={calendarOption} style={{ height: '300px' }} />
          </div>

          {/* Sunburst */}
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <ReactECharts option={sunburstOption} style={{ height: '400px' }} />
          </div>

          {/* Liquid Gauge */}
          <div style={{ background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
            <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>Meta de Resolução Mensal</h3>
            <ReactECharts option={liquidOption} style={{ height: '350px' }} />
          </div>

        </div>

        <div style={{ marginTop: '40px', padding: '30px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginBottom: '20px' }}>🎯 Por que Apache ECharts é Profissional?</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#5470C6', marginBottom: '10px' }}>🚀 Performance</h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Renderização com Canvas/SVG</li>
                <li>Suporta milhões de pontos</li>
                <li>Lazy loading de dados</li>
                <li>Otimização automática</li>
              </ul>
            </div>

            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#91CC75', marginBottom: '10px' }}>🎨 Visual Profissional</h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Animações suaves</li>
                <li>Temas customizáveis</li>
                <li>Gradientes e sombras</li>
                <li>Interações avançadas</li>
              </ul>
            </div>

            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#FAC858', marginBottom: '10px' }}>📊 Recursos Enterprise</h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>50+ tipos de gráficos</li>
                <li>Gráficos 3D e GL</li>
                <li>Big Data handling</li>
                <li>Exportação em alta qualidade</li>
              </ul>
            </div>

            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px' }}>
              <h3 style={{ color: '#EE6666', marginBottom: '10px' }}>🏢 Usado por Gigantes</h3>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                <li>Alibaba</li>
                <li>Baidu</li>
                <li>Amazon China</li>
                <li>GitLab</li>
              </ul>
            </div>
          </div>

          <div style={{ marginTop: '30px', padding: '20px', background: '#e8f4fd', borderRadius: '8px' }}>
            <h3>📈 Tipos Exclusivos do ECharts:</h3>
            <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', margin: 0, paddingLeft: '20px' }}>
              <li><strong>Sankey:</strong> Fluxos e relacionamentos</li>
              <li><strong>Sunburst:</strong> Hierarquias circulares</li>
              <li><strong>ThemeRiver:</strong> Evolução temporal</li>
              <li><strong>Calendar:</strong> Heatmap de calendário</li>
              <li><strong>Gauge:</strong> Indicadores KPI</li>
              <li><strong>Graph:</strong> Redes e grafos</li>
              <li><strong>Parallel:</strong> Coordenadas paralelas</li>
              <li><strong>Pictorial:</strong> Gráficos pictóricos</li>
              <li><strong>GL/3D:</strong> Visualizações 3D</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
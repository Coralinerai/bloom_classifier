import { useState, useEffect } from 'react';
import './App.css';
import React from 'react';
import { Bubble } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  Tooltip,
  Legend,
  LinearScale,
  PointElement,
  Title,
} from 'chart.js';

ChartJS.register(Tooltip, Legend, LinearScale, PointElement, Title);

function getColor(score) {
  const r = Math.round(255 * (1 - score));
  const g = Math.round(255 * score);
  return `rgb(${r},${g},0)`;
}

function App() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState({
    datasets: []
  });

  useEffect(() => {
    if (response?.recommendations) {
      const newData = {
        datasets: [{
          label: 'Recommended LLMs',
          data: response.recommendations.map(model => ({
            x: typeof model.cost_usd === 'number' ? model.cost_usd : 0,
            y: model.carbon_footprint || 1,
            r: model.performance_score || 10,
            name: model.model,
            larena: model.arena_score,
            organization: model.organization,
            inputTokens: model.input_tokens,
            outputTokens: model.output_tokens
          })),
          backgroundColor: response.recommendations.map(model => getColor(model.arena_score)),
          borderColor: '#fff',
          borderWidth: 1,
          pointStyle: 'circle',
          showLine: false,
        }]
      };
      setChartData(newData);
    }
  }, [response]);

  const options = {
    plugins: {
      tooltip: {
        callbacks: {
          label: (context) => {
            const d = context.raw;
            return [
              `Model: ${d.name}`,
              `Organization: ${d.organization}`,
              `Cost: ${d.x.toFixed(6)} €`,
              `CO₂: ${d.y.toFixed(2)} g`,
              `Performance: ${d.r.toFixed(2)}`,
              `Arena Score: ${d.larena.toFixed(2)}`,
              `Tokens: ${d.inputTokens} in / ${d.outputTokens} out`
            ];
          }
        }
      },
      legend: { display: false }
    },
    scales: {
      x: {
        title: { display: true, text: 'Cost (€)' },
        min: 0,
        max: 0.0005
      },
      y: {
        title: { display: true, text: 'Carbon footprint (g CO₂e)' },
        min: 0,
        max: 2
      }
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  const analyzePrompt = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt first!');
      return;
    }

    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const res = await fetch('http://localhost:5000/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: prompt }),
      });

      if (!res.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await res.json();
      setResponse(data);
    } catch (err) {
      setError('Error: ' + err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="app-container">
        <h1 className="main-title">🌿 ECO AI Toolkit</h1>
        
        <div className="input-section">
          <h2>Enter your prompt:</h2>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your AI prompt here..."
            disabled={loading}
            className="prompt-textarea"
          />
          <button onClick={analyzePrompt} disabled={loading} className="btn-analyze">
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
        
        {loading && <div className="loading">Processing...</div>}
        {error && <div className="error">{error}</div>}
        
        {response && (
          <div className="results">
            <h3>Recommended Models</h3>
            <div className="model-recommendations">
              {response.recommendations.map((model, index) => (
                <div key={index} className="model-card">
                  <h4>{model.model}</h4>
                  <p><strong>Organization:</strong> {model.organization}</p>
                  <p><strong>Arena Score:</strong> {model.arena_score.toFixed(2)}</p>
                  <p><strong>Input Tokens:</strong> {model.input_tokens}</p>
                  <p><strong>Output Tokens:</strong> {model.output_tokens}</p>
                  <p><strong>Estimated Cost:</strong> 
                    {typeof model.cost_usd === 'number' 
                      ? '$' + model.cost_usd.toFixed(6) 
                      : model.cost_usd}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="chart-container">
        <h2 className="chart-title">LLM Comparison</h2>
        <div className="graph-wrapper">
          {chartData.datasets.length > 0 ? (
            <>
              <Bubble data={chartData} options={options} style={{ height: "100%", width: "100%" }} />
              <div className="legend-container">
                <span className="legend-title">Arena Score Legend:</span>
                <div className="legend-items">
                  <div className="legend-color" style={{ backgroundColor: 'rgb(255,0,0)' }}></div>
                  <span>0 (low)</span>
                  <div className="legend-color" style={{ backgroundColor: 'rgb(128,128,0)' }}></div>
                  <span>0.5 (medium)</span>
                  <div className="legend-color" style={{ backgroundColor: 'rgb(0,255,0)' }}></div>
                  <span>1 (high)</span>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-chart-message">
              <p>Analyze a prompt to see recommendations on the chart</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;

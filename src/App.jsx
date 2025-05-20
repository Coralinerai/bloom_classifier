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
  if (score <= 0.33) return '#bae6fd';      // low score
  else if (score <= 0.66) return '#7dd3fc'; // medium score
  else return '#38bdf8';                     // high score
}

function App() {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState({
    datasets: []
  });
  const [expandedIndex, setExpandedIndex] = useState(null);

  
  useEffect(() => {
  if (response?.recommendations?.length > 0) {
    const recommendations = response.recommendations;
    
    // Trouver les valeurs max pour une échelle adaptative
    const maxCost = Math.max(...recommendations.map(m => m.cost_usd || 0));
    const maxCarbon = Math.max(...recommendations.map(m => m.carbon_footprint || 0));
    const maxArena = Math.max(...recommendations.map(m => m.arena_score || 0));

    const newData = {
      datasets: [{
        label: 'Recommended LLMs',
        data: recommendations.map(model => ({
          x: model.cost_usd || 0,
          y: model.carbon_footprint || 0,
          r: 5 + (model.arena_score / maxArena) * 10, 
          name: model.model,
          arena_score: model.arena_score,
          organization: model.organization,
          inputTokens: model.input_tokens,
          outputTokens: model.output_tokens
        })),
        backgroundColor: recommendations.map(model => 
          getColor(model.arena_score / maxArena) 
        ),
        borderColor: '#ffffff',
        borderWidth: 1
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
          const data = context.raw;
          return [
            `Model: ${data.name}`,
            `Organization: ${data.organization}`,
            `Cost: $${data.x?.toFixed(6) || '0'}`,
            `CO₂: ${data.y?.toFixed(6) || '0'} kg`,
            `Arena Score: ${data.arena_score?.toFixed(2) || '0'}`,
            `Tokens: ${data.inputTokens} in / ${data.outputTokens} out`
          ];
        }
      }
    },
    legend: {
      display: false
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Cost (USD)'
      },
      min: 0,
      suggestedMax: 0.0005 // Valeur par défaut mais s'adaptera si nécessaire
    },
    y: {
      title: {
        display: true,
        text: 'Carbon Footprint (kg CO₂e)'
      },
      min: 0,
      suggestedMax: 0.002 // Valeur par défaut mais s'adaptera si nécessaire
    }
  },
  responsive: true,
  maintainAspectRatio: false
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

  const faqs = [
    {
      question: "What is a token anyway ?",
      answer: "A token is the basic unit of text that a language model processes. Think of it as a piece of text that the model breaks down for analysis and generation. "
    },
     {
      question: "another question",
      answer: "answer"
    },
    {
      question: "another question",
      answer: "answer"
    },
    {
      question: "another question",
      answer: "answer"
    },
    {
      question: "another question",
      answer: "answer"
    },
  ];

  const toggleFAQ = (index) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <>
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 24px',
        height: '60px',
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.08)'
      }}>
        <span style={{
          fontSize: '18px',
          fontWeight: '600',
          color: '#333'
        }}>
          ECO AI Toolkit 🌱
        </span>
        
        <span style={{
          fontSize: '12px',
          color: '#666',
          fontStyle: 'italic'
        }}>
          Made by OpenL
        </span>
      </div>
      
      <div className="hero-section">
        <div className="hero-content">
          <h1>🌍 Bienvenue dans ECO AI Toolkit</h1>
          <p>Optimisez vos requêtes IA tout en réduisant leur empreinte carbone 🌱</p>
<button
  className="btn-get-started"
  onClick={() => {
    const section = document.getElementById('prompt-section');
    if (section) {
      const yOffset = -100; // valeur négative pour remonter un peu (ou positive pour descendre)
      const y = section.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }}
>            Commencer
          </button>
        </div>
      </div>

      <div className="app-container">
        <center>       
          <div className="input-section" id="prompt-section" >
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
        </center> 
        
        {loading && <div className="loading">Processing...</div>}
        {error && <div className="error">{error}</div>}
        
        {response && (
          <div className="results">
           <center> <h3>Recommended Models</h3></center>
            <div className="model-recommendations" style={{ maxWidth: '800px', margin: '0 auto' }}>
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
                  <p><strong>Carbon emission</strong> {model.carbon_footprint}</p>
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
                <span className="legend-title">Arena Score Legend:</span><br/>
                <div className="legend-items">
                  <div className="legend-color" style={{ backgroundColor: '#bae6fd' }}></div>
                  <span>0 (low)</span>
                  <div className="legend-color" style={{ backgroundColor: '#7dd3fc' }}></div>
                  <span>0.5 (medium)</span>
                  <div className="legend-color" style={{ backgroundColor: '#38bdf8' }}></div>
                  <span>1 (high)</span>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-chart-message">
              <center><p>Analyze a prompt to see recommendations on the chart</p></center>
            </div>
          )}
        </div>
      </div>
<br/><br/>
      {/* Section FAQ ajoutée ici */}
      <div style={{ 
        maxWidth: '800px', 
        margin: '40px auto', 
        padding: '0 20px',
        fontFamily: 'Arial, sans-serif' 
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Frequently asked questions</h1>
        
        {faqs.map((faq, index) => (
          <div key={index} style={{ 
            marginBottom: '15px', 
            borderBottom: '1px solid #eee',
            paddingBottom: '10px'
          }}>
            <div 
              style={{ 
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              onClick={() => toggleFAQ(index)}
            >
              <span>{faq.question}</span>
              <span style={{ fontSize: '18px' }}>{expandedIndex === index ? '-' : '+'}</span>
            </div>
            
            {expandedIndex === index && (
              <div style={{ 
                padding: '10px 0 20px 0',
                color: '#555'
              }}>
                {faq.answer}
              </div>
            )}
          </div>
        ))}
      </div>

      <footer style={{
        textAlign: 'center',
        padding: '20px',
        marginTop: '40px',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #eaeaea',
        color: '#666',
        fontSize: '14px'
      }}>
        Copyright © {new Date().getFullYear()} - All rights reserved by ECO AI Toolkit
      </footer>
    </>
  );
}

export default App;

import React, { useState, useRef, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Form, Button, Card, Spinner, Stack, FormLabel } from 'react-bootstrap';
import axios from 'axios'; 

// Groq API configuration
const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama3-70b-8192'; 

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState('General Assistant');
  const messagesEndRef = useRef(null);

  const roles = [
    'General Assistant',
    'Software Engineer',
    'Nutritionist',
    'Skin Expert',
    'Financial Advisor',
    'Travel Guide',
    'Fitness Coach',
    'Mental Health Support'
  ];

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input, timestamp: new Date().toLocaleTimeString() };
    setMessages([...messages, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await sendToGroq(input, selectedRole, messages);
      const assistantMessage = { 
        role: 'assistant', 
        content: response, 
        assistantRole: selectedRole,
        timestamp: new Date().toLocaleTimeString() 
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling Groq API:', error);
      const errorMessage = { 
        role: 'assistant', 
        content: 'Sorry, there was an error processing your request: ' + error.message, 
        timestamp: new Date().toLocaleTimeString() 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const sendToGroq = async (userInput, role, previousMessages) => {
    // Format conversation history for the API
    const conversationHistory = previousMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Create system message based on the selected role
    const systemMessage = {
      role: "system",
      content: createSystemPrompt(role)
    };

    // Current user message
    const userMessage = {
      role: "user",
      content: userInput
    };

    // Prepare the API request payload
    try {
      const response = await axios.post(
        GROQ_API_URL,
        {
          model: GROQ_MODEL,
          messages: [
            systemMessage,
            ...conversationHistory,
            userMessage
          ],
          temperature: 0.7,
          max_tokens: 1024
        },
        {
          headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Groq API Error:', error.response?.data || error.message);
      throw error;
    }
  };

  // Create appropriate system prompt based on role
  const createSystemPrompt = (role) => {
    const rolePrompts = {
      'General Assistant': 'You are a helpful AI assistant. Answer questions accurately and be conversational.',
      'Software Engineer': 'You are an expert software engineer. Help with coding questions, debugging, system design, and best practices. If a question is unrelated to software engineering, politely explain you can only answer software engineering questions in this role.',
      'Nutritionist': 'You are a professional nutritionist. Provide advice on diet, food choices, nutrition, and healthy eating habits. If a question is unrelated to nutrition, politely explain you can only answer nutrition questions in this role.',
      'Skin Expert': 'You are a dermatology expert. Provide information about skincare, common skin conditions, and basic skincare routines. If a question is unrelated to skin health, politely explain you can only answer skin-related questions in this role.',
      'Financial Advisor': 'You are a financial advisor. Provide guidance on personal finance, investments, budgeting, and financial planning. If a question is unrelated to finance, politely explain you can only answer financial questions in this role.',
      'Travel Guide': 'You are a travel expert. Provide recommendations about destinations, travel tips, and cultural information. If a question is unrelated to travel, politely explain you can only answer travel questions in this role.',
      'Fitness Coach': 'You are a fitness coach. Provide advice on exercise, workouts, fitness goals, and training programs. If a question is unrelated to fitness, politely explain you can only answer fitness questions in this role.',
      'Mental Health Support': 'You are a mental wellness guide. Provide information about stress management, self-care practices, and general mental wellness tips. You are NOT a therapist, so make this clear and suggest professional help when appropriate. If a question is unrelated to mental wellness, politely explain you can only answer mental health questions in this role.'
    };

    return rolePrompts[role] || rolePrompts['General Assistant'];
  };

  return (
    <Container fluid className="vh-100 d-flex flex-column p-0 bg-light">
      <Row className="bg-white shadow-sm py-3">
        <Col>
          <h1 className="text-center mb-0 text-primary">RoleChat</h1>
          {/* <p className="text-center text-muted mb-0">Select your expert role below</p> */}
        </Col>
      </Row>
      
      <Row className="flex-grow-1 overflow-hidden">
        <Col xl={10} lg={10} md={12} className="mx-auto d-flex flex-column p-4">
          {/* Messages display area */}
          <Card className="flex-grow-1 mb-4 shadow-sm" style={{ minHeight: '60vh' }}>
            <Card.Body 
              className="d-flex flex-column p-4" 
              style={{ 
                backgroundColor: '#f8f9fa',
                overflowY: 'auto',
                height: '1px' // Crucial for proper flex overflow
              }}
            >
              <div className="flex-grow-1">
                {messages.length === 0 ? (
                  <div className="text-center text-muted my-5 py-5">
                    <h2 className="display-6">Welcome</h2>
                    <p className="lead">Select a role and start your conversation!</p>
                  </div>
                ) : (
                  <Stack gap={3}>
                    {messages.map((msg, index) => (
                      <div 
                        key={index} 
                        className={`d-flex ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                      >
                        <Card 
                          className={`${msg.role === 'user' ? 'bg-primary text-white' : 'bg-white shadow-sm'} border-0`}
                          style={{ 
                            maxWidth: 'min(80%, 800px)',
                            borderRadius: msg.role === 'user' ? '15px 15px 0 15px' : '15px 15px 15px 0'
                          }}
                        >
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <small className={`fw-medium ${msg.role === 'user' ? 'text-white-50' : 'text-muted'}`}>
                                {/* {msg.role === 'user' ? 'You' : msg.assistantRole || selectedRole} */}
                              </small>
                              {/* <small className={`${msg.role === 'user' ? 'text-white-50' : 'text-muted'}`}>
                                {msg.timestamp}
                              </small> */}
                              <small className={`fw-medium ${msg.role === 'user' ? 'text-white-50' : 'text-muted'}`}>
                                {msg.role === 'user' ? 'You' : msg.assistantRole || selectedRole} - {msg.timestamp}
                              </small>
                            </div>
                            <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{msg.content}</div>
                          </Card.Body>
                        </Card>
                      </div>
                    ))}
                  </Stack>
                )}
                {loading && (
                  <div className="d-flex justify-content-start">
                    <Card 
                      className="bg-white shadow-sm border-0"
                      style={{ maxWidth: 'min(80%, 800px)', borderRadius: '15px 15px 15px 0' }}
                    >
                      <Card.Body>
                        <div className="d-flex align-items-center">
                          <Spinner animation="border" size="sm" className="me-2" />
                          <span className="text-muted">Generating response...</span>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </Card.Body>
          </Card>
          
          {/* Input form */}
          <Form onSubmit={handleSubmit} className="shadow-lg rounded-10">
            <Row className="g-2">
              <Col xl={3} lg={3} md={4} className="pe-0">
                {/* <Form.Select 
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  disabled={loading}
                  className="h-100 rounded-end-0 border-end-0"
                >
                  {roles.map((role) => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </Form.Select> */}
              
              <Form.Select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={loading}
                className="h-100 rounded-end-0 border-end-0"
                style={{ 
                  backgroundColor: '#000',
                  color: '#fff',
                  borderColor: '#000',
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='%23fff' d='M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e")`
                }}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </Form.Select>
              </Col>
              <Col xl={9} lg={9} md={8} className="ps-0">
                <div className="d-flex">
                  <Form.Control
                    as="textarea"
                    placeholder="Type your message here..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={loading}
                    className="rounded-0 border-start-0 flex-grow-1"
                    style={{ 
                      resize: 'none', 
                      minHeight: '56px',
                      maxHeight: '120px',
                      lineHeight: '1.5',
                      padding: '12px 16px'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                      }
                    }}
                  />
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={loading || !input.trim()}
                    className="rounded-start-0 px-4"
                    style={{ minWidth: '100px' }}
                  >
                    {loading ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <span className="d-none d-md-inline">Send</span>
                    )}
                    <i className="bi bi-send-fill d-md-none"></i>
                  </Button>
                </div>
              </Col>
            </Row>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}

const InputGroup = ({ children }) => (
  <div className="input-group">{children}</div>
);

export default App;
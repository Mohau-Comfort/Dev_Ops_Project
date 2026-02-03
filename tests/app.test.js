import app from '#src/app.js';
import request from 'supertest';

describe('API Endpoints', () => {
  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/api/health').expect(200);
  
      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api', () => {
    it('should return API message', async () => {
      const response = await request(app).get('/api').expect(200);
    
      expect(response.body).toHaveProperty('message', 'API is running');
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for nonexistent endpoint', async () => {
      const response = await request(app).get('/nonexistent').expect(404);
    
      expect(response.body).toHaveProperty('message', 'Route not found');
    });
  });

});
<template>
  <div class="not-found">
    <div class="error-content">
      <h1>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you are looking for doesn't exist or has been moved.</p>
      <router-link to="/login" class="btn-home">Go to Homepage</router-link>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.error-content {
  text-align: center;
  color: white;
}

.error-content h1 {
  font-size: 120px;
  margin-bottom: 20px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
}

.error-content h2 {
  font-size: 36px;
  margin-bottom: 20px;
}

.error-content p {
  font-size: 18px;
  margin-bottom: 30px;
  opacity: 0.9;
}

.btn-home {
  display: inline-block;
  padding: 12px 30px;
  background: white;
  color: #667eea;
  text-decoration: none;
  border-radius: 5px;
  font-weight: 500;
  transition: transform 0.3s;
}

.btn-home:hover {
  transform: translateY(-2px);
}
</style>
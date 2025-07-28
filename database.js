const mysql = require('mysql2/promise');
const config = require('./config');

const pool = mysql.createPool({
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
  port: config.mysql.port
});

// 初始化用户表
const createUserTable = `
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`;

// 初始化节点表
const createNodeTable = `
CREATE TABLE IF NOT EXISTS nodes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  location VARCHAR(255) NOT NULL,
  sponsor_id INT,
  sponsored_at TIMESTAMP,
  status VARCHAR(255) DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (sponsor_id) REFERENCES users(id)
);`;

// 初始化隧道表
const createTunnelTable = `
CREATE TABLE IF NOT EXISTS tunnels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  protocol VARCHAR(255) NOT NULL,
  local_port INT NOT NULL,
  remote_port INT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);`;

(async () => {
  try {
    const connection = await pool.getConnection();
    await connection.query(createUserTable);
    await connection.query(createNodeTable);
    await connection.query(createTunnelTable);
    connection.release();
  } catch (error) {
    console.error('初始化数据库表失败:', error);
  }
})();

module.exports = pool;
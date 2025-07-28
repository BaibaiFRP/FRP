const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: '用户名、邮箱和密码不能为空' });
    }

    // 检查用户名和邮箱是否已存在
    const checkQuery = 'SELECT * FROM users WHERE username = ? OR email = ?';
    const [users] = await db.query(checkQuery, [username, email]);
    const user = users[0];
    if (user) {
      if (user.username === username) {
        return res.status(400).json({ message: '用户名已存在' });
      }
      return res.status(400).json({ message: '邮箱已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建新用户
    const insertQuery = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    await db.query(insertQuery, [username, email, hashedPassword]);
    res.status(201).json({ message: '注册成功' });
  } catch (error) {
    res.status(500).json({ message: '注册失败', error: error.message });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    // 检查用户是否存在
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = users[0];
    if (!user) {
      return res.status(400).json({ message: '用户不存在' });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: '密码错误' });
    }

    // 生成 JWT，设置过期时间为24小时
    const token = jwt.sign({
      id: user.id,
      username: user.username,
      email: user.email
    }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.status(200).json({ message: '登录成功', token, redirect: '/console' });
  } catch (error) {
    res.status(500).json({ message: '登录失败', error: error.message });
  }
});

module.exports = router;
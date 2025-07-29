const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');

// 验证用户名格式
const validateUsername = (username) => {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
};

// 验证邮箱格式
const validateEmail = (email) => {
  return /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email);
};

// 验证密码强度
const validatePassword = (password) => {
  return password.length >= 8;
};

// 注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ code: 400, message: '用户名、邮箱和密码不能为空' });
    }

    if (!validateUsername(username)) {
      return res.status(400).json({ code: 400, message: '用户名需由3-20位字母、数字或下划线组成' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ code: 400, message: '邮箱格式不正确' });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ code: 400, message: '密码长度至少为8位' });
    }

    // 检查用户名和邮箱是否已存在
    const checkQuery = 'SELECT * FROM users WHERE username = ? OR email = ?';
    const [users] = await db.query(checkQuery, [username, email]);
    const user = users[0];
    if (user) {
      if (user.username === username) {
        return res.status(400).json({ code: 400, message: '用户名已存在' });
      }
      return res.status(400).json({ code: 400, message: '邮箱已存在' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // 创建新用户
    const insertQuery = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    await db.query(insertQuery, [username, email, hashedPassword]);
    res.status(201).json({ code: 201, message: '注册成功' });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ code: 500, message: '注册失败，请稍后重试' });
  }
});

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }

    // 检查用户是否存在
    const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    const user = users[0];
    if (!user) {
      return res.status(400).json({ code: 400, message: '用户不存在' });
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ code: 400, message: '密码错误' });
    }

    // 生成 JWT，设置过期时间为24小时
    const token = jwt.sign({
      id: user.id,
      username: user.username,
      email: user.email
    }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.cookie('token', token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    res.status(200).json({ code: 200, message: '登录成功', token, redirect: '/console' });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ code: 500, message: '登录失败，请稍后重试' });
  }
});

// 获取用户信息
router.get('/user-info', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ code: 401, message: '未登录' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const [users] = await db.query('SELECT id, username, email, createdAt as register_time, is_verified, points, bandwidth, traffic FROM users WHERE id = ?', [decoded.id]);
        const user = users[0];
        if (!user) {
            return res.status(404).json({ code: 404, message: '用户不存在' });
        }

        res.status(200).json({
            code: 200,
            message: '获取用户信息成功',
            username: user.username,
            email: user.email,
            registerTime: user.register_time,
            verified: user.is_verified,
            points: user.points,
            bandwidth: user.bandwidth,
            traffic: user.traffic
        });
    } catch (error) {
        console.error('获取用户信息错误:', error);
        res.status(500).json({ code: 500, message: '获取用户信息失败，请稍后重试' });
    }
});

module.exports = router;
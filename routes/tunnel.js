const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

// 创建隧道
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      protocol,
      localPort,
      remotePort,
      description
    } = req.body;

    db.run(
      'INSERT INTO tunnels (user_id, name, protocol, local_port, remote_port, description) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, name, protocol, localPort, remotePort, description],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '隧道创建失败', error: err.message });
        }
        db.get('SELECT * FROM tunnels WHERE id = ?', [this.lastID], (err, tunnel) => {
          if (err) {
            return res.status(500).json({ message: '隧道创建失败', error: err.message });
          }
          res.status(201).json({ message: '隧道创建成功', tunnel });
        });
      }
    );
  } catch (error) {
    res.status(500).json({ message: '隧道创建失败', error: error.message });
  }
});

// 获取用户所有隧道
router.get('/', auth, async (req, res) => {
  try {
    db.all('SELECT * FROM tunnels WHERE user_id = ?', [req.user.id], (err, tunnels) => {
      if (err) {
        return res.status(500).json({ message: '获取隧道列表失败', error: err.message });
      }
      res.status(200).json({ tunnels });
    });
  } catch (error) {
    res.status(500).json({ message: '获取隧道列表失败', error: error.message });
  }
});

// 更新隧道
router.put('/:id', auth, async (req, res) => {
  try {
    db.get('SELECT * FROM tunnels WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, tunnel) => {
      if (err) {
        return res.status(500).json({ message: '隧道更新失败', error: err.message });
      }
      if (!tunnel) {
        return res.status(404).json({ message: '未找到该隧道' });
      }

      const { name, protocol, localPort, remotePort, description } = req.body;
      db.run(
        'UPDATE tunnels SET name = ?, protocol = ?, local_port = ?, remote_port = ?, description = ? WHERE id = ?',
        [name, protocol, localPort, remotePort, description, req.params.id],
        function(err) {
          if (err) {
            return res.status(500).json({ message: '隧道更新失败', error: err.message });
          }
          db.get('SELECT * FROM tunnels WHERE id = ?', [req.params.id], (err, updatedTunnel) => {
            if (err) {
              return res.status(500).json({ message: '隧道更新失败', error: err.message });
            }
            res.status(200).json({ message: '隧道更新成功', tunnel: updatedTunnel });
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: '隧道更新失败', error: error.message });
  }
});

// 删除隧道
router.delete('/:id', auth, async (req, res) => {
  try {
    db.get('SELECT * FROM tunnels WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, tunnel) => {
      if (err) {
        return res.status(500).json({ message: '隧道删除失败', error: err.message });
      }
      if (!tunnel) {
        return res.status(404).json({ message: '未找到该隧道' });
      }

      db.run('DELETE FROM tunnels WHERE id = ?', [req.params.id], (err) => {
        if (err) {
          return res.status(500).json({ message: '隧道删除失败', error: err.message });
        }
        res.status(200).json({ message: '隧道删除成功' });
      });
    });
  } catch (error) {
    res.status(500).json({ message: '隧道删除失败', error: error.message });
  }
});

// 生成配置文件
router.get('/:id/config', auth, async (req, res) => {
  try {
    db.get('SELECT * FROM tunnels WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], (err, tunnel) => {
      if (err) {
        return res.status(500).json({ message: '生成配置文件失败', error: err.message });
      }
      if (!tunnel) {
        return res.status(404).json({ message: '未找到该隧道' });
      }

      const configContent = `[${tunnel.name}]
protocol = ${tunnel.protocol}
local_port = ${tunnel.local_port}
remote_port = ${tunnel.remote_port}`;
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', `attachment; filename=${tunnel.name}.ini`);
      res.send(configContent);
    });
  } catch (error) {
    res.status(500).json({ message: '生成配置文件失败', error: error.message });
  }
});

module.exports = router;
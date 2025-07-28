const express = require('express');
const router = express.Router();
const db = require('../database');
const auth = require('../middleware/auth');

// 获取所有可用节点
router.get('/', async (req, res) => {
  try {
    db.all('SELECT * FROM nodes WHERE status = ?', ['available'], (err, nodes) => {
      if (err) {
        return res.status(500).json({ message: '获取节点列表失败', error: err.message });
      }
      res.status(200).json({ nodes });
    });
  } catch (error) {
    res.status(500).json({ message: '获取节点列表失败', error: error.message });
  }
});

// 赞助节点
router.post('/:id/sponsor', auth, async (req, res) => {
  try {
    db.get('SELECT * FROM nodes WHERE id = ?', [req.params.id], (err, node) => {
      if (err) {
        return res.status(500).json({ message: '赞助节点失败', error: err.message });
      }
      if (!node) {
        return res.status(404).json({ message: '未找到该节点' });
      }

      db.run(
        'UPDATE nodes SET sponsor_id = ?, sponsored_at = CURRENT_TIMESTAMP, status = ? WHERE id = ?',
        [req.user.id, 'available', req.params.id],
        function(err) {
          if (err) {
            return res.status(500).json({ message: '赞助节点失败', error: err.message });
          }
          db.get('SELECT * FROM nodes WHERE id = ?', [req.params.id], (err, updatedNode) => {
            if (err) {
              return res.status(500).json({ message: '赞助节点失败', error: err.message });
            }
            res.status(200).json({ message: '赞助节点成功', node: updatedNode });
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: '赞助节点失败', error: error.message });
  }
});

module.exports = router;
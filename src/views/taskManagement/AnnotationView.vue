<template>
  <div class="annotation-page">
    <!-- 页面标题和返回按钮区域 -->
    <div class="page-header">
      <div class="header-left">
        <div class="back-button">← 返回任务详情</div>
        <h1>扫描结果标注</h1>
      </div>
    </div>

    <!-- 标注信息区域 -->
    <div class="annotation-info-section">
      <div class="section-label">当前标注项信息区域</div>
      <div class="info-content">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">文件路径</div>
            <div class="info-value">文件路径显示区域</div>
          </div>
          <div class="info-item">
            <div class="info-label">代码行号</div>
            <div class="info-value">代码行号显示区域</div>
          </div>
          <div class="info-item">
            <div class="info-label">缺陷类型</div>
            <div class="info-value">缺陷类型显示区域</div>
          </div>
          <div class="info-item">
            <div class="info-label">问题描述</div>
            <div class="info-value">问题描述显示区域</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 代码片段展示区域 -->
    <div class="code-section">
      <div class="section-label">代码片段展示区域</div>
      <div class="code-content">
        <div class="code-block">
          <div class="code-header">代码上下文（高亮显示问题行）</div>
          <div class="code-body">
            <div class="code-line">第10行：相关代码...</div>
            <div class="code-line highlight">第11行：问题代码（高亮）</div>
            <div class="code-line">第12行：相关代码...</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 标注操作区域 -->
    <div class="annotation-action-section">
      <div class="section-label">标注操作区域</div>
      <div class="action-content">
        <div class="action-group">
          <div class="action-label">判定结果：</div>
          <div class="action-options">
            <div class="action-option selected">是问题</div>
            <div class="action-option">不是问题</div>
          </div>
        </div>
        <div class="action-group">
          <div class="action-label">标注备注（可选）：</div>
          <div class="remark-input">多行文本输入框：可输入标注备注信息</div>
        </div>
        <div class="action-group">
          <div class="action-label">标记人员工号：</div>
          <div class="auto-fill">自动填充：当前登录用户工号</div>
        </div>
        <div class="action-group">
          <div class="action-label">标注时间：</div>
          <div class="auto-fill">自动填充：当前时间</div>
        </div>
      </div>
    </div>

    <!-- 操作按钮区域 -->
    <div class="button-section">
      <div class="section-label">操作按钮区域</div>
      <div class="button-content">
        <div class="action-button primary">保存标注</div>
        <div class="action-button">取消</div>
        <div class="action-button">上一个</div>
        <div class="action-button">下一个</div>
      </div>
    </div>

    <!-- 批量标注区域（可选） -->
    <div class="batch-section">
      <div class="section-label">批量标注区域（可选功能）</div>
      <div class="batch-content">
        <div class="batch-item">批量选择：复选框列表</div>
        <div class="batch-item">批量操作：批量标记为"是问题" / 批量标记为"不是问题"</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.annotation-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-button {
  padding: 8px 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  color: #6b7280;
  font-size: 14px;
  cursor: pointer;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.annotation-info-section,
.code-section,
.annotation-action-section,
.button-section,
.batch-section {
  background: #ffffff;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 24px;
}

.section-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 20px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
}

.info-content {
  display: flex;
  flex-direction: column;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-label {
  font-weight: 500;
  color: #6b7280;
  font-size: 14px;
}

.info-value {
  padding: 12px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  color: #374151;
  font-size: 14px;
}

.code-content {
  display: flex;
  flex-direction: column;
}

.code-block {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  background: #f9fafb;
}

.code-header {
  padding: 12px 16px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.code-body {
  padding: 16px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
}

.code-line {
  padding: 4px 8px;
  color: #374151;
  line-height: 1.6;
}

.code-line.highlight {
  background: #fef3c7;
  color: #92400e;
  font-weight: 500;
}

.action-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.action-group {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.action-label {
  font-weight: 500;
  color: #374151;
  font-size: 14px;
  min-width: 120px;
  padding-top: 8px;
}

.action-options {
  display: flex;
  gap: 12px;
  flex: 1;
}

.action-option {
  padding: 12px 24px;
  background: #f3f4f6;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  min-width: 120px;
}

.action-option.selected {
  background: #3b82f6;
  color: #ffffff;
  border-color: #3b82f6;
}

.remark-input {
  flex: 1;
  padding: 12px 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  color: #6b7280;
  font-size: 14px;
  min-height: 80px;
}

.auto-fill {
  flex: 1;
  padding: 12px 16px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  color: #6b7280;
  font-size: 14px;
}

.button-content {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
}

.action-button {
  padding: 12px 24px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  text-align: center;
  min-width: 100px;
}

.action-button.primary {
  background: #3b82f6;
  color: #ffffff;
  border-color: #3b82f6;
}

.batch-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.batch-item {
  padding: 12px 16px;
  background: #f3f4f6;
  border-radius: 4px;
  color: #6b7280;
  font-size: 14px;
}
</style>

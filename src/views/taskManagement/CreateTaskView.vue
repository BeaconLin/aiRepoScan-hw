<template>
  <div class="create-task-page">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <h1>创建代码仓扫描任务</h1>
    </div>

    <!-- 任务表单区域 -->
    <div class="form-section">
      <div class="section-label">任务信息表单区域</div>
      <div class="form-content">
        <div class="form-row">
          <div class="form-item">
            <div class="form-label">任务名称</div>
            <div class="form-input-placeholder">输入框：请输入任务名称</div>
          </div>
          <div class="form-item">
            <div class="form-label">代码仓URL</div>
            <div class="form-input-placeholder">输入框：请输入代码仓URL</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-item">
            <div class="form-label">扫描分支</div>
            <div class="form-input-placeholder">输入框：请输入扫描分支（如：main、master）</div>
          </div>
          <div class="form-item">
            <div class="form-label">扫描助手版本</div>
            <div class="form-input-placeholder">下拉选择框：选择扫描助手版本</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-item full-width">
            <div class="form-label">扫描路径（多个）</div>
            <div class="form-input-placeholder">多行输入框或动态添加：可添加多个扫描路径</div>
            <div class="form-hint">提示：每行一个路径，支持添加/删除多个路径</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-item">
            <div class="form-label">创建人</div>
            <div class="form-input-placeholder">自动填充：当前登录用户</div>
          </div>
          <div class="form-item">
            <div class="form-label">创建时间</div>
            <div class="form-input-placeholder">自动填充：当前时间</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 操作按钮区域 -->
    <div class="action-section">
      <div class="section-label">操作按钮区域</div>
      <div class="action-content">
        <div class="action-button primary">提交创建</div>
        <div class="action-button">重置表单</div>
        <div class="action-button">取消</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.create-task-page {
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.form-section,
.action-section {
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

.form-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: flex;
  gap: 20px;
}

.form-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-item.full-width {
  width: 100%;
}

.form-label {
  font-weight: 500;
  color: #374151;
  font-size: 14px;
}

.form-input-placeholder {
  padding: 12px 16px;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  color: #6b7280;
  font-size: 14px;
  min-height: 40px;
  display: flex;
  align-items: center;
}

.form-hint {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
}

.action-content {
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
</style>

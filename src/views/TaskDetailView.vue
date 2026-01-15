<template>
  <div class="task-detail-page">
    <!-- 页面标题和返回按钮区域 -->
    <div class="page-header">
      <div class="header-left">
        <el-button @click="handleBack">← 返回任务列表</el-button>
        <h1>任务详情 - 扫描结果查看</h1>
      </div>
    </div>

    <!-- 任务信息区域 -->
    <div class="task-info-section">
      <div class="section-label">任务信息区域</div>
      <div class="info-content">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">任务名称</div>
            <div class="info-value">任务名称显示区域</div>
          </div>
          <div class="info-item">
            <div class="info-label">代码仓URL</div>
            <div class="info-value">代码仓URL显示区域</div>
          </div>
          <div class="info-item">
            <div class="info-label">创建人</div>
            <div class="info-value">创建人显示区域</div>
          </div>
          <div class="info-item">
            <div class="info-label">创建时间</div>
            <div class="info-value">创建时间显示区域</div>
          </div>
          <div class="info-item">
            <div class="info-label">扫描分支</div>
            <div class="info-value">扫描分支显示区域</div>
          </div>
          <div class="info-item">
            <div class="info-label">扫描文件路径</div>
            <div class="info-value">扫描文件路径显示区域（多个）</div>
          </div>
          <div class="info-item">
            <div class="info-label">代码仓语言</div>
            <div class="info-value">代码仓语言显示区域</div>
          </div>
          <div class="info-item">
            <div class="info-label">代码行数</div>
            <div class="info-value">代码行数显示区域</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计看板区域 -->
    <div class="dashboard-section">
      <div class="section-label">任务扫描结果统计看板区域</div>
      <div class="dashboard-content">
        <!-- 缺陷统计卡片 -->
        <div class="stat-card">
          <div class="stat-label">缺陷统计</div>
          <div class="stat-content">
            <div class="stat-item">总缺陷数：XXX</div>
            <div class="stat-item">已标注：XXX</div>
            <div class="stat-item">未标注：XXX</div>
          </div>
        </div>

        <!-- 缺陷类型分布 -->
        <div class="stat-card">
          <div class="stat-label">缺陷类型分布</div>
          <div class="stat-content">
            <div class="stat-item">图表区域：饼图或柱状图显示缺陷类型分布</div>
            <div class="stat-item">类型1：XX个</div>
            <div class="stat-item">类型2：XX个</div>
            <div class="stat-item">类型3：XX个</div>
          </div>
        </div>

        <!-- 缺陷标记状态统计 -->
        <div class="stat-card">
          <div class="stat-label">缺陷标记状态统计</div>
          <div class="stat-content">
            <div class="stat-item">图表区域：饼图或柱状图显示标记状态</div>
            <div class="stat-item">是问题：XX个</div>
            <div class="stat-item">不是问题：XX个</div>
            <div class="stat-item">未标记：XX个</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 扫描结果列表区域 -->
    <div class="result-list-section">
      <div class="section-label">扫描结果列表区域</div>
      <div class="list-header">
        <div class="list-filter">筛选区域：按类型筛选 / 按标记状态筛选 / 搜索</div>
        <div class="list-action">操作按钮：批量标注 / 导出结果</div>
      </div>
      <div class="list-content">
        <div class="result-item">
          <div class="result-header">扫描结果项</div>
          <div class="result-body">
            <div class="result-field">文件路径</div>
            <div class="result-field">代码行号</div>
            <div class="result-field">缺陷类型</div>
            <div class="result-field">问题描述</div>
            <div class="result-field">代码片段</div>
            <div class="result-field">标记状态：是问题 / 不是问题 / 未标记</div>
            <div class="result-field">标记人员工号</div>
            <div class="result-field">标注时间</div>
            <div class="result-field">操作按钮：查看详情 / 标注</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页区域 -->
    <div class="pagination-section">
      <div class="section-label">分页区域</div>
      <div class="pagination-content">分页控件：上一页 / 页码 / 下一页</div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ElButton } from 'element-plus'

const router = useRouter()

// 返回任务列表
const handleBack = () => {
  router.push('/tasks')
}
</script>

<style scoped>
.task-detail-page {
  max-width: 1400px;
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


.page-header h1 {
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.task-info-section,
.dashboard-section,
.result-list-section,
.pagination-section {
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
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

.dashboard-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.stat-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  background: #f9fafb;
}

.stat-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-item {
  padding: 8px 12px;
  background: #ffffff;
  border-radius: 4px;
  color: #6b7280;
  font-size: 14px;
  border: 1px solid #e5e7eb;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px;
  background: #f3f4f6;
  border-radius: 4px;
}

.list-filter,
.list-action {
  color: #6b7280;
  font-size: 14px;
}

.list-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  background: #f9fafb;
}

.result-header {
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.result-body {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.result-field {
  padding: 8px 12px;
  background: #ffffff;
  border-radius: 4px;
  color: #6b7280;
  font-size: 14px;
  border: 1px solid #e5e7eb;
}

.pagination-content {
  text-align: center;
  padding: 16px;
  color: #6b7280;
  font-size: 14px;
}
</style>

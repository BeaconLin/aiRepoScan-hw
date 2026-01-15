<template>
  <div class="overview-page">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <h1>总览</h1>
      <p class="page-subtitle">全部任务的数据统计看板</p>
    </div>

    <!-- 总体统计卡片区域 -->
    <div class="summary-cards-section">
      <div class="section-label">总体统计卡片区域</div>
      <div class="cards-grid">
        <div class="summary-card">
          <div class="card-title">总任务数</div>
          <div class="card-value">XXX</div>
          <div class="card-desc">全部任务总数</div>
        </div>
        <div class="summary-card">
          <div class="card-title">进行中任务</div>
          <div class="card-value">XXX</div>
          <div class="card-desc">正在扫描的任务数</div>
        </div>
        <div class="summary-card">
          <div class="card-title">已完成任务</div>
          <div class="card-value">XXX</div>
          <div class="card-desc">扫描完成的任务数</div>
        </div>
        <div class="summary-card">
          <div class="card-title">总缺陷数</div>
          <div class="card-value">XXX</div>
          <div class="card-desc">所有任务扫描出的缺陷总数</div>
        </div>
      </div>
    </div>

    <!-- 任务状态分布图表区域 -->
    <div class="chart-section">
      <div class="section-label">任务状态分布图表区域</div>
      <div class="chart-content">
        <div class="chart-item">
          <div class="chart-title">任务状态分布</div>
          <div class="chart-placeholder">图表区域：饼图或柱状图显示任务状态分布（进行中/已完成/已失败）</div>
        </div>
      </div>
    </div>

    <!-- 缺陷统计看板区域 -->
    <div class="defect-dashboard-section">
      <div class="section-label">缺陷统计看板区域</div>
      <div class="dashboard-content">
        <!-- 缺陷类型分布 -->
        <div class="dashboard-card">
          <div class="dashboard-title">缺陷类型分布</div>
          <div class="dashboard-body">
            <div class="chart-placeholder">图表区域：饼图或柱状图显示缺陷类型分布</div>
            <div class="stat-list">
              <div class="stat-row">类型1：XX个</div>
              <div class="stat-row">类型2：XX个</div>
              <div class="stat-row">类型3：XX个</div>
              <div class="stat-row">类型4：XX个</div>
            </div>
          </div>
        </div>

        <!-- 缺陷标记状态统计 -->
        <div class="dashboard-card">
          <div class="dashboard-title">缺陷标记状态统计</div>
          <div class="dashboard-body">
            <div class="chart-placeholder">图表区域：饼图或柱状图显示标记状态分布</div>
            <div class="stat-list">
              <div class="stat-row">是问题：XX个</div>
              <div class="stat-row">不是问题：XX个</div>
              <div class="stat-row">未标记：XX个</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近任务列表区域 -->
    <div class="recent-tasks-section">
      <div class="section-label">最近任务列表区域</div>
      <div class="tasks-header">
        <div class="section-title">最近创建的任务</div>
        <div class="view-all-link">查看全部 →</div>
      </div>
      <div class="tasks-list">
        <div class="task-item">
          <div class="task-info">
            <div class="task-name">任务名称</div>
            <div class="task-meta">创建人 | 创建时间 | 状态</div>
          </div>
          <div class="task-action">查看详情 →</div>
        </div>
      </div>
    </div>

    <!-- 趋势分析区域（可选） -->
    <div class="trend-section">
      <div class="section-label">趋势分析区域（可选）</div>
      <div class="trend-content">
        <div class="trend-item">
          <div class="trend-title">任务创建趋势</div>
          <div class="chart-placeholder">图表区域：折线图显示任务创建趋势（按时间）</div>
        </div>
        <div class="trend-item">
          <div class="trend-title">缺陷发现趋势</div>
          <div class="chart-placeholder">图表区域：折线图显示缺陷发现趋势（按时间）</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overview-page {
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.summary-cards-section,
.chart-section,
.defect-dashboard-section,
.recent-tasks-section,
.trend-section {
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

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.summary-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 24px;
  background: #f9fafb;
  transition: transform 0.2s, box-shadow 0.2s;
}

.summary-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.card-title {
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
}

.card-value {
  font-size: 32px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 8px;
}

.card-desc {
  font-size: 12px;
  color: #9ca3af;
}

.chart-content {
  display: flex;
  flex-direction: column;
}

.chart-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  background: #f9fafb;
}

.chart-title {
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
}

.chart-placeholder {
  padding: 60px 20px;
  background: #f3f4f6;
  border: 2px dashed #d1d5db;
  border-radius: 4px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 16px;
}

.dashboard-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.dashboard-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  background: #f9fafb;
}

.dashboard-title {
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.dashboard-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat-row {
  padding: 8px 12px;
  background: #ffffff;
  border-radius: 4px;
  color: #6b7280;
  font-size: 14px;
  border: 1px solid #e5e7eb;
}

.tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-weight: 600;
  color: #374151;
  font-size: 16px;
}

.view-all-link {
  color: #3b82f6;
  font-size: 14px;
  cursor: pointer;
  text-decoration: none;
}

.tasks-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
}

.task-info {
  flex: 1;
}

.task-name {
  font-weight: 500;
  color: #374151;
  margin-bottom: 4px;
}

.task-meta {
  font-size: 12px;
  color: #6b7280;
}

.task-action {
  color: #3b82f6;
  font-size: 14px;
  cursor: pointer;
}

.trend-content {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
  gap: 20px;
}

.trend-item {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  background: #f9fafb;
}

.trend-title {
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
}
</style>

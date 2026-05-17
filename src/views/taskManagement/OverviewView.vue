<template>
  <div class="overview-page">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <h1>总览</h1>
    </div>

    <!-- 任务概览统计 -->
    <div class="summary-cards-section" v-loading="summaryLoading">
      <div class="card-title summary-section-heading">全部任务的数据统计看板</div>
      <div class="cards-grid">
        <div class="summary-card">
          <div class="card-title">任务总数</div>
          <div class="card-value">{{ formatStat(summaryStats.total) }}</div>
          <div class="card-desc">已创建的全部扫描任务</div>
        </div>
        <div class="summary-card">
          <div class="card-title">进行中</div>
          <div class="card-value">{{ formatStat(summaryStats.running) }}</div>
          <div class="card-desc">状态为「进行中」的任务</div>
        </div>
        <div class="summary-card">
          <div class="card-title">已完成</div>
          <div class="card-value">{{ formatStat(summaryStats.completed) }}</div>
          <div class="card-desc">状态为「已完成」的任务</div>
        </div>
        <div class="summary-card">
          <div class="card-title">扫描告警</div>
          <div class="card-value">{{ formatStat(summaryStats.warnCount) }}</div>
          <div class="card-desc">各任务扫描结果告警条数合计</div>
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

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { queryTaskList } from '@/api/taskManagementApi'
import { TASK_STATUS } from '@/constants/scanTaskConst'

interface SummaryStats {
  total: number
  running: number
  completed: number
  warnCount: number
}

const summaryLoading = ref(false)
const summaryStats = ref<SummaryStats>({
  total: 0,
  running: 0,
  completed: 0,
  warnCount: 0,
})

function formatStat(n: number): string {
  if (summaryLoading.value) return '—'
  return n.toLocaleString()
}

async function loadSummaryStats() {
  summaryLoading.value = true
  try {
    const [allRes, runningRes, completedRes] = await Promise.all([
      queryTaskList(1, 1),
      queryTaskList(1, 1, undefined, TASK_STATUS.RUNNING),
      queryTaskList(1, 1, undefined, TASK_STATUS.COMPLETED),
    ])

    if (allRes.meta.isSuccess) {
      summaryStats.value.total = allRes.data.total
      const total = allRes.data.total
      if (total > 0) {
        const listRes = await queryTaskList(1, total)
        if (listRes.meta.isSuccess) {
          summaryStats.value.warnCount = listRes.data.list.reduce(
            (sum, row) => sum + (row.warnCount ?? 0),
            0,
          )
        }
      } else {
        summaryStats.value.warnCount = 0
      }
    }

    if (runningRes.meta.isSuccess) {
      summaryStats.value.running = runningRes.data.total
    }
    if (completedRes.meta.isSuccess) {
      summaryStats.value.completed = completedRes.data.total
    }
  } finally {
    summaryLoading.value = false
  }
}

onMounted(loadSummaryStats)
</script>

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

.summary-section-heading {
  font-weight: 600;
  color: #374151;
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

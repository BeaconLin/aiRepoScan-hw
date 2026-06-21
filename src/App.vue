<template>
  <div class="layout">
    <!-- 顶部导航栏区域 -->
    <header class="header">
      <div class="header-left">
        <div class="brand">aiRepoScan - 产业代码仓扫描结果管理平台</div>
      </div>
      <SystemAnnouncement />
      <nav class="nav">
        <div class="user-info">用户信息区域</div>
      </nav>
    </header>

    <div class="main-container">
      <!-- 侧边栏导航区域 -->
      <aside class="sidebar">
        <div class="sidebar-content">
          <div class="sidebar-section">导航菜单</div>
          <RouterLink to="/overview" class="sidebar-item" active-class="active">
            <span class="sidebar-icon">📊</span>
            <span>总览</span>
          </RouterLink>
          <RouterLink to="/tasks" class="sidebar-item" active-class="active">
            <span class="sidebar-icon">📋</span>
            <span>任务管理</span>
          </RouterLink>
        </div>
      </aside>

      <!-- 主内容区域 -->
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import SystemAnnouncement from './components/SystemAnnouncement.vue'
</script>

<style scoped>
.layout {
  min-height: 100vh;
  background: #f5f7fb;
  position: relative;
}

.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 16px;
  padding: 0 24px;
  background: #1f2937;
  color: #f9fafb;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  min-height: 64px;
  box-sizing: border-box;
}

.header-left {
  justify-self: start;
  min-width: 0;
}

.brand {
  font-weight: 700;
  letter-spacing: 0.4px;
  font-size: 18px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav {
  justify-self: end;
  grid-column: 3;
  display: flex;
  gap: 24px;
}

.nav a {
  color: #e5e7eb;
  text-decoration: none;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav a:hover {
  background-color: rgba(255,255,255,0.1);
}

.user-info {
  color: #e5e7eb;
  font-size: 14px;
  padding: 8px 16px;
}

.main-container {
  display: flex;
  margin-top: 64px;
  min-height: calc(100vh - 64px);
}

.sidebar {
  position: fixed;
  top: 64px;
  left: 0;
  bottom: 0;
  width: 240px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  padding: 24px;
  box-shadow: 2px 0 4px rgba(0,0,0,0.05);
  overflow-y: auto;
  z-index: 999;
}

.sidebar-content {
  color: #6b7280;
  font-size: 14px;
}

.sidebar-section {
  font-weight: 600;
  color: #374151;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.sidebar-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  color: #6b7280;
  text-decoration: none;
  border-radius: 6px;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.sidebar-item:hover {
  background-color: #f3f4f6;
  color: #374151;
}

.sidebar-item.active {
  background-color: #3b82f6;
  color: #ffffff;
  font-weight: 500;
}

.sidebar-icon {
  font-size: 18px;
}

.content {
  flex: 1;
  margin-left: 240px;
  padding: 24px;
  overflow-y: auto;
  min-height: calc(100vh - 64px);
  box-sizing: border-box;
}
</style>

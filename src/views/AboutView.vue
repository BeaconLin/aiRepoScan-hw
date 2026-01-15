<template>
  <main class="page">
    <section class="panel">
      <h2>关于</h2>
      <p>这个页面通过 vue-router 加载，展示基础导航效果。</p>
    </section>
  </main>
</template>

<style scoped>
.page {
  padding: 32px;
  display: flex;
  justify-content: center;
}
.panel {
  max-width: 640px;
  width: 100%;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.04);
}
.panel h2 {
  margin: 0 0 12px;
}
</style>

